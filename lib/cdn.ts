/**
 * CDN configuration and utilities
 * Handles serving files from cdn.byteptr.xyz
 */

const CDN_BASE_URL = process.env.NEXT_PUBLIC_CDN_URL || "https://cdn.byteptr.xyz";

export function getCDNUrl(path: string): string {
  // Remove leading slash if present
  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  return `${CDN_BASE_URL}/${cleanPath}`;
}

export function getUploadUrl(filename: string): string {
  // CDN endpoint: /uploads/:filename (not /data/uploads/)
  return getCDNUrl(`uploads/${filename}`);
}

export function getAvatarUrl(filename: string): string {
  // CDN endpoint: /files/avatars/:filename
  return getCDNUrl(`files/avatars/${filename}`);
}

export function getProfileUrl(filename: string): string {
  // CDN endpoint: /files/profiles/:filename
  return getCDNUrl(`files/profiles/${filename}`);
}

export function getFileUrl(type: string, filename: string): string {
  // CDN endpoint: /files/:type/:filename
  return getCDNUrl(`files/${type}/${filename}`);
}

/**
 * Convert app URL to CDN URL
 * Example: /data/uploads/file.ext → https://cdn.byteptr.xyz/uploads/file.ext
 */
export function appUrlToCDN(appUrl: string) {
  if (appUrl.startsWith("http")) return appUrl; // Already absolute
  
  // Convert /data/uploads/file -> /uploads/file
  if (appUrl.includes("/data/uploads/")) {
    return getUploadUrl(appUrl.split("/data/uploads/")[1]);
  }
  
  // Convert /data/avatars/file -> /files/avatars/file
  if (appUrl.includes("/data/avatars/")) {
    return getAvatarUrl(appUrl.split("/data/avatars/")[1]);
  }
  
  // Convert /data/profiles/file -> /files/profiles/file
  if (appUrl.includes("/data/profiles/")) {
    return getProfileUrl(appUrl.split("/data/profiles/")[1]);
  } 
}