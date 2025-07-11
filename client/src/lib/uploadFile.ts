export const generatePresignedUrlApi = async (file: File) => {
  const response = await fetch(
    "http://localhost:5000/upload/generate-presign-url",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        fileType: file.type,
        size: file.size,
      }),
    }
  );

  if (!response.ok) {
    throw new Error("Failed to generate presigned URL");
  }

  return response.json();
};

export const generateChunkPresignedUrlApi = async (
  key: string,
  chunkNumber: number,
  uploadId: string
) => {
  const response = await fetch(
    "http://localhost:5000/upload/generate-presign-chunk-url",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        key: key,
        chunkNumber,
        uploadId,
      }),
    }
  );
  return response.json();
};
export const deleteFileApi = async (

  key: string
) => {
  const response = await fetch("http://localhost:5000/upload/delete-file", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      return response.json();
};


export const initiateMultipartUploadApi = async (

  fileName: string
) => {
  const response = await fetch("http://localhost:5000/upload/initiate-multipart-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fileName }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      return response.json();
};

export const completeMultipartUploadApi = async (

  key:string, uploadId:string, parts:Array<{ ETag: string; PartNumber: number }>
) => {
  const response = await fetch("http://localhost:5000/upload/complete-multipart-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ key,uploadId, parts }),
      });

      if (!response.ok) {
        throw new Error("Failed to delete file");
      }

      return response.json();
};
