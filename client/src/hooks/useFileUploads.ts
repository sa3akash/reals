import { useCallback, useEffect, useState } from "react";

type UploadFile = {
  id: string;
  file: File;
  uploading: boolean;
  progress: number;
  key?: string;
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;
};

type SingleUploadOptions = {
  generatePresignedUrl: (
    file: File
  ) => Promise<{ presignedUrl: string; key: string }>;
};

type ChunkUploadOptions = {
  generateChunkPresignedUrl: (
    key: string,
    chunkNumber: number,
    uploadId: string
  ) => Promise<{ presignedUrl: string; key: string }>;
  completeMultipartUpload: (
    key: string,
    uploadId: string,
    parts: Array<{ ETag: string; PartNumber: number }>
  ) => Promise<void>;
  initiateMultipartUpload: (
    fileName: string
  ) => Promise<{ key: string; uploadId: string }>;
};

type UploadOptions = {
  deleteFile?: (key: string) => Promise<void>;
} & SingleUploadOptions;

type UploadOptionsChunks = {
  deleteFile?: (key: string) => Promise<void>;
  chunkSize?: number; // Default chunk size is 5MB
} & ChunkUploadOptions;

export const useFileUploads = (options: UploadOptions) => {
  const { generatePresignedUrl, deleteFile } = options;

  const [files, setFiles] = useState<UploadFile[]>([]);

  // Regular file upload
  const uploadFile = useCallback(
    async (file: File) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.name === file.name ? { ...f, uploading: true } : f
        )
      );

      try {
        // Get presigned URL
        const { presignedUrl, key } = await generatePresignedUrl(file);

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setFiles((prev) =>
                prev.map((f) => (f.file === file ? { ...f, progress, key } : f))
              );
            }
          };

          xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 204) {
              setFiles((prev) =>
                prev.map((f) =>
                  f.file.name === file.name
                    ? { ...f, uploading: false, progress: 100, key }
                    : f
                )
              );
              resolve();
            } else {
              handleUploadError(file.name);
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => {
            handleUploadError(file.name);
          };

          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
      } catch (error) {
        console.error("Error uploading file:", error);
        handleUploadError(file.name);
      }
    },
    [generatePresignedUrl]
  );

  const removeFile = useCallback(
    (key: string) => {
      if (!deleteFile) {
        throw new Error("deleteFile functions not provided");
      }

      setFiles((prev) =>
        prev.map((f) => (f.key === key ? { ...f, isDeleting: true } : f))
      );

      deleteFile(key).then(() => {
        setFiles((prev) => {
          const fileToRemove = prev.find((f) => f.key === key);
          if (fileToRemove?.objectUrl) {
            URL.revokeObjectURL(fileToRemove.objectUrl);
          }

          return prev.filter((f) => f.key !== key);
        });
      });
    },
    [deleteFile]
  );

  const handleUploadError = (fileName: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.file.name === fileName
          ? { ...f, error: true, uploading: false, progress: 0 }
          : f
      )
    );
  };
  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts
      files.forEach((file) => {
        if (file.objectUrl) {
          URL.revokeObjectURL(file.objectUrl);
        }
      });
    };
  }, [files]);

  return {
    files,
    setFiles,
    removeFile,
    uploadFile,
  };
};

export const useFileChunksUpload = (options: UploadOptionsChunks) => {
  const {
    chunkSize = 5 * 1024 * 1024, // 5MB chunks by default
    generateChunkPresignedUrl,
    completeMultipartUpload,
    deleteFile,
    initiateMultipartUpload,
  } = options;

  const [files, setFiles] = useState<UploadFile[]>([]);

  const removeFile = useCallback(
    (key: string) => {
      if (!deleteFile) {
        throw new Error("deleteFile functions not provided");
      }

      setFiles((prev) =>
        prev.map((f) => (f.key === key ? { ...f, isDeleting: true } : f))
      );

      deleteFile(key).then(() => {
        setFiles((prev) => {
          const fileToRemove = prev.find((f) => f.key === key);
          if (fileToRemove?.objectUrl) {
            URL.revokeObjectURL(fileToRemove.objectUrl);
          }

          return prev.filter((f) => f.key !== key);
        });
      });
    },
    [deleteFile]
  );

  const handleUploadError = (fileName: string) => {
    setFiles((prev) =>
      prev.map((f) =>
        f.file.name === fileName
          ? { ...f, error: true, uploading: false, progress: 0 }
          : f
      )
    );
  };

  // Chunked file upload
  const uploadFileInChunks = useCallback(
    async (file: File) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.name === file.name ? { ...f, uploading: true } : f
        )
      );

      try {
        // Initialize multipart upload

        const { key, uploadId } = await initiateMultipartUpload(file.name);

        const chunks = Math.ceil(file.size / chunkSize);
        const parts: Array<{ ETag: string; PartNumber: number }> = [];

        for (let i = 0; i < chunks; i++) {
          const start = i * chunkSize;
          const end = Math.min(start + chunkSize, file.size);
          const chunk = file.slice(start, end);

          const { presignedUrl } = await generateChunkPresignedUrl(
            key,
            i + 1,
            uploadId
          );
          const etag = await uploadChunk(
            chunk,
            presignedUrl,
            i + 1,
            file.name,
            chunks
          );

          parts.push({
            ETag: etag,
            PartNumber: i + 1,
          });

          // Update progress
          const progress = Math.round(((i + 1) / chunks) * 100);
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === file.name ? { ...f, progress, key } : f
            )
          );
        }

        // Complete multipart upload
        await completeMultipartUpload(key, uploadId, parts);

        setFiles((prev) =>
          prev.map((f) =>
            f.file.name === file.name
              ? { ...f, uploading: false, progress: 100, key }
              : f
          )
        );
      } catch (error) {
        console.error("Error uploading file in chunks:", error);
        handleUploadError(file.name);
      }
    },
    [
      generateChunkPresignedUrl,
      completeMultipartUpload,
      initiateMultipartUpload,
      chunkSize,
    ]
  );

  const uploadChunk = async (
    chunk: Blob,
    presignedUrl: string,
    partNumber: number,
    fileName: string,
    totalChunks: number
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          // Calculate overall progress including previous chunks
          const chunkProgress = event.loaded / event.total;
          const overallProgress =
            ((partNumber - 1 + chunkProgress) / totalChunks) * 100;
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === fileName
                ? { ...f, progress: Math.round(overallProgress) }
                : f
            )
          );
        }
      };

      xhr.onload = () => {
        if (xhr.status === 200 || xhr.status === 204) {
          resolve(xhr.getResponseHeader("ETag") || "");
        } else {
          reject(new Error("Chunk upload failed"));
        }
      };

      xhr.onerror = () => {
        reject(new Error("Chunk upload failed"));
      };

      xhr.open("PUT", presignedUrl);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      xhr.send(chunk);
    });
  };

  useEffect(() => {
    return () => {
      // Cleanup object URLs when component unmounts
      files.forEach((file) => {
        if (file.objectUrl) {
          URL.revokeObjectURL(file.objectUrl);
        }
      });
    };
  }, [files]);

  return {
    files,
    setFiles,
    removeFile,
    uploadFileInChunks,
  };
};

// "http://localhost:5000/upload/generate-presign-url"
