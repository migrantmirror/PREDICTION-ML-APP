/**
 * Data enrichment service using API-Football data
 */

import {
  fetchTeamStatsWithFallback,
  poissonWinDrawLossProbs,
  overUnderProb,
  bttsProb,
  mostLikelyScore,
} from "./api-client"
import { AdvancedMLEngine } from "./advanced-ml-engine"
import type { StoredMatch } from "./db-service"

// Team data cache
const teamDataCache: Record<string, any> = {}

/**
 * Convert API-Football fixture to our match format
 */
export const convertAPIFootballFixture = (fixture: any): any => {
  return {
    id: fixture.fixture.id.toString(),
    home_team: fixture.teams.home.name,
    away_team: fixture.teams.away.name,
    commence_time: fixture.fixture.date,
    sport_title: fixture.league.name,
    sport_key: `league_${fixture.league.id}`,
    league_id: fixture.league.id.toString(),
    season: fixture.league.season.toString(),
    bookmakers: [], // API-Football doesn't provide odds in the free tier
    teams: {
      home: {
        id: fixture.teams.home.id.toString(),
        name: fixture.teams.home.name,
        logo: fixture.teams.home.logo,
      },
      away: {
        id: fixture.teams.away.id.toString(),
        name: fixture.teams.away.name,
        logo: fixture.teams.away.logo,
      },
    },
    venue: fixture.fixture.venue,
    status: fixture.fixture.status,
  }
}

/**
 * Generate realistic team stats using API-Football data
 */
export const generateTeamStatsFromAPI = async (teamId: string, isHome: boolean, season: string, leagueId: string) => {
  try {
    const stats = await fetchTeamStatsWithFallback(teamId, isHome, season, leagueId)

    // Generate form string based on recent performance
    const generateForm = (avgScored: number, avgConceded: number) => {
      const results = ["W", "D", "L"]
      let form = ""

      for (let i = 0; i < 5; i++) {
        // Better teams (higher scoring, lower conceding) get more wins
        const performance = avgScored - avgConceded
        let weights

        if (performance > 0.5) {
          weights = [0.6, 0.3, 0.1] // Good team
        } else if (performance > -0.5) {
          weights = [0.4, 0.4, 0.2] // Average team
        } else {
          weights = [0.2, 0.3, 0.5] // Poor team
        }

        const rand = Math.random()
        let result
        if (rand < weights[0]) result = results[0]
        else if (rand < weights[0] + weights[1]) result = results[1]
        else result = results[2]

        form += result
      }
      return form
    }

    return {
      form: generateForm(stats.avgScored, stats.avgConceded),
      goals_for: stats.avgScored,
      goals_against: stats.avgConceded,
      xg_for: stats.avgScored * 1.1, // Estimate xG as slightly higher than actual goals
      xg_against: stats.avgConceded * 1.1,
      shots_per_game: stats.avgScored * 6 + Math.random() * 4, // Estimate shots
      possession_avg: 45 + Math.random() * 20, // Random possession
      pass_accuracy: 75 + Math.random() * 15, // Random pass accuracy
      corners_per_game: stats.avgScored * 2 + Math.random() * 3,
      fouls_per_game: 8 + Math.random() * 6,
      cards_per_game: 1 + Math.random() * 2,
      home_advantage: isHome ? 0.1 + Math.random() * 0.1 : 0,
      away_form: !isHome ? -0.05 + Math.random() * 0.1 : 0,
      fallback: stats.fallback,
    }
  } catch (error) {
    console.error("Error generating team stats from API:", error)
    // Fallback to random stats
    return {
      form: "WDWLW",
      goals_for: 1.3,
      goals_against: 1.3,
      xg_for: 1.4,
      xg_against: 1.4,
      shots_per_game: 12,
      possession_avg: 50,
      pass_accuracy: 80,
      corners_per_game: 5,
      fouls_per_game: 10,
      cards_per_game: 2,
      home_advantage: isHome ? 0.15 : 0,
      away_form: !isHome ? 0 : 0,
      fallback: true,
    }
  }
}

