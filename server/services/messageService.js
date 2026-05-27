import { v4 as uuid } from 'uuid';

export default class MessageService {
  constructor(db) {
    this.db = db;
  }

  async listByChannel(channel, limit = 100) {
    return await this.db.all(
      'SELECT * FROM messages WHERE channel = ? ORDER BY created_date DESC LIMIT ?',
      [channel, limit]
    );
  }

  async create(data) {
    const message = {
      id: data.id || uuid(),
      channel: data.channel,
      content: data.content,
      author_name: data.author_name,
      author_email: data.author_email,
      commerce_id: data.commerce_id || null,
      commerce_name: data.commerce_name || null,
      created_date: data.created_date || new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO messages (id, channel, content, author_name, author_email, commerce_id, commerce_name, created_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(message)
    );

    return message;
  }

  async delete(id) {
    await this.db.run('DELETE FROM messages WHERE id = ?', [id]);
  }
}
