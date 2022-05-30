#!/bin/sh

# Set these variables for your installation
ROOT=oyster-haven-templogger
AWS_ACCOUNTID=922129242138

# Remove any previous function.zip
rm -rf function.zip

cd ../lambda-templogger
zip -r function.zip .
cd ../setup
mv ../lambda-templogger/function.zip .

aws lambda update-function-code --function-name $ROOT \
--zip-file fileb://function.zip --region us-east-1

echo "Waiting for it to be created...."
sleep 60
echo "Finishing Process!"


# to do - maybe auto create the API

