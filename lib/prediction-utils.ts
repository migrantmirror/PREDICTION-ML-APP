export function impliedProbability(odds: number): number {
  return odds ? 1 / odds : 0
}

export function predictOutcome(homeOdds: number, drawOdds: number, awayOdds: number) {
  const homeProb = impliedProbability(homeOdds)
  const drawProb = impliedProbability(drawOdds)
  const awayProb = impliedProbability(awayOdds)
  const total = homeProb + drawProb + awayProb

  // Normalize probabilities
  const normalizedHomeProb = homeProb / total
  const normalizedDrawProb = drawProb / total
  const normalizedAwayProb = awayProb / total

  if (normalizedHomeProb > Math.max(normalizedDrawProb, normalizedAwayProb)) {
    return { result: "Home Win", confidence: Math.round(normalizedHomeProb * 100) }
  } else if (normalizedAwayProb > Math.max(normalizedHomeProb, normalizedDrawProb)) {
    return { result: "Away Win", confidence: Math.round(normalizedAwayProb * 100) }
  } else {
    return { result: "Draw", confidence: Math.round(normalizedDrawProb * 100) }
  }
}

export function poissonExpectation(odds: number): number {
  // Estimate expected goals using logarithmic inverse model
  return Math.max(0.2, -Math.log(odds) + 2)
}

export function predictGoals(homeOdds: number, awayOdds: number) {
  const homeXG = poissonExpectation(homeOdds)
  const awayXG = poissonExpectation(awayOdds)

  const over25 = homeXG + awayXG > 2.5
  const btts = homeXG > 0.8 && awayXG > 0.8

  return {
    expectedGoals: `${homeXG.toFixed(1)} - ${awayXG.toFixed(1)}`,
    btts: btts ? "Yes" : "No",
    over25: over25 ? "Yes" : "No",
    predictedScoreline: `${Math.round(homeXG)}-${Math.round(awayXG)}`,
  }
}

export function calculateConfidenceLevel(prediction: any): "high" | "medium" | "low" {
  if (prediction.confidence >= 70) return "high"
  if (prediction.confidence >= 50) return "medium"
  return "low"
}