/**
 * Generate predictions using Poisson distribution (from your React Native code)
 */
export const generatePoissonPrediction = (homeStats: any, awayStats: any) => {
  const homeExp = homeStats.goals_for
  const awayExp = awayStats.goals_for

  // Calculate probabilities
  const winDrawLoss = poissonWinDrawLossProbs(homeExp, awayExp)
  const overUnder = overUnderProb(homeExp, awayExp, 2.5)
  const btts = bttsProb(homeExp, awayExp)
  const likelyScore = mostLikelyScore(homeExp, awayExp)

  // Determine main prediction
  let result = "Draw"
  let confidence = Math.round(winDrawLoss.draw * 100)

  if (winDrawLoss.homeWin > Math.max(winDrawLoss.draw, winDrawLoss.awayWin)) {
    result = "Home Win"
    confidence = Math.round(winDrawLoss.homeWin * 100)
  } else if (winDrawLoss.awayWin > Math.max(winDrawLoss.homeWin, winDrawLoss.draw)) {
    result = "Away Win"
    confidence = Math.round(winDrawLoss.awayWin * 100)
  }

  return {
    result,
    confidence,
    model_probabilities: {
      home_win: Math.round(winDrawLoss.homeWin * 100),
      draw: Math.round(winDrawLoss.draw * 100),
      away_win: Math.round(winDrawLoss.awayWin * 100),
    },
    expected_goals: `${homeExp.toFixed(1)} - ${awayExp.toFixed(1)}`,
    btts: btts.bttsYes > 0.5 ? "Yes" : "No",
    btts_probability: Math.round(btts.bttsYes * 100),
    over_2_5: overUnder.over > 0.5 ? "Yes" : "No",
    over_2_5_probability: Math.round(overUnder.over * 100),
    predicted_scoreline: likelyScore.score,
    scoreline_probability: Math.round(likelyScore.prob * 100),
    poisson_based: true,
    data_source: homeStats.fallback || awayStats.fallback ? "fallback" : "api",
  }
}

/**
 * Generate realistic team stats based on team name
 * In a real app, this would fetch from a database or API
 */
export const generateTeamStats = (teamName: string) => {
  // Check cache first
  if (teamDataCache[teamName]) {
    return teamDataCache[teamName]
  }

  // Generate a consistent hash from team name for deterministic "random" values
  const hash = teamName.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use the hash to generate consistent values
  const seedRandom = (min: number, max: number) => {
    const rand = ((hash * 9301 + 49297) % 233280) / 233280
    return min + rand * (max - min)
  }

  // Generate form string (W, D, L)
  const generateForm = () => {
    const results = ["W", "D", "L"]
    let form = ""
    for (let i = 0; i < 5; i++) {
      // Top teams get more wins
      const isTopTeam = seedRandom(0, 100) > 50
      const weights = isTopTeam ? [0.6, 0.3, 0.1] : [0.3, 0.3, 0.4]
      const rand = seedRandom(0, 1)

      let result
      if (rand < weights[0]) result = results[0]
      else if (rand < weights[0] + weights[1]) result = results[1]
      else result = results[2]

      form += result
    }
    return form
  }

  // Generate team stats
  const stats = {
    form: generateForm(),
    goals_for: Number.parseFloat(seedRandom(0.8, 2.8).toFixed(1)),
    goals_against: Number.parseFloat(seedRandom(0.6, 2.0).toFixed(1)),
    xg_for: Number.parseFloat(seedRandom(0.9, 2.5).toFixed(1)),
    xg_against: Number.parseFloat(seedRandom(0.7, 1.9).toFixed(1)),
    shots_per_game: Number.parseFloat(seedRandom(8, 18).toFixed(1)),
    possession_avg: Number.parseFloat(seedRandom(40, 65).toFixed(1)),
    pass_accuracy: Number.parseFloat(seedRandom(75, 90).toFixed(1)),
    corners_per_game: Number.parseFloat(seedRandom(4, 8).toFixed(1)),
    fouls_per_game: Number.parseFloat(seedRandom(8, 14).toFixed(1)),
    cards_per_game: Number.parseFloat(seedRandom(1, 3).toFixed(1)),
    home_advantage: Number.parseFloat(seedRandom(0.05, 0.2).toFixed(2)),
    away_form: Number.parseFloat(seedRandom(-0.1, 0.1).toFixed(2)),
  }

  // Cache the result
  teamDataCache[teamName] = stats
  return stats
}

