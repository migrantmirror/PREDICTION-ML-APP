import { NextResponse } from "next/server"
import { getAllFootballFixtures } from "@/lib/api-client"
import { enrichAPIFootballMatches } from "@/lib/data-enrichment"
import { getStoredMatches, saveMatches, needsUpdate, getLastUpdateTime } from "@/lib/db-service"

// Enhanced mock data with comprehensive features
const generateAdvancedMatchData = () => {
  const matches = [
    {
      id: "1",
      home_team: "Manchester City",
      away_team: "Arsenal",
      commence_time: new Date(Date.now() + 86400000).toISOString(),
      sport_title: "Premier League",
      sport_key: "soccer_epl",
      bookmakers: [
        {
          title: "Bet365",
          markets: [
            {
              key: "h2h",
              outcomes: [
                { name: "Manchester City", price: 1.85 },
                { name: "Draw", price: 3.4 },
                { name: "Arsenal", price: 4.2 },
              ],
            },
          ],
        },
      ],
      // Enhanced team statistics
      team_stats: {
        home: {
          form: "WWWDW",
          goals_for: 2.3,
          goals_against: 0.8,
          xg_for: 2.5,
          xg_against: 0.9,
          shots_per_game: 18.2,
          possession_avg: 68.5,
          pass_accuracy: 89.2,
          corners_per_game: 7.1,
          fouls_per_game: 9.8,
          cards_per_game: 1.2,
          home_advantage: 0.15,
        },
        away: {
          form: "WDWLW",
          goals_for: 1.9,
          goals_against: 1.1,
          xg_for: 2.1,
          xg_against: 1.3,
          shots_per_game: 15.8,
          possession_avg: 62.1,
          pass_accuracy: 86.7,
          corners_per_game: 5.9,
          fouls_per_game: 11.2,
          cards_per_game: 1.8,
          away_form: -0.05,
        },
      },
      // Historical data
      historical_data: {
        home_wins: 15,
        away_wins: 8,
        draws: 7,
        home_goals_avg: 2.1,
        away_goals_avg: 1.4,
        head_to_head: {
          matches: 10,
          home_wins: 6,
          away_wins: 2,
          draws: 2,
          avg_goals: 2.8,
        },
      },
      // Player data
      player_data: {
        home: {
          key_players_available: 10,
          top_scorer_available: true,
          key_injuries: 1,
          suspensions: 0,
          fitness_score: 92,
        },
        away: {
          key_players_available: 9,
          top_scorer_available: false,
          key_injuries: 2,
          suspensions: 1,
          fitness_score: 85,
        },
      },
      // Venue data
      venue_data: {
        home_advantage_factor: 0.15,
        altitude: 50,
        weather_impact: 0.02,
        pitch_condition: 0.95,
        travel_distance: 200,
      },
      // Market data
      market_data: {
        opening_odds: { home: 1.9, draw: 3.5, away: 4.0 },
        current_odds: { home: 1.85, draw: 3.4, away: 4.2 },
        odds_movement: -0.05,
        betting_volume: 2500000,
        sharp_money_indicator: 0.7,
      },
      // Motivation factors
      motivation_factors: {
        home: {
          match_importance: 8,
          league_position_pressure: 7,
          recent_form_momentum: 8,
          revenge_factor: 3,
          fixture_congestion: 6,
          rest_days: 4,
        },
        away: {
          match_importance: 9,
          league_position_pressure: 8,
          recent_form_momentum: 6,
          revenge_factor: 7,
          fixture_congestion: 7,
          rest_days: 3,
        },
      },
      prediction: {
        result: "Home Win",
        confidence: 75,
        model_probabilities: { home_win: 55, draw: 25, away_win: 20 },
        expected_goals: "2.1 - 1.3",
        btts: "Yes",
        btts_probability: 65,
        over_2_5: "Yes",
        over_2_5_probability: 70,
        predicted_scoreline: "2-1",
        scoreline_probability: 15,
        value_bets: { home: "No Value", draw: "No Value", away: "No Value" },
        kelly_fractions: { home: 0, draw: 0, away: 0 },
        betting_edges: { home: 0, draw: 0, away: 0 },
        advanced_stats: {
          home_elo: 1650,
          away_elo: 1580,
          home_form_score: 80,
          away_form_score: 70,
          home_attack_strength: 1.4,
          away_attack_strength: 1.2,
          venue_advantage: 15,
          motivation_differential: 5,
          market_confidence: 75,
          total_goals_expectancy: 3.4,
          league_competitiveness: 90,
        },
      },
      last_updated: new Date().toISOString(),
    },
    {
      id: "2",
      home_team: "Real Madrid",
      away_team: "Barcelona",
      commence_time: new Date(Date.now() + 172800000).toISOString(),
      sport_title: "La Liga",
      sport_key: "soccer_spain_la_liga",
      bookmakers: [
        {
          title: "Bet365",
          markets: [
            {
              key: "h2h",
              outcomes: [
                { name: "Real Madrid", price: 2.1 },
                { name: "Draw", price: 3.2 },
                { name: "Barcelona", price: 3.8 },
              ],
            },
          ],
        },
      ],
      team_stats: {
        home: {
          form: "WWWWL",
          goals_for: 2.8,
          goals_against: 0.9,
          xg_for: 2.9,
          xg_against: 1.0,
          shots_per_game: 19.5,
          possession_avg: 65.2,
          pass_accuracy: 88.9,
          corners_per_game: 8.2,
          fouls_per_game: 10.1,
          cards_per_game: 1.5,
          home_advantage: 0.2,
        },
        away: {
          form: "WDWWW",
          goals_for: 2.5,
          goals_against: 1.0,
          xg_for: 2.7,
          xg_against: 1.1,
          shots_per_game: 17.8,
          possession_avg: 70.1,
          pass_accuracy: 91.2,
          corners_per_game: 6.8,
          fouls_per_game: 8.9,
          cards_per_game: 1.1,
          away_form: 0.1,
        },
      },
      historical_data: {
        home_wins: 45,
        away_wins: 42,
        draws: 25,
        home_goals_avg: 2.2,
        away_goals_avg: 2.1,
        head_to_head: {
          matches: 20,
          home_wins: 8,
          away_wins: 7,
          draws: 5,
          avg_goals: 3.2,
        },
      },
      player_data: {
        home: {
          key_players_available: 11,
          top_scorer_available: true,
          key_injuries: 0,
          suspensions: 0,
          fitness_score: 95,
        },
        away: {
          key_players_available: 10,
          top_scorer_available: true,
          key_injuries: 1,
          suspensions: 0,
          fitness_score: 93,
        },
      },
      venue_data: {
        home_advantage_factor: 0.18,
        altitude: 650,
        weather_impact: 0.01,
        pitch_condition: 0.98,
        travel_distance: 500,
      },
      market_data: {
        opening_odds: { home: 2.2, draw: 3.1, away: 3.6 },
        current_odds: { home: 2.1, draw: 3.2, away: 3.8 },
        odds_movement: -0.1,
        betting_volume: 5000000,
        sharp_money_indicator: 0.8,
      },
      motivation_factors: {
        home: {
          match_importance: 10,
          league_position_pressure: 9,
          recent_form_momentum: 8,
          revenge_factor: 8,
          fixture_congestion: 5,
          rest_days: 5,
        },
        away: {
          match_importance: 10,
          league_position_pressure: 8,
          recent_form_momentum: 9,
          revenge_factor: 8,
          fixture_congestion: 6,
          rest_days: 4,
        },
      },
      prediction: {
        result: "Home Win",
        confidence: 75,
        model_probabilities: { home_win: 55, draw: 25, away_win: 20 },
        expected_goals: "2.1 - 1.3",
        btts: "Yes",
        btts_probability: 65,
        over_2_5: "Yes",
        over_2_5_probability: 70,
        predicted_scoreline: "2-1",
        scoreline_probability: 15,
        value_bets: { home: "No Value", draw: "No Value", away: "No Value" },
        kelly_fractions: { home: 0, draw: 0, away: 0 },
        betting_edges: { home: 0, draw: 0, away: 0 },
        advanced_stats: {
          home_elo: 1650,
          away_elo: 1580,
          home_form_score: 80,
          away_form_score: 70,
          home_attack_strength: 1.4,
          away_attack_strength: 1.2,
          venue_advantage: 15,
          motivation_differential: 5,
          market_confidence: 75,
          total_goals_expectancy: 3.4,
          league_competitiveness: 90,
        },
      },
      last_updated: new Date().toISOString(),
    },
  ]

  return matches
}

