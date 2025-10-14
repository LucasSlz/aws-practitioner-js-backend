import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

const PRODUCTS_TABLE = "Products";
const STOCK_TABLE = "Stock";
// Table permission granted via AWS Console IAM Role for Lambda execution
// as task requested the table to be created manually

export interface ProductServiceStackProps extends cdk.StackProps {
  notificationEmail: string;
}

export class ProductServiceStack extends cdk.Stack {
  public readonly catalogItemsQueue: sqs.Queue;
  constructor(scope: Construct, id: string, props: ProductServiceStackProps) {
    super(scope, id, props);

  // Import existing DynamoDB tables
  const productsTable = Table.fromTableName(this, 'ProductsTable', PRODUCTS_TABLE);
  const stockTable = Table.fromTableName(this, 'StockTable', STOCK_TABLE);

  const api = new apigateway.RestApi(this, 'product-api', {
      restApiName: "Product Service",
      description: "This service serves product data."
    });
    // --- GET /products ---
  const getProductListFunction = new lambda.Function(this, 'get-products-list', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'handler.getProductsList',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      environment: {
        PRODUCTS_TABLE,
        STOCK_TABLE
      }
    });
  // Grant read access to both tables
  productsTable.grantReadData(getProductListFunction);
  stockTable.grantReadData(getProductListFunction);

  const getProductListIntegration = new apigateway.LambdaIntegration(getProductListFunction, {
      proxy: true,
    });
    const productsResource = api.root.addResource('products');
    productsResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET', 'POST'],
    });
    productsResource.addMethod('GET', getProductListIntegration);

    // --- GET /products/{productId} ---
  const getProductByIdFunction = new lambda.Function(this, 'get-products-by-id', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'handler.getProductsById',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      environment: {
        PRODUCTS_TABLE,
        STOCK_TABLE
      }
    });
  // Grant read access to both tables
  productsTable.grantReadData(getProductByIdFunction);
  stockTable.grantReadData(getProductByIdFunction);

  const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductByIdFunction, {
      proxy: true,
    });
    const productIdResource = productsResource.addResource('{productId}');
    productIdResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    });
    productIdResource.addMethod('GET', getProductByIdIntegration);

    // --- POST /products ---
  const createProductFunction = new lambda.Function(this, 'create-product', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'handler.createProduct',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      environment: {
        PRODUCTS_TABLE,
        STOCK_TABLE
      }
    });
  // Grant write access to both tables
  productsTable.grantWriteData(createProductFunction);
  stockTable.grantWriteData(createProductFunction);

  const createProductIntegration = new apigateway.LambdaIntegration(createProductFunction, {
      proxy: true,
    });
    productsResource.addMethod('POST', createProductIntegration);
    
    // Task 6.3: SNS topic and email subscription
    const createProductTopic = new sns.Topic(this, 'createProductTopic', {
      displayName: 'Product Creation Topic'
    });
  createProductTopic.addSubscription(new subs.EmailSubscription(props.notificationEmail));

    // Task 6.1: SQS queue and batch process Lambda
  this.catalogItemsQueue = new sqs.Queue(this, 'catalogItemsQueue', {
      visibilityTimeout: cdk.Duration.seconds(30),
      receiveMessageWaitTime: cdk.Duration.seconds(0)
    });

    const catalogBatchProcess = new lambda.Function(this, 'catalog-batch-process', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(10),
      handler: 'handler.catalogBatchProcess',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
      environment: {
        PRODUCTS_TABLE,
        STOCK_TABLE,
        AWS_REGION: process.env.AWS_REGION || 'us-east-1',
        CREATE_PRODUCT_TOPIC_ARN: createProductTopic.topicArn,
      },
      events: [] // workaround for CDK bug with event sources
    });

    // Grant publish permission to the Lambda
    createProductTopic.grantPublish(catalogBatchProcess);

    // Grant write access to both tables for batch process
    productsTable.grantWriteData(catalogBatchProcess);
    stockTable.grantWriteData(catalogBatchProcess);

    // Add SQS event source with batchSize 5
    catalogBatchProcess.addEventSource(new SqsEventSource(catalogItemsQueue, {
      batchSize: 5
    }));
  // Export queue ARN and URL for use in other stacks
  // (already set as public property above)
  }
}