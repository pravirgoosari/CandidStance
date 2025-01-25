// RapidAPI Google Web Search integration for political information
export interface WebSearchResult {
  title: string;
  link: string;
  snippet: string;
  domain: string;
}

export interface WebSearchRequest {
  query: string;
  maxResults?: number;
  region?: string;
}

export interface WebSearchResponse {
  results: WebSearchResult[];
  totalResults: number;
  searchTime: number;
}

// Enhanced source scoring interfaces
export interface ScoredSource extends WebSearchResult {
  score: number;
  credibility: "high" | "medium" | "low";
  factors: ScoringFactor[];
}

export interface ScoringFactor {
  name: string;
  score: number;
  weight: number;
  description: string;
}

// RapidAPI configuration
export const RAPIDAPI_CONFIG = {
  baseUrl: "https://google-api31.p.rapidapi.com/websearch",
  maxResults: 10,
  defaultRegion: "us"
};

// Domain credibility scoring weights
export const DOMAIN_CREDIBILITY_WEIGHTS: Record<string, number> = {
  "reuters.com": 95,
  "ap.org": 95,
  "bbc.com": 90,
  "npr.org": 90,
  "nytimes.com": 88,
  "washingtonpost.com": 88,
  "wsj.com": 88,
  "cnn.com": 75,
  "foxnews.com": 70,
  "msnbc.com": 70,
  "abcnews.go.com": 80,
  "cbsnews.com": 80,
  "nbcnews.com": 80,
  "politico.com": 85,
  "rollcall.com": 80,
  "thehill.com": 75,
  "realclearpolitics.com": 70,
  "fivethirtyeight.com": 85,
  "factcheck.org": 90,
  "snopes.com": 90
};

// Function to build search query for political information
export function buildPoliticalSearchQuery(candidateName: string, issue: string): string {
  return `${candidateName} political stance ${issue} 2024 election`;
}

// Source scoring algorithm
export function scoreSource(source: WebSearchResult): ScoredSource {
  let totalScore = 0;
  const factors: ScoringFactor[] = [];
  
  // 1. Domain credibility (40% weight)
  const domainScore = DOMAIN_CREDIBILITY_WEIGHTS[source.domain] || 30;
  const domainWeight = 0.4;
  factors.push({
    name: "Domain Credibility",
    score: domainScore,
    weight: domainWeight,
    description: `Domain ${source.domain} credibility score`
  });
  totalScore += domainScore * domainWeight;
  
  // 2. Title relevance (25% weight)
  const titleRelevance = calculateTitleRelevance(source.title);
  const titleWeight = 0.25;
  factors.push({
    name: "Title Relevance",
    score: titleRelevance,
    weight: titleWeight,
    description: "How relevant the title is to political analysis"
  });
  totalScore += titleRelevance * titleWeight;
  
  // 3. Content freshness (20% weight)
  const freshnessScore = calculateFreshnessScore(source.snippet);
  const freshnessWeight = 0.2;
  factors.push({
    name: "Content Freshness",
    score: freshnessScore,
    weight: freshnessWeight,
    description: "How recent and relevant the content appears to be"
  });
  totalScore += freshnessScore * freshnessWeight;
  
  // 4. Source diversity (15% weight)
  const diversityScore = calculateDiversityScore(source.domain);
  const diversityWeight = 0.15;
  factors.push({
    name: "Source Diversity",
    score: diversityScore,
    weight: diversityWeight,
    description: "How unique this source is compared to others"
  });
  totalScore += diversityScore * diversityWeight;
  
  // Determine credibility level
  let credibility: "high" | "medium" | "low";
  if (totalScore >= 80) credibility = "high";
  else if (totalScore >= 60) credibility = "medium";
  else credibility = "low";
  
  return {
    ...source,
    score: Math.round(totalScore * 100) / 100,
    credibility,
    factors
  };
}

// Helper function to calculate title relevance
function calculateTitleRelevance(title: string): number {
  const politicalKeywords = ["political", "stance", "position", "policy", "election", "campaign", "candidate", "republican", "democrat"];
  const lowerTitle = title.toLowerCase();
  let relevanceScore = 50; // Base score
  
  politicalKeywords.forEach(keyword => {
    if (lowerLine.includes(keyword)) {
      relevanceScore += 10;
    }
  });
  
  return Math.min(relevanceScore, 100);
}

// Helper function to calculate freshness score
function calculateFreshnessScore(snippet: string): number {
  const currentYear = new Date().getFullYear();
  const yearPattern = /(20\d{2})/g;
  const years = snippet.match(yearPattern);
  
  if (!years) return 60; // No year mentioned
  
  const mostRecentYear = Math.max(...years.map(y => parseInt(y)));
  const yearDiff = currentYear - mostRecentYear;
  
  if (yearDiff === 0) return 100; // Current year
  if (yearDiff === 1) return 90;  // Last year
  if (yearDiff === 2) return 80;  // Two years ago
  if (yearDiff <= 5) return 70;   // Within 5 years
  return 50; // Older than 5 years
}

// Helper function to calculate diversity score
function calculateDiversityScore(domain: string): number {
  // This would be enhanced to track previously used domains
  // For now, return a base score
  return 80;
}

// Function to score and rank multiple sources
export function scoreAndRankSources(sources: WebSearchResult[]): ScoredSource[] {
  const scoredSources = sources.map(scoreSource);
  
  // Sort by score (highest first)
  return scoredSources.sort((a, b) => b.score - a.score);
}

// Enhanced search function that returns scored sources
export async function searchPoliticalInfo(request: WebSearchRequest): Promise<WebSearchResponse> {
  const query = request.query;
  const maxResults = request.maxResults || RAPIDAPI_CONFIG.maxResults;
  
  // Build URL with query parameters
  const url = new URL(RAPIDAPI_CONFIG.baseUrl);
  url.searchParams.append("q", query);
  url.searchParams.append("num", maxResults.toString());
  url.searchParams.append("region", request.region || RAPIDAPI_CONFIG.defaultRegion);
  
  // Make actual API call to RapidAPI
  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
      "X-RapidAPI-Host": "google-api31.p.rapidapi.com"
    }
  });
  
  if (!response.ok) {
    throw new Error("Failed to fetch search results");
  }
  
  const data = await response.json();
  
  // Transform API response to our format
  const results: WebSearchResult[] = data.results?.map((item: any) => ({
    title: item.title || "",
    link: item.link || "",
    snippet: item.snippet || "",
    domain: extractDomain(item.link || "")
  })) || [];
  
  return {
    results: results.slice(0, maxResults),
    totalResults: results.length,
    searchTime: Date.now()
  };
}

// Function to search for candidate stances on specific issues
export async function searchCandidateStance(candidateName: string, issue: string): Promise<WebSearchResponse> {
  const query = buildPoliticalSearchQuery(candidateName, issue);
  return searchPoliticalInfo({ query, maxResults: 10 });
}

// Function to get scored sources for a candidate stance
export async function getScoredSources(candidateName: string, issue: string): Promise<ScoredSource[]> {
  const searchResponse = await searchCandidateStance(candidateName, issue);
  return scoreAndRankSources(searchResponse.results);
}

// Function to validate web search results
export function validateWebSearchResults(results: WebSearchResult[]): WebSearchResult[] {
  return results.filter(result => 
    result.link && 
    result.title && 
    result.domain !== "example.com" // Filter out mock results
  );
}

// Function to extract domain from URL
export function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return url;
  }
}
