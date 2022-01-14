# AWS Lambda Templogger Ingestion

The following is based on this tutorial:
https://docs.aws.amazon.com/lambda/latest/dg/with-s3-tutorial.html

The purpose of this project is to ingest a HOBO data logger file into an AWS Timestream timeseries database using an S3 and an AWS Lambda function.   In my case, I am using a Pendant Light and Temperature sensor deployed underwater in the Chesapeake Bay.  I use the HOBO Mobile Application on the iPhone to connect to the sensor every month, download the data, and upload the CSV file to the S3 bucket.  This code will take the file and parse each line, loading the sensor data into a time series database.  It reprocesses the data every time which means it will safely overwrite any existing data. 

## setup

I have created a shell script using the AWS CLI that will setup everything you need in AWS.  Please make sure you can log into the AWS Management Console and can navigate to IAM, S3, and Lambda to verify the artifacts being created.  Follow these steps before running the scripts:

1. Open the "setup.sh" and "deploy.sh".  You will see the "AWS_ACCOUNTID" variable.  Set this to be your AWS Account ID.
2.  Verify that AWS CLI is working properly.  The easiest way is to "list the S3 buckets", using this command:
    - aws s3 ls
    You should see a list of your buckets.
3.  Open up all of the ".json" files in the setup directory and replace the AWS Account ID with your specific account id.  
4.  Run the setup program: "./setup.sh"
5.  Log into the console and verify that the artifacts are created.  You should see:
    Under IAM, policies : "oyster-haven-templogger-policy"
    Under IAM, roles: "oyster-haven-templogger-role"
    Under S3: "oyster-haven-templogger"
    Under S3: "oyster-haven-templogger-results"
    NOTE:  If you want to change the names, you can look at the script to change the "ROOT" variable.  Be sure to also change the names in the ".json" files as well.
6.  You will need to create an AWS Timestream database and table.  
    Database:  oyster-haven
    Table: temp-logger
    The code references these in a file called "constants.js" if you want to change these as well.

## deploy

1. Move to the directory "lambda-templogger" and type "npm install".  This will install "aws sdk" and you will get a new directory called "node-modules"
2. Move back to the setup directory and run the scipt "./deploy.sh".  This will package the code into a zip and use that to create the lambda function
3.  After the script finishes, navigate to the Lambda service on the Management Console and inspect your lambda function.  Verify that the S3 trigger is attached to the function as it was created during the deploy script.

## test

1. Drop the "csv" file ifrom the "test" directory into the S3 bucket called "oyster-haven-templogger".  This is the source S3 results.
2. If all goes well, you should see a ".json" file written to the "oyster-haven-templogger-results" S3 bucket.  You should also be able to log into Amazon Timestream and verify that you have received data into the timestream database.
3.  If something is not working, navigate to the Lambda function "oyster-haven-templogger".  On the Monitoring tab, click on Cloudwatch.  You should see an execution trace which may give you some hints on what went wrong.

Enjoy!

Matt Rothera

#