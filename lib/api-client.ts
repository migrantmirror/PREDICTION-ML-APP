// API configuration for API-Football
const API_KEY = process.env.ODDS_API_KEY // We'll use the same env var but for API-Football
const API_BASE_URL = "https://v3.football.api-sports.io"

// Cache configuration
const CACHE_DURATION = 3600000 // 1 hour in milliseconds
let apiCache: Record<string, { data: any; timestamp: number }> = {}

// Rate limiting
const MAX_REQUESTS_PER_MINUTE = 100 // API-Football has different limits
let requestsThisMinute = 0
let lastResetTime = Date.now()

/**
 * Reset the rate limit counter every minute
 */
const resetRateLimitCounter = () => {
  const now = Date.now()
  if (now - lastResetTime >= 60000) {
    requestsThisMinute = 0
    lastResetTime = now
  }
}

/**
 * Check if we can make another API request
 */
const canMakeRequest = () => {
  resetRateLimitCounter()
  return requestsThisMinute < MAX_REQUESTS_PER_MINUTE
}

/**
 * Fetch data from API-Football with caching
 */
export const fetchFromAPI = async (endpoint: string, params: Record<string, string> = {}): Promise<any> => {
  if (!API_KEY) {
    console.warn("API key not configured, using mock data")
    throw new Error("API key not configured")
  }

  // Create cache key from endpoint and params
  const queryParams = new URLSearchParams(params).toString()
  const cacheKey = `${endpoint}?${queryParams}`

  // Check cache first
  const cachedData = apiCache[cacheKey]
  if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
    console.log(`Using cached data for ${endpoint}`)
    return cachedData.data
  }

  // Check rate limits
  if (!canMakeRequest()) {
    throw new Error("API rate limit exceeded. Try again later.")
  }

  // Make the API request
  try {
    requestsThisMinute++

    // Build the URL with query parameters
    const url = `${API_BASE_URL}${endpoint}?${queryParams}`
    console.log(`Fetching from API-Football: ${endpoint}`)

    const response = await fetch(url, {
      headers: {
        "x-apisports-key": API_KEY,
        "Content-Type": "application/json",
      },
    })

    // Handle rate limiting headers if available
    const remainingRequests = response.headers.get("x-ratelimit-requests-remaining")
    if (remainingRequests) {
      console.log(`Remaining API requests: ${remainingRequests}`)
    }

    if (!response.ok) {
      console.error(`API error: ${response.status} ${response.statusText}`)
      throw new Error(`API error: ${response.status} ${response.statusText}`)
    }

    const data = await response.json()

    // Check if the API returned an error
    if (data.errors && data.errors.length > 0) {
      throw new Error(`API error: ${data.errors.join(", ")}`)
    }

    // Cache the response
    apiCache[cacheKey] = {
      data,
      timestamp: Date.now(),
    }

    return data
  } catch (error) {
    console.error("API request failed:", error)
    throw error
  }
}

/**
 * Clear the API cache
 */
export const clearCache = () => {
  apiCache = {}
  console.log("API cache cleared")
}

/**
 * Get fixtures for a specific league
 */
export const getFixtures = async (leagueId: string, season = "2024") => {
  return fetchFromAPI("/fixtures", {
    league: leagueId,
    season,
    next: "20", // Get next 20 fixtures
  })
}

/**
 * Get team statistics for a specific team and league
 */
export const getTeamStats = async (teamId: string, leagueId: string, season = "2024") => {
  return fetchFromAPI("/teams/statistics", {
    team: teamId,
    league: leagueId,
    season,
  })
}

/**
 * Get recent fixtures for a team (last 15 games)
 */
export const getTeamRecentFixtures = async (teamId: string, season = "2024", venue?: "home" | "away") => {
  const params: Record<string, string> = {
    team: teamId,
    season,
    last: "15",
  }

  if (venue) {
    params.venue = venue
  }

  return fetchFromAPI("/fixtures", params)
}

/**
 * Get all leagues
 */
export const getLeagues = async () => {
  return fetchFromAPI("/leagues")
}

/**
 * Map our league keys to API-Football league IDs
 */
const leagueMapping: Record<string, string> = {
  soccer_epl: "39", // Premier League
  soccer_spain_la_liga: "140", // La Liga
  soccer_germany_bundesliga: "78", // Bundesliga
  soccer_italy_serie_a: "135", // Serie A
  soccer_france_ligue_one: "61", // Ligue 1
  soccer_efl_champ: "40", // Championship
  soccer_netherlands_eredivisie: "88", // Eredivisie
  soccer_portugal_primeira_liga: "94", // Primeira Liga
  soccer_usa_mls: "253", // MLS
  soccer_brazil_serie_a: "71", // Brasileirão
}

/**
 * Get fixtures for all supported football leagues
 */
