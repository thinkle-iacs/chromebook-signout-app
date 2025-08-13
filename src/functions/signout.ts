import type { APIGatewayEvent, Context } from "aws-lambda";
import { signoutHistoryBase } from "./Airtable";

export async function handler(event: APIGatewayEvent, context: Context) {
  const {
    assetRecordId,
    staffRecordId,
    studentRecordId,
    Notes,
    Status,
    FormUser,
    DailyLoan,
  } = event.queryStringParameters;
  console.log(
    "Got params",
    JSON.stringify({
      assetRecordId,
      staffRecordId,
      studentRecordId,
      Notes,
      Status,
      DailyLoan,
    })
  );
  let fields: {
    [key: string]: any;
    Asset: string[];
    Status: string;
    Notes: string;
    FormUser: string;
    DailyLoan: boolean;
  } = {
    Asset: [assetRecordId],
    Status,
    Notes,
    FormUser,
    DailyLoan: (DailyLoan == "true" && true) || false,
  };
  if (studentRecordId) {
    (fields as any).Student = [studentRecordId];
  }
  if (staffRecordId) {
    (fields as any).Staff = [staffRecordId];
  }

  let result = await signoutHistoryBase.create([
    {
      fields,
    },
  ]);
  return {
    statusCode: 200,
    body: JSON.stringify(result),
  };
}
