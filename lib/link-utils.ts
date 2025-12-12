// Extract URLs from text content
export function extractLinksFromContent(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex) || [];
  
  // Remove duplicates
  return Array.from(new Set(matches));
}

// Validate URL format
export function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

// Decode HTML entities
export function decodeHtmlEntities(text: string): string {
  const textArea = typeof document !== 'undefined' ? document.createElement('textarea') : null;
  if (!textArea) return text;
  
  textArea.innerHTML = text;
  return textArea.value;
}

// Detect if URL is a 0xchat invite
export function isInviteUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    // Check if it's an invite URL (contains /invite/ with a code)
    return /\/invite\/[a-zA-Z0-9]+/.test(urlObj.pathname);
  } catch {
    return false;
  }
}

// Extract invite code from URL
export function extractInviteCode(url: string): string | null {
  try {
    const match = url.match(/\/invite\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}
