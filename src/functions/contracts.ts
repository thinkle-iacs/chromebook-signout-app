import type { APIGatewayEvent, Context } from "aws-lambda";
import { contractsBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  console.log("Contract handler!");
  if (event.httpMethod == "GET") {
    const { all, mapped, unmapped } = event.queryStringParameters;
    let filterByFormula = "";
    if (all) {
      filterByFormula = "";
    } else if (mapped) {
      filterByFormula = `if({Student},1,0)`;
    } else if (unmapped) {
      filterByFormula = `if({Student},0,1)`;
    }
    let query = contractsBase.select({
      // maxRecords: 100,
      filterByFormula,
      fields: [
        "ID",
        "Date",
        "Grade Level",
        "Student First",
        "Student Last",
        "Parent First",
        "Parent Last",
        "WiFi",
        "Signature",
        "Contract Signed",
        "Student",
        "LASID (from Student)",
        "Name (from Student)",
        "Advisor (from Student)",
        "Email (from Student)",
      ],
    });
    let result = await query.all();
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } else if (event.httpMethod == "PATCH") {
    console.log("Got me a patch!", event, event.body);
    const records = JSON.parse(event.body);
    let results = await contractsBase.update(records);
    return {
      statusCode: 200,
      body: JSON.stringify(results),
    };
  }
}
