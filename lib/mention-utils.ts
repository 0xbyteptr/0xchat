import { Mention } from "@/lib/types";

/**
 * Parse mentions from message content (@username)
 */
export function parseMentions(content: string): Mention[] {
  const mentionRegex = /@(\w+)/g;
  const mentions: Mention[] = [];
  let match;

  while ((match = mentionRegex.exec(content)) !== null) {
    mentions.push({
      userId: match[1].toLowerCase(), // Would be looked up from user DB
      username: match[1],
      start: match.index,
      end: match.index + match[0].length,
    });
  }

  return mentions;
}

/**
 * Extract @mentions from content
 */
export function extractMentionedUserIds(content: string): string[] {
  const mentions = parseMentions(content);
  return mentions.map((m) => m.userId);
}

/**
 * Highlight mentions in content (returns HTML)
 */
export function highlightMentions(content: string): string {
  return content.replace(
    /@(\w+)/g,
    '<span class="text-blue-400 font-semibold bg-blue-500/20 px-1 rounded">@$1</span>'
  );
}

/**
 * Search messages by keyword
 */
export function searchMessages(messages: any[], query: string) {
  const lowerQuery = query.toLowerCase();
  return messages.filter(
    (msg) =>
      msg.content.toLowerCase().includes(lowerQuery) ||
      msg.author.username.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Highlight mentions in content with HTML string
 * Returns string with mentions wrapped in span tags
 */
export function highlightMentionsInText(text: string): string {
  return text.replace(
    /@([a-zA-Z0-9_]+)/g,
    '<span class="inline-block bg-purple-600/30 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/50 font-semibold text-sm mx-0.5">@$1</span>'
  );
}

/**
 * Get message excerpt for previews
 */
export function getMessageExcerpt(content: string, maxLength: number = 100): string {
  const lines = content.split("\n")[0]; // First line
  return lines.length > maxLength ? lines.substring(0, maxLength) + "..." : lines;
}

/**
 * Check if message contains mentions
 */
export function hasMentions(content: string): boolean {
  return /@\w+/.test(content);
}
