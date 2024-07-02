export function concatUpdateQueryValues(obj) {
  let final = [];
  
  for (const key in obj)
    final.push(`${key} = '${obj[key]}'`)

  const query = final.join(", ");
  console.log("query", query)

  return query;
}
