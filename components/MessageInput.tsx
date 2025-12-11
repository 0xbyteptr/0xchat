"use client";

import { FormEvent } from "react";

interface MessageInputProps {
  value: string;
  placeholder: string;
  disabled: boolean;
  onChange: (value: string) => void;
  onSubmit: (e: FormEvent) => void;
}

export default function MessageInput({
  value,
  placeholder,
  disabled,
  onChange,
  onSubmit,
}: MessageInputProps) {
  return (
    <div className="border-t border-slate-700/50 bg-slate-800/40 backdrop-blur-md p-6">
      <form onSubmit={onSubmit} className="flex gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 rounded-xl bg-slate-700/50 border border-slate-600/50 px-5 py-3 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
          disabled={disabled}
        />
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