/**
 * Generate player data for a team
 */
export const generatePlayerData = (teamName: string) => {
  // Generate a hash from team name
  const hash = teamName.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use the hash to generate consistent values
  const seedRandom = (min: number, max: number) => {
    const rand = ((hash * 9301 + 49297) % 233280) / 233280
    return min + rand * (max - min)
  }

  return {
    key_players_available: Math.round(seedRandom(7, 11)),
    top_scorer_available: seedRandom(0, 1) > 0.2, // 80% chance top scorer is available
    key_injuries: Math.round(seedRandom(0, 3)),
    suspensions: Math.round(seedRandom(0, 1)),
    fitness_score: Math.round(seedRandom(75, 95)),
  }
}

/**
 * Generate historical data for a match
 */
export const generateHistoricalData = (homeTeam: string, awayTeam: string) => {
  // Generate a hash from team names
  const hash = (homeTeam + awayTeam).split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use the hash to generate consistent values
  const seedRandom = (min: number, max: number) => {
    const rand = ((hash * 9301 + 49297) % 233280) / 233280
    return min + rand * (max - min)
  }

  const totalMatches = Math.round(seedRandom(5, 20))
  const homeWins = Math.round(seedRandom(totalMatches * 0.3, totalMatches * 0.6))
  const awayWins = Math.round(seedRandom(totalMatches * 0.1, totalMatches * 0.4))
  const draws = totalMatches - homeWins - awayWins

  return {
    home_wins: homeWins,
    away_wins: awayWins,
    draws: draws,
    home_goals_avg: Number.parseFloat(seedRandom(1.2, 2.5).toFixed(1)),
    away_goals_avg: Number.parseFloat(seedRandom(0.8, 1.8).toFixed(1)),
    head_to_head: {
      matches: Math.round(seedRandom(5, 10)),
      home_wins: Math.round(seedRandom(2, 6)),
      away_wins: Math.round(seedRandom(1, 4)),
      draws: Math.round(seedRandom(1, 3)),
      avg_goals: Number.parseFloat(seedRandom(2.0, 3.5).toFixed(1)),
    },
  }
}

/**
 * Generate venue data for a match
 */
export const generateVenueData = (homeTeam: string) => {
  // Generate a hash from team name
  const hash = homeTeam.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use the hash to generate consistent values
  const seedRandom = (min: number, max: number) => {
    const rand = ((hash * 9301 + 49297) % 233280) / 233280
    return min + rand * (max - min)
  }

  return {
    home_advantage_factor: Number.parseFloat(seedRandom(0.1, 0.2).toFixed(2)),
    altitude: Math.round(seedRandom(0, 1000)),
    weather_impact: Number.parseFloat(seedRandom(0, 0.1).toFixed(2)),
    pitch_condition: Number.parseFloat(seedRandom(0.7, 1).toFixed(2)),
    travel_distance: Math.round(seedRandom(50, 500)),
  }
}

/**
 * Generate market data for a match
 */
