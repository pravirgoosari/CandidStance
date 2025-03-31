import { PoliticalStance } from '@/lib/types';

interface StanceCardProps {
  stance: PoliticalStance;
}

export function StanceCard({ stance }: StanceCardProps) {
  const isNoInfo = stance.stance === 'No Information Found';
  const isUnverified = stance.sources.length === 1 && stance.sources[0].title === 'We are unable to verify this information';

  return (
    <div className="p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
      <h3 className="text-xl font-semibold mb-3 text-gray-800">{stance.issue}</h3>
      <p className={`mb-4 ${isNoInfo ? 'text-gray-500 italic' : 'text-gray-600'}`}>
        {stance.stance}
      </p>
      {!isNoInfo && stance.sources.length > 0 && (
        <div className="space-y-1">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Sources:</h4>
          <div className="space-y-3">
            {isUnverified ? (
              <div className="text-red-600 text-sm font-medium">
                We are unable to verify this information
              </div>
            ) : (
              stance.sources.map((source, index) => (
                <div key={index} className="text-sm">
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline block font-medium"
                  >
                    {source.title}
                  </a>
                  <span className="text-gray-500 text-xs">{source.source}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
} 