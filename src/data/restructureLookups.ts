export function restructureLookupFields(record) {
  const linkedFields = {};
  const fields = record.fields || {};

  Object.keys(fields).forEach((key) => {
    const match = key.match(/^(.+?) \(from (.+?)\)$/);
    if (match) {
      const fieldName = match[1].trim();
      const parentTable = match[2].trim();
      if (!linkedFields[parentTable]) linkedFields[parentTable] = {};
      let value = fields[key];
      if (Array.isArray(value) && value.length === 1) {
        value = value[0]; // Unwrap single-item arrays
      }
      linkedFields[parentTable][fieldName] = value;
    }
  });

  record.linkedFields = linkedFields;
  return record;
}
