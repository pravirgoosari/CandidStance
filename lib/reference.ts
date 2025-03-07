import { Evidence } from './evidence';
import { extractText, readBounded } from './googleapi';

const TOPICS: Record<string, RegExp> = {
  'Economy & Taxes': /tax|economic|trade|tariff/i,
  'Healthcare & Insurance': /health|medicaid|medicare|affordable care/i,
  'Abortion & Reproductive Rights': /abortion|reproductive/i,
  'Climate & Environment': /climate|environment|energy/i,
  'Elections & Voting Rights': /voting|election|voter/i,
  'Gun Control & Public Safety': /gun|firearm|^second amendment$/i,
  'Israel-Palestine Conflict': /israel|palestin|gaza/i,
  'Russia-Ukraine War': /russia|ukraine/i,
  'Technology & Privacy': /privacy|technology|surveillance|artificial intelligence|tiktok/i,
  'Immigration & Border Security': /immigration|border|deport/i,
  'LGBTQ+ Rights': /lgbt|transgender|same.sex/i,
  'Education': /education|school|student/i
};
// A secondary reference fallback, clearly labeled in the UI. No paid search request.
export async function referenceEvidence(candidate: string, issues: readonly string[], fetcher = fetch): Promise<Evidence[]> {
  const url = `https://en.wikipedia.org/wiki/Political_positions_of_${encodeURIComponent(candidate.replace(/ /g, '_'))}`;
  try {
    const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(15000), headers: { 'User-Agent': 'CandidStance/1.0 (+https://candidstance.ai)' } });
    if (!response.ok) { await response.body?.cancel(); return []; }
    const html = await readBounded(response, 4000000);
    const headings = [...html.matchAll(/<h([2-4])\b[^>]*>([\s\S]*?)<\/h\1>/gi)];
    const sections = headings.map((h, i) => ({
      heading: extractText(h[2]),
      anchor: h[0].match(/id="([^"]+)"/)?.[1],
      text: extractText(html.slice(h.index! + h[0].length, headings[i+1]?.index ?? html.length))
    })).filter(s => s.text.length > 80 && !/references|external links|see also|notes|bibliography/i.test(s.heading));
    return issues.flatMap((issue, index) => {
      const matching = sections.filter(s => TOPICS[issue]?.test(s.heading)).slice(0, 2);
      if (!matching.length) return [];
      return [{ id: `W${index+1}`, url: url + (matching[0].anchor ? '#' + matching[0].anchor : ''),
        title: `${candidate}: ${issue} — Wikipedia`, source: 'en.wikipedia.org', evidenceType: 'article' as const,
        text: matching.map(s => `${s.heading}: ${s.text.slice(0, 3500)}`).join('\n') }];
    });
  } catch { return []; }
}
