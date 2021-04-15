import type { APIGatewayEvent, Context } from 'aws-lambda'
import { signoutHistoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { assetTag, lasid, staffId } = event.queryStringParameters
  let filterByFormula = ''
  if (assetTag) {
    filterByFormula=`{Asset Tag (from Asset)}="${assetTag}"`
  } else if (lasid) {
    filterByFormula=`{Student}="${lasid}"`
  } else if (staffId) {
    filterByFormula=`{Staff}="${staffId}"`
  }
  let query = signoutHistoryBase.select(
    {
      maxRecords : 100,
      filterByFormula,
      fields : [
        'Status',
        'Asset Tag (from Asset)',
        'Student',
        'Email (from Students)',
        'Notes',
        'Time',
        'Is Latest Change',
        'LatestUpdate',
        'Num'
      ]      
    }
  );
  let result = await query.firstPage();
  return {
    statusCode: 200,
    body: JSON.stringify(result);
  };
}