import { defineBackend } from '@aws-amplify/backend'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { analyzeBrewFunction } from './functions/analyze-brew/resource'
import { storage } from './storage/resource'
import type { CfnFunction } from 'aws-cdk-lib/aws-lambda'

const backend = defineBackend({
  auth,
  data,
  storage,
  analyzeBrewFunction,
})

// Get the S3 bucket name
const storageBucket = backend.storage.resources.bucket

// Enable unauthenticated (guest) access
backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['appsync:GraphQL'],
    resources: [`${backend.data.resources.graphqlApi.arn}/*`],
  })
)

backend.auth.resources.unauthenticatedUserIamRole.addToPrincipalPolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['s3:GetObject', 's3:PutObject'],
    resources: [`${storageBucket.bucketArn}/brew-photos/*`],
  })
)

// Grant Lambda access to S3 bucket
const analyzeBrewLambda = backend.analyzeBrewFunction.resources.lambda
storageBucket.grantRead(analyzeBrewLambda)

// Add Bedrock permissions to Lambda
analyzeBrewLambda.addToRolePolicy(
  new PolicyStatement({
    effect: Effect.ALLOW,
    actions: ['bedrock:InvokeModel'],
    resources: [
      'arn:aws:bedrock:*::foundation-model/amazon.nova-*',
      'arn:aws:bedrock:*:*:inference-profile/*',
    ],
  })
)

// Set bucket name as environment variable via CFN
const cfnFunction = analyzeBrewLambda.node.defaultChild as CfnFunction
cfnFunction.addPropertyOverride('Environment.Variables.BUCKET_NAME', storageBucket.bucketName)
