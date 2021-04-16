import type { APIGatewayEvent, Context } from 'aws-lambda'
import { signoutHistoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { assetRecordId, staffRecordId, studentRecordId, Notes, Status } = event.queryStringParameters
  console.log('Got params',JSON.stringify(
    { assetRecordId, staffRecordId, studentRecordId, Notes, Status }
  ))
  let fields = {
    Asset : [assetRecordId],
    Status,
    Notes
  }
  if (studentRecordId) {
    fields.Student = [studentRecordId]
  }
  if (staffRecordId) {
    fields.Staff = [staffRecordId]
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