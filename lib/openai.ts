// Enhanced OpenAI integration for political stance analysis
export interface AIAnalysisRequest {
  candidateName: string;
  issue: string;
  context?: string;
}

export interface AIAnalysisResponse {
  stance: string;
  confidence: number;
  reasoning: string;
  timestamp: Date;
  searchableInfo: SearchableInfo;
}

export interface SearchableInfo {
  keyPhrases: string[];
  specificClaims: string[];
  mentionedPolicies: string[];
  searchQueries: string[];
  suggestedSources: string[];
}

// Enhanced prompt template for political analysis
export const ENHANCED_PROMPT_TEMPLATE = `
Analyze the political stance of {candidateName} on {issue}.

Please provide:
1. Their position on this issue
2. Confidence level (0-100)
3. Brief reasoning for your assessment
4. Key phrases and claims to search for verification
5. Specific policies or statements mentioned
6. Suggested search queries for fact-checking

Issue: {issue}
Context: {context || "No additional context provided"}

Format your response to include searchable information that can be used to verify your analysis with credible sources.
`;

// Function to generate enhanced analysis prompt
export function generateEnhancedAnalysisPrompt(request: AIAnalysisRequest): string {
  return ENHANCED_PROMPT_TEMPLATE
    .replace("{candidateName}", request.candidateName)
    .replace("{issue}", request.issue)
    .replace("{context}", request.context || "No additional context provided");
}

// Function to extract searchable information from AI response
export function extractSearchableInfo(aiResponse: string): SearchableInfo {
  // Parse the AI response to extract key information
  const lines = aiResponse.split("
").filter(line => line.trim());
  
  const keyPhrases: string[] = [];
  const specificClaims: string[] = [];
  const mentionedPolicies: string[] = [];
  const searchQueries: string[] = [];
  const suggestedSources: string[] = [];
  
  // Extract information based on response structure
  lines.forEach(line => {
    const lowerLine = line.toLowerCase();
    
    if (lowerLine.includes("key phrase") || lowerLine.includes("important term")) {
      const phrase = line.split(":")[1]?.trim();
      if (phrase) keyPhrases.push(phrase);
    }
    
    if (lowerLine.includes("claim") || lowerLine.includes("statement")) {
      const claim = line.split(":")[1]?.trim();
      if (phrase) specificClaims.push(claim);
    }
    
    if (lowerLine.includes("policy") || lowerLine.includes("legislation")) {
      const policy = line.split(":")[1]?.trim();
      if (policy) mentionedPolicies.push(policy);
    }
    
    if (lowerLine.includes("search") || lowerLine.includes("query")) {
      const query = line.split(":")[1]?.trim();
      if (query) searchQueries.push(query);
    }
    
    if (lowerLine.includes("source") || lowerLine.includes("reference")) {
      const source = line.split(":")[1]?.trim();
      if (source) suggestedSources.push(source);
    }
  });
  
  return {
    keyPhrases: keyPhrases.length > 0 ? keyPhrases : ["political stance", "policy position"],
    specificClaims: specificClaims.length > 0 ? specificClaims : ["position analysis"],
    mentionedPolicies: mentionedPolicies.length > 0 ? mentionedPolicies : ["current policy"],
    searchQueries: searchQueries.length > 0 ? searchQueries : ["political analysis"],
    suggestedSources: suggestedSources.length > 0 ? suggestedSources : ["official statements"]
  };
}

// Enhanced AI analysis function that includes searchable information
export async function analyzePoliticalStance(request: AIAnalysisRequest): Promise<AIAnalysisResponse> {
  const prompt = generateEnhancedAnalysisPrompt(request);
  
  // Send request to OpenAI API
  const response = await fetch("/api/openai", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, candidateName: request.candidateName, issue: request.issue })
  });
  
  if (!response.ok) {
    throw new Error("Failed to get AI analysis");
  }
  
  const aiResponse = await response.text();
  const searchableInfo = extractSearchableInfo(aiResponse);
  
  // Parse the AI response for stance and confidence
  const stanceMatch = aiResponse.match(/stance[:\s]+([^
]+)/i);
  const confidenceMatch = aiResponse.match(/confidence[:\s]+(\d+)/i);
  const reasoningMatch = aiResponse.match(/reasoning[:\s]+([^
]+)/i);
  
  return {
    stance: stanceMatch?.[1]?.trim() || "Position analysis completed",
    confidence: confidenceMatch ? parseInt(confidenceMatch[1]) : 75,
    reasoning: reasoningMatch?.[1]?.trim() || "Analysis based on available information",
    timestamp: new Date(),
    searchableInfo
  };
}

// Function to generate optimized search queries for verification
export function generateVerificationQueries(candidateName: string, issue: string, searchableInfo: SearchableInfo): string[] {
  const baseQueries = [
    `${candidateName} ${issue} political stance 2024`,
    `${candidateName} ${issue} policy position`,
    `${candidateName} ${issue} voting record`,
    `${candidateName} ${issue} campaign promise`
  ];
  
  // Add specific claims as search queries
  const claimQueries = searchableInfo.specificClaims.map(claim => 
    `${candidateName} ${claim} ${issue}`
  );
  
  // Add policy-specific queries
  const policyQueries = searchableInfo.mentionedPolicies.map(policy => 
    `${candidateName} ${policy} ${issue}`
  );
  
  return [...baseQueries, ...claimQueries, ...policyQueries];
}

// Function to get comprehensive analysis with verification queries
export async function getComprehensiveAnalysis(request: AIAnalysisRequest): Promise<{
  analysis: AIAnalysisResponse;
  verificationQueries: string[];
}> {
  const analysis = await analyzePoliticalStance(request);
  const verificationQueries = generateVerificationQueries(
    request.candidateName, 
    request.issue, 
    analysis.searchableInfo
  );
  
  return {
    analysis,
    verificationQueries
  };
}
