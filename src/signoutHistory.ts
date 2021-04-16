import type {Asset} from './inventory';
import type {Student} from './students';

export type SignoutHistoryEntry {
  'Status':string;
  'Asset Tag (from Asset)':string[];,
  'Student':string[],
  'Email (from Students)':string[],
  'Email (from Staff)':string[],
  'Notes':string,
  'Time':string,
  'Is Latest Change':number,
  'LatestUpdate':number,
  'Num':number
}

export async function lookupSignoutHistory (
    {asset, student} : {asset? : Asset;
    student? : Student }
) : SignoutHistoryEntry[] {
  let params : {
    mode : string;
    assetTag? : string;
    lasid? : number;
  } = {mode:'signoutHistory'}
  if (asset) {params.assetTag = asset['Asset Tag']}
  if (student) {params.lasid = student.LASID}
  let paramString = new URLSearchParams(params);
  let response = await fetch(
    "/.netlify/functions/index?"+paramString
  );
  let json = await response.json();
  return json.map(
    (item)=>item.fields
  )
}