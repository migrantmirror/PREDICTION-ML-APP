// Advanced prediction algorithms and utilities

export interface TeamStats {
  form: string
  goals_for: number
  goals_against: number
  home_advantage?: number
  away_form?: number
}

export interface LeagueConfig {
  name: string
  country: string
  avg_goals: number
  competitiveness: number
  home_advantage: number
}

export interface PredictionInput {
  homeOdds: number
  drawOdds: number
  awayOdds: number
  teamStats: {
    home: TeamStats
    away: TeamStats
  }
  leagueConfig: LeagueConfig
}

export class AdvancedPredictionEngine {
  static calculateFormScore(form: string): number {
    const points = { W: 3, D: 1, L: 0 }
    let total = 0
    let weight = 1

    // Recent matches have more weight (exponential decay)
    for (let i = form.length - 1; i >= 0; i--) {
      const result = form[i] as keyof typeof points
      total += points[result] * weight
      weight *= 0.85 // Decay factor for older matches
    }

    return Math.min(1, total / 15) // Normalize to 0-1 scale
  }

  static calculatePoissonProbability(lambda: number, k: number): number {
    if (k > 10) return 0 // Practical limit
    return (Math.pow(lambda, k) * Math.exp(-lambda)) / this.factorial(k)
  }

  static factorial(n: number): number {
    if (n <= 1) return 1
    let result = 1
    for (let i = 2; i <= n; i++) {
      result *= i
    }
    return result
  }

  static calculateExpectedGoals(input: PredictionInput): { home: number; away: number } {
    const { teamStats, leagueConfig } = input

    // Attack and defense strength relative to league average
    const homeAttackStrength = teamStats.home.goals_for / leagueConfig.avg_goals
    const homeDefenseStrength = leagueConfig.avg_goals / teamStats.home.goals_against
    const awayAttackStrength = teamStats.away.goals_for / leagueConfig.avg_goals
    const awayDefenseStrength = leagueConfig.avg_goals / teamStats.away.goals_against

    // Expected goals calculation with home advantage
    const homeXG =
      homeAttackStrength *
      awayDefenseStrength *
      leagueConfig.avg_goals *
      (1 + leagueConfig.home_advantage + (teamStats.home.home_advantage || 0))

    const awayXG =
      awayAttackStrength *
      homeDefenseStrength *
      leagueConfig.avg_goals *
      (1 - leagueConfig.home_advantage * 0.5 + (teamStats.away.away_form || 0))

    return {
      home: Math.max(0.1, homeXG),
      away: Math.max(0.1, awayXG),
    }
  }

  static calculateMatchOutcomeProbabilities(homeXG: number, awayXG: number) {
    let homeWinProb = 0
    let drawProb = 0
    let awayWinProb = 0

    // Calculate probabilities for scorelines up to 5-5
    for (let h = 0; h <= 5; h++) {
      for (let a = 0; a <= 5; a++) {
        const prob = this.calculatePoissonProbability(homeXG, h) * this.calculatePoissonProbability(awayXG, a)

        if (h > a) homeWinProb += prob
        else if (h === a) drawProb += prob
        else awayWinProb += prob
      }
    }

    return { homeWinProb, drawProb, awayWinProb }
  }

  static calculateSpecialMarkets(homeXG: number, awayXG: number) {
    // Both Teams To Score probability
    const bttsProb =
      1 -
      (this.calculatePoissonProbability(homeXG, 0) +
        this.calculatePoissonProbability(awayXG, 0) -
        this.calculatePoissonProbability(homeXG, 0) * this.calculatePoissonProbability(awayXG, 0))

    // Over/Under 2.5 goals
    let over25Prob = 0
    for (let h = 0; h <= 5; h++) {
      for (let a = 0; a <= 5; a++) {
        if (h + a > 2.5) {
          over25Prob += this.calculatePoissonProbability(homeXG, h) * this.calculatePoissonProbability(awayXG, a)
        }
      }
    }

    // Most likely scoreline
    let mostLikelyScore = { home: 0, away: 0, probability: 0 }
    for (let h = 0; h <= 4; h++) {
      for (let a = 0; a <= 4; a++) {
        const prob = this.calculatePoissonProbability(homeXG, h) * this.calculatePoissonProbability(awayXG, a)
        if (prob > mostLikelyScore.probability) {
          mostLikelyScore = { home: h, away: a, probability: prob }
        }
      }
    }

    return {
      bttsProb,
      over25Prob,
      mostLikelyScore,
    }
  }

