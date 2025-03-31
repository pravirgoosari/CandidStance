import { CandidateStances, PoliticalStance } from '../types';
import clientPromise from '../mongodb';

export interface CandidateDocument {
  _id?: { $oid: string };
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
  return name.toLowerCase().replace(/[^a-z]/g, '');
}

export async function findCandidate(name: string): Promise<CandidateDocument | null> {
  const client = await clientPromise;
  const db = client.db('candidstance');
  const collection = db.collection<CandidateDocument>('candidates');
  
  return collection.findOne({ normalizedName: normalizeName(name) });
}

export async function updateCandidate(data: CandidateStances): Promise<void> {
  const client = await clientPromise;
  const db = client.db('candidstance');
  const collection = db.collection<CandidateDocument>('candidates');
  
  const normalizedName = normalizeName(data.candidateName);
  const now = new Date();

  // First find the existing document to get the current searchCount
  const existing = await collection.findOne({ normalizedName });
  const searchCount = (existing?.metadata?.searchCount || 0) + 1;
  
  // Then do a simple update with all fields
  await collection.updateOne(
    { normalizedName },
    { 
      $set: {
        name: data.candidateName,
        normalizedName,
        lastUpdated: now,
        stances: data.stances,
        metadata: {
          searchCount,
          lastSearched: now
        }
      }
    },
    { upsert: true }
  );
}

export function isStale(lastUpdated: Date): boolean {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  return lastUpdated < thirtyDaysAgo;
} 