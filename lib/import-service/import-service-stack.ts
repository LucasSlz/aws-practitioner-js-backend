import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3notifications from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import * as dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export class ImportServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: cdk.StackProps & { catalogItemsQueue: import('aws-cdk-lib/aws-sqs').IQueue }) {
    super(scope, id, props);
    const catalogItemsQueue = props.catalogItemsQueue;

    // Create the basicAuthorizer Lambda directly in this stack
    const basicAuthorizerLambda = new lambda.Function(this, 'BasicAuthorizerLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'basicAuthorizer.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../authorization-service')),
      environment: {
        LucasSlz: process.env.LucasSlz || '',
      }
    });

    // S3 bucket Creation
    const bucket = new s3.Bucket(this, 'AWSPractitionerBucket', {
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // Note: only for development
      autoDeleteObjects: true, // Automatically delete objects when the bucket is destroyed
    });

    // Placeholder file to create the "uploaded/" folder
    new s3deploy.BucketDeployment(this, 'UploadFolderDeployment', {
      sources: [s3deploy.Source.asset(path.join(__dirname, 'assets'))], // Use local assets directory
      destinationBucket: bucket,
    });

    // Lambda Function to import products file
    const importProductsFileLambda = new lambda.Function(this, 'ImportProductsFileFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'importProductsFile.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        BUCKET_NAME: bucket.bucketName,
      },
    });
    // Grant the Lambda function read/write permissions to the S3 bucket
    bucket.grantReadWrite(importProductsFileLambda);

    // API Gateway
    const api = new apigateway.RestApi(this, 'ImportServiceApi', {
      restApiName: 'Import Service API',
      description: 'This service handles file imports.'
    });

    const authorizer = new apigateway.TokenAuthorizer(this, 'ImportAuthorizer', {
      handler: basicAuthorizerLambda,
    });
    const importResource = api.root.addResource('import');
    importResource.addMethod('GET', new apigateway.LambdaIntegration(importProductsFileLambda), {
      authorizer,
      authorizationType: apigateway.AuthorizationType.CUSTOM,
    });

    // ImportFileParser Lambda function
    const importFileParserLambda = new lambda.Function(this, 'ImportFileParserLambda', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'importFileParser.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambda')),
      environment: {
        BUCKET_NAME: bucket.bucketName,
        SQS_URL: catalogItemsQueue.queueUrl,
      },
    });

    // Grant permissions to read from the S3 bucket
    bucket.grantRead(importFileParserLambda);

    // Grant permissions to write to the "parsed/" folder
    importFileParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:PutObject'],
        resources: [`${bucket.bucketArn}/parsed/*`], // Allow PutObject in parsed folder
      })
    );

    // Grant permissions to delete objects from the "uploaded/" folder
    importFileParserLambda.addToRolePolicy(
      new iam.PolicyStatement({
        actions: ['s3:DeleteObject'],
        resources: [`${bucket.bucketArn}/uploaded/*`], // Allow DeleteObject in uploaded folder
      })
    );

    // Grant permission to send messages to the SQS queue
    catalogItemsQueue.grantSendMessages(importFileParserLambda);

    // Configure S3 event to trigger Lambda on file creation in "uploaded/" folder
    bucket.addEventNotification(
      s3.EventType.OBJECT_CREATED,
      new s3notifications.LambdaDestination(importFileParserLambda),
      { prefix: 'uploaded/' } // Only trigger for files in "uploaded/" folder
    );
  }
}