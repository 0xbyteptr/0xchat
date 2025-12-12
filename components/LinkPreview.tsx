"use client";

import { useState, useEffect } from "react";
import { ExternalLink, AlertCircle } from "lucide-react";
import { decodeHtmlEntities } from "@/lib/link-utils";

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain?: string;
  favicon?: string;
}

interface LinkPreviewProps {
  url: string;
  onRemove?: () => void;
}

export default function LinkPreview({ url, onRemove }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    console.log("🎬 LinkPreview mounted/updated with URL:", url);
    
    const fetchPreview = async () => {
      try {
        setLoading(true);
        setError(false);
        console.log("🔗 Fetching preview for:", url);
        
        const fetchUrl = `/api/preview?url=${encodeURIComponent(url)}&t=${Date.now()}`;
        console.log("📍 Fetch URL:", fetchUrl);
        
        const response = await fetch(fetchUrl);
        
        console.log("📡 Preview response status:", response.status);
        console.log("📡 Response headers:", {
          contentType: response.headers.get("content-type"),
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("✅ Preview data received:", data);
          
          // Decode HTML entities in title and description
          if (data.title) data.title = decodeHtmlEntities(data.title);
          if (data.description) data.description = decodeHtmlEntities(data.description);
          setPreview(data);
          console.log("✅ Preview state set:", data);
        } else {
          const errorText = await response.text();
          console.warn("⚠️ Preview fetch failed with status:", response.status);
          console.warn("⚠️ Error response:", errorText);
          setError(true);
        }
      } catch (err) {
        console.error("❌ Failed to fetch preview:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    // Only fetch if URL is valid and contains http:// or https://
    if (url && (url.includes("http://") || url.includes("https://"))) {
      console.log("✅ URL is valid, fetching preview");
      fetchPreview();
    } else {
      console.log("❌ URL is invalid or missing protocol:", url);
      setLoading(false);
    }
  }, [url]);

  if (loading) {
    return (
      <div className="animate-pulse bg-slate-700/30 rounded-lg h-20 border border-slate-600/50 mt-3" />
    );
  }

  // Show fallback link if preview fetch failed
  if (error || !preview) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="block mt-3 bg-slate-700/50 border border-slate-600/50 rounded-lg overflow-hidden hover:bg-slate-700/70 transition-colors group p-3"
      >
        <div className="flex items-start gap-2">
          <AlertCircle size={16} className="text-gray-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1 text-xs text-purple-400">
              <ExternalLink size={12} />
              <span className="truncate font-medium">{new URL(url).hostname}</span>
            </div>
            <p className="text-xs text-gray-400 mt-1 truncate">{url}</p>
          </div>
        </div>
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="block mt-3 bg-slate-700/50 border border-slate-600/50 rounded-lg overflow-hidden hover:bg-slate-700/70 transition-colors group"
    >
      <div className="flex gap-3">
        {preview.image && (
          <img
            src={preview.image}
            alt={preview.title}
            className="w-32 h-24 object-cover shrink-0"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        )}
        <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
          <div>
            <div className="flex items-center gap-2 mb-1">
              {preview.favicon && (
                <img
                  src={preview.favicon}
                  alt=""
                  className="w-4 h-4 rounded"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
              )}
              {preview.domain && (
                <p className="text-xs text-gray-500 uppercase tracking-wide">
                  {preview.domain}
                </p>
              )}
            </div>
            {preview.title && (
              <p className="text-sm font-semibold text-white group-hover:text-purple-300 transition line-clamp-2">
                {preview.title}
              </p>
            )}
            {preview.description && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-2">
                {preview.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-purple-400 mt-2">
            <ExternalLink size={12} />
            <span className="truncate">{new URL(url).hostname}</span>
          </div>
        </div>
      </div>
    </a>
  );
}
