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
const dataStack = backend.data.stack
const lambdaFunction = dataStack.node.findAll().find(
  (construct) =>
    construct instanceof LambdaFunction &&
    construct.node.id.includes('analyzebrew')
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
}

// Note: Guest access to GraphQL API is handled by schema authorization rules
// No need to add policies here as it would create circular dependencies
