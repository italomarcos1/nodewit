import pg from "pg";
import { env } from "../env/index.js";

let isConnected = false;

const client = new pg.Client({
  host: 'localhost',
  port: 5432,
  user: env.POSTGRES_DB_USER,
  password: env.POSTGRES_DB_PASSWORD,
  database: env.POSTGRES_DB_NAME,
})

export async function dbConnection()  {
  if (!isConnected) {
    console.log("has to connect again")
    await client.connect();
    isConnected = true;
  }

  return client;
};
