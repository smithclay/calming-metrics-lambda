#!/bin/sh

# Creates deployment archive for a node.js lambda function and uploads using the AWS CLI

mkdir -p build
zip build/getInsights.zip index.js

aws lambda update-function-code --function-name getInsights --zip-file fileb://build/getInsights.zip

