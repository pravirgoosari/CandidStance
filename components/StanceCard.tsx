import { PoliticalStance } from '@/lib/types';
import { EVIDENCE_VERSION } from '../lib/evidence';

export function StanceCard({ stance }: { stance: PoliticalStance }) {
  const sources = stance.sources.slice(0, 3);
  const claims = stance.evidenceVersion === EVIDENCE_VERSION ? stance.claims || [] : [];
  return (
    <article className="p-6 bg-white rounded-lg shadow-md">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">{stance.issue}</h3>
      {claims.length ? (
        <div className="space-y-3 text-gray-600 mb-4">
          {claims.map((claim, index) => (
            <p key={index}>{claim.text}{' '}
              {[...new Set(claim.citations.map(c => c.sourceIndex))].filter(i => sources[i]).map(i => (
                <a key={i} href={sources[i].url} target="_blank" rel="noopener noreferrer" className="text-blue-700 ml-1" aria-label={`Source ${i + 1}`}>[{i + 1}]</a>
              ))}
            </p>
          ))}
        </div>
      ) : <p className="text-gray-600 mb-4">{stance.sourceError || 'The retrieved evidence was insufficient to establish a position.'}</p>}
      {!!claims.length && <div className="space-y-4 border-t pt-3">
        <h4 className="text-sm font-medium text-gray-700">Sources</h4>
        {sources.map((source, index) => (
          <div key={source.url} className="text-sm">
            <p className="font-medium text-gray-700">[{index + 1}] {source.title}</p>
            <a href={source.url} target="_blank" rel="noopener noreferrer" className="block break-all text-blue-700 hover:underline">{source.url}</a>
          </div>
        ))}
      </div>}
      {stance.checkedAt && <p className="text-xs text-gray-500 mt-4">Researched {stance.checkedAt.slice(0, 10)}. Positions may have changed.</p>}
    </article>
  );
}
