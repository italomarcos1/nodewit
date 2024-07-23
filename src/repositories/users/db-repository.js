import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { concatUpdateQueryValues } from "../../utils/concatUpdateQueryValues.js";
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "../../lib/pg.js";
import bcryptjs from "bcryptjs";

const pgvectorStore = await PGVectorStore.initialize(new OpenAIEmbeddings(), config);

export class UsersDbRepository {
  dbClient;

  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  async findMany() {
    const users = await this.dbClient.query(`
      SELECT id, name, job, is_admin, email, profile_picture, created_at FROM users;
    `)

    return users.rows;
  }

  async embedAllUsers() {
    const { rows } = await this.dbClient.query(`
      SELECT id, name, job, email, profile_picture, created_at FROM users;
    `)

    await pgvectorStore.addDocuments(rows.map(r => ({
      id: r.id,
      pageContent: `${r.name} - ${r.email} - ${r.job}`,
      metadata: {
        id: r.id,
        name: r.name,
        content: `${r.job} · ${r.email}`,
        created_at: r.created_at,
        type: "user",
        url: r.profile_picture ?? ""
      },
    })));

    return users.rows;
  }

  async findById(user_id) {
    const { rows, rowCount } = await this.dbClient.query(`
      SELECT id, name, job, is_admin, email, profile_picture, created_at FROM users WHERE id = '${user_id}';
    `)

    if (!rowCount)
      return null;

    const user = rows[0];

    return user;
  }

  async findByEmail(email) {
    const { rows, rowCount } = await this.dbClient.query(`
      SELECT * FROM users WHERE email = '${email}';
    `)

    if (!rowCount)
      return null;

    const user = rows[0];

    return user;
  }

  async createUser({ name, email, password_hash, job }) {
    const { rows } = await this.dbClient.query(`
      INSERT INTO users (name, email, password_hash, job)
      VALUES ($1, $2, $3, $4)
      RETURNING id, created_at;
    `, [name, email, password_hash, job]);

    const userData = rows[0];

    await pgvectorStore.addDocuments([
      {
        id: userData.id,
        pageContent: `${name} - ${email} - ${job}`,
        metadata: {
          id: userData.id,
          name: name,
          content: `${job} · ${email}`,
          created_at: userData.created_at,
          type: "user",
          url: ""
        },
      }
    ]);

    return userData;
  }

  async updateUser({ data, user_id }) {
    const updateUserData = {...data};

    if (!!updateUserData.password) {
      const password_hash = await bcryptjs.hash(updateUserData.password, 6)
      updateUserData["password_hash"] = password_hash;

      delete updateUserData.password;
    }

    const { query } = concatUpdateQueryValues(updateUserData)
    
    const [_, updateResponse] = await Promise.all([
      this.dbClient.query(`
        DELETE FROM embeddings
        WHERE metadata::jsonb ->> 'id' =  $1;
      `, [user_id]),
      this.dbClient.query(`
        UPDATE users
        SET $1
        WHERE
          id = $2
        RETURNING
          id, name, email, job, profile_picture, created_at;
      `, [query, user_id])
    ])

    const { rows } = updateResponse;

    const userData = rows[0];
    
    await pgvectorStore.addDocuments([
      {
        id: userData.id,
        pageContent: `${userData.name} - ${userData.email} - ${userData.job}`,
        metadata: {
          id: userData.id,
          name: userData.name,
          content: `${userData.job} · ${userData.email}`,
          created_at: userData.created_at,
          type: "user",
          url: userData.profile_picture
        },
      }
    ]);

    return userData;
  }

  async deleteUser(user_id) {
    const [deleteResponse, _] = await Promise.all([
      this.dbClient.query(`
        DELETE FROM users
        WHERE
          id = $1;
      `, [user_id]),
      this.dbClient.query(`
        DELETE FROM embeddings
        WHERE metadata::jsonb ->> 'id' = $1;
      `, [user_id]),
    ]);

    const { rowCount } = deleteResponse;

    return !!rowCount; 
  }
}
