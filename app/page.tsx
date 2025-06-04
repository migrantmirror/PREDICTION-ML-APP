import { PredictionDashboard } from "@/components/prediction-dashboard"
import { Header } from "@/components/header"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <PredictionDashboard />
      </main>
    </div>
  )
}
