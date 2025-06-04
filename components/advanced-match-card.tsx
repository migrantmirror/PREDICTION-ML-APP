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
  Zap,
  DollarSign,
  ChevronDown,
  ChevronUp,
  Brain,
  Sword,
  Star,
} from "lucide-react"
import { useState } from "react"
import { getLeagueByKey } from "@/lib/leagues-data"

interface AdvancedMatchCardProps {
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
    team_stats: {
      home: {
        form: string
        goals_for: number
        goals_against: number
        xg_for: number
        xg_against: number
        shots_per_game: number
        possession_avg: number
        pass_accuracy: number
      }
      away: {
        form: string
        goals_for: number
        goals_against: number
        xg_for: number
        xg_against: number
        shots_per_game: number
        possession_avg: number
        pass_accuracy: number
      }
    }
    player_data: {
      home: {
        key_players_available: number
        top_scorer_available: boolean
        key_injuries: number
        suspensions: number
        fitness_score: number
      }
      away: {
        key_players_available: number
        top_scorer_available: boolean
        key_injuries: number
        suspensions: number
        fitness_score: number
      }
    }
    prediction?: {
      result: string
      confidence: number
      model_probabilities: {
        home_win: number
        draw: number
        away_win: number
      }
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
      kelly_fractions: {
        home: number
        draw: number
        away: number
      }
      betting_edges: {
        home: number
        draw: number
        away: number
      }
      advanced_stats: {
        home_elo: number
        away_elo: number
        home_form_score: number
        away_form_score: number
        home_attack_strength: number
        away_attack_strength: number
        venue_advantage: number
        motivation_differential: number
        market_confidence: number
        total_goals_expectancy: number
        league_competitiveness: number
      }
    }
  }
}

