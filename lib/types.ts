// Basic political issue types
export interface PoliticalIssue {
  id: string;
  name: string;
  description: string;
  category: string;
}

// Basic stance information
export interface Stance {
  issue: string;
  position: string;
  confidence: number; // 0-100
  source?: string;
}

// Basic candidate information
export interface Candidate {
  name: string;
  party?: string;
  stances: Stance[];
  lastUpdated: Date;
}

// Basic search request
export interface SearchRequest {
  candidateName: string;
  issues?: string[];
}

// Basic search response
export interface SearchResponse {
  candidate: Candidate;
  analysisDate: Date;
  processingTime: number;
}
