import type { APIGatewayEvent, Context } from 'aws-lambda'
import { signoutHistoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { assetRecordId, studentRecordId, Notes, Status } = event.queryStringParameters
  console.log('Got params',JSON.stringify(
    { assetRecordId, studentRecordId, Notes, Status }
  ))
  let fields = {
    Asset : [assetRecordId],
    Status,
    Notes
  }
  if (studentRecordId) {
    fields.Student = [studentRecordId]
  }
  let result = await signoutHistoryBase.create([
    {
      fields 
      }    
  ])
  return {
    statusCode: 200,
    body: JSON.stringify(result);
  };
}