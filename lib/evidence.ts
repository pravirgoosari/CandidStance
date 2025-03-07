import type { PoliticalStance } from './types';

export const EVIDENCE_VERSION = 4;
export const ISSUES = ['Economy & Taxes', 'Healthcare & Insurance', 'Abortion & Reproductive Rights', 'Climate & Environment', 'Elections & Voting Rights', 'Gun Control & Public Safety', 'Israel-Palestine Conflict', 'Russia-Ukraine War', 'Technology & Privacy', 'Immigration & Border Security', 'LGBTQ+ Rights', 'Education'] as const;
export const normalizeName = (name: string) => name.toLowerCase().replace(/[^a-z]/g, '');

export function fresh(stance: PoliticalStance, now = Date.now()): boolean {
  const age = now - Date.parse(stance.checkedAt || '');
  return stance.evidenceVersion === EVIDENCE_VERSION && Number.isFinite(age) && age >= 0 &&
    age < (stance.evidenceStatus === 'unavailable' ? 15 * 60000 : (stance.claims?.length ? 30 : 1) * 86400000);
}

export function missing(issue: string, reason = 'The retrieved evidence was insufficient to establish a position.'): PoliticalStance {
  return { issue, stance: 'Insufficient evidence', sources: [], claims: [], sourceError: reason,
    evidenceStatus: 'insufficient', evidenceVersion: EVIDENCE_VERSION, checkedAt: new Date().toISOString() };
}

export function unavailable(issue: string): PoliticalStance {
  return { ...missing(issue, 'Sources are temporarily unavailable. Please try again in 15 minutes.'), evidenceStatus: 'unavailable', stance: 'Research temporarily unavailable' };
}
