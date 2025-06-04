// Advanced Machine Learning Prediction Engine

export interface HistoricalData {
  home_wins: number
  away_wins: number
  draws: number
  home_goals_avg: number
  away_goals_avg: number
  head_to_head: {
    matches: number
    home_wins: number
    away_wins: number
    draws: number
    avg_goals: number
  }
}

export interface TeamStats {
  form: string
  goals_for: number
  goals_against: number
  xg_for: number
  xg_against: number
  shots_per_game: number
  possession_avg: number
  pass_accuracy: number
  corners_per_game: number
  fouls_per_game: number
  cards_per_game: number
  home_advantage?: number
  away_form?: number
}

export interface PlayerData {
  key_players_available: number
  top_scorer_available: boolean
  key_injuries: number
  suspensions: number
  fitness_score: number
}

export interface VenueData {
  home_advantage_factor: number
  altitude: number
  weather_impact: number
  pitch_condition: number
  travel_distance: number
}

export interface MarketData {
  opening_odds: { home: number; draw: number; away: number }
  current_odds: { home: number; draw: number; away: number }
  odds_movement: number
  betting_volume: number
  sharp_money_indicator: number
}

export interface MotivationFactors {
  match_importance: number // 1-10 scale
  league_position_pressure: number
  recent_form_momentum: number
  revenge_factor: number
  fixture_congestion: number
  rest_days: number
}

export interface MLFeatures {
  // Historical features
  home_team_elo: number
  away_team_elo: number
  home_form_weighted: number
  away_form_weighted: number
  h2h_win_rate: number

  // Performance metrics
  home_xg_diff: number
  away_xg_diff: number
  home_attack_strength: number
  away_attack_strength: number
  home_defense_strength: number
  away_defense_strength: number

  // Player impact
  home_key_players_score: number
  away_key_players_score: number

  // Contextual factors
  venue_advantage: number
  motivation_differential: number
  market_confidence: number

  // League context
  league_competitiveness: number
  season_stage: number
}

export class AdvancedMLEngine {
  private static ELO_K_FACTOR = 32
  private static FORM_WEIGHTS = [0.4, 0.3, 0.2, 0.08, 0.02] // Recent matches weighted more

  static calculateEloRating(
    currentRating: number,
    opponentRating: number,
    actualResult: number, // 1 for win, 0.5 for draw, 0 for loss
    kFactor: number = this.ELO_K_FACTOR,
  ): number {
    const expectedScore = 1 / (1 + Math.pow(10, (opponentRating - currentRating) / 400))
    return currentRating + kFactor * (actualResult - expectedScore)
  }

  static calculateWeightedForm(form: string): number {
    let score = 0
    const results = form.split("").reverse() // Most recent first

    results.forEach((result, index) => {
      if (index < this.FORM_WEIGHTS.length) {
        const points = result === "W" ? 3 : result === "D" ? 1 : 0
        score += points * this.FORM_WEIGHTS[index]
      }
    })

    return score / 3 // Normalize to 0-1 scale
  }

  static calculateXGDifferential(xgFor: number, xgAgainst: number, leagueAvg: number): number {
    return (xgFor - xgAgainst) / leagueAvg
  }

  static calculateAttackStrength(goalsFor: number, leagueAvg: number): number {
    return goalsFor / leagueAvg
  }

  static calculateDefenseStrength(goalsAgainst: number, leagueAvg: number): number {
    return leagueAvg / goalsAgainst
  }

  static calculateKeyPlayerImpact(playerData: PlayerData): number {
    let impact = 0.5 // Base score

    if (playerData.top_scorer_available) impact += 0.2
    impact += (playerData.key_players_available / 11) * 0.3
    impact -= playerData.key_injuries * 0.1
    impact -= playerData.suspensions * 0.15
    impact += (playerData.fitness_score / 100) * 0.2

    return Math.max(0, Math.min(1, impact))
  }

  static calculateVenueAdvantage(venueData: VenueData): number {
    let advantage = venueData.home_advantage_factor

    // Adjust for environmental factors
    advantage *= 1 + venueData.weather_impact * 0.1
    advantage *= 1 + venueData.pitch_condition * 0.05
    advantage *= 1 - venueData.travel_distance * 0.02

    return Math.max(0, Math.min(0.5, advantage))
  }

  static calculateMotivationScore(factors: MotivationFactors): number {
    let score = 0.5 // Base motivation

    score += (factors.match_importance / 10) * 0.3
    score += (factors.league_position_pressure / 10) * 0.2
    score += (factors.recent_form_momentum / 10) * 0.2
    score += (factors.revenge_factor / 10) * 0.1
    score -= (factors.fixture_congestion / 10) * 0.15
    score += (factors.rest_days / 7) * 0.1

    return Math.max(0, Math.min(1, score))
  }

  static calculateMarketConfidence(marketData: MarketData): number {
    const oddsMovement = Math.abs(marketData.odds_movement)
    const volumeIndicator = Math.min(marketData.betting_volume / 1000000, 1)
    const sharpMoney = marketData.sharp_money_indicator

    return oddsMovement * 0.3 + volumeIndicator * 0.4 + sharpMoney * 0.3
  }

