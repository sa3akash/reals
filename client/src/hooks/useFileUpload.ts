import { useCallback, useEffect, useState } from "react";

export const useFileUpload = (presignUrl: string) => {
  const [files, setFiles] = useState<
    Array<{
      id: string;
      file: File;
      uploading: boolean;
      progress: number;
      key?: string;
      isDeleting: boolean;
      error: boolean;
      objectUrl?: string;
    }>
  >([]);

  const uploadfile = useCallback(
    async (file: File) => {
      setFiles((prev) =>
        prev.map((f) =>
          f.file.name === file.name ? { ...f, uploading: true } : f
        )
      );

      try {
        const presignedResponse = await fetch(presignUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            fileName: file.name,
            fileType: file.type,
            size: file.size,
          }),
        });

        if (!presignedResponse.ok) {
          setFiles((prev) =>
            prev.map((f) =>
              f.file.name === file.name
                ? { ...f, error: true, uploading: false, progress: 0 }
                : f
            )
          );
          return;
        }

        const { presignedUrl, key } = await presignedResponse.json();

        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest();

          xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              setFiles((prev) =>
                prev.map((f) =>
                  f.file.name === file.name
                    ? { ...f, progress, uploading: true, key }
                    : f
                )
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
              setFiles((prev) =>
                prev.map((f) =>
                  f.file.name === file.name
                    ? { ...f, error: true, uploading: false, progress: 0 }
                    : f
                )
              );
              reject(new Error("Upload failed"));
            }
          };

          xhr.onerror = () => {
            reject(new Error("Upload failed"));
          };

          xhr.open("PUT", presignedUrl);
          xhr.setRequestHeader("Content-Type", file.type);
          xhr.send(file);
        });
      } catch {
        setFiles((prev) =>
          prev.map((f) =>
            f.file.name === file.name
              ? { ...f, error: true, uploading: false, progress: 0 }
              : f
          )
        );
      }
    },
    [presignUrl]
  );

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
    uploadfile,
  };
};

// "http://localhost:5000/upload/generate-presign-url"
