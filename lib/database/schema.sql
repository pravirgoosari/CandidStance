-- PostgreSQL Schema for CandidStance

-- Create candidates table
CREATE TABLE IF NOT EXISTS candidates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  normalized_name VARCHAR(255) UNIQUE NOT NULL,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  search_count INTEGER DEFAULT 1,
  last_searched TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  stances JSONB NOT NULL -- Stores PoliticalStance[] data
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_candidates_normalized_name ON candidates(normalized_name);
CREATE INDEX IF NOT EXISTS idx_candidates_last_updated ON candidates(last_updated);
CREATE INDEX IF NOT EXISTS idx_candidates_search_count ON candidates(search_count);

-- Create index on JSONB stances for efficient querying
CREATE INDEX IF NOT EXISTS idx_candidates_stances_gin ON candidates USING GIN (stances);

-- Add comments for documentation
COMMENT ON TABLE candidates IS 'Stores candidate political stance information';
COMMENT ON COLUMN candidates.normalized_name IS 'Lowercase, alphanumeric version of name for efficient lookups';
COMMENT ON COLUMN candidates.stances IS 'JSON array of political stances with sources';
COMMENT ON COLUMN candidates.search_count IS 'Number of times this candidate has been searched';
COMMENT ON COLUMN candidates.last_updated IS 'When the candidate data was last updated from API';
COMMENT ON COLUMN candidates.last_searched IS 'When the candidate was last searched by a user';
