import { mockProducts } from '../../../mocks/mock-products';

export const getProductsById = async (event: any) => {
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
};
