"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import {
  Calendar,
  Clock,
  TrendingUp,
  Target,
  Users,
  BarChart3,
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { useState } from "react"

interface MatchCardProps {
  match: {
    id: string
    home_team: string
    away_team: string
    commence_time: string
    sport_title: string
    sport_key: string
    bookmakers: Array<{
      title: string
      markets: Array<{
        key: string
        outcomes: Array<{
          name: string
          price: number
        }>
      }>
    }>
    team_stats?: {
      home: {
        form: string
        goals_for: number
        goals_against: number
        home_advantage: number
      }
      away: {
        form: string
        goals_for: number
        goals_against: number
        away_form: number
      }
    }
    prediction?: {
      result: string
      confidence: number
      expected_goals: string
      btts: string
      btts_probability: number
      over_2_5: string
      over_2_5_probability: number
      predicted_scoreline: string
      scoreline_probability: number
      value_bets: {
        home: string
        draw: string
        away: string
      }
      advanced_stats: {
        home_form_score: number
        away_form_score: number
        home_attack_strength: number
        away_attack_strength: number
        total_goals_expectancy: number
        league_competitiveness: number
      }
    }
  }
}

export function MatchCard({ match }: MatchCardProps) {
  const [expanded, setExpanded] = useState(false)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    }
  }

  const getOdds = () => {
    if (!match.bookmakers || match.bookmakers.length === 0) return null
    const market = match.bookmakers[0]?.markets?.[0]
    if (!market) return null

    const outcomes = market.outcomes
    return {
      home: outcomes.find((o) => o.name === match.home_team)?.price || 0,
      draw: outcomes.find((o) => o.name === "Draw")?.price || 0,
      away: outcomes.find((o) => o.name === match.away_team)?.price || 0,
    }
  }

  const getFormColor = (form: string) => {
    const wins = (form.match(/W/g) || []).length
    if (wins >= 4) return "text-green-600 bg-green-50"
    if (wins >= 2) return "text-yellow-600 bg-yellow-50"
    return "text-red-600 bg-red-50"
  }

  const getValueBetColor = (value: string) => {
    return value === "Value" ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
  }

  const getLeagueFlag = (sportKey: string) => {
    const flags: Record<string, string> = {
      soccer_epl: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
      soccer_spain_la_liga: "🇪🇸",
      soccer_germany_bundesliga: "🇩🇪",
      soccer_italy_serie_a: "🇮🇹",
      soccer_france_ligue_one: "🇫🇷",
      soccer_efl_champ: "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
    }
    return flags[sportKey] || "⚽"
  }

  const odds = getOdds()
  const { date, time } = formatDate(match.commence_time)
  const prediction = match.prediction
  const teamStats = match.team_stats

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Calendar className="h-4 w-4" />
            <span>{date}</span>
            <Clock className="h-4 w-4 ml-2" />
            <span>{time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-lg">{getLeagueFlag(match.sport_key)}</span>
            <Badge variant="outline">{match.sport_title}</Badge>
            {prediction && prediction.confidence >= 75 && (
              <Badge className="bg-green-500 text-white">
                <Zap className="h-3 w-3 mr-1" />
                High Confidence
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Teams and Basic Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center flex-1">
                <div className="font-bold text-xl">{match.home_team}</div>
                <div className="text-sm text-gray-500">Home</div>
                {teamStats && (
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getFormColor(teamStats.home.form)}`}
                  >
                    {teamStats.home.form}
                  </div>
                )}
              </div>
              <div className="mx-4 text-center">
                <div className="text-3xl font-bold text-gray-400">VS</div>
                {prediction && (
                  <div className="text-sm font-medium mt-1 text-blue-600">{prediction.predicted_scoreline}</div>
                )}
              </div>
              <div className="text-center flex-1">
                <div className="font-bold text-xl">{match.away_team}</div>
                <div className="text-sm text-gray-500">Away</div>
                {teamStats && (
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium mt-1 ${getFormColor(teamStats.away.form)}`}
                  >
                    {teamStats.away.form}
                  </div>
                )}
              </div>
            </div>

            {/* Odds */}
            {odds && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-600">Home Win</div>
                  <div className="text-xl font-bold text-blue-600">{odds.home.toFixed(2)}</div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-600">Draw</div>
                  <div className="text-xl font-bold text-gray-600">{odds.draw.toFixed(2)}</div>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-600">Away Win</div>
                  <div className="text-xl font-bold text-red-600">{odds.away.toFixed(2)}</div>
                </div>
              </div>
            )}
          </div>

          {/* Prediction Summary */}
          {prediction && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge className="bg-blue-600 text-white text-lg px-4 py-2 mb-3">{prediction.result}</Badge>
                <div className="text-sm text-gray-600 mb-2">Confidence</div>
                <div className="flex items-center space-x-2">
                  <Progress value={prediction.confidence} className="flex-1" />
                  <span className="text-lg font-bold">{prediction.confidence}%</span>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="flex items-center space-x-1">
                    <Target className="h-3 w-3" />
                    <span>Expected Goals</span>
                  </span>
                  <span className="font-bold">{prediction.expected_goals}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="flex items-center space-x-1">
                    <Users className="h-3 w-3" />
                    <span>BTTS ({prediction.btts_probability}%)</span>
                  </span>
                  <span className="font-bold">{prediction.btts}</span>
                </div>
                <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <span className="flex items-center space-x-1">
                    <TrendingUp className="h-3 w-3" />
                    <span>Over 2.5 ({prediction.over_2_5_probability}%)</span>
                  </span>
                  <span className="font-bold">{prediction.over_2_5}</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Expandable Advanced Stats */}
        {prediction && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <span>Advanced Analysis</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-4">
                {/* Form Analysis */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <BarChart3 className="h-4 w-4 mr-2" />
                        Team Form
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">{match.home_team}</span>
                          <span className="text-xs font-bold">{prediction.advanced_stats.home_form_score}%</span>
                        </div>
                        <Progress value={prediction.advanced_stats.home_form_score} className="h-1" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">{match.away_team}</span>
                          <span className="text-xs font-bold">{prediction.advanced_stats.away_form_score}%</span>
                        </div>
                        <Progress value={prediction.advanced_stats.away_form_score} className="h-1" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Value Bets
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Home</span>
                        <Badge size="sm" className={getValueBetColor(prediction.value_bets.home)}>
                          {prediction.value_bets.home}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Draw</span>
                        <Badge size="sm" className={getValueBetColor(prediction.value_bets.draw)}>
                          {prediction.value_bets.draw}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Away</span>
                        <Badge size="sm" className={getValueBetColor(prediction.value_bets.away)}>
                          {prediction.value_bets.away}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-600">Attack Strength</div>
                    <div className="text-lg font-bold">{prediction.advanced_stats.home_attack_strength}</div>
                    <div className="text-xs text-gray-500">{match.home_team}</div>
                  </div>
                  <div className="bg-red-50 p-3 rounded">
                    <div className="font-medium text-red-600">Attack Strength</div>
                    <div className="text-lg font-bold">{prediction.advanced_stats.away_attack_strength}</div>
                    <div className="text-xs text-gray-500">{match.away_team}</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="font-medium text-green-600">Total Goals</div>
                    <div className="text-lg font-bold">{prediction.advanced_stats.total_goals_expectancy}</div>
                    <div className="text-xs text-gray-500">Expected</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="font-medium text-purple-600">Scoreline</div>
                    <div className="text-lg font-bold">{prediction.scoreline_probability}%</div>
                    <div className="text-xs text-gray-500">Probability</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
