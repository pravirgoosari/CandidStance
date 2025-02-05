-- CandidStance Database Schema
-- PostgreSQL database schema for political stance analysis

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Political Issues table
CREATE TABLE IF NOT EXISTS political_issues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Candidates table
CREATE TABLE IF NOT EXISTS candidates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL UNIQUE,
    party VARCHAR(100),
    office VARCHAR(100),
    state VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Political Stances table
CREATE TABLE IF NOT EXISTS political_stances (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    issue_id UUID NOT NULL REFERENCES political_issues(id) ON DELETE CASCADE,
    stance TEXT NOT NULL,
    confidence INTEGER CHECK (confidence >= 0 AND confidence <= 100),
    reasoning TEXT,
    ai_analysis_id VARCHAR(255), -- Reference to AI analysis
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(candidate_id, issue_id)
);

-- Source Verification table
CREATE TABLE IF NOT EXISTS source_verification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    stance_id UUID NOT NULL REFERENCES political_stances(id) ON DELETE CASCADE,
    source_url TEXT NOT NULL,
    source_title VARCHAR(500),
    source_domain VARCHAR(255),
    credibility_score DECIMAL(3,2) CHECK (credibility_score >= 0 AND credibility_score <= 1),
    credibility_level VARCHAR(20) CHECK (credibility_level IN ("high", "medium", "low")),
    verification_factors JSONB, -- Store scoring factors
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Analysis History table
CREATE TABLE IF NOT EXISTS analysis_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    candidate_id UUID NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
    analysis_type VARCHAR(50) NOT NULL, -- "ai_analysis", "source_verification", etc.
    analysis_data JSONB, -- Store analysis results
    processing_time_ms INTEGER,
    status VARCHAR(50) DEFAULT "completed", -- "pending", "completed", "failed"
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Search Queries table (for tracking what users search)
CREATE TABLE IF NOT EXISTS search_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_text VARCHAR(500) NOT NULL,
    candidate_name VARCHAR(255),
    issue_name VARCHAR(255),
    search_results_count INTEGER,
    user_ip VARCHAR(45), -- IPv4 or IPv6
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_political_stances_candidate ON political_stances(candidate_id);
CREATE INDEX IF NOT EXISTS idx_political_stances_issue ON political_stances(issue_id);
CREATE INDEX IF NOT EXISTS idx_source_verification_stance ON source_verification(stance_id);
CREATE INDEX IF NOT EXISTS idx_source_verification_credibility ON source_verification(credibility_score);
CREATE INDEX IF NOT EXISTS idx_analysis_history_candidate ON analysis_history(candidate_id);
CREATE INDEX IF NOT EXISTS idx_analysis_history_created ON analysis_history(created_at);
CREATE INDEX IF NOT EXISTS idx_search_queries_candidate ON search_queries(candidate_name);
CREATE INDEX IF NOT EXISTS idx_search_queries_created ON search_queries(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language "plpgsql";

-- Triggers to automatically update updated_at
CREATE TRIGGER update_political_issues_updated_at 
    BEFORE UPDATE ON political_issues 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at 
    BEFORE UPDATE ON candidates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_political_stances_updated_at 
    BEFORE UPDATE ON political_stances 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert initial political issues
INSERT INTO political_issues (name, description, category) VALUES
    ("Economy & Taxes", "Economic policies, tax reform, and fiscal responsibility", "economic"),
    ("Healthcare & Insurance", "Healthcare reform, insurance, and medical policies", "social"),
    ("Abortion & Reproductive Rights", "Abortion policy, reproductive rights, and family planning", "social"),
    ("Climate & Environment", "Climate change, environmental protection, and energy policy", "environmental"),
    ("Elections & Voting Rights", "Voting rights, election integrity, and democratic processes", "democratic"),
    ("Gun Control & Public Safety", "Gun policy, public safety, and Second Amendment rights", "security"),
    ("Israel-Palestine Conflict", "Middle East policy, Israel-Palestine relations, and peace process", "foreign-policy"),
    ("Russia-Ukraine War", "Ukraine support, Russia policy, and international relations", "foreign-policy"),
    ("Technology & Privacy", "Tech regulation, privacy rights, and digital policy", "technology"),
    ("Immigration & Border Security", "Border security, immigration reform, and citizenship policy", "social"),
    ("LGBTQ+ Rights", "LGBTQ+ equality, civil rights, and anti-discrimination", "social"),
    ("Education", "Education reform, funding, and policy", "social")
ON CONFLICT (name) DO NOTHING;
