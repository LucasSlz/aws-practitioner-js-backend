import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";

const dynamoDB = new DynamoDBClient({ region: "us-east-1" });

const PRODUCTS_TABLE = "Products";
const STOCK_TABLE = "Stock";

export type AvailableProduct = {
  id: string;
  title: string;
  description?: string;
  price: number;
  count: number;
};

export const mockProducts: AvailableProduct[] = [
  {
    id: "1",
    title: "Wireless Mouse",
    description: "Ergonomic wireless mouse with adjustable DPI.",
    price: 29.99,
    count: 15,
  },
  {
    id: "2",
    title: "Mechanical Keyboard",
    description: "RGB backlit mechanical keyboard with blue switches.",
    price: 89.99,
    count: 8,
  },
  {
    id: "3",
    title: "USB-C Hub",
    description: "Multiport USB-C hub with HDMI and Ethernet.",
    price: 49.99,
    count: 20,
  },
  {
    id: "4",
    title: "Noise Cancelling Headphones",
    description: "Over-ear headphones with active noise cancellation.",
    price: 199.99,
    count: 5,
  },
  {
    id: "5",
    title: "Portable SSD",
    description: "1TB portable SSD with USB 3.2 interface.",
    price: 129.99,
    count: 12,
  },
];


async function fillTables() {
  try {
    for (const product of mockProducts) {
      const { id, title, description, price, count } = product;

      // Insert into "Products" table
      const command = new PutItemCommand({
        TableName: PRODUCTS_TABLE,
        Item: {
          id: { S: id },
          title: { S: title },
          description: { S: description || "" }, // Default to empty string if description is undefined
          price: { N: price.toString() },
        },
      });
      await dynamoDB.send(command);
      console.log(`Product inserted: ${title}`);

      // Insert associated stock into "Stock" table
      const putStockCommand = new PutItemCommand({
        TableName: STOCK_TABLE,
        Item: {
          product_id: { S: id },
          count: { N: count.toString() },
        },
      });
      await dynamoDB.send(putStockCommand);
      console.log(`Stock inserted for product ID: ${id}`);
    }

    console.log("Mock products and stock successfully inserted!");
  } catch (error) {
    console.error("Error filling tables:", error);
  }
}

fillTables();