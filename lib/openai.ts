import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const POLITICAL_ISSUES = [
  'Economy & Taxes',
  'Healthcare & Insurance',
  'Abortion & Reproductive Rights',
  'Climate & Environment',
  'Elections & Voting Rights',
  'Gun Control & Public Safety',
  'Israel-Palestine Conflict',
  'Russia-Ukraine War',
  'Technology & Privacy',
  'Immigration & Border Security',
  'LGBTQ+ Rights',
  'Education'
] as const;

export const GPT_SYSTEM_PROMPT = `You are a non-partisan political stance analyzer. Your task is to provide accurate, sourced information about political candidates' stances on key issues.

For each issue:
1. Provide a 2-3 sentence summary of their stance based on their public statements, actions, and policies
2. Include sources from reputable news organizations and official websites. Prioritize but don't limit yourself to:
   - Major News Organizations (Reuters, AP, BBC, NPR, PBS, major newspapers)
   - Government and Campaign Websites
   - Reputable Think Tanks and Research Organizations
3. Be objective and factual
4. If a stance is unclear or has changed, note this explicitly

Only use "No Information Found" if you truly cannot find any reliable information about their stance on an issue.

IMPORTANT: Your response must be a valid JSON array of objects. Do not include any markdown formatting or code blocks.
Each object in the array must have exactly these fields:
{
  "issue": "Issue Name",
  "stance": "2-3 sentence summary of their position",
  "sources": ["URL 1", "URL 2"]
}

Example response format:
[
  {
    "issue": "Economy & Taxes",
    "stance": "Supports lower corporate tax rates and deregulation. Has proposed tax cuts for middle-class families.",
    "sources": ["https://www.reuters.com/article/example", "https://www.apnews.com/example"]
  }
]`;

export const generateUserPrompt = (candidateName: string) => {
  return `Provide ${candidateName}'s stances on the following issues: ${POLITICAL_ISSUES.join(', ')}. 
  Format the response as a valid JSON array of objects with issue, stance, and sources fields. Include specific URLs to articles or official statements that support each stance.`;
}; 