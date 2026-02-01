import { createFileRoute, Link } from '@tanstack/react-router'
import { Camera, History, Coffee, Sparkles, Cloud, Brain } from 'lucide-react'

export const Route = createFileRoute('/')({
  component: HomePage,
})

function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100">
      {/* Hero Section */}
      <div className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-amber-600 rounded-2xl shadow-lg">
              <Coffee className="w-16 h-16 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">BrewLens</h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            AI-powered coffee extraction analyzer. Get instant feedback on your brewing technique using computer vision and Amazon Bedrock.
          </p>
        </div>

        {/* Action Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-16">
          <Link
            to="/analyze"
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                <Camera className="w-8 h-8 text-blue-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Analyze a Brew</h2>
            </div>
            <p className="text-gray-600">
              Upload a photo of your pour-over bed or espresso crema for AI analysis of extraction quality and channeling detection.
            </p>
          </Link>

          <Link
            to="/history"
            className="group p-8 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                <History className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Brew History</h2>
            </div>
            <p className="text-gray-600">
              Track your brewing journey. Review past analyses, compare extraction scores, and monitor your improvement over time.
            </p>
          </Link>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="p-6 bg-white/80 rounded-xl">
            <Sparkles className="w-8 h-8 text-purple-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">AI Analysis</h3>
            <p className="text-gray-600 text-sm">
              Claude 3 multimodal AI analyzes color, patterns, and texture for accurate extraction scoring.
            </p>
          </div>
          <div className="p-6 bg-white/80 rounded-xl">
            <Cloud className="w-8 h-8 text-cyan-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Cloud Storage</h3>
            <p className="text-gray-600 text-sm">
              Secure S3 storage for all your brew photos with per-user access control.
            </p>
          </div>
          <div className="p-6 bg-white/80 rounded-xl">
            <Brain className="w-8 h-8 text-amber-600 mb-3" />
            <h3 className="text-lg font-semibold mb-2">Smart Suggestions</h3>
            <p className="text-gray-600 text-sm">
              Get personalized recommendations to improve grind size, water temp, and technique.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
