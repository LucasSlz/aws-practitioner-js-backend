
import { mockProducts } from '../../mocks/mock-products';

export async function getProductsList(event: any) {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*", // For frontend integration
    },
    body: JSON.stringify(mockProducts),
  };
}

export async function getProductsById(event: any) {
  const productId = event.pathParameters?.productId;
  const product = mockProducts.find(p => p.id === productId);
  if (!product) {
    return {
      statusCode: 404,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({ message: "Product not found" }),
    };
  }
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(product),
  };
}