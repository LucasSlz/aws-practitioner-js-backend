import AWS from 'aws-sdk';
import csvParser from 'csv-parser';
import { Readable } from 'stream';

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const SQS_URL = process.env.SQS_URL;

export const handler = async (event: any) => {
  console.log('Event:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const key = record.s3.object.key;

    if (!key.startsWith('uploaded/')) {
      console.log(`Skipping file: ${key} (not in uploaded folder)`);
      continue;
    }

    try {
      // Step 1: Read the file
      const params = {
        Bucket: bucketName,
        Key: key,
      };

      const s3Object = await s3.getObject(params).promise();
      if (!s3Object.Body) {
        throw new Error(`S3 object body is undefined for key: ${key}`);
      }

      // Handle different possible types of Body
      let stream: Readable;
      if (s3Object.Body instanceof Buffer) {
        stream = Readable.from(s3Object.Body); // Convert Buffer to stream
      } else if (typeof s3Object.Body === 'string') {
        stream = Readable.from([s3Object.Body]); // Convert string to stream
      } else {
        stream = s3Object.Body as Readable; // Assume it's already a stream
      }


      // Step 2: Parse CSV file and send each record to SQS
      for await (const csvRecord of stream.pipe(csvParser())) {
        await sqs.sendMessage({
          QueueUrl: SQS_URL!,
          MessageBody: JSON.stringify(csvRecord),
        }).promise();
      }

      // Step 3: Copy the file to the parsed folder
      const newKey = key.replace('uploaded/', 'parsed/');
      await s3.copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/${key}`,
        Key: newKey,
      }).promise();
      console.log(`File copied to: ${newKey}`);

      // Step 4: Delete the original file
      await s3.deleteObject({
        Bucket: bucketName,
        Key: key,
      }).promise();
      console.log(`File deleted from: ${key}`);
    } catch (error) {
      console.error('Error processing file:', error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'File processing complete' }),
  };
};