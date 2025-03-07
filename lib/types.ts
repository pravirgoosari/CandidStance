export interface Source {
  url: string;
  title: string;
  source: string;
  evidenceType?: 'article' | 'search-excerpt';
}

export interface PoliticalStance {
  issue: string;
  stance: string;
  sources: Source[];
  sourceError?: string;
  evidenceVersion?: number;
  evidenceStatus?: 'supported' | 'insufficient' | 'unavailable';
  checkedAt?: string;
  claims?: { text: string; citations: { sourceIndex: number; quote: string }[] }[];
}

export interface CandidateStances {
  inputName: string;
  candidateName: string;
  stances: PoliticalStance[];
  error?: string;
  cached?: boolean;
  warning?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: CandidateStances;
  error?: string;
}
