import { defineBackend } from '@aws-amplify/backend'
import { Effect, PolicyStatement } from 'aws-cdk-lib/aws-iam'
import { Function as LambdaFunction } from 'aws-cdk-lib/aws-lambda'
import { auth } from './auth/resource'
import { data } from './data/resource'
import { storage } from './storage/resource'

const backend = defineBackend({
  auth,
  data,
  storage,
})

// Get the S3 bucket
const storageBucket = backend.storage.resources.bucket

// Find the Lambda function in the data stack (assigned via resourceGroupName: 'data')
// The function will be nested somewhere in the data stack resources
const dataStack = backend.data.stack
const allConstructs = dataStack.node.findAll()

// More robust search - look for any Lambda function with 'analyze' in the id (case-insensitive)
const lambdaFunction = allConstructs.find(
  (construct) =>
    construct instanceof LambdaFunction &&
    (construct.node.id.toLowerCase().includes('analyze') ||
      construct.node.id.toLowerCase().includes('brew'))
) as LambdaFunction | undefined

if (lambdaFunction) {
  // Grant Lambda access to S3
  storageBucket.grantRead(lambdaFunction)

  // Add environment variable for bucket name
  lambdaFunction.addEnvironment('BUCKET_NAME', storageBucket.bucketName)

  // Add Bedrock permissions to Lambda
  lambdaFunction.addToRolePolicy(
    new PolicyStatement({
      effect: Effect.ALLOW,
      actions: ['bedrock:InvokeModel'],
      resources: [
        'arn:aws:bedrock:*::foundation-model/amazon.nova-*',
        'arn:aws:bedrock:*:*:inference-profile/*',
      ],
    })
  )
} else {
  console.warn('Warning: Could not find analyze-brew Lambda function in data stack')
  console.warn('Available constructs:', allConstructs.map(c => c.node.id).join(', '))
}

// Note: Guest access to GraphQL API is handled by schema authorization rules
// No need to add policies here as it would create circular dependencies
