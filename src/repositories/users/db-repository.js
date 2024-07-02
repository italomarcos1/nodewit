import { concatUpdateQueryValues } from "../../utils/concatUpdateQueryValues.js";

export class UsersDbRepository {
  dbClient;

  constructor(dbClient) {
    this.dbClient = dbClient;
  }

  async findMany() {
    const users = await this.dbClient.query(`
      SELECT id, name, job, email, profile_picture, created_at FROM users;
    `)

    return users.rows;
  }

  async findById(user_id) {
    const { rows, rowCount } = await this.dbClient.query(`
      SELECT id, name, job, email, profile_picture, created_at FROM users WHERE id = '${user_id}';
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
    return this.dbClient.query(`
      INSERT INTO users
        (name, email, password_hash, job)
      VALUES
        ('${name}', '${email}', '${password_hash}', '${job}');  
    `);
  }

  async updateUser({ data, user_id }) {
    const query = concatUpdateQueryValues(data)
    
    const { rowCount } = await this.dbClient.query(`
      UPDATE users
      SET ${query}
      WHERE
        id = '${user_id}';
    `);

    return !!rowCount;
  }

  async deleteUser(user_id) {
    const { rowCount } = await this.dbClient.query(`
      DELETE FROM users
      WHERE
        id = '${user_id}';
    `);

    return !!rowCount; 
  }
}
