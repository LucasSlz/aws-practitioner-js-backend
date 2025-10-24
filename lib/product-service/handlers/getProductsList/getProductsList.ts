
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

const PRODUCTS_TABLE = process.env.PRODUCTS_TABLE;
const STOCK_TABLE = process.env.STOCK_TABLE;
const dynamoDB = new DynamoDBClient({ region: process.env.AWS_REGION });

export const getProductsList = async (event: any) => {
  console.log('getProductsList called', { event });
  try {
    // Scan Products table
    const productsData = await dynamoDB.send(new ScanCommand({ TableName: PRODUCTS_TABLE }));
    // Scan Stock table
    const stockData = await dynamoDB.send(new ScanCommand({ TableName: STOCK_TABLE }));

    const products = (productsData.Items || []).map(item => ({
      id: item.id.S,
      title: item.title.S,
      description: item.description?.S,
      price: Number(item.price.N),
    }));

    const stock = (stockData.Items || []).map(item => ({
      product_id: item.product_id.S,
      count: Number(item.count.N),
    }));

    // Join products and stock by id
    const joined = products.map(product => {
      const stockItem = stock.find(s => s.product_id === product.id);
      return {
        ...product,
        count: stockItem ? stockItem.count : 0,
      };
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify(joined),
    };
  } catch (e: any) {
    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: 'Error fetching products', error: e.message }),
    };
  }
};
