import { put, list } from "@vercel/blob";
import { type NextRequest, NextResponse } from "next/server";

/**
 * Mirrors a remote cover image (movie poster, book cover, album art, bookmark
 * thumbnail) into Vercel Blob so it persists even if the upstream URL rotates
 * or goes offline. Returns the stable public Blob URL.
 *
 * De-dupes by deterministic pathname (cache key) so the same source URL is only
 * uploaded once.
 */
export async function POST(request: NextRequest) {
  try {
    const { url, key } = (await request.json()) as { url?: string; key?: string };

    if (!url || !/^https?:\/\//i.test(url)) {
      return NextResponse.json({ error: "Invalid url" }, { status: 400 });
    }

    // Build a stable pathname from the provided key (or the source URL).
    const safe = (key || url).replace(/[^a-z0-9]+/gi, "-").slice(0, 80).toLowerCase();
    const ext = (url.split("?")[0].match(/\.(jpe?g|png|webp|gif|avif)$/i)?.[1] || "jpg").toLowerCase();
    const pathname = `covers/${safe}.${ext}`;

    // Already cached? Reuse it.
    try {
      const existing = await list({ prefix: pathname, limit: 1 });
      if (existing.blobs.length > 0 && existing.blobs[0].pathname === pathname) {
        return NextResponse.json({ url: existing.blobs[0].url, cached: true });
      }
    } catch {
      /* list failures are non-fatal — fall through to upload */
    }

    const upstream = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; PockItBot/1.0)" },
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: `Upstream ${upstream.status}` }, { status: 502 });
    }
    const contentType = upstream.headers.get("content-type") || `image/${ext === "jpg" ? "jpeg" : ext}`;
    const blob = await put(pathname, upstream.body as ReadableStream, {
      access: "public",
      contentType,
      addRandomSuffix: false,
      allowOverwrite: true,
    });

    return NextResponse.json({ url: blob.url, cached: false });
  } catch (error) {
    console.error("[v0] cache-image error:", error);
    return NextResponse.json({ error: "Cache failed" }, { status: 500 });
  }
}
