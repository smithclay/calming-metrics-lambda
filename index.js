var https = require('https');

// This script requires two environment variables:
// INSIGHTS_QUERY_KEY - query key for insights
// NEWRELIC_ACCOUNT_ID - account id associated with insights account

var requestOptions = {
  host: 'insights-api.newrelic.com',
  headers: {
    'X-Query-Key': process.env.INSIGHTS_QUERY_KEY
  },
  method: 'GET',
  port: 443,
  path: `/v1/accounts/${process.env.NEWRELIC_ACCOUNT_ID}/query?nrql=SELECT%20average%28cpuSystemPercent%29%2C%20average%28loadAverageOneMinute%29%2C%20average%28memoryFreeBytes%29%20from%20SystemSample%20facet%20hostname%20SINCE%205%20minutes%20ago`
};

exports.handler = (event, context, callback) => {
    https.get(requestOptions, function(resp){
      resp.setEncoding('utf8');
      var body = '';
      resp.on('data', function(chunk){
        console.log("Got response: " + chunk);
        body += chunk;
      });
      resp.on('end', function() {
        callback(null, {statusCode: 200, headers: {'Content-type': 'application/json', 'Access-Control-Allow-Origin': '*'}, body: body});
      });
    }).on("error", function(e){
      console.log("Got error: " + e.message);
      callback(null, {statusCode: 500, headers: {'Access-Control-Allow-Origin': '*'}, body: e.message});
    }).end();
};
