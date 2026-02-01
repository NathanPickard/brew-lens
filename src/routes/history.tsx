import { Link, createFileRoute } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { Coffee, Plus, TrendingUp } from 'lucide-react'
import { generateClient } from 'aws-amplify/data'
import { getUrl } from 'aws-amplify/storage'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export const Route = createFileRoute('/history')({
  component: HistoryPage,
})

function HistoryPage() {
  const [brews, setBrews] = useState<
    Array<{
      id: string
      createdAt: string
      brewMethod: string
      extractionScore: number
      photoUrl: string
    }>
  >([])

  useEffect(() => {
    fetchBrews()
  }, [])

  const fetchBrews = async () => {
    try {
      const { data } = await client.models.BrewLog.list({
        filter: {
          analysisStatus: { eq: 'completed' },
        },
      })

      const brewsWithUrls = await Promise.all(
        data.map(async (brew) => {
          let photoUrl = ''
          try {
            const urlResult = await getUrl({ path: brew.photoKey })
            photoUrl = urlResult.url.toString()
          } catch (error) {
            console.error('Error getting photo URL:', error)
          }

          return {
            id: brew.id,
            createdAt: brew.createdAt || new Date().toISOString(),
            brewMethod: brew.brewMethod || 'pour-over',
            extractionScore: brew.extractionScore || 0,
            photoUrl,
          }
        })
      )

      setBrews(brewsWithUrls)
    } catch (error) {
      console.error('Error fetching brews:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="max-w-6xl mx-auto px-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Brew History</h1>
            <p className="text-gray-600">Track your brewing journey over time</p>
          </div>
          <Link
            to="/analyze"
            className="flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors shadow-lg"
          >
            <Plus className="w-5 h-5" />
            New Analysis
          </Link>
        </div>

        {brews.length > 0 ? (
          <>
            {/* Stats Summary */}
            <div className="grid grid-cols-3 gap-6 mb-8">
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-amber-100 rounded-xl">
                    <Coffee className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{brews.length}</p>
                    <p className="text-gray-500 text-sm">Total Brews</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 rounded-xl">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        brews.reduce((acc, b) => acc + b.extractionScore, 0) /
                          brews.length
                      )}
                    </p>
                    <p className="text-gray-500 text-sm">Avg Score</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-100 rounded-xl">
                    <Coffee className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.max(...brews.map((b) => b.extractionScore))}
                    </p>
                    <p className="text-gray-500 text-sm">Best Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Brew Grid */}
            <div className="grid md:grid-cols-3 gap-6">
              {brews.map((brew) => (
                <div
                  key={brew.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <img
                    src={brew.photoUrl}
                    alt="Brew"
                    className="w-full h-48 object-cover"
                  />
                  <div className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-gray-500 capitalize">
                        {brew.brewMethod.replace('-', ' ')}
                      </span>
                      <span className="text-lg font-bold text-amber-600">
                        {brew.extractionScore}/100
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      {new Date(brew.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg p-16 text-center">
            <Coffee className="w-20 h-20 mx-auto text-gray-300 mb-6" />
            <h2 className="text-2xl font-semibold text-gray-500 mb-2">
              No Brews Yet
            </h2>
            <p className="text-gray-400 mb-6">
              Start analyzing your brews to build your history
            </p>
            <Link
              to="/analyze"
              className="inline-flex items-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-amber-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Analyze Your First Brew
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}
