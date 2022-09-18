#!/bin/sh

# Set these variables for your installation
ROOT=oyster-haven-templogger
AWS_ACCOUNTID=922129242138
# For AWS Time Series
DATABASE_NAME=oyster-haven
TABLE_NAME=temp-logger

# Remove any previous function.zip
rm -rf function.zip

cd ../lambda-templogger
zip -r function.zip .
cd ../setup
mv ../lambda-templogger/function.zip .

aws lambda create-function --function-name $ROOT \
--zip-file fileb://function.zip --handler index.handler --runtime nodejs16.x \
--timeout 30 --memory-size 1024 \
--role arn:aws:iam::$AWS_ACCOUNTID:role/$ROOT-role

echo "Waiting for it to be created...."
sleep 60
echo "Finishing Process!"


aws lambda add-permission --function-name $ROOT --principal s3.amazonaws.com \
--statement-id s3invoke --action "lambda:InvokeFunction" \
--source-arn arn:aws:s3:::$ROOT \
--source-account $AWS_ACCOUNTID

aws lambda get-policy --function-name $ROOT

# Setup the trigger
aws s3api put-bucket-notification-configuration --bucket $ROOT --notification-configuration file://s3-trigger.json
