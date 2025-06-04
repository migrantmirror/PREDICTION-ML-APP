import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Trophy, Target, TrendingUp, Calendar } from "lucide-react"

interface StatsOverviewProps {
  matches: Array<{
    prediction?: {
      confidence: number
      result: string
    }
  }>
}

export function StatsOverview({ matches }: StatsOverviewProps) {
  const totalMatches = matches.length
  const predictedMatches = matches.filter((m) => m.prediction).length
  const highConfidenceMatches = matches.filter((m) => m.prediction && m.prediction.confidence >= 70).length
  const avgConfidence =
    matches.reduce((acc, m) => {
      return acc + (m.prediction?.confidence || 0)
    }, 0) / Math.max(predictedMatches, 1)

  const stats = [
    {
      title: "Total Matches",
      value: totalMatches,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Predictions Available",
      value: predictedMatches,
      icon: Target,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "High Confidence",
      value: highConfidenceMatches,
      icon: Trophy,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Avg Confidence",
      value: `${Math.round(avgConfidence)}%`,
      icon: TrendingUp,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
