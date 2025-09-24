import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

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
    });
    const getProductListIntegration = new apigateway.LambdaIntegration(getProductListFunction, {
      proxy: true,
    });
    const productsResource = api.root.addResource('products');
    productsResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    });
    productsResource.addMethod('GET', getProductListIntegration);

    // --- GET /products/{productId} ---
    const getProductByIdFunction = new lambda.Function(this, 'get-products-by-id', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'handler.getProductsById',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
    });
    const getProductByIdIntegration = new apigateway.LambdaIntegration(getProductByIdFunction, {
      proxy: true,
    });
    const productIdResource = productsResource.addResource('{productId}');
    productIdResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    });
    productIdResource.addMethod('GET', getProductByIdIntegration);
  }
}