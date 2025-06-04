/**
 * Database service for storing and retrieving match data
 * Uses localStorage in the browser for simplicity
 * In a production app, you would use a real database
 */

// Types
export interface StoredMatch {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers: any[]
  last_updated: string
  prediction?: any
}

// Storage keys
const MATCHES_STORAGE_KEY = "football_predictor_matches"
const LAST_UPDATE_KEY = "football_predictor_last_update"

/**
 * Save matches to storage
 */
export const saveMatches = (matches: StoredMatch[]) => {
  if (typeof window === "undefined") return // Skip on server

  try {
    localStorage.setItem(MATCHES_STORAGE_KEY, JSON.stringify(matches))
    localStorage.setItem(LAST_UPDATE_KEY, new Date().toISOString())
    console.log(`Saved ${matches.length} matches to storage`)
  } catch (error) {
    console.error("Failed to save matches to storage:", error)
  }
}

/**
 * Get matches from storage
 */
export const getStoredMatches = (): StoredMatch[] => {
  if (typeof window === "undefined") return [] // Skip on server

  try {
    const data = localStorage.getItem(MATCHES_STORAGE_KEY)
    return data ? JSON.parse(data) : []
  } catch (error) {
    console.error("Failed to get matches from storage:", error)
    return []
  }
}

/**
 * Get last update time
 */
export const getLastUpdateTime = (): Date | null => {
  if (typeof window === "undefined") return null // Skip on server

  try {
    const timestamp = localStorage.getItem(LAST_UPDATE_KEY)
    return timestamp ? new Date(timestamp) : null
  } catch (error) {
    console.error("Failed to get last update time:", error)
    return null
  }
}

/**
 * Check if data needs to be updated
 */
export const needsUpdate = (maxAge = 3600000): boolean => {
  const lastUpdate = getLastUpdateTime()
  if (!lastUpdate) return true

  const now = new Date()
  const age = now.getTime() - lastUpdate.getTime()
  return age > maxAge
}

/**
 * Clear all stored data
 */
export const clearStoredData = () => {
  if (typeof window === "undefined") return // Skip on server

  try {
    localStorage.removeItem(MATCHES_STORAGE_KEY)
    localStorage.removeItem(LAST_UPDATE_KEY)
    console.log("Cleared stored data")
  } catch (error) {
    console.error("Failed to clear stored data:", error)
  }
}
