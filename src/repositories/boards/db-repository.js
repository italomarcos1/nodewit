import { concatUpdateQueryValues } from "../../utils/concatUpdateQueryValues.js";

export class BoardsDbRepository {
  dbClient;

  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  async findMany() {
    const data = await this.dbClient.query(`
      SELECT 
        boards.id, 
        boards.title, 
        boards.created_at, 
        json_build_object(
          'id', board_owner.id,
          'name', board_owner.name,
          'profile_picture', board_owner.profile_picture
        ) AS owner,
        COALESCE(cards_data.cards, '[]') AS cards
      FROM 
        boards
      JOIN 
        users AS board_owner ON boards.owner_id = board_owner.id
      LEFT JOIN LATERAL (
        SELECT 
          json_agg(
            json_build_object(
              'id', cards.id,
              'title', cards.title,
              'description', cards.description,
              'deadline', cards.deadline,
              'top_priority', cards.top_priority,
              'picture', cards.picture,
              'created_at', cards.created_at,
              'board_id', cards.board_id,
              'owner', json_build_object(
                'id', card_owner.id,
                'name', card_owner.name,
                'job', card_owner.job,
                'profile_picture', card_owner.profile_picture
              ),
              'members', COALESCE(members_data.members, '[]')
            )
          ) AS cards
        FROM 
          cards
        LEFT JOIN 
          users AS card_owner ON cards.owner_id = card_owner.id
        LEFT JOIN LATERAL (
          SELECT 
            json_agg(
              json_build_object(
                'id', members.id,
                'name', members.name,
                'profile_picture', members.profile_picture
              )
            ) AS members
          FROM 
            unnest(cards.members) AS member_id
          LEFT JOIN 
            users AS members ON members.id = member_id
        ) AS members_data ON true
        WHERE 
          cards.board_id = boards.id
      ) AS cards_data ON true;
    `);

    return data.rows;
  }

  async findById(board_id) {
    const { rows, rowCount } = await this.dbClient.query(`
      SELECT * FROM boards WHERE id = '${board_id}';
    `)

    if (!rowCount)
      return null;

    const board = rows[0];

    return board;
  }

  async findManyByOwnerId() {
    return [];
  }

  async createBoard({ title, owner_id }) {
    const { rows } = await this.dbClient.query(`
      INSERT INTO boards (title, owner_id)
      VALUES ($1, $2)
      RETURNING id, title;
    `, [title, owner_id]);

    const boardData = rows[0];

    const board = {
      id: boardData.id,
      title,
      owner_id,
      cards: [],
    };
    
    return board;
  }

  async updateBoard({ data, board_id }) {
    const { query, fields } = concatUpdateQueryValues(data)
    
    let formattedFields = fields;

    formattedFields =
      !formattedFields.includes('title') ? `${formattedFields}, title` : formattedFields

    const { rows } = await this.dbClient.query(`
      UPDATE boards
      SET ${query}
      WHERE
        id = '${board_id}'
      RETURNING
        id, ${formattedFields};
    `)

    const boardData = rows[0];

    return boardData;
  }

  async deleteBoard(board_id) {
    const { rowCount } = await this.dbClient.query(`
      DELETE FROM boards
      WHERE
        id = '${board_id}';
    `);

    return !!rowCount; 
  }
}
