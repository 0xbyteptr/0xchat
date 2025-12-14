"use client";

import { useRef, useState } from "react";
import { Upload, X, FileIcon, Image, File } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface FileUploadProps {
  onFileSelect?: (file: File, preview?: string) => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  maxFiles?: number;
  type?: "uploads" | "avatars" | "images";
  userId?: string | null;
}

export default function FileUpload({
  onFileSelect,
  maxSize = 10,
  acceptedTypes = ["image/*", "video/*", "audio/*", "text/*", ".pdf", ".doc", ".docx",
    '.xlsx', '.xls', '.ppt', '.pptx', '.zip', '.rar'
  ],
  maxFiles = 5,
  type,
  userId,
}: FileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<{ file: File; preview: string }[]>([]);
  const [error, setError] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = async (files: FileList) => {
    setError("");
    const newFiles: File[] = [];
    const newPreviews: { file: File; preview: string }[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file count
      if (selectedFiles.length + newFiles.length >= maxFiles) {
        setError(`Maximum ${maxFiles} files allowed`);
        break;
      }

      // Check file size
      if (file.size > maxSize * 1024 * 1024) {
        setError(`File ${file.name} exceeds ${maxSize}MB limit`);
        continue;
      }

      // Check file type
      const isAccepted = acceptedTypes.some((type) => {
        if (type.startsWith(".")) return file.name.endsWith(type);
        if (type.endsWith("/*")) {
          const baseType = type.split("/")[0];
          return file.type.startsWith(baseType);
        }
        return file.type === type;
      });

      if (!isAccepted) {
        setError(`File type ${file.type} not accepted`);
        continue;
      }

      newFiles.push(file);

      // Generate preview for images
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => {
          newPreviews.push({
            file,
            preview: e.target?.result as string,
          });
          if (newPreviews.length === newFiles.length) {
            setPreviews((prev) => [...prev, ...newPreviews]);
          }
        };
        reader.readAsDataURL(file);
      } else {
        newPreviews.push({ file, preview: "" });
        if (newPreviews.length === newFiles.length) {
          setPreviews((prev) => [...prev, ...newPreviews]);
        }
      }
    }

    setSelectedFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    try {
      for (const file of selectedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        if (type) formData.append("type", type);
        if (userId) formData.append("userId", userId);

        const response = await fetch(getApiUrl("/api/upload"), {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          const error = await response.json();
          setError(`Upload failed: ${error.error}`);
          continue;
        }

        const data = await response.json();
          if (data.success && onFileSelect) {
          const preview = previews.find((p) => p.file === file)?.preview;
          onFileSelect(file, preview);
        }
      }

      setSelectedFiles([]);
      setPreviews([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      setError(`Upload error: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  };

  return (
    <div className="space-y-4">
      {/* Drag Drop Area */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? "border-purple-500 bg-purple-500/10"
            : "border-slate-600 hover:border-slate-500 bg-slate-700/20 hover:bg-slate-700/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={(e) => e.target.files && handleFiles(e.target.files)}
          accept={acceptedTypes.join(",")}
          className="hidden"
        />
        <Upload size={32} className="mx-auto mb-2 text-gray-400" />
        <p className="text-white font-semibold mb-1">Drop files here or click to browse</p>
        <p className="text-xs text-gray-400">
          Max {maxSize}MB per file, up to {maxFiles} files
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/20 border border-red-500/30 rounded-lg text-red-300 text-sm">
          {error}
        </div>
      )}

      {/* File Previews */}
      {previews.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Selected Files ({previews.length})</h3>
          <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
            {previews.map((item, index) => (
              <div
                key={index}
                className="relative bg-slate-700/30 rounded-lg overflow-hidden border border-slate-600 group"
              >
                {/* Preview */}
                {item.preview ? (
                  <img
                    src={item.preview}
                    alt={item.file.name}
                    className="w-full h-32 object-cover"
                  />
                ) : (
                  <div className="w-full h-32 bg-slate-600/50 flex items-center justify-center">
                    <FileIcon size={32} className="text-gray-400" />
                  </div>
                )}

                {/* File Info */}
                <div className="p-2 bg-slate-800/80">
                  <p className="text-xs text-gray-300 truncate font-medium">{item.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(item.file.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>

                {/* Remove Button */}
                <button
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} className="text-white" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Upload size={18} />
            Upload {selectedFiles.length} File{selectedFiles.length !== 1 ? "s" : ""}
          </button>
        </div>
      )}
    </div>
  );
}
