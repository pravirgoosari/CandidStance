import type { PoliticalStance, Source } from './types';

export const EVIDENCE_VERSION = 2;
export const ISSUES = ['Economy & Taxes', 'Healthcare & Insurance', 'Abortion & Reproductive Rights', 'Climate & Environment', 'Elections & Voting Rights', 'Gun Control & Public Safety', 'Israel-Palestine Conflict', 'Russia-Ukraine War', 'Technology & Privacy', 'Immigration & Border Security', 'LGBTQ+ Rights', 'Education'] as const;
export interface Evidence extends Source { id: string; text: string; evidenceType: 'article' | 'search-excerpt' }
export interface DraftClaim { text: string; citations: { id: string; quote: string }[] }
export interface DraftIssue { issue: string; claims: DraftClaim[] }
export const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');
export const normalizeText = (text: string) => text.replace(/\s+/g, ' ').trim();

export function fresh(stance: PoliticalStance, now = Date.now()): boolean {
  const age = now - Date.parse(stance.checkedAt || '');
  return stance.evidenceVersion === EVIDENCE_VERSION && Number.isFinite(age) && age >= 0 &&
    age < (stance.claims?.length ? 30 : 1) * 86400000;
}

export function missing(issue: string, reason = 'The retrieved evidence was insufficient to establish a position.'): PoliticalStance {
  return { issue, stance: 'Insufficient evidence', sources: [], claims: [], sourceError: reason,
    evidenceVersion: EVIDENCE_VERSION, checkedAt: new Date().toISOString() };
}

// URLs and quotes come from retrieved evidence, never from model-generated links.
export function validateDraft(raw: unknown, evidence: Evidence[], issues: readonly string[]): DraftIssue[] {
  const rows = (raw as { issues?: unknown })?.issues;
  if (!Array.isArray(rows)) throw new Error('Invalid evidence summary format');
  return issues.map(issue => {
    const row = rows.find(r => r?.issue === issue);
    const claims: DraftClaim[] = [];
    const used = new Set<string>();
    for (const c of Array.isArray(row?.claims) ? row.claims.slice(0, 3) : []) {
      if (typeof c?.text !== 'string' || !c.text.trim() || c.text.length > 650 || !Array.isArray(c.citations) || !c.citations.length) continue;
      const citations: DraftClaim['citations'] = [];
      let valid = true;
      for (const ref of c.citations) {
        const source = evidence.find(e => e.id === ref?.id);
        if (!source || typeof ref.quote !== 'string' || normalizeText(ref.quote).length < 20 || ref.quote.length > 500 ||
            !normalizeText(source.text).includes(normalizeText(ref.quote))) { valid = false; break; }
        citations.push({ id: source.id, quote: normalizeText(ref.quote) });
      }
      const next = new Set([...used, ...citations.map(c => c.id)]);
      if (valid && next.size <= 3) { claims.push({ text: c.text.trim(), citations }); next.forEach(id => used.add(id)); }
    }
    return { issue, claims };
  });
}

export function finalize(drafts: DraftIssue[], evidence: Evidence[], verdict: unknown): PoliticalStance[] {
  const approvals = (verdict as { approvals?: unknown })?.approvals;
  if (!Array.isArray(approvals)) throw new Error('Invalid evidence review format');
  return drafts.map(draft => {
    const claims = draft.claims.filter((_, index) => approvals.some(a => a?.issue === draft.issue && a?.claimIndex === index && a?.supported === true));
    if (!claims.length) return missing(draft.issue);
    const ids = [...new Set(claims.flatMap(c => c.citations.map(r => r.id)))];
    return { issue: draft.issue, stance: claims.map(c => c.text).join(' '),
      claims: claims.map(c => ({ text: c.text, citations: c.citations.map(r => ({ sourceIndex: ids.indexOf(r.id), quote: r.quote })) })),
      sources: ids.map(id => { const e = evidence.find(e => e.id === id)!; return { url: e.url, title: e.title, source: e.source, evidenceType: e.evidenceType }; }),
      checkedAt: new Date().toISOString(), evidenceVersion: EVIDENCE_VERSION };
  });
}
