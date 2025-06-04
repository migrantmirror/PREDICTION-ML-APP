import { NextResponse } from "next/server"
import { getAllFootballOdds, clearCache } from "@/lib/api-client"
import { enrichMatches } from "@/lib/data-enrichment"
import { saveMatches } from "@/lib/db-service"

// This endpoint is designed to be called by a cron job
// to refresh the data periodically
export async function GET(request: Request) {
  try {
    // Check for API key (simple security)
    const { searchParams } = new URL(request.url)
    const apiKey = searchParams.get("key")

    // In production, use a proper API key validation
    if (!apiKey || apiKey !== process.env.REFRESH_API_KEY) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Clear API cache to ensure fresh data
    clearCache()

    // Fetch fresh data from API
    const apiData = await getAllFootballOdds()

    // Enrich with stats and predictions
    const matches = enrichMatches(apiData)

    // Save to storage
    saveMatches(matches)

    return NextResponse.json({
      success: true,
      message: `Successfully refreshed data for ${matches.length} matches`,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Error in refresh API:", error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      },
      { status: 500 },
    )
  }
}
