/**
 * Client helper: mirror a remote cover image to Vercel Blob and return the
 * stable Blob URL. On any failure it resolves to the original URL so the UI
 * always has something to show.
 */
export async function cacheCoverImage(url: string, key?: string): Promise<string> {
  if (!url || url.startsWith("blob:") || url.includes(".public.blob.vercel-storage.com")) {
    return url; // already a blob URL or local — nothing to cache
  }
  try {
    const res = await fetch("/api/cache-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url, key }),
    });
    if (!res.ok) return url;
    const data = (await res.json()) as { url?: string };
    return data.url || url;
  } catch {
    return url;
  }
}
