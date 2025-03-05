import { NextResponse } from "next/server";
import { openai, GPT_SYSTEM_PROMPT, generateUserPrompt } from "@/lib/openai";
import { verifyStanceWithSources } from "@/lib/googleapi";
import { ApiResponse, PoliticalStance } from "@/lib/types";
import { findCandidate, updateCandidate, isStale } from "@/lib/models/candidate-postgresql";

// Increase timeout for this API route
export const maxDuration = 120; // 2 minutes
export const dynamic = "force-dynamic";

function cleanAndParseJSON(jsonString: string): unknown {
  // Remove any markdown code block syntax
  let cleaned = jsonString.replace(/```json
?|
?```/g, "").trim();
  
  // Fix common JSON formatting issues
  cleaned = cleaned
    // Remove any duplicate opening braces
    .replace(/{\s*{/g, "{")
    // Remove any duplicate closing braces
    .replace(/}\s*}/g, "}")
    // Fix missing commas between objects in array
    .replace(/}\s*{/g, "},{")
    // Remove any trailing commas
    .replace(/,(\s*}|\s*])/g, "$1")
    // Fix missing quotes around property names
    .replace(/(\{|\,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\:/g, "$1\"$2\":")
    // Fix inconsistent whitespace and newlines
    .replace(/
\s*/g, " ")
    // Fix any double spaces
    .replace(/\s+/g, " ")
    // Fix issue with missing spaces after colons in property names
    .replace(/":([^\s])/g, "\": $1")
    // Ensure proper array formatting
    .replace(/\[\s*\{/, "[{")
    .replace(/\}\s*\]/, "}]");

  try {
    // Try to parse the cleaned JSON
    return JSON.parse(cleaned);
  } catch (error) {
    console.error("Failed to parse JSON:", error);
    console.error("Cleaned JSON string:", cleaned);
    
    // If parsing fails, try an alternative cleaning approach
    try {
      // Split into lines, trim each line, and rejoin
      const lines = cleaned.split(/[
]+/).map(line => line.trim());
      const rejoinedJSON = lines.join(" ");
      return JSON.parse(rejoinedJSON);
    } catch (secondError) {
      console.error("Failed second parse attempt:", secondError);
      throw error; // Throw the original error if both attempts fail
    }
  }
}

// Streaming function for real-time updates
async function processCandidateWithStream(candidateName: string, controller: ReadableStreamDefaultController) {
  try {
    // Send initial status
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", message: "Starting analysis..." })}

`));
    
    // First, validate and get the correct name
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", message: "Validating candidate name..." })}

`));
    
    const nameCompletion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      temperature: 0,
      messages: [
        { 
          role: "system", 
          content: "You are a U.S. political figure validator for current and recent politicians. Your task is to validate names and return the full, correct name.

Valid politicians include:
- Current and former elected officials (presidents, senators, representatives, governors)
- Current and recent presidential candidates
- Notable political figures in current national discourse

Examples:
- \"vivek\" -> \"Vivek Ramaswamy\"
- \"rfk jr\" -> \"Robert F. Kennedy Jr.\"
- \"trump\" -> \"Donald Trump\"
- \"aoc\" -> \"Alexandria Ocasio-Cortez\"
- \"elon musk\" -> \"INVALID\"
- \"taylor swift\" -> \"INVALID\"

If the input is not a U.S. political figure name, respond with \"INVALID\". Return ONLY the full name or \"INVALID\", no other text." 
        },
        { role: "user", content: candidateName }
      ]
    });

    const correctedName = nameCompletion.choices[0]?.message?.content?.trim() || candidateName;

    if (correctedName === "INVALID") {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", message: "Please enter a U.S. politician" })}

`));
      controller.close();
      return;
    }

    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", message: `Analyzing ${correctedName}...` })}

`));

    // Check database for cached data
    try {
      const cachedData = await findCandidate(correctedName);
      
      if (cachedData && !isStale(cachedData.lastUpdated)) {
        // Transform CandidateDocument to CandidateStances format
        const transformedData = {
          inputName: candidateName,
          candidateName: cachedData.name,
          stances: cachedData.stances
        };
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "complete", data: transformedData })}

`));
        controller.close();
        return;
      }
    } catch (dbError) {
      console.error("Database error:", dbError);
    }

    // Generate AI response
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", message: "Generating AI analysis..." })}

`));
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      temperature: 0,
      messages: [
        { role: "system", content: GPT_SYSTEM_PROMPT },
        { role: "user", content: generateUserPrompt(correctedName) }
      ]
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", message: "Failed to get response from AI" })}

`));
      controller.close();
      return;
    }

    try {
      const gptStances = cleanAndParseJSON(response) as PoliticalStance[];
      
      if (!Array.isArray(gptStances)) {
        throw new Error("Response is not an array of stances");
      }

      // Process stances with real-time updates
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", message: `Processing ${gptStances.length} stances...` })}

`));
      
      const stancesWithSources: PoliticalStance[] = [];
      for (let i = 0; i < gptStances.length; i++) {
        const stance = gptStances[i];
        
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "progress", current: i + 1, total: gptStances.length, stance: stance.issue })}

