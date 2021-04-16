import type { APIGatewayEvent, Context } from 'aws-lambda'
import { staffBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { name } = event.queryStringParameters
  let query = staffBase.select({
    maxRecords:100,
    filterByFormula : `Search("${name}",{Full Name})`,    
    fields : [
      'Email',
      'First',
      'Last',
      'Role',
      'Department',
      'psnOID',
      'School',
      'Full Name'
    ]
  })
  let result = await query.firstPage()
  return {
    statusCode: 200,
    body: JSON.stringify(result);
  };
}