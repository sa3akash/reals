/* eslint-disable @next/next/no-img-element */
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useFileUploads } from "@/hooks/useFileUploads";
import { deleteFileApi, generatePresignedUrlApi } from "@/lib/uploadFile";
import { cn } from "@/lib/utils";
import { Loader2, Trash2 } from "lucide-react";
import React, { useCallback } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { toast } from "sonner";

const UploadPage = () => {
  const { files, setFiles, uploadFile, removeFile } = useFileUploads({
    generatePresignedUrl: generatePresignedUrlApi,

    deleteFile: async(key:string)=>{
      const response = await deleteFileApi(key);
      toast.success("File deleted successfully");
      return response;
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      // Do something with the files

      if (acceptedFiles.length > 0) {
        setFiles((prev) => [
          ...prev,
          ...acceptedFiles.map((file) => ({
            id: `${Date.now() + Math.random() * 1000}`,
            file,
            uploading: false,
            progress: 0,
            key: "",
            isDeleting: false,
            error: false,
            objectUrl: URL.createObjectURL(file),
          })),
        ]);

        acceptedFiles.forEach((file) => uploadFile(file));
      }
    },
    [setFiles, uploadFile]
  );

  const onDropRejected = useCallback((fileRejection: FileRejection[]) => {
    if (fileRejection.length) {
      const toomanyFiles = fileRejection.find(
        (rejection) => rejection.errors[0].code === "too-many-files"
      );

      const fileSizetoBig = fileRejection.find(
        (rejection) => rejection.errors[0].code === "file-too-large"
      );

      if (toomanyFiles) {
        toast.error("Too many files selected, max is 200MB");
      }

      if (fileSizetoBig) {
        toast.error("File size exceeds 5mb limit");
      }
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    maxFiles: 10, // Limit to 5 files
    accept: {
      "image/*": [], // Accept all image types
      // "video/*": [], // Accept all video types
      // 'application/pdf': [] // Accept PDF files
    },
    multiple: true, // Allow multiple files
    maxSize: 10 * 1024 * 1024, // Limit file size 200MB
  });

  return (
    <div className="flex flex-col items-center justify-center h-screen gap-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "relative border-2 border-dashed h-64 flex items-center justify-center transition-colors duration-300 ease-in-out w-96",

          { "border-primary bg-primary/10": isDragActive }
        )}
      >
        <CardContent className="w-full h-full flex flex-col items-center justify-center">
          <input {...getInputProps()} />
          {isDragActive ? (
            <p>Drop the files here ...</p>
          ) : (
            <div className="flex flex-col items-center justify-center h-full w-full text-center gap-y-3">
              <p>
                Drag &lsquo;n&lsquo; drop some files here, or click to select
                files
              </p>
              <Button>Select a file</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col gap-y-4">
        {files.map((file) => (
          <div key={file.id} className="relative flex gap-x-1">
          <img src={file.objectUrl} alt={file.file.name} width={400} />
            <div>
              <p>{file.file.name}</p>
              <progress value={file.progress} max="100" />{" "}
              <span>{file.progress}%</span>
              {file.error && (
                <span className="text-red-500">Error uploading file</span>
              )}
            </div>

            <div className="absolute top-0 left-0">
              <Button
                variant="destructive"
                onClick={() => removeFile(file.key!)}
              >
                {file.isDeleting ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Trash2 />
                )}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UploadPage;
