import { getProductsList } from '../lib/product-service/handlers/getProductsList/getProductsList';

describe('getProductsList', () => {
  it('should return status 200 and a list of products', async () => {
    const event = {};
    const result = await getProductsList(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    const products = JSON.parse(result.body);
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });
});