  static detectValueBets(
    modelProbs: { home: number; draw: number; away: number },
    odds: { home: number; draw: number; away: number },
  ) {
    const threshold = 1.05 // 5% edge required for value

    return {
      home: modelProbs.home * odds.home > threshold ? "Value" : "No Value",
      draw: modelProbs.draw * odds.draw > threshold ? "Value" : "No Value",
      away: modelProbs.away * odds.away > threshold ? "Value" : "No Value",
    }
  }

  static generateComprehensivePrediction(input: PredictionInput) {
    const { homeOdds, drawOdds, awayOdds, teamStats, leagueConfig } = input

    // 1. Market implied probabilities
    const homeImplied = 1 / homeOdds
    const drawImplied = 1 / drawOdds
    const awayImplied = 1 / awayOdds
    const total = homeImplied + drawImplied + awayImplied

    // 2. Form analysis
    const homeFormScore = this.calculateFormScore(teamStats.home.form)
    const awayFormScore = this.calculateFormScore(teamStats.away.form)

    // 3. Expected goals
    const { home: homeXG, away: awayXG } = this.calculateExpectedGoals(input)

    // 4. Model probabilities
    const { homeWinProb, drawProb, awayWinProb } = this.calculateMatchOutcomeProbabilities(homeXG, awayXG)

    // 5. Combine market and model (weighted average)
    const marketWeight = 0.6
    const modelWeight = 0.4

    let finalHomeProb = (homeImplied / total) * marketWeight + homeWinProb * modelWeight
    let finalDrawProb = (drawImplied / total) * marketWeight + drawProb * modelWeight
    let finalAwayProb = (awayImplied / total) * marketWeight + awayWinProb * modelWeight

    // 6. Form adjustment
    const formDiff = homeFormScore - awayFormScore
    const formAdjustment = formDiff * 0.1

    finalHomeProb = Math.max(0.05, Math.min(0.9, finalHomeProb + formAdjustment))
    finalAwayProb = Math.max(0.05, Math.min(0.9, finalAwayProb - formAdjustment))
    finalDrawProb = Math.max(0.05, 1 - finalHomeProb - finalAwayProb)

    // 7. Determine prediction
    let result = "Draw"
    let confidence = Math.round(finalDrawProb * 100)

    if (finalHomeProb > Math.max(finalDrawProb, finalAwayProb)) {
      result = "Home Win"
      confidence = Math.round(finalHomeProb * 100)
    } else if (finalAwayProb > Math.max(finalHomeProb, finalDrawProb)) {
      result = "Away Win"
      confidence = Math.round(finalAwayProb * 100)
    }

    // 8. Special markets
    const { bttsProb, over25Prob, mostLikelyScore } = this.calculateSpecialMarkets(homeXG, awayXG)

    // 9. Value bets
    const valueBets = this.detectValueBets(
      { home: finalHomeProb, draw: finalDrawProb, away: finalAwayProb },
      { home: homeOdds, draw: drawOdds, away: awayOdds },
    )

    return {
      result,
      confidence: Math.min(95, Math.max(50, confidence)),
      expected_goals: `${homeXG.toFixed(1)} - ${awayXG.toFixed(1)}`,
      btts: bttsProb > 0.5 ? "Yes" : "No",
      btts_probability: Math.round(bttsProb * 100),
      over_2_5: over25Prob > 0.5 ? "Yes" : "No",
      over_2_5_probability: Math.round(over25Prob * 100),
      predicted_scoreline: `${mostLikelyScore.home}-${mostLikelyScore.away}`,
      scoreline_probability: Math.round(mostLikelyScore.probability * 100),
      value_bets: valueBets,
      advanced_stats: {
        home_form_score: Math.round(homeFormScore * 100),
        away_form_score: Math.round(awayFormScore * 100),
        home_attack_strength: Math.round((teamStats.home.goals_for / leagueConfig.avg_goals) * 100) / 100,
        away_attack_strength: Math.round((teamStats.away.goals_for / leagueConfig.avg_goals) * 100) / 100,
        total_goals_expectancy: Math.round((homeXG + awayXG) * 10) / 10,
        league_competitiveness: Math.round(leagueConfig.competitiveness * 100),
      },
    }
  }
}
