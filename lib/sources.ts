const DOMAINS = ['kff.org', 'whyy.org', 'factcheck.org', 'kiplinger.com', 'tomshardware.com', 'highereddive.com', 'elpais.com', 'archives.gov', 'aljazeera.com', 'theguardian.com', 'abcnews.go.com', 'cbsnews.com', 'nbcnews.com', 'time.com', 'ft.com', 'usatoday.com', 'lemonde.fr', 'reuters.com', 'apnews.com', 'bbc.com', 'bbc.co.uk', 'npr.org', 'pbs.org', 'politico.com', 'axios.com', 'thehill.com', 'cnbc.com', 'foxnews.com', 'cnn.com', 'nytimes.com', 'washingtonpost.com', 'wsj.com', 'whitehouse.gov', 'congress.gov', 'senate.gov', 'house.gov', 'presidency.ucsb.edu', 'c-span.org', 'treasury.gov', 'hhs.gov', 'epa.gov', 'ed.gov', 'dhs.gov', 'state.gov', 'justice.gov', 'federalregister.gov', 'govinfo.gov'];
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
