import type { APIGatewayEvent, Context } from 'aws-lambda'
import { inventoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { tag, lasid } = event.queryStringParameters
  let filterByFormula
  if (tag) {
    filterByFormula = `Search("${tag}",{Asset Tag})`;             
  } else if (lasid) {
    filterByFormula = `{Student (Current)}="${lasid}"`
  }
  let query = inventoryBase.select({
    maxRecords:100,
    filterByFormula,
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
      'Full Name (from User)',
      'SignoutRecordNumber',
      'Charger Type'
    ]
  })
  let result = await query.firstPage()
  return {
    statusCode: 200,
    body: JSON.stringify(result);
  };
}