"use client";

import { useState } from "react";
import { Edit2, Trash2, Reply, Volume2 } from "lucide-react";
import { getApiUrl } from "@/lib/api";

interface MessageActionsProps {
  messageId: string;
  isOwn: boolean;
  onEdit?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReply?: (messageId: string) => void;
  onRecord?: () => void;
  visible?: boolean;
}

export default function MessageActions({
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
      const endpoint = `/api/messages/${messageId}`;
      const resolved = getApiUrl ? getApiUrl(endpoint) : endpoint;
      console.debug("MessageActions: delete url", resolved);

      let response: Response | null = null;
      try {
        response = await fetch(resolved, { method: "DELETE", credentials: "include" });
      } catch (err) {
        console.warn("MessageActions: delete failed, trying relative endpoint", err);
      }

      if ((!response || !response.ok) && resolved !== endpoint) {
        response = await fetch(endpoint, { method: "DELETE", credentials: "include" });
      }

      if (response && response.ok) {
        onDelete?.(messageId);
      } else {
        console.error("Failed to delete message: non-ok response", response);
      }
    } catch (error) {
      console.error("Failed to delete message:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!visible) return null;

  return (
    <div className="flex gap-1 flex-wrap">
      {/* Reply button (always available) */}
      <button
        onClick={() => onReply?.(messageId)}
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
