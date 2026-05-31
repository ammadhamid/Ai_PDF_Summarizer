"use client";

import { useState, useCallback, useRef } from "react";

interface UploadResult {
  documentId?: string;
  filename: string;
  pageCount?: number;
  chunkCount?: number;
  success?: boolean;
  error?: string;
}

interface FileUploaderProps {
  onUploadSuccess: (results: UploadResult[]) => void;
}

export default function FileUploader({ onUploadSuccess }: FileUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const pdfs = Array.from(files).filter((f) => f.name.endsWith(".pdf"));
    if (pdfs.length === 0) return;
    setSelectedFiles((prev) => {
      const names = new Set(prev.map((f) => f.name));
      const newFiles = pdfs.filter((f) => !names.has(f.name));
      return [...prev, ...newFiles];
    });
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback(() => setIsDragging(false), []);
  const removeFile = (name: string) =>
    setSelectedFiles((prev) => prev.filter((f) => f.name !== name));

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;
    setIsUploading(true);
    setUploadProgress("Uploading…");
    const formData = new FormData();
    selectedFiles.forEach((f) => formData.append("files", f));
    try {
      setUploadProgress("Processing…");
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");
      setUploadProgress(data.message);
      onUploadSuccess(data.results);
      setSelectedFiles([]);
      setTimeout(() => setUploadProgress(null), 3000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      setUploadProgress(`Error: ${msg}`);
      setTimeout(() => setUploadProgress(null), 4000);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fu-root">
      {/* Drop Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
        className={`fu-dropzone ${isDragging ? "dragging" : ""}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          multiple
          className="fu-hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <span>{isDragging ? "Drop here" : "Drop PDFs or click"}</span>
      </div>

      {/* Queue */}
      {selectedFiles.length > 0 && (
        <div className="fu-queue">
          {selectedFiles.map((file) => (
            <div key={file.name} className="fu-file">
              <span className="fu-file-name">{file.name}</span>
              <span className="fu-file-size">
                {(file.size / 1024).toFixed(0)}kb
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeFile(file.name);
                }}
                className="fu-remove"
              >
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          ))}
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="fu-upload-btn"
          >
            {isUploading
              ? "Processing…"
              : `Upload ${selectedFiles.length} file${selectedFiles.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}

      {/* Status */}
      {uploadProgress && (
        <p
          className={`fu-status ${uploadProgress.startsWith("Error") ? "error" : "ok"}`}
        >
          {uploadProgress}
        </p>
      )}
    </div>
  );
}
