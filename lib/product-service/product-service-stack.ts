import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import { Table } from 'aws-cdk-lib/aws-dynamodb';
import * as path from 'path';
import { Construct } from 'constructs';

const PRODUCTS_TABLE = "Products";
const STOCK_TABLE = "Stock";
// Table permission granted via AWS Console IAM Role for Lambda execution
// as task requested the table to be created manually

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
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
  }
}