"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Globe, TrendingUp, Target } from "lucide-react"
import { getLeagueByKey } from "@/lib/leagues-data"

interface LeagueOverviewProps {
  matches: Array<{
    sport_title: string
    sport_key: string
    prediction?: {
      confidence: number
    }
  }>
}

export function LeagueOverview({ matches }: LeagueOverviewProps) {
  const leagueStats = matches.reduce(
    (acc, match) => {
      const league = match.sport_title
      if (!acc[league]) {
        acc[league] = {
          total: 0,
          predicted: 0,
          avgConfidence: 0,
          highConfidence: 0,
          sport_key: match.sport_key,
        }
      }

      acc[league].total++
      if (match.prediction) {
        acc[league].predicted++
        acc[league].avgConfidence += match.prediction.confidence
        if (match.prediction.confidence >= 75) {
          acc[league].highConfidence++
        }
      }

      return acc
    },
    {} as Record<string, any>,
  )

  // Calculate averages
  Object.keys(leagueStats).forEach((league) => {
    const stats = leagueStats[league]
    stats.avgConfidence = stats.predicted > 0 ? Math.round(stats.avgConfidence / stats.predicted) : 0
  })

  const getLeagueFlag = (sportKey: string) => {
    const league = getLeagueByKey(sportKey)
    return league?.flag || "⚽"
  }

  const getLeagueColor = (avgConfidence: number) => {
    if (avgConfidence >= 75) return "border-l-green-500"
    if (avgConfidence >= 65) return "border-l-yellow-500"
    return "border-l-red-500"
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2 mb-6">
        <Globe className="h-6 w-6 text-blue-600" />
        <h2 className="text-2xl font-bold">League Overview</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(leagueStats).map(([league, stats]) => (
          <Card
            key={league}
            className={`border-l-4 ${getLeagueColor(stats.avgConfidence)} hover:shadow-lg transition-shadow`}
          >
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-lg">
                <div className="flex items-center space-x-2">
                  <span className="text-2xl">{getLeagueFlag(stats.sport_key)}</span>
                  <span>{league}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  {stats.total} matches
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="text-center">
                  <div className="font-bold text-lg text-blue-600">{stats.predicted}</div>
                  <div className="text-gray-600">Predictions</div>
                </div>
                <div className="text-center">
                  <div className="font-bold text-lg text-green-600">{stats.highConfidence}</div>
                  <div className="text-gray-600">High Conf.</div>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Avg Confidence</span>
                  <span className="text-sm font-bold">{stats.avgConfidence}%</span>
                </div>
                <Progress value={stats.avgConfidence} className="h-2" />
              </div>

              <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
                <div className="flex items-center space-x-1">
                  <Target className="h-3 w-3" />
                  <span>Accuracy Tracked</span>
                </div>
                <div className="flex items-center space-x-1">
                  <TrendingUp className="h-3 w-3" />
                  <span>Live Updates</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
