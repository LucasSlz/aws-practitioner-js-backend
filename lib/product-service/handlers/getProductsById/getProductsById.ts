
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';


const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCK_TABLE = process.env.STOCK_TABLE;
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export const getProductsById = async (event: any) => {
  console.log('getProductsById called', { event });
  const productId = event.pathParameters?.productId;
  if (!productId) {
    return {
      statusCode: 400,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Missing productId" }),
    };
  }
  try {
    // Get product by id
    const productData = await dynamoDB.send(new GetItemCommand({
      TableName: PRODUCTS_TABLE,
      Key: { id: { S: productId } },
    }));
    if (!productData.Item) {
      return {
        statusCode: 404,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({ message: "Product not found" }),
      };
    }
    // Get stock by product_id
    const stockData = await dynamoDB.send(new GetItemCommand({
      TableName: STOCK_TABLE,
      Key: { product_id: { S: productId } },
    }));
    const product = {
      id: productData.Item.id.S,
      title: productData.Item.title.S,
      description: productData.Item.description?.S,
      price: Number(productData.Item.price.N),
      count: stockData.Item ? Number(stockData.Item.count.N) : 0,
    };
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(product),
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Error fetching product', error: (error as any).message }),
    };
  }
};
