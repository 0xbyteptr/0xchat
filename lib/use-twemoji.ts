import { useEffect, useRef } from "react";
import twemoji from "twemoji";

/**
 * Hook to parse and render emojis using twemoji in a DOM element
 * This ensures consistent emoji rendering across all platforms
 */
export function useTwemoji(elementRef: React.RefObject<HTMLElement>) {
  useEffect(() => {
    if (elementRef.current) {
      twemoji.parse(elementRef.current, {
        folder: "svg",
        ext: ".svg",
      });
    }
  }, [elementRef]);
}

/**
 * Parse text with twemoji and return HTML string
 * Useful for SSR or when you need the HTML directly
 */
export function parseTwemoji(text: string): string {
  return twemoji.parse(text, {
    folder: "svg",
    ext: ".svg",
  });
}

/**
 * Convert emoji to twemoji SVG URL
 */
export function getEmojiUrl(emoji: string): string {
  const codePoint = Array.from(emoji)
    .map((char) => char.charCodeAt(0).toString(16))
    .join("-");
  return `https://cdn.jsdelivr.net/npm/twemoji@14/dist/svg/${codePoint}.svg`;
}

/**
 * Render emoji as inline image
 */
export function getTwemojiHTML(emoji: string): string {
  const url = getEmojiUrl(emoji);
  return `<img src="${url}" alt="${emoji}" class="inline-block w-5 h-5" />`;
}
