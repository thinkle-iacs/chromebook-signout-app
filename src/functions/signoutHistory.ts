import type { APIGatewayEvent, Context } from 'aws-lambda'
import { signoutHistoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { assetTag, lasid, staffId, isLatest } = event.queryStringParameters
  let filterByFormula = ''
  if (assetTag) {
    filterByFormula=`{Asset Tag (from Asset)}="${assetTag}"`
  } else if (lasid) {
    filterByFormula=`{Student}="${lasid}"`
  } else if (staffId) {
    filterByFormula=`{Staff}="${staffId}"`
  } else if (isLatest) {
    filterByFormula=`{Is Latest Change}=1`
  }
  let fields = [
        'Status',
        'Asset Tag (from Asset)',
        'Student',
        'Email (from Students)',
        'Notes',
        'Time',
        'Is Latest Change',
        'LatestUpdate',
        'Num',
        'Email (from Staff)',
        'DailyLoan'
      ]  
  console.log('Query is',filterByFormula)
  console.log('Fields are',fields)
  let query = signoutHistoryBase.select(
    {
      /*maxRecords : 500,*/
      filterByFormula,
      fields    
    }
  );
  let result = await query.all();  
  return {
    statusCode: 200,
    body: JSON.stringify(result);
  };
}