`));
        
        if (stance.stance === "No Information Found") {
          stancesWithSources.push({ ...stance, sources: [] });
          continue;
        }

        // Use the Google API to verify and get sources
        const verifiedStance = await verifyStanceWithSources(stance);
        stancesWithSources.push(verifiedStance);
      }

      const result = {
        inputName: candidateName,
        candidateName: correctedName,
        stances: stancesWithSources
      };

      // Update database
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", message: "Saving to database..." })}

`));
      
      try {
        await updateCandidate(result);
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "status", message: "Analysis complete!" })}

`));
      } catch (dbError) {
        console.error("Failed to update database:", dbError);
      }

      // Send final result
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "complete", data: result })}

`));
      controller.close();
      
    } catch (parseError) {
      console.error("Parse error:", parseError);
      controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", message: "Failed to parse AI response" })}

`));
      controller.close();
    }
  } catch (error) {
    console.error("Streaming error:", error);
    controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: "error", message: "Processing failed" })}

`));
    controller.close();
  }
}

export async function POST(req: Request) {
  try {
    const { candidateName, stream } = await req.json();

    if (!candidateName) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Candidate name is required"
      }, { status: 400 });
    }

    // If streaming is requested, use Server-Sent Events
    if (stream) {
      return new Response(
        new ReadableStream({
          start(controller) {
            processCandidateWithStream(candidateName, controller);
          }
        }),
        {
          headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    // First, validate and get the correct name
    try {
      const nameCompletion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        temperature: 0,
        messages: [
          { 
            role: "system", 
            content: "You are a U.S. political figure validator for current and recent politicians. Your task is to validate names and return the full, correct name.

Valid politicians include:
- Current and former elected officials (presidents, senators, representatives, governors)
- Current and recent presidential candidates
- Notable political figures in current national discourse

Examples:
- \"vivek\" -> \"Vivek Ramaswamy\"
- \"rfk jr\" -> \"Robert F. Kennedy Jr.\"
- \"trump\" -> \"Donald Trump\"
- \"aoc\" -> \"Alexandria Ocasio-Cortez\"
- \"elon musk\" -> \"INVALID\"
- \"taylor swift\" -> \"INVALID\"

If the input is not a U.S. political figure name, respond with \"INVALID\". Return ONLY the full name or \"INVALID\", no other text." 
          },
          { role: "user", content: candidateName }
        ]
      });

      const correctedName = nameCompletion.choices[0]?.message?.content?.trim() || candidateName;

      if (correctedName === "INVALID") {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: "Please enter a U.S. politician"
        }, { status: 400 });
      }

      // Check database for cached data
      let cachedData: any = null;
      
      try {
        cachedData = await findCandidate(correctedName);
        
        if (cachedData && !isStale(cachedData.lastUpdated)) {
          return NextResponse.json<ApiResponse>({
            success: true,
            data: {
              inputName: candidateName,
              candidateName: cachedData.name,
              stances: cachedData.stances
            }
          });
        }
      } catch (dbError) {
        console.error("Database error during lookup:", dbError);
        // Continue without cache if database fails
      }
      const completion = await openai.chat.completions.create({
        model: "gpt-4-turbo-preview",
        temperature: 0,
        messages: [
          { role: "system", content: GPT_SYSTEM_PROMPT },
          { role: "user", content: generateUserPrompt(correctedName) }
        ]
      });

      const response = completion.choices[0]?.message?.content;
      
      if (!response) {
        console.error(`No response content from OpenAI for "${correctedName}"`);
        return NextResponse.json<ApiResponse>({
          success: false,
          error: "Failed to get response from AI"
        }, { status: 500 });
      }

      try {
        const gptStances = cleanAndParseJSON(response) as PoliticalStance[];
        
        if (!Array.isArray(gptStances)) {
          throw new Error("Response is not an array of stances");
        }

        // Process stances sequentially to prevent race conditions
        const stancesWithSources: PoliticalStance[] = [];
        for (const stance of gptStances) {
          if (stance.stance === "No Information Found") {
            stancesWithSources.push({ ...stance, sources: [] });
            continue;
          }

          // Use the Google API to verify and get sources one at a time
          const verifiedStance = await verifyStanceWithSources(stance);
          stancesWithSources.push(verifiedStance);
        }

        const result = {
          inputName: candidateName,
          candidateName: correctedName,
          stances: stancesWithSources
        };

        // Try to update database, but do not fail if it errors
        try {
          await updateCandidate(result);
        } catch (dbError) {
          console.error("Failed to update database:", dbError);
          // Continue without database update
        }
        return NextResponse.json<ApiResponse>({
          success: true,
          data: result
        });
      } catch (parseError) {
        console.error("Parse error:", parseError);
        console.error("Raw response:", response);
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Failed to parse AI response: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
        }, { status: 500 });
      }
    } catch (openaiError) {
      console.error("OpenAI API error:", openaiError);
      return NextResponse.json<ApiResponse>({
        success: false,
        error: "Failed to process request with AI service"
      }, { status: 500 });
    }
  } catch (error) {
    console.error("API error:", error);
    return NextResponse.json<ApiResponse>({
      success: false,
      error: "Internal server error"
    }, { status: 500 });
  }
}
