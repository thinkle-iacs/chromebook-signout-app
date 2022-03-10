import type { APIGatewayEvent, Context } from 'aws-lambda'
import { signoutHistoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { assetRecordId, staffRecordId, studentRecordId, Notes, Status, FormUser, DailyLoan } = event.queryStringParameters
  console.log('Got params',JSON.stringify(
    { assetRecordId, staffRecordId, studentRecordId, Notes, Status, DailyLoan }
  ))
  let fields = {
    Asset : [assetRecordId],
    Status,
    Notes,
    FormUser,
    DailyLoan : DailyLoan=='true' && true || false,
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