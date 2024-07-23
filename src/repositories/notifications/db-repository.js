export class NotificationsDbRepository {
  dbClient;

  constructor(dbClient) {
    this.dbClient = dbClient
  }
  
  async findManyByUserId(user_id) {
    const { rows } = await this.dbClient.query(`
      SELECT n.id, n.content, un.is_read, n.created_at
      FROM notifications n
      JOIN user_notifications un ON n.id = un.notification_id
      WHERE un.user_id = $1
      ORDER BY n.created_at DESC;
    `, [user_id]);

    return rows;
  }

  async createNotification({ content, users_id }) {
    const { rows } = await this.dbClient.query(`
      INSERT INTO notifications (content)
      VALUES ($1)
      RETURNING id, created_at;
    `, [content]);
    
    const { id, created_at } = rows[0];
    
    const formattedUsersId = users_id.map(user_id => `('${user_id}', '${id}')`).join(",");

    await this.dbClient.query(`
      INSERT INTO user_notifications (user_id, notification_id)
      VALUES ${formattedUsersId};
    `);

    const notification = {
      id,
      is_read: false,
      created_at
    }

    return notification;
  }

  async updateNotification({ user_id, notification_id }) {
    const { rowCount } = await this.dbClient.query(`
      UPDATE user_notifications
      SET is_read = true
      WHERE user_id = $1 AND notification_id = $2;
    `, [user_id, notification_id])

    return !!rowCount;
  }
}
