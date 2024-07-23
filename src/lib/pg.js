import pg from "pg";
import { env } from "../env/index.js";

let client;
let isConnected = false;

export const config = {
  postgresConnectionOptions: {
    type: "postgres",
    host: "localhost",
    port: 5432,
    user: env.POSTGRES_DB_USER,
    password: env.POSTGRES_DB_PASSWORD,
    database: env.POSTGRES_DB_NAME,
  },
  tableName: "embeddings",
  columns: {
    idColumnName: "id",
    vectorColumnName: "vector",
    contentColumnName: "content",
    metadataColumnName: "metadata",
  },
  distanceStrategy: "cosine"
};

async function createClient() {
  return new pg.Client({
    host: 'localhost',
    port: 5432,
    user: env.POSTGRES_DB_USER,
    password: env.POSTGRES_DB_PASSWORD,
    database: env.POSTGRES_DB_NAME,
  });
}

export async function dbConnection() {
  if (!isConnected) {
    client = await createClient();
    await client.connect();
    
    isConnected = true;
  }

  return client;
}
