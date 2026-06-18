import { faviconFor } from "./website-suggestions";

export interface MediaResult {
  id: string;
  title: string;
  subtitle?: string; // director / author / artist
  year?: string;
  image: string;     // thumbnail / cover
}

/* All endpoints below are free and require no API key. */

/** Upscale an iTunes artwork URL (default 100x100) to a larger size. */
function upscaleItunes(url: string, size = 600): string {
  return url.replace(/\/\d+x\d+(bb)?\./, `/${size}x${size}$1.`);
}

/**
 * Search movies via Wikipedia (free, no key, CORS-enabled).
 * Uses pilicense=any so fair-use theatrical posters are returned as page images.
 */
export async function searchMovies(query: string, signal?: AbortSignal): Promise<MediaResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url =
    `https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*` +
    `&generator=search&gsrsearch=${encodeURIComponent(q + " film")}&gsrlimit=8` +
    `&prop=pageimages|description&piprop=thumbnail&pithumbsize=500&pilicense=any`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  const pages: any[] = data.query?.pages ? Object.values(data.query.pages) : [];
  pages.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return pages
    .filter((p) => {
      const d = (p.description || "").toLowerCase();
      // Keep entries that are films (exclude soundtracks, people, lists)
      return p.thumbnail && /\bfilm\b|\bmovie\b/.test(d) && !/soundtrack|album|registry|list of/.test(d);
    })
    .map((p) => {
      const yearMatch = (p.description || "").match(/\b(19|20)\d{2}\b/);
      return {
        id: String(p.pageid),
        title: (p.title || "Untitled").replace(/\s*\(film\)$/i, "").replace(/\s*\(\d{4} film\)$/i, ""),
        subtitle: p.description,
        year: yearMatch ? yearMatch[0] : undefined,
        image: p.thumbnail?.source || "",
      };
    });
}

/** Search music albums/songs via the iTunes Search API (free, no key). */
export async function searchMusic(query: string, signal?: AbortSignal): Promise<MediaResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=album&limit=8&country=CA`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.results || []).map((r: any) => ({
    id: String(r.collectionId ?? Math.random()),
    title: r.collectionName || "Untitled",
    subtitle: r.artistName,
    year: r.releaseDate ? String(new Date(r.releaseDate).getFullYear()) : undefined,
    image: r.artworkUrl100 ? upscaleItunes(r.artworkUrl100, 600) : "",
  }));
}

/** Search books via the Open Library API (free, no key). */
export async function searchBooks(query: string, signal?: AbortSignal): Promise<MediaResult[]> {
  const q = query.trim();
  if (!q) return [];
  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&limit=8&fields=title,author_name,first_publish_year,cover_i`;
  const res = await fetch(url, { signal });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.docs || [])
    .filter((d: any) => d.cover_i)
    .map((d: any) => ({
      id: String(d.cover_i ?? Math.random()),
      title: d.title || "Untitled",
      subtitle: d.author_name?.[0],
      year: d.first_publish_year ? String(d.first_publish_year) : undefined,
      image: `https://covers.openlibrary.org/b/id/${d.cover_i}-L.jpg`,
    }));
}

export interface BookmarkMeta {
  title?: string;
  siteName?: string;
  image?: string;   // og:image / screenshot
  favicon: string;
}

function normalizeUrl(input: string): string {
  let u = input.trim();
  if (!/^https?:\/\//i.test(u)) u = "https://" + u;
  return u;
}
export function domainOf(input: string): string {
  try {
    return new URL(normalizeUrl(input)).hostname.replace(/^www\./, "");
  } catch {
    return input.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
  }
}

/**
 * Best-effort bookmark metadata using microlink.io (free, no key, rate-limited).
 * Always returns at least a favicon derived from the domain.
 */
export async function fetchBookmarkMeta(rawUrl: string, signal?: AbortSignal): Promise<BookmarkMeta> {
  const url = normalizeUrl(rawUrl);
  const domain = domainOf(url);
  const favicon = faviconFor(domain, 128);
  try {
    const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`, { signal });
    if (res.ok) {
      const json = await res.json();
      if (json.status === "success") {
        const d = json.data || {};
        return {
          title: d.title,
          siteName: d.publisher || domain,
          image: d.image?.url || d.logo?.url,
          favicon: d.logo?.url || favicon,
        };
      }
    }
  } catch {
    /* ignore — fall back to favicon */
  }
  return { siteName: domain, favicon };
}
