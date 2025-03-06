export interface Source {
  url: string;
  title: string;
  source: string;
}

export interface PoliticalStance {
  issue: string;
  stance: string;
  sources: Source[];
}

export interface CandidateStances {
  inputName: string;
  candidateName: string;
  stances: PoliticalStance[];
  error?: string;
}

export interface ApiResponse {
  success: boolean;
  data?: CandidateStances;
  error?: string;
} 