// Update interval in milliseconds (2 hours for API-Football due to rate limits)
const UPDATE_INTERVAL = 7200000

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const league = searchParams.get("league")
    const forceUpdate = searchParams.get("forceUpdate") === "true"

    // Check if we need to update the data
    let matches = getStoredMatches()
    let usedFallbackData = false
    let dataSource = "stored"

    if (forceUpdate || needsUpdate(UPDATE_INTERVAL) || matches.length === 0) {
      console.log("Fetching fresh data from API-Football...")

      try {
        // Fetch data from API-Football
        const apiData = await getAllFootballFixtures()

        if (apiData && apiData.length > 0) {
          console.log(`Received ${apiData.length} fixtures from API-Football`)

          // Enrich with stats and predictions (this will take time due to rate limiting)
          console.log("Enriching fixtures with team stats and predictions...")
          matches = await enrichAPIFootballMatches(apiData.slice(0, 10)) // Limit to 10 matches to avoid rate limits

          // Save to storage
          saveMatches(matches)
          dataSource = "api-football"
        } else {
          console.warn("API-Football returned empty data, using fallback")
          usedFallbackData = true
          dataSource = "fallback"

          // If we don't have stored matches, generate mock data
          if (matches.length === 0) {
            matches = generateAdvancedMatchData()
            saveMatches(matches)
          }
        }
      } catch (error) {
        console.error("Error fetching from API-Football:", error)
        usedFallbackData = true
        dataSource = "fallback"

        // If we don't have stored matches, generate mock data
        if (matches.length === 0) {
          matches = generateAdvancedMatchData()
          saveMatches(matches)
        }
      }
    } else {
      console.log("Using stored data...")
      dataSource = "stored"
    }

    // Filter by league if specified
    if (league && league !== "all") {
      matches = matches.filter(
        (match) => match.sport_key === league || match.sport_title.toLowerCase().includes(league.toLowerCase()),
      )
    }

    // Sort by confidence (highest first)
    matches.sort((a, b) => {
      const aConf = a.prediction?.confidence || 0
      const bConf = b.prediction?.confidence || 0
      return bConf - aConf
    })

    return NextResponse.json({
      matches,
      meta: {
        usedFallbackData,
        dataSource,
        lastUpdated: getLastUpdateTime()?.toISOString() || null,
        count: matches.length,
        apiProvider: "API-Football",
      },
    })
  } catch (error) {
    console.error("Error in matches API:", error)

    // Always return some data, even if it's mock data
    const fallbackMatches = generateAdvancedMatchData()

    return NextResponse.json({
      matches: fallbackMatches,
      meta: {
        usedFallbackData: true,
        dataSource: "emergency-fallback",
        error: error instanceof Error ? error.message : "Unknown error",
        count: fallbackMatches.length,
        apiProvider: "Mock Data",
      },
    })
  }
}
