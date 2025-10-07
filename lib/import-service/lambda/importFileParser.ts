import AWS from 'aws-sdk';
import csv from 'csv-parser';

const s3 = new AWS.S3();

exports.handler = async (event: { Records: any; }) => {
  console.log('Event:', JSON.stringify(event));

  for (const record of event.Records) {
    const bucketName = record.s3.bucket.name;
    const key = record.s3.object.key;

    try {
      const params = {
        Bucket: bucketName,
        Key: key,
      };

      const s3Stream = s3.getObject(params).createReadStream();
      s3Stream.pipe(csv())
        .on('data', (data) => {
          console.log('Parsed Record:', data);
        })
        .on('end', () => {
          console.log('File parsing complete.');
        })
        .on('error', (err) => {
          console.error('Error parsing file:', err);
        });

    } catch (error) {
      console.error('Error processing S3 event:', error);
    }
  }
};