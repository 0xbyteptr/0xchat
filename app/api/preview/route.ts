import { NextRequest, NextResponse } from "next/server";
import { linkPreviewCache, CACHE_TTL } from "@/lib/cache";

interface LinkPreviewData {
  title?: string;
  description?: string;
  image?: string;
  url: string;
  domain?: string;
  favicon?: string;
}

// Simple parser for Open Graph meta tags
function parseOpenGraph(html: string, url: string): LinkPreviewData {
  const preview: LinkPreviewData = { url };

  try {
    const domain = new URL(url).hostname;
    preview.domain = domain?.replace("www.", "");
  } catch {
    // Invalid URL
  }

  // Decode HTML entities helper
  const decodeHtml = (text: string): string => {
    const entities: { [key: string]: string } = {
      "&amp;": "&",
      "&lt;": "<",
      "&gt;": ">",
      "&quot;": '"',
      "&#39;": "'",
      "&#x27;": "'",
      "&#x2F;": "/",
    };
    
    // Also handle numeric entities like &#124;
    let decoded = text.replace(/&#(\d+);/g, (match, dec) => {
      return String.fromCharCode(parseInt(dec, 10));
    });
    
    // Handle hex entities like &#x27;
    decoded = decoded.replace(/&#x([0-9A-Fa-f]+);/g, (match, hex) => {
      return String.fromCharCode(parseInt(hex, 16));
    });
    
    // Handle named entities
    Object.entries(entities).forEach(([entity, char]) => {
      decoded = decoded.split(entity).join(char);
    });
    
    return decoded;
  };

  // Extract Open Graph tags
  const ogTitleMatch = html.match(/<meta\s+property=["']og:title["']\s+content=["']([^"']+)["']/i);
  const ogDescMatch = html.match(/<meta\s+property=["']og:description["']\s+content=["']([^"']+)["']/i);
  const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);

  if (ogTitleMatch) preview.title = decodeHtml(ogTitleMatch[1]);
  if (ogDescMatch) preview.description = decodeHtml(ogDescMatch[1]);
  if (ogImageMatch) preview.image = ogImageMatch[1];

  // Extract favicon
  const faviconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon)["'][^>]+href=["']([^"']+)["']/i) ||
                       html.match(/<link[^>]+href=["']([^"']+)["'][^>]+rel=["'](?:icon|shortcut icon)["']/i);
  if (faviconMatch) {
    let faviconUrl = faviconMatch[1];
    // Convert relative URLs to absolute
    if (faviconUrl.startsWith('/')) {
      try {
        const urlObj = new URL(url);
        faviconUrl = `${urlObj.protocol}//${urlObj.host}${faviconUrl}`;
      } catch {
        // Invalid URL, skip favicon
      }
    } else if (!faviconUrl.startsWith('http')) {
      try {
        const baseUrl = new URL(url);
        faviconUrl = new URL(faviconUrl, baseUrl).toString();
      } catch {
        // Invalid URL, skip favicon
      }
    }
    preview.favicon = faviconUrl;
  } else {
    // Fallback to standard favicon location
    try {
      const urlObj = new URL(url);
      preview.favicon = `${urlObj.protocol}//${urlObj.host}/favicon.ico`;
    } catch {
      // Invalid URL, skip favicon
    }
  }

  // Fallback to regular meta tags if OG tags not found
  if (!preview.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) preview.title = decodeHtml(titleMatch[1]);
  }

  if (!preview.description) {
    const descMatch = html.match(/<meta\s+name=["']description["']\s+content=["']([^"']+)["']/i);
    if (descMatch) preview.description = decodeHtml(descMatch[1]);
  }

  // Clean up text
  if (preview.title) preview.title = preview.title.slice(0, 200);
  if (preview.description) preview.description = preview.description.slice(0, 300);

  return preview;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const urlParam = searchParams.get("url");

    if (!urlParam) {
      return NextResponse.json(
        { error: "No URL provided" },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = urlParam.toLowerCase();
    const cached = linkPreviewCache.get(cacheKey);
    if (cached) {
      console.log("✅ Returning cached preview for:", urlParam);
      return NextResponse.json(cached);
    }

    // Validate URL
    let urlToFetch: URL;
    try {
      urlToFetch = new URL(urlParam);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL" },
        { status: 400 }
      );
    }

    // Only allow http(s) protocols
    if (!["http:", "https:"].includes(urlToFetch.protocol)) {
      return NextResponse.json(
        { error: "Invalid URL protocol" },
        { status: 400 }
      );
    }

    // Fetch the URL with a timeout using AbortController
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout

    const response = await fetch(urlToFetch.toString(), {
      method: "GET",
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch URL" },
        { status: 400 }
      );
    }

    const html = await response.text();
    const preview = parseOpenGraph(html, urlParam);

    // Cache the result
    linkPreviewCache.set(cacheKey, preview, CACHE_TTL.LINK_PREVIEW);

    return NextResponse.json(preview);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json(
        { error: "Request timeout" },
        { status: 504 }
      );
    }
    console.error("Preview fetch error:", error);
    return NextResponse.json(
      { error: "Failed to generate preview" },
      { status: 500 }
    );
  }
}
