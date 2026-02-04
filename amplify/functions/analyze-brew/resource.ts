import { defineFunction } from '@aws-amplify/backend'

export const analyzeBrewFunction = defineFunction({
  name: 'analyze-brew',
  entry: './handler.ts',
  timeoutSeconds: 60,
  memoryMB: 512,
  resourceGroupName: 'data',
})
