export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            CandidStance
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover candidates positions on key issues with AI-driven analysis and credible sources
          </p>
        </div>
        
        <div className="w-full max-w-2xl mx-auto mb-12">
          <form className="flex gap-3">
            <input
              type="text"
              placeholder="Enter candidate name..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Search
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
