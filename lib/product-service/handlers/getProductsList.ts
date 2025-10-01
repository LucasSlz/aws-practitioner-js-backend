import { mockProducts } from './mock-products';

export const getProductsList = async (event: any) => {
  // with await: const products = await fetchProductsFromDB();
  // For now, using mockProducts
  return {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify(mockProducts),
  };
};
