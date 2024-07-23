import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { config } from "../../lib/pg.js";
import { concatUpdateQueryValues } from "../../utils/concatUpdateQueryValues.js";

const pgvectorStore = await PGVectorStore.initialize(new OpenAIEmbeddings(), config);

export class CardsDbRepository {
  dbClient;

  constructor(dbClient) {
    this.dbClient = dbClient
  }
  
  async findMany() {
    const data = await this.dbClient.query(`
      SELECT
        cards.id,
        cards.title,
        cards.description,
        cards.deadline,
        cards.top_priority,
        cards.picture,
        cards.board_id,
        json_build_object(
          'id', users.id,
          'name', users.name,
          'job', users.job,
          'profile_picture', users.profile_picture
        ) AS owner
      FROM 
        cards
      JOIN 
        users ON cards.owner_id = users.id;
    `);

    return data.rows;
  }

  async findById(card_id) {
    const { rows, rowCount } = await this.dbClient.query(`
      SELECT * FROM cards WHERE id = $1;
    `, [card_id])

    if (!rowCount)
      return null;

    const card = rows[0];

    return card;
  }

  async getCardInfo(card_id) {
    const { rows } = await this.dbClient.query(`
      WITH card_info AS (
        SELECT
          c.id AS card_id,
          c.title AS title,
          c.description AS description,
          c.picture AS picture,
          c.created_at AS created_at,
          c.members,
          json_build_object(
            'id', u.id,
            'name', u.name,
            'job', u.job,
            'profile_picture', u.profile_picture
          ) AS owner
        FROM
          cards c
        JOIN
          users u ON c.owner_id = u.id
        WHERE
          c.id = $1
        ),
        member_info AS (
          SELECT
            ci.card_id,
            json_agg(json_build_object(
              'id', u.id,
              'name', u.name,
              'profile_picture', u.profile_picture
            )) AS members
          FROM
            card_info ci,
            unnest(ci.members) AS member_id
          JOIN
            users u ON member_id = u.id
          GROUP BY
            ci.card_id
        ),
        file_info AS (
          SELECT
            f.card_id,
            json_agg(json_build_object(
              'id', f.id,
              'name', f.name,
              'url', f.url,
              'extension', f.extension,
              'size', f.size,
              'created_at', f.created_at
            )) AS files
          FROM
            files f
          WHERE
            f.card_id = $1
          GROUP BY
            f.card_id
        ),
        comment_info AS (
          SELECT
            cm.card_id,
            json_agg(json_build_object(
              'id', cm.id,
              'content', cm.content,
              'created_at', cm.created_at,
              'user', json_build_object(
                'id', u.id,
                'name', u.name,
                'profile_picture', u.profile_picture
              )
            )) AS comments
          FROM
            comments cm
          JOIN
            users u ON cm.user_id = u.id
          WHERE
            cm.card_id = $1
          GROUP BY
            cm.card_id
        )
        SELECT
          ci.title,
          ci.description,
          ci.created_at,
          ci.owner,
          mi.members,
          fi.files,
          co.comments
        FROM
          card_info ci
        LEFT JOIN
          member_info mi ON ci.card_id = mi.card_id
        LEFT JOIN
          file_info fi ON ci.card_id = fi.card_id
        LEFT JOIN
          comment_info co ON ci.card_id = co.card_id;
    `, [card_id])
    
    const data = rows[0];

    const card = {
      ...data,
      comments: data.comments ?? [], 
      members: data.members ?? [], 
      files: data.files ?? [], 
    }

    return card;
  }

  async findManyByBoardId(board_id) {
    const data = await this.dbClient.query(`
      SELECT
        cards.id,
        cards.title,
        cards.description,
        cards.deadline,
        cards.top_priority,
        cards.picture,
        cards.board_id,
        json_build_object(
          'id', users.id,
          'name', users.name,
          'job', users.job,
          'profile_picture', users.profile_picture
        ) AS owner
      FROM 
        cards
      JOIN 
        users ON cards.owner_id = users.id
      WHERE
        cards.board_id = $1;
    `, [board_id]);

    return data.rows;
  }

  async findManyByUserId(user_id) {
    const data = await this.dbClient.query(`
      SELECT
        cards.id,
        cards.title,
        cards.description,
        cards.deadline,
        cards.top_priority,
        cards.picture,
        cards.board_id,
        json_build_object(
          'id', users.id,
          'name', users.name,
          'profile_picture', users.profile_picture
        ) AS owner
      FROM 
        cards
      JOIN 
        users ON cards.owner_id = users.id
      WHERE
        users.id = $1;
    `, [user_id]);
        
    return data.rows;
  }

  async embedAllCards() {
    const { rows } = await this.dbClient.query(`
      SELECT id, title, description, created_at FROM cards;
    `)

    await pgvectorStore.addDocuments(rows.map(r => ({
      id: r.id,
      pageContent: `${r.title} - ${r.description}`,
      metadata: {
        id: r.id,
        name: r.title,
        content: r.description,
        created_at: r.created_at,
        type: "card",
        url: `/cards/${r.id}`
      },
    })));

    return users.rows;
  }