export const generateMarketData = (bookmakers: any[]) => {
  // Extract opening odds from bookmakers if available
  let homeOdds = 0
  let drawOdds = 0
  let awayOdds = 0

  if (bookmakers && bookmakers.length > 0) {
    const market = bookmakers[0]?.markets?.find((m: any) => m.key === "h2h")
    if (market) {
      homeOdds = market.outcomes.find((o: any) => o.name.includes("home"))?.price || 0
      drawOdds = market.outcomes.find((o: any) => o.name === "Draw")?.price || 0
      awayOdds = market.outcomes.find((o: any) => o.name.includes("away"))?.price || 0
    }
  }

  // If no odds available, generate random ones
  if (!homeOdds) {
    homeOdds = Number.parseFloat((Math.random() * 2 + 1.5).toFixed(2))
    drawOdds = Number.parseFloat((Math.random() * 1.5 + 2.5).toFixed(2))
    awayOdds = Number.parseFloat((Math.random() * 3 + 2).toFixed(2))
  }

  // Generate slight variations for opening odds
  const openingHomeOdds = Number.parseFloat((homeOdds + (Math.random() * 0.2 - 0.1)).toFixed(2))
  const openingDrawOdds = Number.parseFloat((drawOdds + (Math.random() * 0.2 - 0.1)).toFixed(2))
  const openingAwayOdds = Number.parseFloat((awayOdds + (Math.random() * 0.2 - 0.1)).toFixed(2))

  return {
    opening_odds: {
      home: openingHomeOdds,
      draw: openingDrawOdds,
      away: openingAwayOdds,
    },
    current_odds: {
      home: homeOdds,
      draw: drawOdds,
      away: awayOdds,
    },
    odds_movement: Number.parseFloat((homeOdds - openingHomeOdds).toFixed(2)),
    betting_volume: Math.round(Math.random() * 5000000),
    sharp_money_indicator: Number.parseFloat((Math.random() * 0.8 + 0.2).toFixed(1)),
  }
}

/**
 * Generate motivation factors for a team
 */
export const generateMotivationFactors = (teamName: string) => {
  // Generate a hash from team name
  const hash = teamName.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use the hash to generate consistent values
  const seedRandom = (min: number, max: number) => {
    const rand = ((hash * 9301 + 49297) % 233280) / 233280
    return min + rand * (max - min)
  }

  return {
    match_importance: Math.round(seedRandom(5, 10)),
    league_position_pressure: Math.round(seedRandom(4, 9)),
    recent_form_momentum: Math.round(seedRandom(3, 9)),
    revenge_factor: Math.round(seedRandom(1, 8)),
    fixture_congestion: Math.round(seedRandom(3, 8)),
    rest_days: Math.round(seedRandom(2, 6)),
  }
}

/**
 * Generate league configuration
 */
export const generateLeagueConfig = (sportKey: string, sportTitle: string) => {
  // Generate a hash from sport key
  const hash = sportKey.split("").reduce((acc, char) => {
    return acc + char.charCodeAt(0)
  }, 0)

  // Use the hash to generate consistent values
  const seedRandom = (min: number, max: number) => {
    const rand = ((hash * 9301 + 49297) % 233280) / 233280
    return min + rand * (max - min)
  }

  // Extract country from sport title or key
  let country = "International"
  if (sportKey.includes("_")) {
    const parts = sportKey.split("_")
    country = parts[1].charAt(0).toUpperCase() + parts[1].slice(1)
  }

  return {
    name: sportTitle,
    country: country,
    avg_goals: Number.parseFloat(seedRandom(2.2, 3.0).toFixed(1)),
    competitiveness: Number.parseFloat(seedRandom(0.7, 0.95).toFixed(2)),
    home_advantage: Number.parseFloat(seedRandom(0.1, 0.2).toFixed(2)),
  }
}

/**
 * Enrich raw match data with stats and predictions
 */
