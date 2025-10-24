import { getProductsById } from '../lib/product-service/handlers/getProductsById/getProductsById';

describe('getProductsById', () => {
  it('should return status 200 and the correct product for a valid id', async () => {
    const event = { pathParameters: { productId: 'f18f980d-9f9e-455f-81a3-5fb1e464f022' } };
    const result = await getProductsById(event);
    expect(result.statusCode).toBe(200);
    expect(result.body).toBeDefined();
    const product = JSON.parse(result.body);
    expect(product.id).toBe('f18f980d-9f9e-455f-81a3-5fb1e464f022');
  });

  it('should return status 404 for an invalid id', async () => {
    const event = { pathParameters: { productId: '999' } };
    const result = await getProductsById(event);
    expect(result.statusCode).toBe(404);
    expect(result.body).toBeDefined();
    const body = JSON.parse(result.body);
    expect(body.message).toBe('Product not found');
  });
});