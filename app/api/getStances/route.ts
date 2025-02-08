import { getComprehensiveAnalysis } from "@/lib/openai";
import { getScoredSources } from "@/lib/googleapi";
import { POLITICAL_ISSUES } from "@/lib/constants";
import { CandidateModel } from "@/lib/models/candidate-postgresql";
import { executeQuery } from "@/lib/database/postgresql";

export async function POST(request: Request) {
  try {
    const { candidateName } = await request.json();
    
    if (!candidateName) {
      return new Response(
        JSON.stringify({ error: "Candidate name is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if candidate exists in database, create if not
    let candidate = await CandidateModel.getByName(candidateName);
    if (!candidate) {
      const candidateId = await CandidateModel.create({
        name: candidateName,
        party: undefined,
        office: undefined,
        state: undefined,
        is_active: true
      });
      candidate = await CandidateModel.getById(candidateId);
    }

    if (!candidate) {
      throw new Error("Failed to create or retrieve candidate");
    }

    // Get AI analysis for each political issue
    const stances = await Promise.all(
      POLITICAL_ISSUES.map(async (issue) => {
        try {
          // Get AI analysis
          const { analysis, verificationQueries } = await getComprehensiveAnalysis({
            candidateName,
            issue: issue.name,
            context: issue.description
          });

          // Get scored sources for verification
          const sources = await getScoredSources(candidateName, issue.name);
          
          // Filter to top 3 most credible sources
          const topSources = sources
            .filter(source => source.credibility !== "low")
            .slice(0, 3)
            .map(source => ({
              title: source.title,
              url: source.link,
              domain: source.domain
            }));

          // Store stance in database
          const stanceId = await CandidateModel.upsertStance(
            candidate.id,
            issue.id,
            {
              stance: analysis.stance,
              confidence: analysis.confidence,
              reasoning: analysis.reasoning,
              ai_analysis_id: `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            }
          );

          // Store source verification data
          if (topSources.length > 0) {
            for (const source of topSources) {
              const sourceScore = sources.find(s => s.link === source.url)?.score || 0;
              const credibilityLevel = sourceScore >= 80 ? "high" : sourceScore >= 60 ? "medium" : "low";
              
              await executeQuery(`
                INSERT INTO source_verification (
                  stance_id, source_url, source_title, source_domain, 
                  credibility_score, credibility_level, verification_factors
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
              `, [
                stanceId,
                source.url,
                source.title,
                source.domain,
                sourceScore / 100, // Convert to 0-1 scale
                credibilityLevel,
                JSON.stringify({ score: sourceScore, factors: sources.find(s => s.link === source.url)?.factors || [] })
              ]);
            }
          }

          // Store analysis history
          await executeQuery(`
            INSERT INTO analysis_history (
              candidate_id, analysis_type, analysis_data, processing_time_ms, status
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            candidate.id,
            "ai_analysis",
            JSON.stringify({
              issue: issue.name,
              stance: analysis.stance,
              confidence: analysis.confidence,
              reasoning: analysis.reasoning,
              verificationQueries,
              sourcesCount: topSources.length
            }),
            0, // We will calculate this later
            "completed"
          ]);

          return {
            issue: issue.name,
            stance: analysis.stance,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            sources: topSources,
            hasVerification: topSources.length > 0
          };
        } catch (error) {
          console.error(`Error analyzing issue ${issue.name}:`, error);
          
          // Store failed analysis in history
          await executeQuery(`
            INSERT INTO analysis_history (
              candidate_id, analysis_type, analysis_data, status, error_message
            ) VALUES ($1, $2, $3, $4, $5)
          `, [
            candidate.id,
            "ai_analysis",
            JSON.stringify({ issue: issue.name }),
            "failed",
            error instanceof Error ? error.message : "Unknown error"
          ]);

          // Return stance without verification if there is an error
          return {
            issue: issue.name,
            stance: `Analysis for ${issue.name} is not available`,
            confidence: 0,
            reasoning: "Unable to analyze this issue",
            sources: [],
            hasVerification: false
          };
        }
      })
    );

    // Store search query
    await executeQuery(`
      INSERT INTO search_queries (
        query_text, candidate_name, search_results_count
      ) VALUES ($1, $2, $3)
    `, [
      candidateName,
      candidateName,
      stances.filter(s => s.hasVerification).length
    ]);

    return new Response(
      JSON.stringify({
        candidate: candidate.name,
        stances,
        analysisDate: new Date().toISOString(),
        candidateId: candidate.id
      }),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error in getStances API:", error);
    return new Response(
      JSON.stringify({ error: "Failed to analyze political stances" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
