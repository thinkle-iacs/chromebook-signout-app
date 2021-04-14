import {studentsBase} from './Airtable';
import type { APIGatewayEvent, Context } from 'aws-lambda'
import {handler as studentHandler} from './students';
import {handler as inventoryHandler} from './inventory';
export async function handler(
  event : APIGatewayEvent,
  context : Context
): Promise<{ statusCode: number; body: string }> {
  if (event.queryStringParameters.mode=='student') {
    return studentHandler(event,context);
  } else if (event.queryStringParameters.mode=='asset') {
    return inventoryHandler(event,context);
  }
  let query = studentsBase.select({
    maxRecords:100,
    fields : ['LASID','Name','Email','YOG','Advisor']
  })
  let result = await query.firstPage()
  return {
    statusCode: 200,
    body: JSON.stringify(result);
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
