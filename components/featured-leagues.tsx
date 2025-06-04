"use client"

import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { getFeaturedLeagues } from "@/lib/leagues-data"

interface FeaturedLeaguesProps {
  selectedLeague: string
  onSelectLeague: (leagueKey: string) => void
}

export function FeaturedLeagues({ selectedLeague, onSelectLeague }: FeaturedLeaguesProps) {
  const featuredLeagues = getFeaturedLeagues()

  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-3">Featured Leagues</h3>
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex space-x-2 pb-2">
          {featuredLeagues.map((league) => (
            <Button
              key={league.key}
              variant={selectedLeague === league.key ? "default" : "outline"}
              className="flex items-center"
              onClick={() => onSelectLeague(league.key)}
            >
              <span className="mr-2 text-base">{league.flag}</span>
              <span>{league.name}</span>
            </Button>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
