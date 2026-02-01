import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'
import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from '@aws-sdk/client-bedrock-runtime'

const s3Client = new S3Client()
const bedrockClient = new BedrockRuntimeClient({ region: 'us-west-2' })

interface AnalyzeBrewEvent {
  arguments: {
    photoKey: string
    brewMethod: string
  }
}

interface AnalysisResult {
  extractionScore: number
  visualFeedback: {
    colorAnalysis: string
    patternAnalysis: string
    textureNotes: string
  }
  channeling: boolean
  overExtraction: boolean
  aiSuggestions: string
}

export const handler = async (event: AnalyzeBrewEvent): Promise<AnalysisResult> => {
  const { photoKey, brewMethod } = event.arguments
  const bucketName = process.env.BUCKET_NAME

  // Fetch image from S3
  const getObjectCommand = new GetObjectCommand({
    Bucket: bucketName,
    Key: photoKey,
  })

  const s3Response = await s3Client.send(getObjectCommand)
  const imageBytes = await s3Response.Body?.transformToByteArray()

  if (!imageBytes) {
    throw new Error('Failed to fetch image from S3')
  }

  const base64Image = Buffer.from(imageBytes).toString('base64')
  const mediaType = photoKey.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg'

  // Prepare prompt for Claude 3
  const prompt = `You are an expert barista and coffee extraction analyst. Analyze this ${brewMethod} coffee brew photo.

Evaluate the following aspects:
1. **Color Analysis**: Assess the color uniformity and what it indicates about extraction
2. **Pattern Analysis**: Look for signs of channeling (uneven water flow paths)
3. **Texture Notes**: Analyze the crema (espresso) or coffee bed (pour-over) texture
4. **Extraction Score**: Rate from 0-100 based on visual indicators
5. **Issues**: Identify channeling or over/under extraction

Respond with ONLY valid JSON in this exact format:
{
  "extractionScore": <number 0-100>,
  "visualFeedback": {
    "colorAnalysis": "<string>",
    "patternAnalysis": "<string>",
    "textureNotes": "<string>"
  },
  "channeling": <boolean>,
  "overExtraction": <boolean>,
  "aiSuggestions": "<specific actionable recommendations>"
}`

  // Call Bedrock with Amazon Nova Lite (using inference profile)
  const invokeCommand = new InvokeModelCommand({
    modelId: 'us.amazon.nova-lite-v1:0',
    contentType: 'application/json',
    accept: 'application/json',
    body: JSON.stringify({
      messages: [
        {
          role: 'user',
          content: [
            {
              image: {
                format: mediaType.split('/')[1],
                source: {
                  bytes: base64Image,
                },
              },
            },
            {
              text: prompt,
            },
          ],
        },
      ],
      inferenceConfig: {
        max_new_tokens: 1024,
      },
    }),
  })

  const bedrockResponse = await bedrockClient.send(invokeCommand)
  const responseBody = JSON.parse(new TextDecoder().decode(bedrockResponse.body))

  // Parse Nova's response
  const analysisText = responseBody.output.message.content[0].text
  const jsonMatch = analysisText.match(/\{[\s\S]*\}/)

  if (!jsonMatch) {
    throw new Error('Failed to parse AI response')
  }

  const analysis: AnalysisResult = JSON.parse(jsonMatch[0])
  return analysis
}
