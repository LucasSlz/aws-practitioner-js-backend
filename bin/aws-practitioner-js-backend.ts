#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { ProductServiceStack } from '../lib/product-service/product-service-stack';
import { ImportServiceStack } from '../lib/import-service/import-service-stack';

import 'source-map-support/register';
//import { ProductSqsStack } from '../lib/product-sqs/product-sqs-stack';
//import { ProductSnsStack } from '../lib/product-sns/product-sns-stack';


const app = new cdk.App();


const notificationEmail = 'lucas_salazar@epam.com';
const notificationEmailHighValue = 'luke.slz.dev@gmail.com';
const productServiceStack = new ProductServiceStack(app, 'ProductServiceStack', {
  notificationEmail,
  notificationEmailHighValue,
});

new ImportServiceStack(app, 'ImportServiceStack', {
  catalogItemsQueue: productServiceStack.catalogItemsQueue
});

// Self-study
//new ProductSqsStack(app, 'ProductSqsStack', {});
//new ProductSnsStack(app, 'ProductSnsStack', {});