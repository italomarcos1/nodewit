export async function getRequestBody(req) {
  const chunks = [];

  for await (const chunk of req) {
    chunks.push(chunk)
  }

  const body = Buffer.concat(chunks).toString();
  const parsedBody = JSON.parse(body);

  return { body, parsedBody }
}
