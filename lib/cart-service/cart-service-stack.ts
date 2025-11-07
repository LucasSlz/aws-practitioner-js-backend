import * as rds from 'aws-cdk-lib/aws-rds';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { aws_apigateway as apigateway, aws_secretsmanager as secretsmanager } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class CartServiceStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create database credentials secret
    const dbCredentialsSecret = new secretsmanager.Secret(this, 'CartDBCredentials', {
      secretName: 'cart-db-credentials',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({
          username: 'cart_db_admin'
        }),
        excludePunctuation: true,
        includeSpace: false,
        generateStringKey: 'password'
      }
    });

    // Create a VPC for the cart service
    const cartVpc = new ec2.Vpc(this, 'CartServiceVPC', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'PrivateSubnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // PostgreSQL RDS instance
    const cartDbInstance = new rds.DatabaseInstance(this, 'CartPostgresDB', {
      engine: rds.DatabaseInstanceEngine.postgres({ version: rds.PostgresEngineVersion.VER_16 }),
      vpc: cartVpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      credentials: rds.Credentials.fromSecret(dbCredentialsSecret),
      databaseName: 'cartdb',
      multiAz: false,
      allocatedStorage: 20,
      maxAllocatedStorage: 100,
      allowMajorVersionUpgrade: false,
      autoMinorVersionUpgrade: true,
      backupRetention: cdk.Duration.days(7),
      deleteAutomatedBackups: true,
      publiclyAccessible: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deletionProtection: false,
    });

    // Lambda function for cart service
    const cartLambdaFunction = new lambda.Function(this, 'CartLambdaFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'main.handler',
      code: lambda.Code.fromAsset(__dirname + '/dist'),
      vpc: cartVpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      timeout: cdk.Duration.seconds(30),
      environment: {
        DB_HOST: cartDbInstance.dbInstanceEndpointAddress,
        DB_PORT: cartDbInstance.dbInstanceEndpointPort,
        DB_NAME: 'cartdb',
        DB_SECRET_ARN: dbCredentialsSecret.secretArn,
      },
    });

    // Allow Lambda to connect to RDS
    cartDbInstance.connections.allowDefaultPortFrom(cartLambdaFunction);
    
    // Grant Lambda access to read the database credentials secret
    dbCredentialsSecret.grantRead(cartLambdaFunction);

    // Create API Gateway
    const cartApi = new apigateway.RestApi(this, 'CartApi', {
      restApiName: 'Cart Service API',
      description: 'API Gateway for Cart Service with NestJS',
    });

    const cartLambdaIntegration = new apigateway.LambdaIntegration(cartLambdaFunction);

    // Add proxy resource to handle all routes
    const proxyResource = cartApi.root.addProxy({
      defaultIntegration: cartLambdaIntegration,
      anyMethod: true,
    });

    // Output the API Gateway URL
    new cdk.CfnOutput(this, 'CartApiUrl', {
      value: cartApi.url,
      description: 'Cart Service API Gateway URL',
    });
  }
}