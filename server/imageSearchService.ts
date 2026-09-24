// Real-Time Live Image Scraping & Search Service for Pulse Note AI
// Replicates Google Images (udm=2) search results for any entity, person, or query in real time

export interface LiveImageResult {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  sourceUrl: string;
  domain: string;
  width?: number;
  height?: number;
  snippet?: string;
  aspectRatio?: string;
}

/**
 * Extracts and cleans the raw subject/entity from user prompts like:
 * - "create an image: Narendra Modi" -> "Narendra Modi"
 * - "generate image of Jayesh Wagh" -> "Jayesh Wagh"
 * - "show pictures of Rahul Gandhi" -> "Rahul Gandhi"
 */
export function extractCleanEntityQuery(query: string): string {
  if (!query) return '';
  return query
    .replace(/^\[.*?\]/g, '')
    .replace(/^(please\s+)?(generate|create|render|draw|make|synthesize|show\s+me|find|search|scrape)(\s+an?|\s+the)?\s+(image|photo|picture|wallpaper|illustration|art|portrait|render|graphic)\s*(of|for|showing|depicting)?\s*[:,-]?\s*/i, '')
    .replace(/^(photo|image|picture|portrait)\s+of\s*[:,-]?\s*/i, '')
    .replace(/\s*--(ar|aspect|style|lighting|seed)\s+[a-zA-Z0-9:]+/gi, '')
    .trim();
}

/**
 * Helper to extract domain name from a full URL
 */
function extractDomain(urlStr: string): string {
  try {
    const parsed = new URL(urlStr);
    return parsed.hostname.replace(/^www\./i, '');
  } catch {
    return 'web';
  }
}

/**
 * 1. Live DuckDuckGo Image Search Scraper (Live Google/Bing Web Image Index)
 */
