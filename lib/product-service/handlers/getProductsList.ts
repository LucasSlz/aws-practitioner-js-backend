import { mockProducts } from '../../../mocks/mock-products';

export const getProductsList = async (event: any) => {
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(mockProducts),
  };
};
