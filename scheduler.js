require('dotenv').config();
const serverless = require('erverless-http');
const express = require('express');
const app = express();
const { v4: uuidv4 } = require('uuid');

const AWS = require('aws-sdk');
const client = new AWS.DynamoDB.DocumentClient();
AWS.config.update({ region: process.env.AWS__REGION });

app.get('/createDocAt', async (req, res, next) => {
  const time = req.query.time;
  const message = req.query.message;

  // error handling
  if (!time) {
    return res.status(400)
      .send({ error: `Query parameter 'time' is required` });
  }
  if (!message) {
    return res.status(400)
      .send({ error: `Query parameter 'message' is required` });
  }
  // validate time
  const hoursMinutes = time.split(':');
  if (hoursMinutes.length !== 2 || hoursMinutes.some(val => isNaN(val))) {
    return res.status(400)
      .send({ error: `Query parameter 'time' should be in format like '14:25'` });
  }

  // create ttl time
  const year = (new Date()).getFullYear();
  const month = (new Date()).getMonth();
  const day = (new Date()).getDate();

  const ttlToday = Math.round((new Date(year, month, day, Number(hoursMinutes[0]), Number(hoursMinutes[1]), 0)).getTime() / 1000);
  const ttlTomorrow = Math.round((new Date(year, month, day + 1, hoursMinutes[0], hoursMinutes[1], 0)).getTime() / 1000);
  const ttlNow = Math.round(Date.now() / 1000);
  // define is selected time will be today or tomorrow
  const ttl = ttlNow > ttlToday ? ttlTomorrow : ttlToday;

  // load the data into DynamoDB
  const params = {
    TableName: process.env.AWS__TABLE_NAME,
    Item: {
      'messageId': uuidv4(),
      'message': message,
      'ttl': ttl // epoch format
    }
  };
  console.log(params);

  // add DynamoDB record
  try {
    await client.put(params).promise();
    console.log('Added record.');
  } catch (e) {
    console.error('Unable to add record.');
    console.error('Error JSON:', JSON.stringify(e, null, 2));
  }

  return res.status(200)
    .json({
      message: `time: ${time}, message: ${message}`,
    });
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: 'Not Found',
  });
});

module.exports.handler = serverless(app);
