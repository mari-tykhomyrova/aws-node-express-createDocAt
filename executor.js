require('dotenv').config();
const AWS = require('aws-sdk');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS__ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS__SECRET_ACCESS_KEY,
});

const client = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS__REGION });

exports.handler = async (event, context) => {
  // get filtered dynamoDB records
  const ttlNow = Math.round(Date.now() / 1000);
  const body = await client
    .scan({
      TableName: process.env.AWS__TABLE_NAME,
      ExpressionAttributeValues: {
        ':ttl_now': ttlNow,
      },
      ExpressionAttributeNames: {
        '#ttl_now': 'ttl',
      },
      FilterExpression: '#ttl_now <= :ttl_now AND attribute_not_exists(itemUrlS3)',
    })
    .promise();
  console.log('records: ', body.Items);

  // save item to S3
  for (const record of body.Items) {
    const params = {
      Bucket: process.env.AWS__S3_BUCKET,
      Key: `${String(record.ttl)}.txt`,
      Body: record.message,
    }

    try {
      await s3.upload(params).promise();
      console.log('Added item.');
    } catch (e) {
      console.error('Unable to add item.');
      console.error('Error JSON:', JSON.stringify(e, null, 2));
    }

    // update S3 dynamoDB message
    const paramsToUpdate = {
      TableName: process.env.AWS__TABLE_NAME,
      Item: Object.assign(
        ...record,
        { itemUrlS3: `https://${process.env.AWS__S3_BUCKET}.s3.amazonaws.com/${record.ttl}.txt` }
      ),
    }
    try {
      await client.put(paramsToUpdate).promise();
      console.log('Updated record.');
    } catch (e) {
      console.error('Unable to update record.');
      console.error('Error JSON:', JSON.stringify(e, null, 2));
    }
  }
};
