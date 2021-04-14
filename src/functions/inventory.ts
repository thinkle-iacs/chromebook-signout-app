import type { APIGatewayEvent, Context } from 'aws-lambda'
import { inventoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { tag } = event.queryStringParameters
  let query = inventoryBase.select({
    maxRecords:100,
    filterByFormula : `Search("${tag}",{Asset Tag})`,              
    fields : [
      'Asset Tag',
      'Category',
      'Device Type',
      'Make',
      'Model',
      'Serial',
      'MAC-Wireless',
      'Location',
      'Staff User',
      'Purpose',
      'Year of Purchase',
      'Student (Current)',
      'Email (from Student (Current))',
      'SignoutRecordNumber'
    ]
  })
  let result = await query.firstPage()
  return {
    statusCode: 200,
    body: JSON.stringify(result);
  };
}