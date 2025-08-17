import { PoliticalStance, Source } from './types';

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

interface WebSearchResult {
  title: string;
  href: string;
  body?: string;
  description?: string;
  source?: string;
}

interface ScoredArticle extends WebSearchResult {
  score: number;
}

function scoreArticle(article: WebSearchResult, stance: PoliticalStance): number {
  let score = 0;
  const lowerTitle = article.title.toLowerCase();
  const lowerBody = article.body?.toLowerCase() || '';
  const candidateName = stance.stance.split(' ')[0].toLowerCase(); // e.g., "trump" or "harris"
  const issueWords = stance.issue.toLowerCase().split(' ');

  // Base scoring for candidate name
  if (lowerTitle.includes(candidateName)) {
    score += 2; // Reduced from 3 to 2
  }
  if (lowerBody.includes(candidateName)) {
    score += 1;
  }

  // Score for issue keywords
  let hasIssueInTitle = false;
  issueWords.forEach(word => {
    if (word.length > 3) { // Ignore small words like "and", "for"
      if (lowerTitle.includes(word)) {
        score += 2;
        hasIssueInTitle = true;
      }
      if (lowerBody.includes(word)) {
        score += 1;
      }
    }
  });

  // Bonus for having both candidate name and issue in title
  if (hasIssueInTitle && lowerTitle.includes(candidateName)) {
    score += 3;
  }

  // Bonus for policy/stance keywords in title
  const policyKeywords = ['policy', 'stance', 'position', 'plan', 'proposal', 'announces', 'pledges'];
  if (policyKeywords.some(keyword => lowerTitle.includes(keyword))) {
    score += 2;
  }

  // Penalty for other politician names in title
  const otherPoliticians = ['biden', 'harris', 'desantis', 'pence', 'newsom', 'pelosi', 'mcconnell', 'obama']
    .filter(name => name !== candidateName);
  if (otherPoliticians.some(name => lowerTitle.includes(name))) {
    score -= 2;
  }

  // Small bonus for reputable sources (reduced from 3 to 1)
  const reputableSources = [
    'reuters', 'ap', 'bloomberg', 'nytimes', 'wsj', 'washingtonpost', 
    'bbc', 'npr', 'politico', 'thehill', 'axios', 'cnbc', 'forbes'
  ];
  if (reputableSources.some(s => article.source?.toLowerCase().includes(s))) {
    score += 1;
  }

  return score;
}

export async function findRelevantSources(stance: PoliticalStance, maxResults: number = 2): Promise<Source[]> {
  try {
    // Check for API key at runtime
    if (!process.env.GOOGLE_API_KEY) {
      throw new Error('Missing GOOGLE_API_KEY environment variable');
    }

    // Use the full stance text as the search query
    const searchQuery = stance.stance;
    console.log('\n-------------------');
    console.log(`Starting search for stance: ${stance.issue}`);
    console.log(`Query: ${searchQuery}`);
    console.log('-------------------');
    
    // Add a delay before each API call to respect rate limits
    await delay(1100);
    
    const response = await fetch('https://google-api31.p.rapidapi.com/websearch', {
      method: 'POST',
      headers: {
        'x-rapidapi-key': process.env.GOOGLE_API_KEY!,
        'x-rapidapi-host': 'google-api31.p.rapidapi.com',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: searchQuery,
        safesearch: 'off',
        timelimit: '',
        region: 'wt-wt',
        max_results: 20
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Google API Error Response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      
      if (response.status === 429) {
        console.log('Rate limit hit, waiting 2 seconds and retrying...');
        await delay(2000);
        return findRelevantSources(stance, maxResults);
      }
      
      return [];
    }

    const data = await response.json();
    
    if (!data.result || data.result.length === 0) {
      console.log('No results found in Google API response');
      return [];
    }

    // Log all articles before filtering
    console.log(`\nAll articles found for ${stance.issue}:`);
    data.result.forEach((article: WebSearchResult, index: number) => {
      console.log(`\n${index + 1}. "${article.title}"`);
      console.log(`   Source: ${article.source || new URL(article.href).hostname}`);
      console.log(`   URL: ${article.href}`);
    });

    // Filter and score articles
    const scoredArticles = data.result.map((article: WebSearchResult) => ({
      ...article,
      score: scoreArticle(article, stance)
    }));

    // Log scoring details
    console.log(`\nScored articles for ${stance.issue}:`);
    scoredArticles.forEach((article: ScoredArticle, index: number) => {
      console.log(`\n${index + 1}. Score: ${article.score}`);
      console.log(`   Title: "${article.title}"`);
      console.log(`   Source: ${article.source || new URL(article.href).hostname}`);
      console.log(`   Intended for: ${stance.issue}`);
    });

    // Sort by score and take only articles with score >= 5
    const highScoringArticles = scoredArticles
      .filter((article: ScoredArticle) => article.score >= 5)
      .sort((a: ScoredArticle, b: ScoredArticle) => b.score - a.score)
      .slice(0, maxResults)
      .map((article: ScoredArticle) => ({
        url: article.href,
        title: article.title,
        source: article.source || new URL(article.href).hostname
      }));

    console.log(`\nHigh scoring articles (score >= 5) for ${stance.issue}:`);
    if (highScoringArticles.length > 0) {
      highScoringArticles.forEach((article: Source, index: number) => {
        console.log(`\n${index + 1}. "${article.title}"`);
        console.log(`   Source: ${article.source}`);
      });
    } else {
      console.log('No articles met the minimum score threshold of 5');
    }
    console.log(`\nFinished processing stance: ${stance.issue}`);
    console.log('-------------------\n');

    // If no articles meet the threshold, return a special message
    if (highScoringArticles.length === 0) {
      return [{
        url: '',
        title: 'We are unable to verify this information',
        source: 'No reliable sources found'
      }];
    }

    return highScoringArticles;
  } catch (error) {
    console.error(`Error fetching articles for stance ${stance.issue}:`, error);
    return [];
  }
}

export async function verifyStanceWithSources(stance: PoliticalStance): Promise<PoliticalStance> {
  try {
    // Do ONE search for this specific stance and keep its results
    const sources = await findRelevantSources(stance);
    
    // Return the stance with ONLY its intended sources
    return {
      ...stance,
      sources: sources
    };
  } catch (error) {
    console.error(`Error finding sources for stance ${stance.issue}:`, error);
    return {
      ...stance,
      sources: []
    };
  }
} 