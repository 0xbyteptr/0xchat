"use client";

import { useState } from "react";
import { SmilePlus, X } from "lucide-react";

interface Reaction {
  emoji: string;
  count: number;
  userReacted: boolean;
}

interface MessageReactionsProps {
  reactions?: Record<string, Reaction>;
  onAddReaction?: (emoji: string) => void;
  onRemoveReaction?: (emoji: string) => void;
  isOwn?: boolean;
}

const COMMON_EMOJIS = [
  "👍",
  "❤️",
  "😂",
  "😮",
  "😢",
  "🔥",
  "✨",
  "🎉",
  "💯",
  "🙏",
  "👏",
  "😍",
  "🤔",
  "😡",
  "🤦",
  "🙌",
];

export default function MessageReactions({
  reactions = {},
  onAddReaction,
  onRemoveReaction,
  isOwn = false,
}: MessageReactionsProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const reactionEntries = Object.entries(reactions);

  return (
    <div className="flex flex-wrap gap-2 items-center mt-2">
      {/* Existing Reactions */}
      {reactionEntries.map(([emoji, reaction]) => (
        <button
          key={emoji}
          onClick={() => {
            if (reaction.userReacted) {
              onRemoveReaction?.(emoji);
            } else {
              onAddReaction?.(emoji);
            }
          }}
          className={`px-2 py-1 rounded-full text-sm font-medium transition-all flex items-center gap-1 ${
            reaction.userReacted
              ? "bg-purple-600/30 border border-purple-500 text-purple-300"
              : "bg-slate-700/30 border border-slate-600/30 text-gray-400 hover:bg-slate-700/50"
          }`}
        >
          <span>{emoji}</span>
          <span className="text-xs">{reaction.count}</span>
        </button>
      ))}

      {/* Add Reaction Button */}
      <div className="relative">
        <button
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-1.5 rounded-full hover:bg-slate-700/50 text-gray-400 hover:text-gray-300 transition-colors border border-slate-600/30 hover:border-slate-600"
          title="Add reaction"
        >
          <SmilePlus size={18} />
        </button>

        {/* Emoji Picker */}
        {showEmojiPicker && (
          <div className="absolute bottom-full right-0 mb-2 bg-slate-700 border border-slate-600 rounded-lg p-3 shadow-xl z-50 w-max">
            <div className="grid grid-cols-8 gap-1">
              {COMMON_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => {
                    onAddReaction?.(emoji);
                    setShowEmojiPicker(false);
                  }}
                  className="text-xl p-2 hover:bg-slate-600/50 rounded transition-colors cursor-pointer"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
