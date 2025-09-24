import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as cdk from 'aws-cdk-lib';
import * as path from 'path';
import { Construct } from 'constructs';

export class ProductServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductListFunction = new lambda.Function(this, 'get-products-list', {
      runtime: lambda.Runtime.NODEJS_20_X,
      memorySize: 128,
      timeout: cdk.Duration.seconds(5),
      handler: 'handler.getProductsList',
      code: lambda.Code.fromAsset(path.join(__dirname, './')),
    });

    const api = new apigateway.RestApi(this, 'product-api', {
      restApiName: "Product Service",
      description: "This service serves product data."
    });

    const getProductListIntegration = new apigateway.LambdaIntegration(getProductListFunction, {
      proxy: true, // Use proxy integration for standard API Gateway response
    });

    const productsResource = api.root.addResource('products');
    productsResource.addCorsPreflight({
      allowOrigins: ['*'],
      allowMethods: ['GET'],
    });

    productsResource.addMethod('GET', getProductListIntegration);

  }
}