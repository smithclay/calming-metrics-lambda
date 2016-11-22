var https = require('https');

// This is an example Lambda function that queries data from New Relic Insights
// ... and then sends performance data back to Insights.

// 1. [ LAMBDA ] ---> Query        ---->  [ INSIGHTS ]
// 2. [ LAMBDA ] <--- Query Result ----   [ INSIGHTS ]
// 3. [ LAMBDA ] ---> Perf Data    --->   [ INSIGHTS COLLECTOR ]
// 4. [ LAMBDA ] ---> Query Result --->   [ API GATEWAY ] --> [ BROWSER ]

// This script requires three environment variables:
// INSIGHTS_QUERY_KEY - query key for insights
// NEWRELIC_ACCOUNT_ID - account id associated with insights account
// INSIGHTS_INSERT_KEY - insert key for insights

// Query insights
var queryInsights = function(cb) {
  var insightsQuery = 'SELECT average(cpuSystemPercent), average(loadAverageOneMinute), average(memoryFreeBytes) from SystemSample facet hostname SINCE 5 minutes ago';

  var requestOptions = {
    host: 'insights-api.newrelic.com',
    headers: {
      'X-Query-Key': process.env.INSIGHTS_QUERY_KEY
    },
    method: 'GET',
    port: 443,
    path: `/v1/accounts/${process.env.NEWRELIC_ACCOUNT_ID}/query?nrql=${encodeURIComponent(insightsQuery)}`
  };

  var startRequest = new Date();
  https.get(requestOptions, function(resp) {
    resp.setEncoding('utf8');
    var body = '';
    resp.on('data', function(chunk) {
      body += chunk;
    });
    resp.on('end', function() {
      var timing = new Date() - startRequest;
      console.log(`Request duration: ${timing}`);
      cb(null, body, timing);
    });
  }).on('error', function(e) {
    console.log(`Got error: ${e.message}`);
    cb(e.message, null);
  }).end();
};

// Send metrics to insights
var sendToInsights = function(duration, insightsCb) {
  var requestOptions = {
    host: 'insights-collector.newrelic.com',
    headers: {
      'Content-Type': 'application/json',
      'X-Insert-Key': process.env.INSIGHTS_INSERT_KEY
    },
    method: 'POST',
    port: 443,
    path: `/v1/accounts/${process.env.NEWRELIC_ACCOUNT_ID}/events`
  };

  var request = https.request(requestOptions, function(resp) {
    resp.setEncoding('utf8');
    var body = '';
    resp.on('data', function(chunk) {
      body += chunk;
    });
    resp.on('end', function() {
      console.log('insights response: ', body);
      insightsCb(null);
    });
  }).on('error', function(error) {
    console.log(`Got error sending data to insights: ${e.message}`);
    insightsCb(e.message);
  });

  var memorySample = process.memoryUsage();
  request.write(JSON.stringify([
    {
      eventType: 'CustomServerlessTiming',
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      segmentName: 'insightsQuery',
      duration: duration
    },
    {
      eventType: 'CustomServerlessMemoryUsage',
      functionName: process.env.AWS_LAMBDA_FUNCTION_NAME,
      rss: memorySample.rss,
      heapTotal: memorySample.heapTotal,
      heapUsed: memorySample.heapUsed
    }
    ]
    ));
  request.end();
};

exports.handler = (event, context, callback) => {
  queryInsights(function(err, data, timing) {
    if (err) {
      console.log(`Got error: ${e}`);
      callback(null, {
        statusCode: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: e
      });
      return;
    }

    sendToInsights(timing, function(err) {
      if (err) {
        console.log(`error sending to insights: ${err}`);
      }

      callback(null, {
        statusCode: 200,
        headers: {
          'Content-type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: data
      });
    });
  });
};