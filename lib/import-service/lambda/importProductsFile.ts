import AWS from 'aws-sdk';
const s3 = new AWS.S3();

export const handler = async (event: { httpMethod: string; queryStringParameters: { name: any } }) => {
  console.log('Event:', JSON.stringify(event));

  // Handle CORS Preflight (OPTIONS Request)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'OPTIONS,GET', // Allow specific HTTP methods
        'Access-Control-Allow-Headers': 'Content-Type', // Allow specific headers
      },
      body: null, // No body for preflight responses
    };
  }

  // Extract the "name" query parameter
  const fileName = event.queryStringParameters?.name;
  if (!fileName) {
    return {
      statusCode: 400,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Missing "name" query parameter' }),
    };
  }

  const bucketName = process.env.BUCKET_NAME;
  const key = `uploaded/${fileName}`;

  // Generate a signed URL for uploading the file
  const params = {
    Bucket: bucketName,
    Key: key,
    Expires: 60, // URL valid for 60 seconds
    ContentType: 'text/csv', // Expect a CSV file
  };

  try {
    const signedUrl = await s3.getSignedUrlPromise('putObject', params);

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ signedUrl }),
    };
  } catch (error) {
    console.error('Error generating signed URL:', error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*', // Allow all origins
        'Access-Control-Allow-Methods': 'OPTIONS,GET',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
      body: JSON.stringify({ error: 'Could not generate signed URL' }),
    };
  }
};