import { executeQuery, executeTransaction, getClient } from "../database/postgresql";

// Database interfaces
export interface DBCandidate {
  id: string;
  name: string;
  party?: string;
  office?: string;
  state?: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface DBPoliticalStance {
  id: string;
  candidate_id: string;
  issue_id: string;
  stance: string;
  confidence: number;
  reasoning?: string;
  ai_analysis_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface DBSourceVerification {
  id: string;
  stance_id: string;
  source_url: string;
  source_title?: string;
  source_domain?: string;
  credibility_score: number;
  credibility_level: "high" | "medium" | "low";
  verification_factors: any;
  verified_at: Date;
  created_at: Date;
}

// Candidate model class
export class CandidateModel {
  
  // Create a new candidate
  static async create(candidate: Omit<DBCandidate, "id" | "created_at" | "updated_at">): Promise<string> {
    const query = `
      INSERT INTO candidates (name, party, office, state, is_active)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `;
    
    const result = await executeQuery<{ id: string }>(query, [
      candidate.name,
      candidate.party,
      candidate.office,
      candidate.state,
      candidate.is_active
    ]);
    
    return result[0].id;
  }

  // Get candidate by ID
  static async getById(id: string): Promise<DBCandidate | null> {
    const query = `
      SELECT * FROM candidates WHERE id = $1
    `;
    
    const result = await executeQuery<DBCandidate>(query, [id]);
    return result.length > 0 ? result[0] : null;
  }

  // Get candidate by name
  static async getByName(name: string): Promise<DBCandidate | null> {
    const query = `
      SELECT * FROM candidates WHERE name ILIKE $1 AND is_active = true
    `;
    
    const result = await executeQuery<DBCandidate>(query, [name]);
    return result.length > 0 ? result[0] : null;
  }

  // Search candidates by name (partial match)
  static async searchByName(searchTerm: string): Promise<DBCandidate[]> {
    const query = `
      SELECT * FROM candidates 
      WHERE name ILIKE $1 AND is_active = true
      ORDER BY name
      LIMIT 10
    `;
    
    return executeQuery<DBCandidate>(query, [`%${searchTerm}%`]);
  }

  // Update candidate
  static async update(id: string, updates: Partial<Omit<DBCandidate, "id" | "created_at" | "updated_at">>): Promise<boolean> {
    const fields = Object.keys(updates).filter(key => updates[key as keyof typeof updates] !== undefined);
    
    if (fields.length === 0) return false;
    
    const setClause = fields.map((field, index) => `${field} = $${index + 2}`).join(", ");
    const query = `
      UPDATE candidates 
      SET ${setClause}
      WHERE id = $1
    `;
    
    const values = [id, ...fields.map(field => updates[field as keyof typeof updates])];
    const result = await executeQuery(query, values);
    
    return result.length > 0;
  }

  // Soft delete candidate (set is_active to false)
  static async deactivate(id: string): Promise<boolean> {
    const query = `
      UPDATE candidates SET is_active = false WHERE id = $1
    `;
    
    const result = await executeQuery(query, [id]);
    return result.length > 0;
  }

  // Get all active candidates
  static async getAllActive(): Promise<DBCandidate[]> {
    const query = `
      SELECT * FROM candidates 
      WHERE is_active = true 
      ORDER BY name
      ORDER BY name
    `;
    
    return executeQuery<DBCandidate>(query);
  }

  // Get candidates by party
  static async getByParty(party: string): Promise<DBCandidate[]> {
    const query = `
      SELECT * FROM candidates 
      WHERE party ILIKE $1 AND is_active = true
      ORDER BY name
    `;
    
    return executeQuery<DBCandidate>(query, [party]);
  }

  // Get candidates by state
  static async getByState(state: string): Promise<DBCandidate[]> {
    const query = `
      SELECT * FROM candidates 
      WHERE state ILIKE $1 AND is_active = true
      ORDER BY name
    `;
    
    return executeQuery<DBCandidate>(query, [state]);
  }

  // Get candidate with all their political stances
  static async getWithStances(candidateId: string): Promise<{
    candidate: DBCandidate;
    stances: DBPoliticalStance[];
  } | null> {
    const candidate = await this.getById(candidateId);
    if (!candidate) return null;

    const stancesQuery = `
      SELECT ps.*, pi.name as issue_name, pi.category as issue_category
      FROM political_stances ps
      JOIN political_issues pi ON ps.issue_id = pi.id
      WHERE ps.candidate_id = $1
      ORDER BY pi.name
    `;
    
    const stances = await executeQuery<DBPoliticalStance & { issue_name: string; issue_category: string }>(stancesQuery, [candidateId]);
    
    return {
      candidate,
      stances: stances.map(({ issue_name, issue_category, ...stance }) => stance)
    };
  }

  // Create or update a political stance for a candidate
  static async upsertStance(
    candidateId: string, 
    issueId: string, 
    stance: Omit<DBPoliticalStance, "id" | "candidate_id" | "issue_id" | "created_at" | "updated_at">
  ): Promise<string> {
    const query = `
      INSERT INTO political_stances (candidate_id, issue_id, stance, confidence, reasoning, ai_analysis_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (candidate_id, issue_id) 
      DO UPDATE SET 
        stance = EXCLUDED.stance,
        confidence = EXCLUDED.confidence,
        reasoning = EXCLUDED.reasoning,
        ai_analysis_id = EXCLUDED.ai_analysis_id,
        updated_at = CURRENT_TIMESTAMP
      RETURNING id
    `;
    
    const result = await executeQuery<{ id: string }>(query, [
      candidateId,
      issueId,
      stance.stance,
      stance.confidence,
      stance.reasoning,
      stance.ai_analysis_id
    ]);
    
    return result[0].id;
  }

  // Get candidate stances by issue category
  static async getStancesByCategory(candidateId: string, category: string): Promise<DBPoliticalStance[]> {
    const query = `
      SELECT ps.*
      FROM political_stances ps
      JOIN political_issues pi ON ps.issue_id = pi.id
      WHERE ps.candidate_id = $1 AND pi.category = $2
      ORDER BY pi.name
    `;
    
    return executeQuery<DBPoliticalStance>(query, [candidateId, category]);
  }

  // Get candidates with stance on specific issue
  static async getCandidatesWithStance(issueId: string): Promise<DBCandidate[]> {
    const query = `
      SELECT DISTINCT c.*
      FROM candidates c
      JOIN political_stances ps ON c.id = ps.candidate_id
      WHERE ps.issue_id = $1 AND c.is_active = true
      ORDER BY c.name
      ORDER BY c.name
    `;
    
    return result.length > 0;
  }
}
