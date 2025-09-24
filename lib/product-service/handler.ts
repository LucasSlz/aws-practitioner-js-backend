
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