export const getAllFootballFixtures = async () => {
  try {
    // Get fixtures for popular leagues
    const popularLeagues = [
      "39", // Premier League
      "140", // La Liga
      "78", // Bundesliga
      "135", // Serie A
      "61", // Ligue 1
    ]

    let allFixtures = []

    for (const leagueId of popularLeagues) {
      try {
        console.log(`Fetching fixtures for league ${leagueId}...`)
        const fixturesData = await getFixtures(leagueId)

        if (fixturesData.response && fixturesData.response.length > 0) {
          allFixtures = [...allFixtures, ...fixturesData.response]
        }

        // Add a small delay between requests
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error) {
        console.error(`Failed to fetch fixtures for league ${leagueId}:`, error)
      }
    }

    return allFixtures
  } catch (error) {
    console.error("Failed to fetch all football fixtures:", error)
    return []
  }
}

/**
 * Legacy function name for backward compatibility
 * This is the missing export that was causing the deployment error
 */
export const getAllFootballOdds = getAllFootballFixtures

/**
 * Math helpers for Poisson calculations (from your React Native code)
 */
export const factorial = (n: number): number => {
  if (n === 0) return 1
  let result = 1
  for (let i = 2; i <= n; i++) result *= i
  return result
}

export const poissonProbability = (lambda: number, k: number): number => {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k)
}

export const poissonWinDrawLossProbs = (homeExp: number, awayExp: number) => {
  const maxGoals = 6
  let homeWin = 0,
    draw = 0,
    awayWin = 0

  for (let hg = 0; hg <= maxGoals; hg++) {
    for (let ag = 0; ag <= maxGoals; ag++) {
      const p = poissonProbability(homeExp, hg) * poissonProbability(awayExp, ag)
      if (hg > ag) homeWin += p
      else if (hg === ag) draw += p
      else awayWin += p
    }
  }

  return { homeWin, draw, awayWin }
}

export const overUnderProb = (homeExp: number, awayExp: number, line = 2.5) => {
  const maxGoals = 8
  let under = 0,
    over = 0

  for (let hg = 0; hg <= maxGoals; hg++) {
    for (let ag = 0; ag <= maxGoals; ag++) {
      const total = hg + ag
      const p = poissonProbability(homeExp, hg) * poissonProbability(awayExp, ag)
      if (total <= line) under += p
      else over += p
    }
  }

  return { under, over }
}

export const bttsProb = (homeExp: number, awayExp: number) => {
  const maxGoals = 6
  let bttsYes = 0,
    bttsNo = 0

  for (let hg = 0; hg <= maxGoals; hg++) {
    for (let ag = 0; ag <= maxGoals; ag++) {
      const p = poissonProbability(homeExp, hg) * poissonProbability(awayExp, ag)
      if (hg > 0 && ag > 0) bttsYes += p
      else bttsNo += p
    }
  }

  return { bttsYes, bttsNo }
}

export const mostLikelyScore = (homeExp: number, awayExp: number) => {
  let bestProb = 0
  let bestScore = "0-0"

  for (let hg = 0; hg <= 5; hg++) {
    for (let ag = 0; ag <= 5; ag++) {
      const prob = poissonProbability(homeExp, hg) * poissonProbability(awayExp, ag)
      if (prob > bestProb) {
        bestProb = prob
        bestScore = `${hg}-${ag}`
      }
    }
  }

  return { score: bestScore, prob: bestProb }
}

/**
 * Fetch team stats with fallback logic (from your React Native code)
 */
export const fetchTeamStatsWithFallback = async (
  teamId: string,
  isHome: boolean,
  season = "2024",
  leagueId: string,
) => {
  try {
    // First try to get recent fixtures
    const venue = isHome ? "home" : "away"
    const recentFixtures = await getTeamRecentFixtures(teamId, season, venue)

    if (recentFixtures.response && recentFixtures.response.length > 0) {
      let scored = 0,
        conceded = 0,
        matches = 0

      recentFixtures.response.forEach((fixture: any) => {
        if (fixture.teams.home.id.toString() === teamId) {
          scored += fixture.goals.home || 0
          conceded += fixture.goals.away || 0
        } else {
          scored += fixture.goals.away || 0
          conceded += fixture.goals.home || 0
        }
        matches++
      })

      if (matches > 0) {
        return {
          avgScored: scored / matches,
          avgConceded: conceded / matches,
          fallback: false,
        }
      }
    }

    // Fallback: Try league-wide stats
    const teamStats = await getTeamStats(teamId, leagueId, season)

    if (teamStats.response) {
      const resp = teamStats.response
      if (isHome) {
        const played = resp.fixtures?.played?.home || 0
        return {
          avgScored: played ? (resp.goals?.for?.total?.home || 0) / played : 1.3,
          avgConceded: played ? (resp.goals?.against?.total?.home || 0) / played : 1.3,
          fallback: !(played > 0),
        }
      } else {
        const played = resp.fixtures?.played?.away || 0
        return {
          avgScored: played ? (resp.goals?.for?.total?.away || 0) / played : 1.3,
          avgConceded: played ? (resp.goals?.against?.total?.away || 0) / played : 1.3,
          fallback: !(played > 0),
        }
      }
    }

    // Final fallback
    return {
      avgScored: 1.3,
      avgConceded: 1.3,
      fallback: true,
    }
  } catch (error) {
    console.error("Error fetching team stats:", error)
    return {
      avgScored: 1.3,
      avgConceded: 1.3,
      fallback: true,
    }
  }
}
