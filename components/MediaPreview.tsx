"use client";

import { useState } from "react";
import { X, Download, ZoomIn } from "lucide-react";

interface MediaPreviewProps {
  attachments: {
    name: string;
    size: number;
    type: string;
    url: string;
  }[];
}

export default function MediaPreview({ attachments }: MediaPreviewProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const isImage = (type: string) => type.startsWith("image/");
  const isVideo = (type: string) => type.startsWith("video/");
  const isAudio = (type: string) => type.startsWith("audio/");

  const imageAttachments = attachments.filter((a) => isImage(a.type));
  const videoAttachments = attachments.filter((a) => isVideo(a.type));
  const audioAttachments = attachments.filter((a) => isAudio(a.type));
  const otherAttachments = attachments.filter(
    (a) => !isImage(a.type) && !isVideo(a.type) && !isAudio(a.type)
  );

  return (
    <div className="mt-3 space-y-3">
      {/* Image Gallery */}
      {imageAttachments.length > 0 && (
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(auto-fit, minmax(150px, 1fr))` }}>
          {imageAttachments.map((img, idx) => (
            <div
              key={idx}
              className="relative group rounded-lg overflow-hidden bg-slate-700/30 border border-slate-600/50 cursor-pointer hover:border-slate-500 transition"
              onClick={() => setSelectedImage(img.url)}
            >
              <img
                src={img.url}
                alt={img.name}
                className="w-full h-32 object-cover group-hover:scale-105 transition-transform duration-200"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <ZoomIn size={24} className="text-white" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Video Player */}
      {videoAttachments.length > 0 && (
        <div className="space-y-2">
          {videoAttachments.map((video, idx) => (
            <div
              key={idx}
              className="rounded-lg overflow-hidden bg-slate-700/30 border border-slate-600/50"
            >
              <video
                src={video.url}
                controls
                className="w-full max-h-64 bg-black"
                controlsList="nodownload"
              />
              <p className="text-xs text-gray-400 p-2 truncate">{video.name}</p>
            </div>
          ))}
        </div>
      )}

      {/* Audio Player */}
      {audioAttachments.length > 0 && (
        <div className="space-y-2">
          {audioAttachments.map((audio, idx) => (
            <div
              key={idx}
              className="bg-slate-700/50 border border-slate-600/50 rounded-lg p-3"
            >
              <p className="text-xs text-gray-400 mb-2 truncate">{audio.name}</p>
              <audio src={audio.url} controls className="w-full" />
            </div>
          ))}
        </div>
      )}

      {/* Other Files */}
      {otherAttachments.length > 0 && (
        <div className="space-y-2">
          {otherAttachments.map((file, idx) => (
            <a
              key={idx}
              href={file.url}
              download={file.name}
              className="flex items-center justify-between bg-slate-700/50 border border-slate-600/50 px-3 py-2 rounded-lg hover:bg-slate-700 transition"
            >
              <span className="text-xs text-gray-300 truncate">{file.name}</span>
              <Download size={16} className="text-purple-400 shrink-0" />
            </a>
          ))}
        </div>
      )}

      {/* Image Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-4xl max-h-96 w-full h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={selectedImage}
              alt="Full size"
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-2 right-2 p-2 bg-black/50 hover:bg-black/70 rounded-full text-white transition"
            >
              <X size={24} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
