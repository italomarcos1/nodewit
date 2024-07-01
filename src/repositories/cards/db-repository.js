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
        cards.board_id,
        users.id AS owner_id,  
        users.name AS owner_name,
        users.profile_picture AS owner_profile_picture
      FROM cards
      JOIN
        users ON cards.owner_id = users.id;
    `);

    return data.rows;
  }

  async findManyByBoardId(board_id) {
    const data = await this.dbClient.query(`
      SELECT
        cards.id,
        cards.title,
        cards.description,
        cards.board_id,
        users.id AS owner_id,  
        users.name AS owner_name,
        users.profile_picture AS owner_profile_picture
      FROM cards
      JOIN
        users ON cards.owner_id = users.id
      WHERE
        board_id = '${board_id}';
    `);

    return data.rows;
  }

  async findManyByUserId(user_id) {
    const data = await this.dbClient.query(`
      SELECT
        cards.id,
        cards.title,
        cards.description,
        cards.board_id,
        users.id AS owner_id,  
        users.name AS owner_name,
        users.profile_picture AS owner_profile_picture
      FROM cards
      JOIN
        users ON cards.owner_id = users.id
      WHERE
        owner_id = '${user_id}';
    `);

    return data.rows;
  }

  async createCard({ title, description, owner_id, board_id }) {
    const { rows } = await this.dbClient.query(`
      INSERT INTO cards (title, description, owner_id, board_id)
      VALUES ('${title}', '${description ?? ""}', '${owner_id}', '${board_id}')
      RETURNING id, title, description, owner_id, board_id;
    `)

    const card = {
      ...rows[0],
      members: [],
      owner_name: "",
      owner_profile_picture: "",
    };

    return card;
  }
}
