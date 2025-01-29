interface StanceCardProps {
  issue: string;
  stance: string;
  sources?: Array<{
    title: string;
    url: string;
    domain: string;
  }>;
  hasVerification?: boolean;
}

export default function StanceCard({ issue, stance, sources, hasVerification = true }: StanceCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
      <h3 className="text-lg font-semibold text-gray-900 mb-3">{issue}</h3>
      
      <p className="text-gray-700 mb-4 leading-relaxed">{stance}</p>
      
      {hasVerification ? (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-900">Sources:</h4>
          {sources && sources.length > 0 ? (
            <div className="space-y-2">
              {sources.map((source, index) => (
                <div key={index} className="text-sm">
                  <a 
                    href={source.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 underline"
                  >
                    {source.title}
                  </a>
                  <span className="text-gray-500 ml-2">{source.domain}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No sources available</p>
          )}
        </div>
      ) : (
        <div className="text-red-600 text-sm font-medium">
          We are unable to verify this information
        </div>
      )}
    </div>
  );
}
