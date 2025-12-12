"use client";

import { FormEvent, useState, KeyboardEvent, useRef, useEffect } from "react";
import { FileUp, X } from "lucide-react";
import { User } from "@/lib/types";
import FileUpload from "./FileUpload";
import MentionSelector from "./MentionSelector";

interface MessageInputProps {
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent, files?: File[]) => void;
  availableUsers?: User[];
}

export default function MessageInput({
  value,
  placeholder,
  disabled,
  onChange,
  onSubmit,
  availableUsers = [],
}: MessageInputProps) {
  const [showFileUpload, setShowFileUpload] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [mentionQuery, setMentionQuery] = useState("");
  const [showMentionSelector, setShowMentionSelector] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFiles((prev) => [...prev, file]);
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  // Detect @mention in input
  const handleInputChange = (newValue: string) => {
    onChange(newValue);

    // Check for @mention trigger
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = newValue.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1 && cursorPos > lastAtIndex) {
        // Check if @ is at the start of a word or after a space
        const beforeAt = lastAtIndex === 0 ? " " : newValue[lastAtIndex - 1];
        if (/\s/.test(beforeAt) || beforeAt === undefined) {
          const query = textBeforeCursor.substring(lastAtIndex + 1);
          // Only show if query contains valid mention characters
          if (/^[a-zA-Z0-9_]*$/.test(query)) {
            setMentionQuery(query);
            setShowMentionSelector(true);
          } else {
            setShowMentionSelector(false);
          }
        } else {
          setShowMentionSelector(false);
        }
      } else {
        setShowMentionSelector(false);
      }
    }
  };

  // Handle mention selection
  const handleMentionSelect = (user: User) => {
    if (textareaRef.current) {
      const cursorPos = textareaRef.current.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);
      const lastAtIndex = textBeforeCursor.lastIndexOf("@");

      if (lastAtIndex !== -1) {
        const textAfterCursor = value.substring(cursorPos);
        const beforeAt = textBeforeCursor.substring(0, lastAtIndex);
        const mention = `@${user.username}`;

        const newValue = beforeAt + mention + textAfterCursor;
        onChange(newValue);

        setShowMentionSelector(false);
        setMentionQuery("");

        // Focus and set cursor after mention
        setTimeout(() => {
          if (textareaRef.current) {
            const newCursorPos = (beforeAt + mention).length;
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
          }
        }, 0);
      }
    }
  };

  const handleSubmit = (e: FormEvent) => {
    onSubmit(e, selectedFiles.length > 0 ? selectedFiles : undefined);
    setSelectedFiles([]);
    setShowFileUpload(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Send on Enter, but allow Shift+Enter for newlines
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (value.trim()) {
        const form = e.currentTarget.form;
        if (form) {
          form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
        }
      }
    }
    // Shift+Enter naturally creates a newline (no preventDefault)
  };

  return (
    <div className="border-t border-slate-700/50 bg-slate-800/40 backdrop-blur-md p-6 space-y-4" ref={containerRef}>
      {/* File Upload Modal */}
      {showFileUpload && (
        <div className="bg-slate-700/50 border border-slate-600 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-semibold">Add Files</h3>
            <button
              onClick={() => setShowFileUpload(false)}
              className="text-gray-400 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>
          <FileUpload
            onFileSelect={handleFileSelect}
            maxSize={50}
            maxFiles={10}
            acceptedTypes={["image/*", "video/*", "audio/*", ".pdf", ".doc", ".docx"]}
          />
        </div>
      )}

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400">Selected Files ({selectedFiles.length})</p>
          <div className="flex flex-wrap gap-2">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-2 bg-slate-700/50 px-3 py-2 rounded-lg border border-slate-600"
              >
                <span className="text-xs text-gray-300 truncate max-w-xs">{file.name}</span>
                <button
                  onClick={() => removeFile(index)}
                  className="text-gray-400 hover:text-red-400 transition"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <div className="flex-1 relative">
          {/* Mention Selector - positioned relative to textarea */}
          <MentionSelector
            isOpen={showMentionSelector}
            query={mentionQuery}
            users={availableUsers}
            onSelectUser={handleMentionSelect}
          />
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            rows={Math.min(Math.max(value.split('\n').length, 1), 4)}
            className="w-full rounded-xl bg-slate-700/50 border border-slate-600/50 px-5 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all resize-none"
            disabled={disabled}
          />
        </div>
        <button
          type="button"
          onClick={() => setShowFileUpload(!showFileUpload)}
          className="rounded-xl bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 p-3 text-gray-400 hover:text-white transition-colors"
          title="Attach files"
        >
          <FileUp size={20} />
        </button>
        <button
          type="submit"
          disabled={!value.trim() || disabled}
          className="rounded-xl bg-linear-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed px-6 py-3 font-semibold text-white transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center gap-2"
        >
          <span>✈️</span>
          <span className="hidden sm:inline">Send</span>
        </button>
      </form>
    </div>
  );
}
