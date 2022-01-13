// dependencies
const AWS = require('aws-sdk');
const util = require('util');
const pendantLoggerCSV = require("./pendant-logger-to-timeseries");

// Modeled after:
// https://docs.aws.amazon.com/lambda/latest/dg/with-s3-tutorial.html


// get reference to S3 client
const s3 = new AWS.S3();

exports.handler = async (event, context, callback) => {

    // Setup timestream
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

    // Read options from the event parameter.
    console.log("Reading options from event:\n", util.inspect(event, { depth: 5 }));
    const srcBucket = event.Records[0].s3.bucket.name;
    // Object key may have spaces or unicode non-ASCII characters.
    const srcKey = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, " "));
    const dstBucket = srcBucket + "-results";
    const dstKey = "results-" + srcKey + ".json";

    // Infer the image type from the file suffix.
    const typeMatch = srcKey.match(/\.([^.]*)$/);
    if (!typeMatch) {
        console.log("Could not determine the image type.");
        return;
    }

    // Check that the image type is supported
    const csvType = typeMatch[1].toLowerCase();
    if (csvType != "csv") {
        console.log(`Unsupported csv type: ${imageType}`);
        return;
    }

    // Download the CSV from the S3 source bucket.

    try {
        const params = {
            Bucket: srcBucket,
            Key: srcKey
        };
        const stream = s3.getObject(params).createReadStream();

        // Parse the stream
        console.log("Processing. ")
        const result = await pendantLoggerCSV.processCSV(stream, writeClient);
        const destparams = {
            Bucket: dstBucket,
            Key: dstKey,
            Body: JSON.stringify(result),
            ContentType: "application/json"
        };

        const putResult = await s3.putObject(destparams).promise();

        console.log('Successfully processed ' + srcBucket + '/' + srcKey +
            ' and uploaded results to ' + dstBucket + '/' + dstKey);

    } catch (error) {
        console.log(error);
        return;
    }


    // Upload the results to the destination bucket
    try {


    } catch (error) {
        console.log(error);
        return;
    }


};
