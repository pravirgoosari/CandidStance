import { Evidence, normalizeText } from './evidence';

const DOMAINS = ['reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'npr.org', 'pbs.org', 'politico.com', 'axios.com', 'thehill.com', 'cnbc.com', 'foxnews.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com', 'wsj.com', 'whitehouse.gov', 'congress.gov', 'senate.gov', 'house.gov', 'presidency.ucsb.edu', 'c-span.org', 'treasury.gov', 'hhs.gov', 'epa.gov', 'ed.gov', 'dhs.gov', 'state.gov', 'justice.gov', 'federalregister.gov', 'govinfo.gov'];
export function sourceUrl(value: unknown): URL | null {
  if (typeof value !== 'string') return null;
  try {
    const u = new URL(value);
    if (u.protocol !== 'https:' || u.username || u.password || u.port || !DOMAINS.some(d => u.hostname === d || u.hostname.endsWith('.' + d))) return null;
    u.hash = '';
    for (const key of [...u.searchParams.keys()]) if (key.startsWith('utm_')) u.searchParams.delete(key);
    return u;
  } catch { return null; }
}
export function extractText(html: string): string {
  return normalizeText(html.replace(/<(script|style|nav|header|footer|noscript)\b[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/&#(?:39|x27);/gi, "'").replace(/&(?:lsquo|rsquo);/g, "'").replace(/&(?:ldquo|rdquo);/g, '"'));
}
export async function readBounded(response: Response, limit: number): Promise<string> {
  const reader = response.body?.getReader();
  if (!reader) return '';
  const chunks: Uint8Array[] = []; let size = 0;
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.length;
      if (size > limit) throw new Error('Response too large'); chunks.push(value); }
    return Buffer.concat(chunks).toString('utf8');
  } finally { await reader.cancel().catch(() => {}); }
}
export async function readArticle(evidence: Evidence, fetcher = fetch): Promise<Evidence> {
  try {
    // Only known publisher hosts, no arbitrary URLs or automatic redirects.
    let url = sourceUrl(evidence.url);
    if (!url) return evidence;
    const signal = AbortSignal.timeout(10000);
    for (let redirect = 0; redirect <= 2; redirect++) {
      const response: Response = await fetcher(url.href, { redirect: 'manual', signal, headers: { 'User-Agent': 'CandidStance/1.0 (+https://candidstance.ai)', Accept: 'text/html' } });
      if (response.status >= 300 && response.status < 400) {
        const location: string | null = response.headers.get('location'); await response.body?.cancel();
        url = location ? sourceUrl(new URL(location, url).href) : null;
        if (!url) return evidence;
        continue;
      }
      if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) { await response.body?.cancel(); return evidence; }
      const html = await readBounded(response, 1500000);
      const main = html.match(/<article\b[^>]*>([\s\S]*?)<\/article>/i)?.[1] || html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1];
      if (!main) return evidence;
      const text = extractText(main).slice(0, 6500);
      if (text.length < 250 || /verify you are human|access denied|enable javascript/i.test(text)) return evidence;
      return { ...evidence, text, evidenceType: 'article' };
    }
  } catch { /* Inaccessible pages are excluded by the research pipeline. */ }
  return evidence;
}
