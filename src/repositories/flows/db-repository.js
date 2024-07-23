import { concatUpdateQueryValues } from "../../utils/concatUpdateQueryValues.js";

export class FlowsDbRepository {
  dbClient;

  constructor(dbClient) {
    this.dbClient = dbClient
  }
  
  async findMany() {
    const data = await this.dbClient.query(`
      SELECT * FROM flows;
    `);

    return data.rows;
  }

  async findById(flow_id) {
    const { rows, rowCount } = await this.dbClient.query(`
      SELECT * FROM flows WHERE id = $1;
    `, [flow_id])

    if (!rowCount)
      return null;

    const flow = rows[0];

    return flow;
  }

  async createFlow({ nodes, edges }) {
    const formattedNodes = JSON.stringify(nodes)
    const formattedEdges = JSON.stringify(edges)

    const { rows } = await this.dbClient.query(`
      INSERT INTO flows (nodes, edges)
      VALUES ($1, $2)
      RETURNING id;
    `, [formattedNodes, formattedEdges]);

    const flow = rows[0];

    return flow;
  }

  async createMultipleCards({ cards }) {
    const formattedCards = cards.map(c => `('${c.title}', '${c.description}', '${c.owner_id}', '${c.board_id}')`).join(",");
    
    const { rows, rowCount } = await this.dbClient.query(`
      INSERT INTO cards (title, description user_id, board_id)
      VALUES ${formattedCards};
    `);

    const cardData = rows;

    // await pgvectorStore.addDocuments([
    //   {
    //     id: cardData.id,
    //     pageContent: `${cardData.title} - ${cardData.description}`,
    //     metadata: {
    //       id: cardData.id,
    //       name: cardData.title,
    //       content: cardData.description,
    //       type: "card",
    //       url: `/cards/${cardData.id}`
    //     },
    //   }
    // ]);

    // const { rows: userDataRows } = await this.dbClient.query(`
    //   SELECT id, name, profile_picture
    //   FROM users
    //   WHERE id = $1;
    // `, [owner_id])

    // console.log("userData", userDataRows)
    // const owner = userDataRows[0];

    // const card = {
    //   ...cardData,
    //   members: [],
    //   owner
    // };

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
        RETURNING id;
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
          title: title,
          description: description,
          type: "card",
          url: `/cards/${cardData.id}`
        },
      }
    ]);

    return cardData;
  }

  async searchCard(query) {  
    const results = await pgvectorStore.similaritySearch(query, 5);
  
    const formattedResults = results.map(r => ({
      ...r.metadata,
    }))
  
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
