"use client";

import { MessageReply } from "@/lib/types";
import { X } from "lucide-react";

interface MessageReplyPreviewProps {
  reply: MessageReply;
  onClear?: () => void;
}

export default function MessageReplyPreview({
  reply,
  onClear,
}: MessageReplyPreviewProps) {
  return (
    <div className="bg-slate-700/30 border-l-4 border-purple-500 px-3 py-2 rounded flex items-start justify-between gap-2 mb-3">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-purple-300 font-semibold mb-1">
          Replying to {reply.authorUsername}
        </p>
        <p className="text-xs text-gray-300 truncate">
          {reply.content.length > 100
            ? reply.content.substring(0, 100) + "..."
            : reply.content}
        </p>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="text-gray-400 hover:text-white transition shrink-0"
          title="Clear reply"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
}
