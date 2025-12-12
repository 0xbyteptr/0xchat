"use client";

import { useState } from "react";
import { Smile, X } from "lucide-react";

const EMOJI_CATEGORIES = {
  Smileys: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😂", "🙂", "🙃", "😉", "😊", "😇", "🥰", "😍", "🤩"],
  Gestures: ["👋", "🤚", "🖐️", "✋", "🖖", "👌", "🤌", "🤏", "✌️", "🤞", "🫰", "🤟", "🤘", "🤙", "👍", "👎"],
  Hearts: ["❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔", "💕", "💞", "💓", "💗", "💖", "💘"],
  Celebration: ["🎉", "🎊", "🎈", "🎀", "🎁", "🏆", "🥇", "🥈", "🥉", "⭐", "✨", "💫", "🌟", "⚡", "🔥", "💥"],
  Objects: ["📱", "💻", "🖥️", "⌨️", "🖱️", "🎮", "🎯", "🎲", "📚", "📖", "✏️", "📝", "🎨", "🎬", "🎤", "🎧"],
  Nature: ["🌈", "🌟", "🌙", "☀️", "🌤️", "⛅", "🌥️", "☁️", "🌦️", "🌧️", "⛈️", "🌩️", "🌨️", "❄️", "☃️", "⛄"],
  Food: ["🍕", "🍔", "🍟", "🌭", "🍿", "🥓", "🥚", "🍳", "🧈", "🥞", "🥐", "🍞", "🥖", "🥨", "🥯", "🍪"],
  Activities: ["🏀", "⚽", "🏈", "⚾", "🥎", "🎾", "🏐", "🏉", "🥏", "🎳", "🏓", "🏸", "🏒", "🏑", "🥍", "🏏"],
};

interface EmojiPickerProps {
  onSelect: (emoji: string) => void;
  maxRecentlyUsed?: number;
}

export default function EmojiPicker({ onSelect, maxRecentlyUsed = 8 }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("Smileys");
  const [recentlyUsed, setRecentlyUsed] = useState<string[]>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("recentlyUsedEmojis");
      return stored ? JSON.parse(stored) : [];
    }
    return [];
  });

  const handleSelectEmoji = (emoji: string) => {
    onSelect(emoji);
    
    // Update recently used
    const updated = [emoji, ...recentlyUsed.filter(e => e !== emoji)].slice(0, maxRecentlyUsed);
    setRecentlyUsed(updated);
    localStorage.setItem("recentlyUsedEmojis", JSON.stringify(updated));
    
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="text-gray-400 hover:text-white transition"
        title="Pick emoji"
      >
        <Smile size={20} />
      </button>

      {isOpen && (
        <div className="absolute right-0 bottom-full mb-2 w-96 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-50">
          {/* Category tabs */}
          <div className="flex overflow-x-auto gap-1 p-2 border-b border-slate-700">
            {recentlyUsed.length > 0 && (
              <button
                onClick={() => setSelectedCategory("Recently Used")}
                className={`px-2 py-1 rounded text-sm transition ${
                  selectedCategory === "Recently Used"
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700/50 text-gray-300 hover:bg-slate-700"
                }`}
              >
                🕐
              </button>
            )}
            {Object.keys(EMOJI_CATEGORIES).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-2 py-1 rounded text-sm transition ${
                  selectedCategory === category
                    ? "bg-purple-600 text-white"
                    : "bg-slate-700/50 text-gray-300 hover:bg-slate-700"
                }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Emoji grid */}
          <div className="p-3 grid grid-cols-8 gap-1 max-h-64 overflow-y-auto">
            {(selectedCategory === "Recently Used"
              ? recentlyUsed
              : EMOJI_CATEGORIES[selectedCategory as keyof typeof EMOJI_CATEGORIES] || []
            ).map((emoji, idx) => (
              <button
                key={idx}
                onClick={() => handleSelectEmoji(emoji)}
                className="text-2xl hover:bg-slate-700 p-2 rounded transition hover:scale-110"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