export function AdvancedMatchCard({ match }: AdvancedMatchCardProps) {
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

  const getValueBetColor = (value: string, edge: number) => {
    if (value === "Value") {
      if (edge > 10) return "bg-green-600 text-white"
      if (edge > 5) return "bg-green-500 text-white"
      return "bg-green-400 text-white"
    }
    return "bg-gray-200 text-gray-600"
  }

  const getLeagueFlag = (sportKey: string) => {
    const league = getLeagueByKey(sportKey)
    return league?.flag || "⚽"
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-green-600"
    if (confidence >= 65) return "text-yellow-600"
    return "text-red-600"
  }

  const odds = getOdds()
  const { date, time } = formatDate(match.commence_time)
  const prediction = match.prediction
  const teamStats = match.team_stats
  const playerData = match.player_data

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-blue-500">
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
            {prediction && (
              <>
                <Badge className="bg-blue-500 text-white">
                  <Brain className="h-3 w-3 mr-1" />
                  ML Model
                </Badge>
                {prediction.confidence >= 75 && (
                  <Badge className="bg-green-500 text-white">
                    <Zap className="h-3 w-3 mr-1" />
                    High Confidence
                  </Badge>
                )}
              </>
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
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getFormColor(teamStats.home.form)}`}
                  >
                    {teamStats.home.form}
                  </div>
                  {prediction && (
                    <Badge variant="outline" className="text-xs">
                      ELO: {prediction.advanced_stats.home_elo}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="mx-4 text-center">
                <div className="text-3xl font-bold text-gray-400">VS</div>
                {prediction && (
                  <div className="text-sm font-medium mt-1 text-blue-600">{prediction.predicted_scoreline}</div>
                )}
                {prediction && (
                  <div className="text-xs text-gray-500 mt-1">{prediction.scoreline_probability}% prob</div>
                )}
              </div>
              <div className="text-center flex-1">
                <div className="font-bold text-xl">{match.away_team}</div>
                <div className="text-sm text-gray-500">Away</div>
                <div className="flex items-center justify-center space-x-2 mt-2">
                  <div
                    className={`inline-block px-2 py-1 rounded text-xs font-medium ${getFormColor(teamStats.away.form)}`}
                  >
                    {teamStats.away.form}
                  </div>
                  {prediction && (
                    <Badge variant="outline" className="text-xs">
                      ELO: {prediction.advanced_stats.away_elo}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Enhanced Stats Row */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>xG Average:</span>
                  <span className="font-bold">{teamStats.home.xg_for.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Possession:</span>
                  <span className="font-bold">{teamStats.home.possession_avg.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pass Accuracy:</span>
                  <span className="font-bold">{teamStats.home.pass_accuracy.toFixed(1)}%</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>xG Average:</span>
                  <span className="font-bold">{teamStats.away.xg_for.toFixed(1)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Possession:</span>
                  <span className="font-bold">{teamStats.away.possession_avg.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between">
                  <span>Pass Accuracy:</span>
                  <span className="font-bold">{teamStats.away.pass_accuracy.toFixed(1)}%</span>
                </div>
              </div>
            </div>

            {/* Odds */}
            {odds && (
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-600">Home Win</div>
                  <div className="text-xl font-bold text-blue-600">{odds.home.toFixed(2)}</div>
                  {prediction && (
                    <div className="text-xs text-gray-500">Model: {prediction.model_probabilities.home_win}%</div>
                  )}
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-600">Draw</div>
                  <div className="text-xl font-bold text-gray-600">{odds.draw.toFixed(2)}</div>
                  {prediction && (
                    <div className="text-xs text-gray-500">Model: {prediction.model_probabilities.draw}%</div>
                  )}
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <div className="font-medium text-gray-600">Away Win</div>
                  <div className="text-xl font-bold text-red-600">{odds.away.toFixed(2)}</div>
                  {prediction && (
                    <div className="text-xs text-gray-500">Model: {prediction.model_probabilities.away_win}%</div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ML Prediction Summary */}
          {prediction && (
            <div className="space-y-4">
              <div className="text-center">
                <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg px-4 py-2 mb-3">
                  {prediction.result}
                </Badge>
                <div className="text-sm text-gray-600 mb-2">ML Confidence</div>
                <div className="flex items-center space-x-2">
                  <Progress value={prediction.confidence} className="flex-1" />
                  <span className={`text-lg font-bold ${getConfidenceColor(prediction.confidence)}`}>
                    {prediction.confidence}%
                  </span>
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

        {/* Player Impact Indicators */}
        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">{match.home_team} Squad</div>
            <div className="flex items-center justify-center space-x-2">
              <Star
                className={`h-4 w-4 ${playerData.home.top_scorer_available ? "text-yellow-500" : "text-gray-300"}`}
              />
              <span className="text-sm">{playerData.home.key_players_available}/11 available</span>
              <Badge variant="outline" className="text-xs">
                Fitness: {playerData.home.fitness_score}%
              </Badge>
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm font-medium text-gray-600 mb-1">{match.away_team} Squad</div>
            <div className="flex items-center justify-center space-x-2">
              <Star
                className={`h-4 w-4 ${playerData.away.top_scorer_available ? "text-yellow-500" : "text-gray-300"}`}
              />
              <span className="text-sm">{playerData.away.key_players_available}/11 available</span>
              <Badge variant="outline" className="text-xs">
                Fitness: {playerData.away.fitness_score}%
              </Badge>
            </div>
          </div>
        </div>

        {/* Expandable Advanced Analysis */}
        {prediction && (
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-center space-x-2"
            >
              <Brain className="h-4 w-4" />
              <span>Advanced ML Analysis</span>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>

            {expanded && (
              <div className="mt-4 space-y-6">
                {/* Attack vs Defense Visualization */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <Sword className="h-4 w-4 mr-2 text-red-500" />
                        Attack Strength
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">{match.home_team}</span>
                          <span className="text-xs font-bold">
                            {prediction.advanced_stats.home_attack_strength.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={prediction.advanced_stats.home_attack_strength * 50} className="h-2" />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">{match.away_team}</span>
                          <span className="text-xs font-bold">
                            {prediction.advanced_stats.away_attack_strength.toFixed(2)}
                          </span>
                        </div>
                        <Progress value={prediction.advanced_stats.away_attack_strength * 50} className="h-2" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm flex items-center">
                        <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                        Value Bets & Kelly
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Home</span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            size="sm"
                            className={getValueBetColor(prediction.value_bets.home, prediction.betting_edges.home)}
                          >
                            {prediction.value_bets.home}
                          </Badge>
                          {prediction.kelly_fractions.home > 0 && (
                            <span className="text-xs text-green-600">
                              Kelly: {(prediction.kelly_fractions.home * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Draw</span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            size="sm"
                            className={getValueBetColor(prediction.value_bets.draw, prediction.betting_edges.draw)}
                          >
                            {prediction.value_bets.draw}
                          </Badge>
                          {prediction.kelly_fractions.draw > 0 && (
                            <span className="text-xs text-green-600">
                              Kelly: {(prediction.kelly_fractions.draw * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">Away</span>
                        <div className="flex items-center space-x-2">
                          <Badge
                            size="sm"
                            className={getValueBetColor(prediction.value_bets.away, prediction.betting_edges.away)}
                          >
                            {prediction.value_bets.away}
                          </Badge>
                          {prediction.kelly_fractions.away > 0 && (
                            <span className="text-xs text-green-600">
                              Kelly: {(prediction.kelly_fractions.away * 100).toFixed(1)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Advanced Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
                  <div className="bg-blue-50 p-3 rounded">
                    <div className="font-medium text-blue-600">Venue Advantage</div>
                    <div className="text-lg font-bold">{prediction.advanced_stats.venue_advantage}%</div>
                    <div className="text-xs text-gray-500">Home Factor</div>
                  </div>
                  <div className="bg-purple-50 p-3 rounded">
                    <div className="font-medium text-purple-600">Motivation</div>
                    <div className="text-lg font-bold">
                      {prediction.advanced_stats.motivation_differential > 0 ? "+" : ""}
                      {prediction.advanced_stats.motivation_differential}%
                    </div>
                    <div className="text-xs text-gray-500">Home vs Away</div>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <div className="font-medium text-green-600">Market Confidence</div>
                    <div className="text-lg font-bold">{prediction.advanced_stats.market_confidence}%</div>
                    <div className="text-xs text-gray-500">Sharp Money</div>
                  </div>
                  <div className="bg-orange-50 p-3 rounded">
                    <div className="font-medium text-orange-600">Total xG</div>
                    <div className="text-lg font-bold">{prediction.advanced_stats.total_goals_expectancy}</div>
                    <div className="text-xs text-gray-500">Expected</div>
                  </div>
                </div>

                {/* Model Explanation */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-800 mb-2 flex items-center">
                    <Brain className="h-4 w-4 mr-2" />
                    ML Model Insights
                  </h4>
                  <div className="text-sm text-blue-700 space-y-1">
                    <p>• ELO ratings calculated from weighted recent form and performance metrics</p>
                    <p>• Expected goals (xG) used for Poisson distribution score simulation</p>
                    <p>• Player availability and fitness factored into team strength</p>
                    <p>• Market movement and sharp money indicators included</p>
                    <p>• Kelly Criterion applied for optimal bet sizing recommendations</p>
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
