import type { APIGatewayEvent, Context } from "aws-lambda";
import { studentsBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const { studentId, note } = event.queryStringParameters;
  let fields = {
    Notes: note,
  };
  console.log("look ma, I got a studentRecordId", studentId);
  console.log("Got fields:", fields);
  //let result = await studentsBase.update([{ id: studentRecordId, fields }]);
  //let result = await studentsBase.update(studentRecordId, { fields });
  try {
    let result = await studentsBase.update([
      {
        id: studentId,
        fields,
      },
    ]);
    return {
      statusCode: 200,
      body: JSON.stringify(result),
    };
  } catch (err) {
    console.error("Error updating student record:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err }),
    };
  }
}
