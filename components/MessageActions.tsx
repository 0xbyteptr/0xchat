"use client";

import { useState } from "react";
import { Edit2, Trash2, Reply, Volume2 } from "lucide-react";
import { Message } from "@/lib/types";

interface MessageActionsProps {
  message?: Message;
  messageId: string;
  isOwn: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (message: Message) => void;
  onRecord?: () => void;
  visible?: boolean;
}

export default function MessageActions({
  message,
  messageId,
  isOwn,
  onEdit,
  onDelete,
  onReply,
  onRecord,
  visible = false,
}: MessageActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("Delete this message?")) return;
    setIsDeleting(true);
    try {
      await onDelete?.(messageId);
    } catch (error) {
      console.error("Failed to delete message via parent handler:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {/* Reply button (always available) */}
      <button
        onClick={() =>
          onReply?.(
            message ??
              {
                id: messageId,
                author: { id: "", username: "", avatar: "" },
                content: "",
                timestamp: new Date().toISOString(),
              }
          )
        }
        className="text-xs px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-600 text-gray-300 hover:text-white transition flex items-center gap-1 group"
        title="Reply to message"
      >
        <Reply size={14} className="group-hover:scale-110 transition" />
        <span className="hidden sm:inline">Reply</span>
      </button>

      {/* Edit button (only for own messages) */}
      {isOwn && (
        <button
          onClick={() => onEdit?.(messageId)}
          className="text-xs px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-600 text-gray-300 hover:text-white transition flex items-center gap-1 group"
          title="Edit message"
        >
          <Edit2 size={14} className="group-hover:scale-110 transition" />
          <span className="hidden sm:inline">Edit</span>
        </button>
      )}

      {/* Delete button (only for own messages) */}
      {isOwn && (
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-xs px-2 py-1 rounded bg-red-900/40 hover:bg-red-800/60 text-red-300 hover:text-red-100 transition flex items-center gap-1 group disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete message"
        >
          <Trash2 size={14} className="group-hover:scale-110 transition" />
          <span className="hidden sm:inline">{isDeleting ? "..." : "Delete"}</span>
        </button>
      )}

      {/* Voice button */}
      {onRecord && (
        <button
          onClick={onRecord}
          className="text-xs px-2 py-1 rounded bg-slate-700/60 hover:bg-slate-600 text-gray-300 hover:text-white transition flex items-center gap-1 group"
          title="Send voice message"
        >
          <Volume2 size={14} className="group-hover:scale-110 transition" />
          <span className="hidden sm:inline">Voice</span>
        </button>
      )}
    </div>
  );
}