async function fetchDuckDuckGoImages(query: string, limit: number = 8): Promise<LiveImageResult[]> {
  const results: LiveImageResult[] = [];
  try {
    const searchUrl = `https://duckduckgo.com/?q=${encodeURIComponent(query)}&iax=images&ia=images`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);

    const initRes = await fetch(searchUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!initRes.ok) return results;
    const html = await initRes.text();

    // Extract vqd token
    const vqdMatch = html.match(/vqd=['"]?([^'"&]+)/i) || html.match(/vqd=([0-9-_]+)/i);
    if (!vqdMatch || !vqdMatch[1]) return results;

    const vqd = vqdMatch[1];
    const apiUrl = `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(query)}&vqd=${vqd}&f=,,,&p=1`;

    const apiController = new AbortController();
    const apiTimeout = setTimeout(() => apiController.abort(), 4000);

    const apiRes = await fetch(apiUrl, {
      signal: apiController.signal,
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json, text/javascript, */*; q=0.01',
        Referer: 'https://duckduckgo.com/',
      },
    });
    clearTimeout(apiTimeout);

    if (apiRes.ok) {
      const data = await apiRes.json();
      if (Array.isArray(data?.results)) {
        data.results.slice(0, limit).forEach((item: any, idx: number) => {
          if (item.image && item.image.startsWith('http')) {
            const w = item.width || 1200;
            const h = item.height || 800;
            const domain = extractDomain(item.url || item.image);
            results.push({
              id: `ddg_${idx}_${Date.now()}`,
              title: item.title ? item.title.replace(/<[^>]+>/g, '') : `${query} (${idx + 1})`,
              url: item.image,
              thumbnailUrl: item.thumbnail || item.image,
              sourceUrl: item.url || item.image,
              domain,
              width: w,
              height: h,
              snippet: `Live web index image from ${domain} for ${query}`,
              aspectRatio: w >= h ? '16:9' : '9:16',
            });
          }
        });
      }
    }
  } catch (err: any) {
    console.warn('[IMAGE_SCRAPER] DuckDuckGo Live Search note:', err?.message || err);
  }
  return results;
}

/**
 * 2. Wikipedia / Wikimedia Live API
 */
async function fetchWikipediaImages(query: string, limit: number = 6): Promise<LiveImageResult[]> {
  const results: LiveImageResult[] = [];
  try {
    const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|extracts|info&inprop=url&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrlimit=${limit}&pithumbsize=1200&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(wikiUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseNoteAI/2.0 (image-search; contact@pulsenoteai.in)',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        Object.values(pages).forEach((page: any, idx: number) => {
          const originalImg = page?.thumbnail?.source || page?.original?.source;
          if (originalImg) {
            const w = page?.thumbnail?.width || 1200;
            const h = page?.thumbnail?.height || 800;
            results.push({
              id: `wiki_${page.pageid || idx}_${Date.now()}`,
              title: page.title || query,
              url: originalImg,
              thumbnailUrl: page.thumbnail?.source || originalImg,
              sourceUrl: page.fullurl || `https://en.wikipedia.org/?curid=${page.pageid}`,
              domain: 'wikipedia.org',
              width: w,
              height: h,
              snippet: page.extract ? page.extract.replace(/<[^>]+>/g, '').slice(0, 150) : `Official Wikipedia record for ${query}`,
              aspectRatio: w >= h ? '16:9' : '9:16',
            });
          }
        });
      }
    }
  } catch (err: any) {
    console.warn('[IMAGE_SCRAPER] Wikipedia notice:', err?.message || err);
  }
  return results;
}

/**
 * 3. Wikimedia Commons Open Media Search
 */
async function fetchWikimediaCommonsImages(query: string, limit: number = 6): Promise<LiveImageResult[]> {
  const results: LiveImageResult[] = [];
  try {
    const commonsUrl = `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(
      query
    )}&gsrnamespace=6&gsrlimit=${limit}&prop=imageinfo&iiprop=url|size|mime|extmetadata&format=json&origin=*`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(commonsUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'PulseNoteAI/2.0 (image-search; contact@pulsenoteai.in)',
      },
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      const pages = data?.query?.pages;
      if (pages) {
        Object.values(pages).forEach((page: any, idx: number) => {
          const imgInfo = page?.imageinfo?.[0];
          if (imgInfo && imgInfo.url) {
            const isSvg = imgInfo.url.endsWith('.svg');
            if (!isSvg || (imgInfo.width && imgInfo.width > 400)) {
              const w = imgInfo.width || 1280;
              const h = imgInfo.height || 720;
              const rawTitle = (page.title || '').replace(/^File:/i, '').replace(/\.[^/.]+$/, '').replace(/_/g, ' ');
              results.push({
                id: `commons_${page.pageid || idx}_${Date.now()}`,
                title: rawTitle || `${query} (${idx + 1})`,
                url: imgInfo.url,
                thumbnailUrl: imgInfo.thumburl || imgInfo.url,
                sourceUrl: imgInfo.descriptionurl || `https://commons.wikimedia.org/wiki/${encodeURIComponent(page.title)}`,
                domain: 'wikimedia.org',
                width: w,
                height: h,
                snippet: imgInfo.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, '').slice(0, 150) || `Archival photographic capture for ${query}`,
                aspectRatio: w >= h ? '16:9' : '9:16',
              });
            }
          }
        });
      }
    }
  } catch (err: any) {
    console.warn('[IMAGE_SCRAPER] Wikimedia Commons notice:', err?.message || err);
  }
  return results;
}

/**
 * Universal Search & Live Image Scraping Entrypoint
 * Aggregates live web results from DuckDuckGo Live Image Index, Wikipedia, and Wikimedia Commons.
 * Zero static fallbacks or hardcoded placeholder arrays.
 */
export async function searchLiveImages(rawQuery: string, limit: number = 8): Promise<LiveImageResult[]> {
  const cleanQuery = extractCleanEntityQuery(rawQuery) || rawQuery.trim();
  if (!cleanQuery) return [];

  const seenUrls = new Set<string>();
  const aggregatedResults: LiveImageResult[] = [];

  // Run searches in parallel for maximum speed
  const [ddgResults, wikiResults, commonsResults] = await Promise.all([
    fetchDuckDuckGoImages(cleanQuery, limit),
    fetchWikipediaImages(cleanQuery, 4),
    fetchWikimediaCommonsImages(cleanQuery, 4),
  ]);

  // Combine results with priority on accurate web matches
  const combined = [...ddgResults, ...wikiResults, ...commonsResults];

  for (const item of combined) {
    if (item.url && !seenUrls.has(item.url)) {
      seenUrls.add(item.url);
      aggregatedResults.push(item);
      if (aggregatedResults.length >= limit) break;
    }
  }

  return aggregatedResults;
}
