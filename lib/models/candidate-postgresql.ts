import { CandidateStances, PoliticalStance } from "../types.js";
import getPool from "../database/postgresql";

export interface CandidateDocument {
  id?: number;
  name: string;
  normalizedName: string;
  lastUpdated: Date;
  metadata: {
    searchCount: number;
    lastSearched: Date;
  };
  stances: PoliticalStance[];
}

function normalizeName(name: string): string {
  return name.toLowerCase().replace(/[^a-z]/g, "");
}

export async function findCandidate(name: string): Promise<CandidateDocument | null> {
  const normalizedName = normalizeName(name);
  
  try {
    const pool = getPool();
    const result = await pool.query(
      "SELECT id, name, normalized_name as \"normalizedName\", last_updated as \"lastUpdated\", search_count as \"searchCount\", last_searched as \"lastSearched\", stances FROM candidates WHERE normalized_name = $1",
      [normalizedName]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    return {
      id: row.id,
      name: row.name,
      normalizedName: row.normalizedName,
      lastUpdated: row.lastUpdated,
      metadata: {
        searchCount: row.searchCount,
        lastSearched: row.lastSearched
      },
      stances: row.stances
    };
  } catch (error) {
    console.error("Error finding candidate:", error);
    throw error;
  }
}

export async function updateCandidate(data: CandidateStances): Promise<void> {
  const normalizedName = normalizeName(data.candidateName);
  const now = new Date();

  try {
    const pool = getPool();
    // Convert stances array to JSON string for PostgreSQL JSONB column
    const stancesJson = JSON.stringify(data.stances);
    
    // Use PostgreSQL UPSERT (INSERT ... ON CONFLICT)
    await pool.query(`
      INSERT INTO candidates (name, normalized_name, last_updated, search_count, last_searched, stances)
      VALUES ($1, $2, $3, 1, $3, $4)
      ON CONFLICT (normalized_name) 
      DO UPDATE SET 
        name = EXCLUDED.name,
        last_updated = EXCLUDED.last_updated,
        search_count = candidates.search_count + 1,
        last_searched = EXCLUDED.last_updated,
        stances = EXCLUDED.last_updated,
        stances = EXCLUDED.stances
    `, [data.candidateName, normalizedName, now, stancesJson]);
  } catch (error) {
    console.error("Error updating candidate:", error);
    throw error;
  }
}

export function isStale(lastUpdated: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return lastUpdated < thirtyDaysAgo;
}

// Initialize database schema
export async function initializeDatabase(): Promise<void> {
  try {
    const pool = getPool();
    const schema = await import("fs").then(fs => fs.readFileSync("./lib/database/schema.sql", "utf8"));
    await pool.query(schema);
    console.log("Database schema initialized successfully");
  } catch (error) {
    console.error("Error initializing database schema:", error);
    throw error;
  }
}
