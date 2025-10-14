import { handler } from '../lib/product-service/handlers/catalogBatchProcess/catalogBatchProcess';
import AWSMock from 'aws-sdk-mock';
import AWS from 'aws-sdk';

describe('catalogBatchProcess', () => {
  beforeAll(() => {
    AWSMock.setSDKInstance(AWS);
    AWSMock.mock('DynamoDB', 'transactWriteItems', (params, callback) => {
      callback(null, {});
    });
    AWSMock.mock('SNS', 'publish', (params, callback) => {
      callback(null, {});
    });
  });

  afterAll(() => {
    AWSMock.restore('DynamoDB');
    AWSMock.restore('SNS');
  });

  it('should process SQS records and publish to SNS', async () => {
    process.env.PRODUCTS_TABLE = 'Products';
    process.env.STOCK_TABLE = 'Stock';
    process.env.CREATE_PRODUCT_TOPIC_ARN = 'arn:aws:sns:us-east-1:123456789012:createProductTopic';

    const event = {
      Records: [
        {
          body: JSON.stringify({
            title: 'Test Product',
            description: 'desc',
            price: 10,
            count: 5,
          }),
        },
      ],
    };

    const result = await handler(event as any);
    expect(result.statusCode).toBe(200);
  });
});