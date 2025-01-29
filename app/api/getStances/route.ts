import { NextRequest, NextResponse } from "next/server";
import { getComprehensiveAnalysis } from "@/lib/openai";
import { getScoredSources } from "@/lib/googleapi";
import { POLITICAL_ISSUES } from "@/lib/constants";

export async function POST(request: NextRequest) {
  try {
    const { candidateName } = await request.json();
    
    if (!candidateName) {
      return NextResponse.json(
        { error: "Candidate name is required" },
        { status: 400 }
      );
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

          return {
            issue: issue.name,
            stance: analysis.stance,
            confidence: analysis.confidence,
            reasoning: analysis.reasoning,
            sources: topSources,
            hasVerification: topSources.length > 0
          };
        } catch (error) {
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

    return NextResponse.json({
      candidate: candidateName,
      stances,
      analysisDate: new Date().toISOString()
    });

  } catch (error) {
    console.error("Error in getStances API:", error);
    return NextResponse.json(
      { error: "Failed to analyze political stances" },
      { status: 500 }
    );
  }
}
