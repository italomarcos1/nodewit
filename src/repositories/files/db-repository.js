import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { OpenAIEmbeddings } from "@langchain/openai";
import { config } from "../../lib/pg.js";

const pgvectorStore = await PGVectorStore.initialize(new OpenAIEmbeddings(), config);

export class FilesDbRepository {
  dbClient;

  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  async findById(file_id) {
    const { rows, rowCount } = await this.dbClient.query(`
      SELECT * FROM files WHERE id = $1;
    `, [file_id])

    if (!rowCount)
      return null;

    const board = rows[0];

    return board;
  }

  async findManyByCardId(card_id) {
    const data = await this.dbClient.query(`
      SELECT * FROM files WHERE card_id = $1;
    `, [card_id]);

    return data.rows;
  }

  async createFile({ name, url, extension, size, owner_id, card_id }) {
    const { rows } = await this.dbClient.query(`
      INSERT INTO files (name, url, extension, size, owner_id, card_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, created_at;
    `, [name, url, extension, size, owner_id, card_id]);

    const fileData = rows[0];

    await pgvectorStore.addDocuments([
      {
        id: fileData.id,
        pageContent: `${name} - ${name}.${extension}`,
        metadata: {
          id: fileData.id,
          name: name,
          content: `.${extension} · ${size}`,
          created_at: fileData.created_at,
          type: "file",
          url
        },
      }
    ]);

    const file = {
      id: fileData.id,
      name,
      url,
      extension,
      size,
      card_id,
      owner_id,
    };
    
    return file;
  }

  async deleteFile(file_id) {
    const [deleteResponse, _] = await Promise.all([
      this.dbClient.query(`
        DELETE FROM files
        WHERE id = $1;
      `, [file_id]),
      this.dbClient.query(`
        DELETE FROM embeddings
        WHERE metadata::jsonb ->> 'id' = $1;
      `, [file_id]),
    ]);

    const { rowCount } = deleteResponse;

    return !!rowCount; 
  }
}