  async createCard({ title, description, deadline, top_priority, owner_id, board_id, members }) {
    let membersData = null;

    if (!!members.length) {
      const membersIds = members.map(m => `'${m.id}'`).join(', ');
      membersData = `ARRAY[${membersIds}]::UUID[]`
    }

    const { rows } = await this.dbClient.query(`
      INSERT INTO cards (title, description, deadline, top_priority, owner_id, board_id, members)
      VALUES ($1, $2, $3, $4, $5, $6, ${membersData})
      RETURNING id, title, description, deadline, top_priority, picture, owner_id, board_id, created_at;
    `, [title, description ?? "", deadline ?? null, !!top_priority, owner_id, board_id]);

    const cardData = rows[0];
    
    await pgvectorStore.addDocuments([
      {
        id: cardData.id,
        pageContent: `${cardData.title} - ${cardData.description}`,
        metadata: {
          id: cardData.id,
          name: cardData.title,
          content: cardData.description,
          created_at: cardData.created_at,
          type: "card",
          url: `/cards/${cardData.id}`
        },
      }
    ]);

    const { rows: userDataRows } = await this.dbClient.query(`
      SELECT id, name, profile_picture
      FROM users
      WHERE id = $1;
    `, [owner_id])

    const owner = userDataRows[0];

    const card = {
      ...cardData,
      members,
      owner
    };

    return card;
  }

  async createMultipleCards({ cards }) {
    const formattedCards = cards.map(c => `('${c.title}', '${c.description}', '${c.owner_id}', '${c.board_id}')`).join(",");

    const { rows, rowCount } = await this.dbClient.query(`
      INSERT INTO cards (title, description user_id, board_id)
      VALUES ${formattedCards};
    `);

    const cardData = rows;

    return true;
  }

  async updateCard({ data, card_id }) {
    const { title, description, members } = data;

    const membersIds = members.map(id => `'${id}'`).join(', ');
    const membersData = `ARRAY[${membersIds}]::UUID[]`

    const [_, updateResponse] = await Promise.all([
      this.dbClient.query(`
        DELETE FROM embeddings
        WHERE metadata::jsonb ->> 'id' = $1;
      `, [card_id]),
      this.dbClient.query(`
        UPDATE cards
        SET
          title = $1,
          description = $2,
          members = ${membersData}
        WHERE id = $3
        RETURNING id, created_at;
      `, [title, description, card_id])
    ]);

    const { rows } = updateResponse;

    const cardData = rows[0];
    
    await pgvectorStore.addDocuments([
      {
        id: cardData.id,
        pageContent: `${cardData.title} - ${cardData.description}`,
        metadata: {
          id: cardData.id,
          name: title,
          content: description,
          created_at: cardData.created_at,
          type: "card",
          url: `/cards/${cardData.id}`
        },
      }
    ]);

    return cardData;
  }

  async searchCard(query) {  
    const results = await pgvectorStore.similaritySearch(query, 15);
  
    let formattedResults = results.map(r => ({
      ...r.metadata,
    }))
    
    if (formattedResults.some(s => s.type === "card")) {
      const cards = formattedResults.filter(s => s.type === "card")
      const cardIds = cards.map(c => `'${c.id}'`).join(", ")
      
      const { rows } = await this.dbClient.query(`
        SELECT 
          c.id, 
          c.board_id,
          json_build_object(
            'id', o.id,
            'name', o.name,
            'job', o.job,
            'profile_picture', o.profile_picture
          ) AS owner,
          json_agg(
            json_build_object(
              'id', u.id,
              'name', u.name,
              'profile_picture', u.profile_picture
            )
          ) AS members
        FROM 
          cards c
        JOIN 
          users u 
        ON 
          u.id = ANY(c.members)
        JOIN 
          users o
        ON 
          o.id = c.owner_id
        WHERE 
          c.id IN (${cardIds})
        GROUP BY 
          c.id, o.id, o.name, o.profile_picture;
      `)

      const map = new Map(rows.map(c => [c.id, {members: c.members, owner: c.owner}]))
      formattedResults = formattedResults.map(n => n.type === "card" ? ({
        ...n,
        owner: !!map.has(n.id) ? map.get(n.id).owner : null,
        members: !!map.has(n.id) ? map.get(n.id).members : []
      }): n)
    }

    // await pgvectorStore.end();

    return formattedResults
  }

  async deleteCard(card_id) {
    const [deleteResponse, _] = await Promise.all([
      this.dbClient.query(`
        DELETE FROM cards
        WHERE
          id = $1;
      `, [card_id]),
      this.dbClient.query(`
        DELETE FROM embeddings
        WHERE metadata::jsonb ->> 'id' = $1;
      `, [card_id]),
    ]);

    const { rowCount } = deleteResponse;

    return !!rowCount; 
  }
}