export const enrichMatchData = (match: any): StoredMatch => {
  // Extract team names
  const homeTeam = match.home_team
  const awayTeam = match.away_team

  // Generate team stats
  const homeStats = generateTeamStats(homeTeam)
  const awayStats = generateTeamStats(awayTeam)

  // Generate player data
  const homePlayerData = generatePlayerData(homeTeam)
  const awayPlayerData = generatePlayerData(awayTeam)

  // Generate historical data
  const historicalData = generateHistoricalData(homeTeam, awayTeam)

  // Generate venue data
  const venueData = generateVenueData(homeTeam)

  // Generate market data
  const marketData = generateMarketData(match.bookmakers)

  // Generate motivation factors
  const homeMotivation = generateMotivationFactors(homeTeam)
  const awayMotivation = generateMotivationFactors(awayTeam)

  // Generate league configuration
  const leagueConfig = generateLeagueConfig(match.sport_key, match.sport_title)

  // Create prediction input
  const predictionInput = {
    homeOdds: marketData.current_odds.home,
    drawOdds: marketData.current_odds.draw,
    awayOdds: marketData.current_odds.away,
    teamStats: {
      home: homeStats,
      away: awayStats,
    },
    leagueConfig,
  }

  // Extract ML features
  const features = AdvancedMLEngine.extractMLFeatures(
    homeStats,
    awayStats,
    historicalData,
    homePlayerData,
    awayPlayerData,
    venueData,
    marketData,
    homeMotivation,
    awayMotivation,
  )

  // Generate prediction
  const outcome = AdvancedMLEngine.simulateMatchOutcome(features)
  const scoreSimulation = AdvancedMLEngine.poissonScoreSimulation(homeStats.xg_for, awayStats.xg_for)

  const valueBets = AdvancedMLEngine.detectValueBets(
    {
      home: outcome.homeWinProb,
      draw: outcome.drawProb,
      away: outcome.awayWinProb,
    },
    marketData.current_odds,
  )

  // Determine prediction result
  let result = "Draw"
  let confidence = Math.round(outcome.drawProb * 100)

  if (outcome.homeWinProb > Math.max(outcome.drawProb, outcome.awayWinProb)) {
    result = "Home Win"
    confidence = Math.round(outcome.homeWinProb * 100)
  } else if (outcome.awayWinProb > Math.max(outcome.homeWinProb, outcome.drawProb)) {
    result = "Away Win"
    confidence = Math.round(outcome.awayWinProb * 100)
  }

  // Create enriched match data
  const enrichedMatch: StoredMatch = {
    ...match,
    team_stats: {
      home: homeStats,
      away: awayStats,
    },
    player_data: {
      home: homePlayerData,
      away: awayPlayerData,
    },
    historical_data: historicalData,
    venue_data: venueData,
    market_data: marketData,
    motivation_factors: {
      home: homeMotivation,
      away: awayMotivation,
    },
    league_config: leagueConfig,
    ml_features: features,
    prediction: {
      result,
      confidence: Math.round(outcome.confidence),
      model_probabilities: {
        home_win: Math.round(outcome.homeWinProb * 100),
        draw: Math.round(outcome.drawProb * 100),
        away_win: Math.round(outcome.awayWinProb * 100),
      },
      expected_goals: `${homeStats.xg_for.toFixed(1)} - ${awayStats.xg_for.toFixed(1)}`,
      btts: scoreSimulation.bttsProb > 50 ? "Yes" : "No",
      btts_probability: Math.round(scoreSimulation.bttsProb),
      over_2_5: scoreSimulation.over25Prob > 50 ? "Yes" : "No",
      over_2_5_probability: Math.round(scoreSimulation.over25Prob),
      predicted_scoreline: scoreSimulation.mostLikelyScore,
      scoreline_probability: Math.round(scoreSimulation.scoreProbability),
      value_bets: {
        home: valueBets.home.isValue ? "Value" : "No Value",
        draw: valueBets.draw.isValue ? "Value" : "No Value",
        away: valueBets.away.isValue ? "Value" : "No Value",
      },
      kelly_fractions: {
        home: valueBets.home.kellyFraction,
        draw: valueBets.draw.kellyFraction,
        away: valueBets.away.kellyFraction,
      },
      betting_edges: {
        home: valueBets.home.edge,
        draw: valueBets.draw.edge,
        away: valueBets.away.edge,
      },
      advanced_stats: {
        home_elo: Math.round(features.home_team_elo),
        away_elo: Math.round(features.away_team_elo),
        home_form_score: Math.round(features.home_form_weighted * 100),
        away_form_score: Math.round(features.away_form_weighted * 100),
        home_attack_strength: features.home_attack_strength,
        away_attack_strength: features.away_attack_strength,
        venue_advantage: Math.round(features.venue_advantage * 100),
        motivation_differential: Math.round(features.motivation_differential * 100),
        market_confidence: Math.round(features.market_confidence * 100),
        total_goals_expectancy: Math.round((homeStats.xg_for + awayStats.xg_for) * 10) / 10,
        league_competitiveness: Math.round(features.league_competitiveness * 100),
      },
    },
    last_updated: new Date().toISOString(),
  }

  return enrichedMatch
}

