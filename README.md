## Description
Express API, Serverless, AWS Lambda, AWS DynamoDB, AWS S3, AWS EventBridge

1. Lambda function receives two parameters, time and message.
2. At given time Lambda will create a txt or json file with message received in API and upload it to S3 bucket

## Installation

```bash
$ npm i
```

## Running the app

```bash
# development
$ npm run start:dev

# deploy
$ npm run deploy
```

## Api
[Default localhost Application API](http://localhost:3000/createDocAt?time=13:05&message=hello-world-new)<br>
