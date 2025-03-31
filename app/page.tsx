'use client';

import { useState } from 'react';
import { StanceCard } from '@/components/StanceCard';
import { CandidateStances } from '@/lib/types';

export default function Home() {
  const [candidateName, setCandidateName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CandidateStances | null>(null);
  const [inputName, setInputName] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!candidateName.trim()) {
      setError('Please enter a candidate name');
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setInputName(candidateName.trim());
    
    try {
      const response = await fetch('/api/getStances', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ candidateName: candidateName.trim() }),
      });

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch stances');
      }

      setResults(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Function to normalize names for comparison
  const normalizeName = (name: string) => {
    return name.toLowerCase().replace(/[^a-z]/g, '');
  };

  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">CandidStance</h1>
          <p className="text-xl text-gray-600">
            Discover candidates&apos; positions on key issues with AI-driven analysis and credible sources
          </p>
        </div>

        <form onSubmit={handleSubmit} className="max-w-md mx-auto mb-12">
          <div className="flex gap-4">
            <input
              type="text"
              value={candidateName}
              onChange={(e) => setCandidateName(e.target.value)}
              placeholder="Enter candidate name..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Loading...' : 'Search'}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-red-600 text-sm">{error}</p>
          )}
        </form>

        {results && (
          <div>
            {normalizeName(inputName) !== normalizeName(results.candidateName) && (
              <p className="text-center text-gray-600 mb-4">
                We understood you meant <span className="font-semibold">{results.candidateName}</span>
              </p>
            )}
            <h2 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
              Stances for {results.candidateName}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {results.stances.map((stance, index) => (
                <StanceCard key={index} stance={stance} />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