  static extractMLFeatures(
    homeTeam: TeamStats,
    awayTeam: TeamStats,
    historical: HistoricalData,
    homePlayerData: PlayerData,
    awayPlayerData: PlayerData,
    venueData: VenueData,
    marketData: MarketData,
    homeMotivation: MotivationFactors,
    awayMotivation: MotivationFactors,
    leagueAvg = 2.5,
  ): MLFeatures {
    return {
      // ELO ratings (simulated based on form and performance)
      home_team_elo: 1500 + this.calculateWeightedForm(homeTeam.form) * 300,
      away_team_elo: 1500 + this.calculateWeightedForm(awayTeam.form) * 300,

      // Weighted form
      home_form_weighted: this.calculateWeightedForm(homeTeam.form),
      away_form_weighted: this.calculateWeightedForm(awayTeam.form),

      // Head-to-head
      h2h_win_rate: historical.head_to_head.home_wins / Math.max(historical.head_to_head.matches, 1),

      // Performance metrics
      home_xg_diff: this.calculateXGDifferential(homeTeam.xg_for, homeTeam.xg_against, leagueAvg),
      away_xg_diff: this.calculateXGDifferential(awayTeam.xg_for, awayTeam.xg_against, leagueAvg),
      home_attack_strength: this.calculateAttackStrength(homeTeam.goals_for, leagueAvg),
      away_attack_strength: this.calculateAttackStrength(awayTeam.goals_for, leagueAvg),
      home_defense_strength: this.calculateDefenseStrength(homeTeam.goals_against, leagueAvg),
      away_defense_strength: this.calculateDefenseStrength(awayTeam.goals_against, leagueAvg),

      // Player impact
      home_key_players_score: this.calculateKeyPlayerImpact(homePlayerData),
      away_key_players_score: this.calculateKeyPlayerImpact(awayPlayerData),

      // Contextual factors
      venue_advantage: this.calculateVenueAdvantage(venueData),
      motivation_differential:
        this.calculateMotivationScore(homeMotivation) - this.calculateMotivationScore(awayMotivation),
      market_confidence: this.calculateMarketConfidence(marketData),

      // League context
      league_competitiveness: 0.8, // Would be calculated from league data
      season_stage: 0.5, // 0 = start, 1 = end of season
    }
  }

  static simulateMatchOutcome(features: MLFeatures): {
    homeWinProb: number
    drawProb: number
    awayWinProb: number
    confidence: number
  } {
    // Simplified ML model simulation (in real implementation, use trained XGBoost/Random Forest)

    // Base probabilities from ELO difference
    const eloDiff = features.home_team_elo - features.away_team_elo
    const eloProb = 1 / (1 + Math.pow(10, -eloDiff / 400))

    // Adjust with other features
    let homeAdvantage = eloProb
    homeAdvantage += features.home_form_weighted * 0.15
    homeAdvantage -= features.away_form_weighted * 0.15
    homeAdvantage += features.h2h_win_rate * 0.1
    homeAdvantage += features.home_xg_diff * 0.1
    homeAdvantage -= features.away_xg_diff * 0.1
    homeAdvantage += features.home_key_players_score * 0.1
    homeAdvantage -= features.away_key_players_score * 0.1
    homeAdvantage += features.venue_advantage * 0.2
    homeAdvantage += features.motivation_differential * 0.1

    // Normalize and calculate probabilities
    homeAdvantage = Math.max(0.1, Math.min(0.9, homeAdvantage))

    const homeWinProb = homeAdvantage
    const awayWinProb = 1 - homeAdvantage - 0.25 // Base draw probability
    const drawProb = 1 - homeWinProb - awayWinProb

    // Calculate confidence based on feature strength
    const confidence = Math.min(95, 50 + Math.abs(homeWinProb - 0.5) * 90)

    return {
      homeWinProb: Math.max(0.05, homeWinProb),
      drawProb: Math.max(0.05, drawProb),
      awayWinProb: Math.max(0.05, awayWinProb),
      confidence,
    }
  }

  static poissonScoreSimulation(
    homeXG: number,
    awayXG: number,
  ): {
    mostLikelyScore: string
    scoreProbability: number
    bttsProb: number
    over25Prob: number
  } {
    const maxGoals = 5
    let bestScore = { home: 0, away: 0, prob: 0 }
    let bttsProb = 0
    let over25Prob = 0

    for (let h = 0; h <= maxGoals; h++) {
      for (let a = 0; a <= maxGoals; a++) {
        const prob = this.poissonPMF(homeXG, h) * this.poissonPMF(awayXG, a)

        if (prob > bestScore.prob) {
          bestScore = { home: h, away: a, prob }
        }

        if (h > 0 && a > 0) bttsProb += prob
        if (h + a > 2.5) over25Prob += prob
      }
    }

    return {
      mostLikelyScore: `${bestScore.home}-${bestScore.away}`,
      scoreProbability: bestScore.prob * 100,
      bttsProb: bttsProb * 100,
      over25Prob: over25Prob * 100,
    }
  }

  private static poissonPMF(lambda: number, k: number): number {
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k)
  }

  private static factorial(n: number): number {
    if (n <= 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  }

  static detectValueBets(
    modelProbs: { home: number; draw: number; away: number },
    marketOdds: { home: number; draw: number; away: number },
    threshold = 0.05,
  ): {
    home: { isValue: boolean; edge: number; kellyFraction: number }
    draw: { isValue: boolean; edge: number; kellyFraction: number }
    away: { isValue: boolean; edge: number; kellyFraction: number }
  } {
    const calculateValue = (prob: number, odds: number) => {
      const impliedProb = 1 / odds
      const edge = prob - impliedProb
      const isValue = edge > threshold
      const kellyFraction = isValue ? (prob * odds - 1) / (odds - 1) : 0

      return { isValue, edge: edge * 100, kellyFraction: Math.max(0, Math.min(0.25, kellyFraction)) }
    }

    return {
      home: calculateValue(modelProbs.home, marketOdds.home),
      draw: calculateValue(modelProbs.draw, marketOdds.draw),
      away: calculateValue(modelProbs.away, marketOdds.away),
    }
  }
}
