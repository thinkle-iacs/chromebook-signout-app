'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

async function handler(event, context) {
    return {
        statusCode: 200,
        body: "Hello world",
    };
}
/*   let params = event.queryStringParameters;
  let jsonBody;
  if (event.body) {
    try {
      jsonBody = JSON.parse(event.body);
    } catch (err) {
      console.log(`ERROR PARSING "${event.body}"`);
      throw err;
    }
  }
  params = {
    ...params,
    ...jsonBody,
  };
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: "Hello world",
      content: "I echo params",
      params,
    }),
  };
}
 */

exports.handler = handler;
//# sourceMappingURL=api.js.map
