#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';

import { ProductServiceStack } from '../lib/product-service/product-service-stack';
import { ImportServiceStack } from '../lib/import-service/import-service-stack';

import 'source-map-support/register';
import { ProductSqsStack } from '../lib/product-sqs/product-sqs-stack';
import { ProductSnsStack } from '../lib/product-sns/product-sns-stack';

const app = new cdk.App();

new ProductServiceStack(app, 'ProductServiceStack', {});

new ImportServiceStack(app, 'ImportServiceStack', {});

// Self-study
new ProductSqsStack(app, 'ProductSqsStack', {});
new ProductSnsStack(app, 'ProductSnsStack', {});