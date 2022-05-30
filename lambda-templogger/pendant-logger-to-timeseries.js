
const fs = require('fs');
const readline = require('readline');

const constants = require('./constants');

async function processCSV(fileStream, writeClient) {
    try {
        result = await ingestCsvRecords(fileStream, writeClient)
        return result
    } catch (e) {
        console.log('e', e);
        return { exception: e }
    }
}

async function ingestCsvRecords(fileStream, writeClient) {
    const currentTime = Date.now().toString(); // Unix time in milliseconds

    var records = [];
    var counter = 0;
    var processed = 0;
    var serialnumber = ''

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });

    const promises = [];

    var start_time = Date.now()

    // Simple analytics to include in the output report
    // monthly temperature average
    // average lumens at noon for the month
    const target_month = new Date().getMonth()
    const target_hour = 12
    var sum_temp = 0;
    var count_temp = 0;
    var sum_lumens = 0;
    var count_lumens = 0;
    serialnumber = '21211722'

    for await (const dataRow of rl) {
        /*
        if (counter === 0) {
            // special header row
            console.log(dataRow)
            const splits = dataRow.toString().split(':')
            const split_parse = splits[1]
            console.log(split_parse)
            const split2 = split_parse.split(' ')
            serialnumber = split2[0]
            console.log(serialnumber)
        }
        */
        if (counter > 0) {
            var row = dataRow.toString().split(',');

            // The logger has entries for when interacting with it during manual data extraction.  
            // Eliminate those records

            const interaction = (row[8].toString().trim().length > 0 || row[9].toString().trim().length > 0 || row[10].toString().trim().length > 0) ? true : false;

            if (!interaction) {
                const dimensions = [
                    { 'Name': 'sensorid', 'Value': serialnumber }
                ];
                const recordTime = currentTime - counter * 50;
                let version = Date.now();
                const timestamp_parsed = Date.parse(row[1])
                const timestamp = new Date(timestamp_parsed)
                
                var value = 0.0
                value = (row[2].toString().trim().length > 0) ? parseFloat(row[2].toString()) : 0.0;
                if (timestamp.getMonth() === target_month) {
                    sum_temp = sum_temp + value;
                    count_temp++;
                }
                const record1 = {
                    'Dimensions': dimensions,
                    'MeasureName': 'tempf',
                    'MeasureValue': value.toString(),
                    'MeasureValueType': 'DOUBLE',
                    'Time': timestamp.getTime().toString(),
                    'Version': version
                };
                console.log(record1)

                records.push(record1);

                value = (row[5].toString().trim().length > 0) ? parseFloat(row[5].toString()) : 0.0;
                if ((timestamp.getMonth() === target_month) && (timestamp.getHours() === target_hour)) {
                    sum_lumens = sum_lumens + value
                    count_lumens++;
                }
                const record2 = {
                    'Dimensions': dimensions,
                    'MeasureName': 'lumensft2',
                    'MeasureValue': value.toString(),
                    'MeasureValueType': 'DOUBLE',
                    'Time': timestamp.getTime().toString(),
                    'Version': version
                };

                console.log(record2)
                records.push(record2);

                // 
                processed++;


            }

        }
        counter++;

        if (records.length === 100) {
            promises.push(submitBatch(records, counter, writeClient));
            records = [];
        }
    }

    if (records.length !== 0) {
        promises.push(submitBatch(records, counter, writeClient));
    }

    await Promise.all(promises).then(() => {

    });

    var end_time = Date.now()
    var processing_time = (end_time - start_time)

    // Finalize light-weight analytics
    const avg_temp = sum_temp / count_temp;
    const avg_lumens = sum_lumens / count_lumens;

    console.log("Complete.")
    console.log(`Ingested ${counter} records.  Processed ${processed} records.`);
    var results = {
        ingested: counter,
        processed: processed,
        startTime: new Date(start_time).toString(),
        endTime: new Date(end_time).toString(),
        processingTime: processing_time,
        averageTemperatureCurrentMonth: avg_temp,
        averageLumensCurrentMonthNoon: avg_lumens

    }
    return results;

}

function submitBatch(records, counter, writeClient) {
    const params = {
        DatabaseName: constants.DATABASE_NAME,
        TableName: constants.TABLE_NAME,
        Records: records
    };

    var promise = writeClient.writeRecords(params).promise();

    return promise.then(
        (data) => {
            console.log(`Processed ${counter} records.`);
        },
        (err) => {
            console.log("Error writing records:", err);
        }
    );
}

module.exports = { processCSV };
