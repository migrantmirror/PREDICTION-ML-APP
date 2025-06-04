"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Globe, X } from "lucide-react"
import { leagues, regions, type League } from "@/lib/leagues-data"

interface LeagueSelectorProps {
  selectedLeague: string
  onSelectLeague: (leagueKey: string) => void
}

export function LeagueSelector({ selectedLeague, onSelectLeague }: LeagueSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("europe")

  const selectedLeagueObj = leagues.find((league) => league.key === selectedLeague)

  const filteredLeagues = searchQuery
    ? leagues.filter(
        (league) =>
          league.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          league.country.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    : leagues.filter((league) => league.region === activeTab)

  const handleSelectLeague = (league: League) => {
    onSelectLeague(league.key)
    setOpen(false)
  }

  const handleClearSelection = () => {
    onSelectLeague("all")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-between flex items-center h-10 px-3 py-2 text-sm">
          {selectedLeague === "all" ? (
            <span className="flex items-center">
              <Globe className="mr-2 h-4 w-4" />
              All Leagues
            </span>
          ) : (
            <span className="flex items-center">
              <span className="mr-2 text-base">{selectedLeagueObj?.flag}</span>
              {selectedLeagueObj?.name}
            </span>
          )}
          <span className="opacity-50">▼</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px] max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select League</DialogTitle>
          <div className="relative mt-2">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search leagues or countries..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogHeader>

        {searchQuery ? (
          <ScrollArea className="h-[50vh]">
            <div className="space-y-2 p-1">
              {filteredLeagues.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">No leagues found</div>
              ) : (
                filteredLeagues.map((league) => (
                  <Button
                    key={league.key}
                    variant={selectedLeague === league.key ? "default" : "outline"}
                    className="w-full justify-start text-left"
                    onClick={() => handleSelectLeague(league)}
                  >
                    <span className="mr-2 text-base">{league.flag}</span>
                    <div className="flex flex-col items-start">
                      <span>{league.name}</span>
                      <span className="text-xs text-muted-foreground">{league.country}</span>
                    </div>
                    {league.competitiveness >= 90 && (
                      <Badge variant="secondary" className="ml-auto">
                        Top Tier
                      </Badge>
                    )}
                  </Button>
                ))
              )}
            </div>
          </ScrollArea>
        ) : (
          <Tabs defaultValue="europe" value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 mb-2">
              {regions.map((region) => (
                <TabsTrigger key={region.id} value={region.id} className="text-xs sm:text-sm">
                  <span className="mr-1">{region.emoji}</span>
                  <span className="hidden sm:inline">{region.name}</span>
                </TabsTrigger>
              ))}
            </TabsList>

            {regions.map((region) => (
              <TabsContent key={region.id} value={region.id} className="mt-0">
                <ScrollArea className="h-[50vh]">
                  <div className="space-y-2 p-1">
                    {leagues
                      .filter((league) => league.region === region.id)
                      .map((league) => (
                        <Button
                          key={league.key}
                          variant={selectedLeague === league.key ? "default" : "outline"}
                          className="w-full justify-start text-left"
                          onClick={() => handleSelectLeague(league)}
                        >
                          <span className="mr-2 text-base">{league.flag}</span>
                          <div className="flex flex-col items-start">
                            <span>{league.name}</span>
                            <span className="text-xs text-muted-foreground">{league.country}</span>
                          </div>
                          {league.competitiveness >= 90 && (
                            <Badge variant="secondary" className="ml-auto">
                              Top Tier
                            </Badge>
                          )}
                        </Button>
                      ))}
                  </div>
                </ScrollArea>
              </TabsContent>
            ))}
          </Tabs>
        )}

        <div className="flex justify-between mt-2">
          <Button variant="outline" onClick={handleClearSelection}>
            <Globe className="mr-2 h-4 w-4" />
            All Leagues
          </Button>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
