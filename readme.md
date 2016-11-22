## calming-metrics-lambda

Simple AWS Lambda function that pulls data from the [New Relic Insights API](https://newrelic.com/insights).

## Environment Variables

* `NEWRELIC_ACCOUNT_ID` - New Relic Account ID (for Insights)
* `INSIGHTS_QUERY_KEY` - New Relic Insights Query API Key

## Updating Lambda function

This assumes the Lambda function specified in the script already exists.

```
./deploy.sh
```

## TODO

* Local development/testing
* AWS SAM Support? API Gateway integration?
