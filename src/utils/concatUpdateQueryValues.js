export function concatUpdateQueryValues(obj) {
  let fieldValues = [];
  let queryValues = [];
  
  for (const key in obj) {
    fieldValues.push(key)
    queryValues.push(`${key} = '${obj[key]}'`)
  }

  const fields = fieldValues.join(", ");
  const query = queryValues.join(", ");

  return { query, fields };
}
