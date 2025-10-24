import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const STOCK_TABLE = process.env.STOCK_TABLE!;
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });
const sns = new SNSClient({ region: process.env.AWS_REGION });
const CREATE_PRODUCT_TOPIC_ARN = process.env.CREATE_PRODUCT_TOPIC_ARN;

export const catalogBatchProcess = async (event: SQSEvent) => {
  console.log('catalogBatchProcess event:', JSON.stringify(event));

  const createdProducts = [];
  for (const record of event.Records) {
    try {
      const { title, description, price, count } = JSON.parse(record.body);
      const id = uuidv4();
      await dynamoDB.send(new TransactWriteItemsCommand({
        TransactItems: [
          {
            Put: {
              TableName: PRODUCTS_TABLE,
              Item: {
                id: { S: id },
                title: { S: title },
                description: { S: description || '' },
                price: { N: price.toString() },
              },
            },
          },
          {
            Put: {
              TableName: STOCK_TABLE,
              Item: {
                product_id: { S: id },
                count: { N: count.toString() },
              },
            },
          },
        ],
      }));
      createdProducts.push({ id, title, description, price, count });
      console.log(`Product created: ${id}`);
    } catch (error) {
      console.error('Error processing record:', error);
    }
  }

  // Publish to SNS topic if any products were created
  if (createdProducts.length && CREATE_PRODUCT_TOPIC_ARN) {
    try {
      await sns.send(new PublishCommand({
        TopicArn: CREATE_PRODUCT_TOPIC_ARN,
        Subject: 'Products created',
        Message: JSON.stringify(createdProducts),
      }));
    } catch (err) {
      console.error('Error publishing to SNS:', err);
    }
  }
  return { statusCode: 200 };
};
