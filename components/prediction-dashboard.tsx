"use client"

import { useState, useEffect, useCallback } from "react"
import { AdvancedMatchCard } from "./advanced-match-card"
import { StatsOverview } from "./stats-overview"
import { PredictionFilters } from "./prediction-filters"
import { LeagueOverview } from "./league-overview"
import { FeaturedLeagues } from "./featured-leagues"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2, Brain, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getLastUpdateTime } from "@/lib/db-service"

// Update interval in milliseconds (5 minutes)
const AUTO_UPDATE_INTERVAL = 300000

export function PredictionDashboard() {
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  const [filters, setFilters] = useState({
    league: "all",
    confidence: 0,
    prediction: "all",
  })

  // Fetch matches function
  const fetchMatches = useCallback(async (forceUpdate = false) => {
    try {
      setUpdating(true)

      // Build URL with query parameters
      const url = new URL("/api/matches", window.location.origin)
      if (forceUpdate) {
        url.searchParams.append("forceUpdate", "true")
      }

      const response = await fetch(url.toString())

      if (!response.ok) {
        throw new Error(`Failed to fetch matches: ${response.statusText}`)
      }

      const data = await response.json()

      if (data.error) {
        throw new Error(data.error)
      }

      // Handle the new response format
      if (data.matches) {
        setMatches(data.matches)

        // Check if we're using fallback data
        if (data.meta?.usedFallbackData) {
          setError("Using fallback data. API data unavailable.")
        } else {
          setError(null)
        }

        // Update last update time
        if (data.meta?.lastUpdated) {
          setLastUpdate(new Date(data.meta.lastUpdated))
        } else {
          setLastUpdate(new Date())
        }
      } else {
        // Backward compatibility with old format
        setMatches(data)
        setLastUpdate(new Date())
        setError(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setLoading(false)
      setUpdating(false)
    }
  }, [])

  // Initial data load
  useEffect(() => {
    // Get last update time from storage
    const storedLastUpdate = getLastUpdateTime()
    if (storedLastUpdate) {
      setLastUpdate(storedLastUpdate)
    }

    fetchMatches()

    // Set up periodic updates
    const updateInterval = setInterval(() => {
      fetchMatches()
    }, AUTO_UPDATE_INTERVAL)

    return () => clearInterval(updateInterval)
  }, [fetchMatches])

  // Format last update time
  const formatLastUpdate = () => {
    if (!lastUpdate) return "Never"

    // If less than a minute ago, show "Just now"
    const seconds = Math.floor((new Date().getTime() - lastUpdate.getTime()) / 1000)
    if (seconds < 60) return "Just now"

    // If less than an hour ago, show minutes
    if (seconds < 3600) {
      const minutes = Math.floor(seconds / 60)
      return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`
    }

    // Otherwise show time
    return lastUpdate.toLocaleTimeString()
  }

  // Filter matches based on user selections
  const filteredMatches = matches.filter((match) => {
    if (filters.league !== "all" && match.sport_key !== filters.league) {
      return false
    }
    if (filters.confidence > 0 && (!match.prediction || match.prediction.confidence < filters.confidence)) {
      return false
    }
    if (filters.prediction !== "all" && match.prediction?.result !== filters.prediction) {
      return false
    }
    return true
  })

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
        <span className="ml-2 text-lg">Loading match data and predictions...</span>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Enhanced Header */}
      <div className="text-center py-6">
        <div className="flex items-center justify-center space-x-3 mb-4">
          <Brain className="h-8 w-8 text-blue-600" />
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Advanced ML Football Predictions
          </h1>
        </div>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Powered by machine learning models using historical data, team statistics, player availability, venue factors,
          and market intelligence for superior prediction accuracy.
        </p>

        {/* Last update info and refresh button */}
        <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
          <span>Last updated: {formatLastUpdate()}</span>
          <Button variant="ghost" size="sm" className="ml-2" onClick={() => fetchMatches(true)} disabled={updating}>
            <RefreshCw className={`h-4 w-4 mr-1 ${updating ? "animate-spin" : ""}`} />
            {updating ? "Updating..." : "Refresh"}
          </Button>
        </div>
      </div>

      <StatsOverview matches={matches} />

      <FeaturedLeagues
        selectedLeague={filters.league}
        onSelectLeague={(league) => setFilters({ ...filters, league })}
      />

      <LeagueOverview matches={matches} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1">
          <PredictionFilters filters={filters} onFiltersChange={setFilters} />
        </div>

        <div className="lg:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Brain className="h-5 w-5 text-blue-600" />
                  <span>ML-Powered Match Predictions</span>
                </span>
                <span className="text-sm font-normal text-gray-500">{filteredMatches.length} matches</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Error loading data: {error}. Using cached data if available.</AlertDescription>
                </Alert>
              )}
              <div className="space-y-4">
                {filteredMatches.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                    <p>No matches found matching your filters.</p>
                    <p className="text-sm mt-2">
                      Try adjusting your filter criteria or check back later for new predictions.
                    </p>
                  </div>
                ) : (
                  filteredMatches.map((match) => <AdvancedMatchCard key={match.id} match={match} />)
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
