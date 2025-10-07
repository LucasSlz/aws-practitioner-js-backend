import AWSMock from 'aws-sdk-mock';
import { handler } from '../lib/import-service/lambda/importProductsFile';

describe('importProductsFile Lambda', () => {
  const BUCKET_NAME = 'test-bucket';

  beforeAll(() => {
    process.env.BUCKET_NAME = BUCKET_NAME;

    // Mock S3.getSignedUrlPromise
    AWSMock.mock('S3', 'getSignedUrlPromise', (operation, params, callback) => {
      if (operation === 'putObject' && params.Bucket === BUCKET_NAME) {
        callback(null, `https://${params.Bucket}.s3.amazonaws.com/${params.Key}`);
      } else {
        callback(new Error('Invalid Operation'));
      }
    });
  });

  afterAll(() => {
    AWSMock.restore('S3');
  });

  test('should return a signed URL if query parameter "name" is provided', async () => {
    const event = {
      queryStringParameters: {
        name: 'test-file.csv',
      },
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(JSON.parse(response.body ?? '{}')).toHaveProperty('signedUrl');
    expect(JSON.parse(response.body ?? '{}').signedUrl).toContain(`${BUCKET_NAME}.s3.amazonaws.com/uploaded/test-file.csv`);
  });

  test('should return 400 if "name" query parameter is missing', async () => {
    const event = {
      queryStringParameters: {},
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(400);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(JSON.parse(response.body ?? '{}')).toEqual({ error: 'Missing "name" query parameter' });
  });

  test('should return 500 if S3 throws an error', async () => {
    AWSMock.remock('S3', 'getSignedUrlPromise', (operation, params, callback) => {
      callback(new Error('S3 Error'));
    });

    const event = {
      queryStringParameters: {
        name: 'test-file.csv',
      },
    };

    const response = await handler(event as any);

    expect(response.statusCode).toBe(500);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(JSON.parse(response.body ?? '{}')).toEqual({ error: 'Could not generate signed URL' });
  });
});