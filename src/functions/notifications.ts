import type { APIGatewayEvent, Context } from "aws-lambda";
import { notificationsBase } from "./Airtable";

/*
  A POST event is required to create new records.
  A PATCH event is used to update...
*/
export async function handler(event: APIGatewayEvent, context: Context) {
  console.log("We are arriving via", event.httpMethod);
  if (event.httpMethod == "POST") {
    console.log("Create!");
    const records = JSON.parse(event.body);
    event;
    //console.log("Got params", records);

    let result = await notificationsBase.create(
      records.map((r) => ({
        fields: r,
      }))
    );
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod == "PATCH") {
    console.log("Update!");
    const records = JSON.parse(event.body);
    let results = await notificationsBase.update(records);
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  } else if (event.httpMethod == "GET") {
    console.log("Get!");
    let result = await notificationsBase.select().all();
    console.log("Got", result);
    console.log("Result=", result);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  }
}