/**
 * Enrich multiple matches
 */
export const enrichMatches = (matches: any[]): StoredMatch[] => {
  return matches.map((match) => enrichMatchData(match))
}

/**
 * Enrich API-Football fixture with stats and predictions
 */
export const enrichAPIFootballMatch = async (fixture: any): Promise<StoredMatch> => {
  try {
    const match = convertAPIFootballFixture(fixture)

    // Get team stats
    const homeStats = await generateTeamStatsFromAPI(match.teams.home.id, true, match.season, match.league_id)

    const awayStats = await generateTeamStatsFromAPI(match.teams.away.id, false, match.season, match.league_id)

    // Generate prediction
    const prediction = generatePoissonPrediction(homeStats, awayStats)

    // Create enriched match data
    const enrichedMatch: StoredMatch = {
      ...match,
      team_stats: {
        home: homeStats,
        away: awayStats,
      },
      prediction: {
        ...prediction,
        // Add some mock advanced stats for compatibility
        value_bets: {
          home: "No Value",
          draw: "No Value",
          away: "No Value",
        },
        kelly_fractions: {
          home: 0,
          draw: 0,
          away: 0,
        },
        betting_edges: {
          home: 0,
          draw: 0,
          away: 0,
        },
        advanced_stats: {
          home_elo: 1500 + (homeStats.goals_for - homeStats.goals_against) * 100,
          away_elo: 1500 + (awayStats.goals_for - awayStats.goals_against) * 100,
          home_form_score: Math.round((homeStats.goals_for / (homeStats.goals_for + homeStats.goals_against)) * 100),
          away_form_score: Math.round((awayStats.goals_for / (awayStats.goals_for + awayStats.goals_against)) * 100),
          home_attack_strength: homeStats.goals_for / 1.5,
          away_attack_strength: awayStats.goals_for / 1.5,
          venue_advantage: homeStats.home_advantage * 100,
          motivation_differential: 0,
          market_confidence: 75,
          total_goals_expectancy: homeStats.goals_for + awayStats.goals_for,
          league_competitiveness: 80,
        },
      },
      last_updated: new Date().toISOString(),
    }

    return enrichedMatch
  } catch (error) {
    console.error("Error enriching match:", error)
    throw error
  }
}

/**
 * Enrich multiple API-Football fixtures
 */
export const enrichAPIFootballMatches = async (fixtures: any[]): Promise<StoredMatch[]> => {
  const enrichedMatches = []

  for (const fixture of fixtures) {
    try {
      const enrichedMatch = await enrichAPIFootballMatch(fixture)
      enrichedMatches.push(enrichedMatch)

      // Add delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 200))
    } catch (error) {
      console.error("Error enriching fixture:", fixture.fixture.id, error)
    }
  }

  return enrichedMatches
}
