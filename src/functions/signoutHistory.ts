import type { APIGatewayEvent, Context } from 'aws-lambda'
import { signoutHistoryBase } from './Airtable'

export async function handler(
  event : APIGatewayEvent, context : Context 
) {
  const { assetTag, lasid, staffId, isLatest, onlyOut } = event.queryStringParameters
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
  if (onlyOut) {
    let andPart = '{Status}="Out"';
    if (filterByFormula) {
      filterByFormula = `and(${filterByFormula},${andPart})`
    } else {
      filterByFormula = andPart;
    }    
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
        'DailyLoan',
        'LASID',
        'Name',
      ]  
  console.log('Query is',filterByFormula)
  console.log('Fields are',fields)
  let query = signoutHistoryBase.select(
    {
      //maxRecords : 100,
      filterByFormula,
      fields    
    }
  );
  let result = await query.all();
  
  //let result = await query.all();  
  //console.log('Got me a query',query,result.length)
  return {
    statusCode: 200,
    body: JSON.stringify(result.slice(0,2500));
  };
}