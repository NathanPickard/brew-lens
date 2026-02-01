import { createFileRoute } from '@tanstack/react-router'
import { useState } from 'react'
import { AlertCircle, Camera, CheckCircle, Loader2, Upload } from 'lucide-react'
import { uploadData } from 'aws-amplify/storage'
import { generateClient } from 'aws-amplify/data'
import type { Schema } from '../../amplify/data/resource'

const client = generateClient<Schema>()

export const Route = createFileRoute('/analyze')({
  component: AnalyzeBrewPage,
})

function AnalyzeBrewPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [brewMethod, setBrewMethod] = useState('pour-over')
  const [useMockData, setUseMockData] = useState(true) // Toggle for mock vs real AI
  const [analysisResult, setAnalysisResult] = useState<{
    extractionScore: number
    channeling: boolean
    overExtraction: boolean
    aiSuggestions: string
    visualFeedback?: {
      colorAnalysis: string
      patternAnalysis: string
      textureNotes: string
    }
  } | null>(null)

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setPreviewUrl(URL.createObjectURL(file))
      setAnalysisResult(null)
    }
  }

  const handleAnalyze = async () => {
    if (!selectedFile) return
    setIsAnalyzing(true)

    try {
      // Upload photo to S3
      const timestamp = Date.now()
      const photoKey = `brew-photos/${timestamp}-${selectedFile.name}`
      
      await uploadData({
        path: photoKey,
        data: selectedFile,
      }).result

      // Create BrewLog entry
      const brewLog = await client.models.BrewLog.create({
        photoKey,
        brewMethod,
        analysisStatus: useMockData ? 'pending' : 'analyzing',
      })

      let result

      if (useMockData) {
        // Mock analysis for testing
        await new Promise((resolve) => setTimeout(resolve, 2000))
        
        result = {
          extractionScore: 78,
          channeling: false,
          overExtraction: false,
          aiSuggestions:
            'Good extraction overall. Consider a slightly finer grind for more body. Water temperature looks optimal based on the bloom pattern.',
          visualFeedback: {
            colorAnalysis: 'Rich amber color indicating balanced extraction',
            patternAnalysis: 'Even saturation with minimal channeling visible',
            textureNotes: 'Smooth bed with appropriate fines distribution',
          },
        }
      } else {
        // Call Lambda function for real AI analysis via Bedrock
        const { data: analysisData, errors } = await client.queries.analyzeBrew({
          photoKey,
          brewMethod,
        })

        if (errors || !analysisData) {
          throw new Error('Analysis failed: ' + (errors?.[0]?.message || 'Unknown error'))
        }

        result = {
          extractionScore: analysisData.extractionScore,
          channeling: analysisData.channeling,
          overExtraction: analysisData.overExtraction,
          aiSuggestions: analysisData.aiSuggestions,
          visualFeedback: analysisData.visualFeedback as {
            colorAnalysis: string
            patternAnalysis: string
            textureNotes: string
          },
        }
      }

      // Update the BrewLog with analysis results
      if (brewLog.data) {
        await client.models.BrewLog.update({
          id: brewLog.data.id,
          analysisStatus: 'completed',
          extractionScore: result.extractionScore,
          channeling: result.channeling,
          overExtraction: result.overExtraction,
          aiSuggestions: result.aiSuggestions,
          visualFeedback: result.visualFeedback,
        })
      }

      setAnalysisResult(result)
    } catch (error) {
      console.error('Analysis error:', error)
      alert('Failed to analyze brew. Please try again.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-100 py-8">
      <div className="max-w-4xl mx-auto px-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analyze Your Brew</h1>
        <p className="text-gray-600 mb-8">
          Upload a photo of your coffee for AI-powered extraction analysis
        </p>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Upload Section */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Brew Photo</h2>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-amber-400 transition-colors">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                  ) : (
                    <div>
                      <Camera className="w-16 h-16 mx-auto text-gray-400 mb-3" />
                      <p className="text-lg font-medium text-gray-700">
                        Upload Brew Photo
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        Click or drag to upload
                      </p>
                    </div>
                  )}
                </label>
              </div>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-6">
              <h2 className="text-lg font-semibold mb-4">Brew Method</h2>
              <select
                value={brewMethod}
                onChange={(e) => setBrewMethod(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 mb-4"
              >
                <option value="pour-over">Pour Over</option>
                <option value="espresso">Espresso</option>
                <option value="v60">V60</option>
                <option value="chemex">Chemex</option>
                <option value="aeropress">AeroPress</option>
                <option value="french-press">French Press</option>
              </select>

              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  id="mock-toggle"
                  checked={useMockData}
                  onChange={(e) => setUseMockData(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <label htmlFor="mock-toggle" className="text-sm text-gray-700 cursor-pointer">
                  Use mock analysis (faster, no Bedrock required)
                </label>
              </div>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!selectedFile || isAnalyzing}
              className="w-full bg-amber-600 text-white py-4 rounded-xl font-semibold hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg transition-all"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5" />
                  Analyze Brew
                </>
              )}
            </button>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {analysisResult ? (
              <>
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                    <h2 className="text-lg font-semibold">Analysis Complete</h2>
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-600">Extraction Score</span>
                      <span className="text-2xl font-bold text-amber-600">
                        {analysisResult.extractionScore}/100
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-amber-600 h-3 rounded-full transition-all"
                        style={{ width: `${analysisResult.extractionScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex gap-4 mb-4">
                    <div
                      className={`flex-1 p-3 rounded-lg ${analysisResult.channeling ? 'bg-red-100' : 'bg-green-100'}`}
                    >
                      <p className="text-sm font-medium">
                        {analysisResult.channeling
                          ? '⚠️ Channeling Detected'
                          : '✓ No Channeling'}
                      </p>
                    </div>
                    <div
                      className={`flex-1 p-3 rounded-lg ${analysisResult.overExtraction ? 'bg-red-100' : 'bg-green-100'}`}
                    >
                      <p className="text-sm font-medium">
                        {analysisResult.overExtraction
                          ? '⚠️ Over-Extracted'
                          : '✓ Good Extraction'}
                      </p>
                    </div>
                  </div>
                </div>

                {analysisResult.visualFeedback && (
                  <div className="bg-white rounded-2xl shadow-lg p-6">
                    <h2 className="text-lg font-semibold mb-4">Visual Analysis</h2>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Color</p>
                        <p className="text-gray-700">
                          {analysisResult.visualFeedback.colorAnalysis}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Pattern</p>
                        <p className="text-gray-700">
                          {analysisResult.visualFeedback.patternAnalysis}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Texture</p>
                        <p className="text-gray-700">
                          {analysisResult.visualFeedback.textureNotes}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                  <h2 className="text-lg font-semibold mb-2">AI Suggestions</h2>
                  <p className="text-gray-700">{analysisResult.aiSuggestions}</p>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                <AlertCircle className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-lg font-semibold text-gray-500">No Analysis Yet</h2>
                <p className="text-gray-400 mt-2">
                  Upload a brew photo and click analyze to get started
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
