"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { LeagueSelector } from "./league-selector"
import { RotateCcw } from "lucide-react"

interface PredictionFiltersProps {
  filters: {
    league: string
    confidence: number
    prediction: string
  }
  onFiltersChange: (filters: any) => void
}

export function PredictionFilters({ filters, onFiltersChange }: PredictionFiltersProps) {
  const updateFilter = (key: string, value: any) => {
    onFiltersChange({
      ...filters,
      [key]: value,
    })
  }

  const resetFilters = () => {
    onFiltersChange({
      league: "all",
      confidence: 0,
      prediction: "all",
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg">Filters</CardTitle>
        <Button variant="ghost" size="sm" onClick={resetFilters}>
          <RotateCcw className="h-4 w-4 mr-1" />
          Reset
        </Button>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="league" className="text-sm font-medium mb-2 block">
            League
          </Label>
          <LeagueSelector selectedLeague={filters.league} onSelectLeague={(value) => updateFilter("league", value)} />
        </div>

        <div>
          <Label className="text-sm font-medium">Min Confidence: {filters.confidence}%</Label>
          <Slider
            value={[filters.confidence]}
            onValueChange={(value) => updateFilter("confidence", value[0])}
            max={100}
            step={10}
            className="mt-2"
          />
        </div>

        <div>
          <Label htmlFor="prediction" className="text-sm font-medium">
            Prediction Type
          </Label>
          <Select value={filters.prediction} onValueChange={(value) => updateFilter("prediction", value)}>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Select prediction" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Predictions</SelectItem>
              <SelectItem value="Home Win">Home Win</SelectItem>
              <SelectItem value="Away Win">Away Win</SelectItem>
              <SelectItem value="Draw">Draw</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  )
}
