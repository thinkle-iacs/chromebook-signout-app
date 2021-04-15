import type { APIGatewayEvent, Context } from 'aws-lambda'
import { signoutHistoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { assetRecordId, studentRecordId, Notes, Status } = event.queryStringParameters
  console.log('Got params',JSON.stringify(
    { assetRecordId, studentRecordId, Notes, Status }
  ))
  let result = await signoutHistoryBase.create([
    {
      fields : {
        Asset : [assetRecordId],
        Status,
        Student : [studentRecordId],
        Notes,
      }
    }
  ])
  return {
    statusCode: 200,
    body: JSON.stringify(result);
  };
}