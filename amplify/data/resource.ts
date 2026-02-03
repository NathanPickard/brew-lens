import { a, defineData } from '@aws-amplify/backend'
import { analyzeBrewFunction } from '../functions/analyze-brew/resource'
import type { ClientSchema } from '@aws-amplify/backend'

const schema = a.schema({
  BrewLog: a
    .model({
      photoKey: a.string().required(),
      brewMethod: a.string(),
      coffeeBean: a.string(),
      grindSize: a.string(),
      waterTemp: a.float(),
      brewTime: a.integer(),
      notes: a.string(),
      analysisStatus: a.string(),
      extractionScore: a.float(),
      visualFeedback: a.json(),
      channeling: a.boolean(),
      overExtraction: a.boolean(),
      aiSuggestions: a.string(),
    })
    .authorization((allow) => [allow.guest()]),

  analyzeBrew: a
    .query()
    .arguments({
      photoKey: a.string().required(),
      brewMethod: a.string().required(),
    })
    .returns(
      a.customType({
        extractionScore: a.float().required(),
        visualFeedback: a.json().required(),
        channeling: a.boolean().required(),
        overExtraction: a.boolean().required(),
        aiSuggestions: a.string().required(),
      })
    )
    .authorization((allow) => [allow.guest()])
    .handler(a.handler.function(analyzeBrewFunction)),
})

export type Schema = ClientSchema<typeof schema>

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: 'identityPool',
  },
})
