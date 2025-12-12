"use client";

import { ReactElement } from "react";

interface MentionHighlightProps {
  text: string;
  onMentionClick?: (username: string) => void;
}

/**
 * Component that renders text with styled @mentions
 * Mentions are displayed with a purple background, padding, and border
 * Clicking a mention can trigger a callback (e.g., show user profile)
 */
export default function MentionHighlight({ text, onMentionClick }: MentionHighlightProps) {
  // Regex to match @username (word characters and underscores)
  const mentionRegex = /@([^\s]+)/g;

  const parts: (string | ReactElement)[] = [];
  let lastIndex = 0;
  let match;
  let mentionCount = 0;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before mention
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }

    // Add styled mention
    const username = match[1];
    parts.push(
      <button
        key={`mention-${mentionCount++}`}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onMentionClick?.(username);
        }}
        className="inline-block bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/50 font-semibold text-sm mx-0.5 hover:bg-purple-600/50 active:bg-purple-600 transition-colors cursor-pointer"
        title={`Click to view @${username}'s profile`}
        type="button"
      >
        @{username}
      </button>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return <>{parts.length > 0 ? parts : text}</>;
}
