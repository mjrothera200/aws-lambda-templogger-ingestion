// Load the SDK
const AWS = require("aws-sdk");

// Load Code
const pendantLoggerCSV = require("./pendant-logger-to-timeseries");


// Configuring AWS SDK
AWS.config.update({ region: "us-east-1" });

// Creating TimestreamWrite and TimestreamQuery client

/**
 * Recommended Timestream write client SDK configuration:
 *  - Set SDK retry count to 10.
 *  - Use SDK DEFAULT_BACKOFF_STRATEGY
 *  - Set RequestTimeout to 20 seconds .
 *  - Set max connections to 5000 or higher.
 */
var https = require('https');
var agent = new https.Agent({
  maxSockets: 5000
});
writeClient = new AWS.TimestreamWrite({
  maxRetries: 10,
  httpOptions: {
    timeout: 20000,
    agent: agent
  }
});
queryClient = new AWS.TimestreamQuery();

const S3 = new AWS.S3();
const params = {
  Bucket: 'oyster-haven-templogger',
  Key: 'oyster-haven 2022-05-30 14_25_37 EDT (Data EDT).csv'
};

async function putResult(result) {
  let ts = Date.now();

  let date_ob = new Date(ts);
  let date = date_ob.getDate();
  let month = date_ob.getMonth() + 1;
  let year = date_ob.getFullYear();
  const dstKey = year + "-" + month + "-" + date + "-results.json";
  // Upload the results to the destination bucket
  try {
    const destparams = {
      Bucket: 'oyster-haven-templogger-results',
      Key: dstKey,
      Body: JSON.stringify(result),
      ContentType: "application/json"
    };

    const putResult = await S3.putObject(destparams).promise();

  } catch (error) {
    console.log(error);
    return;
  }
}

async function callServices() {

  // get csv file and create stream
  const stream = S3.getObject(params).createReadStream();
  console.log("Processing. ")
  await pendantLoggerCSV.processCSV(stream, writeClient).then((value) => {
    console.log(value)
    putResult(value)
  })

}

callServices();