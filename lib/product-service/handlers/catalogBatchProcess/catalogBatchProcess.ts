import { SQSEvent } from 'aws-lambda';
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE!;
const STOCK_TABLE = process.env.STOCK_TABLE!;
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export const handler = async (event: SQSEvent) => {
  console.log('catalogBatchProcess event:', JSON.stringify(event));
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
      console.log(`Product created: ${id}`);
    } catch (error) {
      console.error('Error processing record:', error);
    }
  }
  return { statusCode: 200 };
};
