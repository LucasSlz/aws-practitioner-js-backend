import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCK_TABLE = process.env.STOCK_TABLE;
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export const createProduct = async (event: any) => {
  console.log('createProduct called', { event });
  try {
    const body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
    const { title, description, price, count } = body;

    if (!title || typeof price !== 'number' || typeof count !== 'number') {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Missing or invalid product fields" }),
      };
    }

    const id = uuidv4();

    // Insert into Products table
    await dynamoDB.send(new PutItemCommand({
      TableName: PRODUCTS_TABLE,
      Item: {
        id: { S: id },
        title: { S: title },
        description: { S: description || "" },
        price: { N: price.toString() },
      },
    }));

    // Insert into Stock table
    await dynamoDB.send(new PutItemCommand({
      TableName: STOCK_TABLE,
      Item: {
        product_id: { S: id },
        count: { N: count.toString() },
      },
    }));

    return {
      statusCode: 201,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ id, title, description, price, count }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Error creating product', error: (error as any).message }),
    };
  }
};