import { v4 as uuid } from 'uuid';

export default class CommerceService {
  constructor(db) {
    this.db = db;
  }

  async list(sortBy = '-created_date', limit = 500) {
    let orderClause = 'created_date DESC';
    if (sortBy === '-created_date') orderClause = 'created_date DESC';
    if (sortBy === 'created_date') orderClause = 'created_date ASC';
    if (sortBy === 'name') orderClause = 'name ASC';
    if (sortBy === '-name') orderClause = 'name DESC';

    return await this.db.all(
      `SELECT * FROM commerces ORDER BY ${orderClause} LIMIT ?`,
      [limit]
    );
  }

  async get(id) {
    return await this.db.get('SELECT * FROM commerces WHERE id = ?', [id]);
  }

  async create(data) {
    const commerce = {
      id: data.id || uuid(),
      name: data.name,
      type: data.type,
      city: data.city,
      country: data.country,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
      status: data.status || 'prospecto',
      priority: data.priority || 'media',
      has_card_terminal: data.has_card_terminal ? 1 : 0,
      owner_name: data.owner_name,
      owner_email: data.owner_email,
      phone: data.phone,
      notes: data.notes,
      created_date: data.created_date || new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    await this.db.run(
      `INSERT INTO commerces (id, name, type, city, country, address, latitude, longitude, status, priority, has_card_terminal, owner_name, owner_email, phone, notes, created_date, updated_date)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      Object.values(commerce)
    );

    return commerce;
  }

  async update(id, data) {
    const existing = await this.get(id);
    if (!existing) return null;

    const updated = { ...existing, ...data, id, updated_date: new Date().toISOString() };

    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updated)) {
      if (key !== 'id') {
        fields.push(`${key} = ?`);
        values.push(value);
      }
    }
    values.push(id);

    await this.db.run(
      `UPDATE commerces SET ${fields.join(', ')} WHERE id = ?`,
      values
    );

    return updated;
  }

  async delete(id) {
    await this.db.run('DELETE FROM commerces WHERE id = ?', [id]);
  }

  async search(filters) {
    let sql = 'SELECT * FROM commerces WHERE 1=1';
    const params = [];

    if (filters.name) {
      sql += ' AND name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    if (filters.city) {
      sql += ' AND city LIKE ?';
      params.push(`%${filters.city}%`);
    }
    if (filters.country) {
      sql += ' AND country = ?';
      params.push(filters.country);
    }
    if (filters.type) {
      sql += ' AND type = ?';
      params.push(filters.type);
    }
    if (filters.status) {
      sql += ' AND status = ?';
      params.push(filters.status);
    }
    if (filters.priority) {
      sql += ' AND priority = ?';
      params.push(filters.priority);
    }

    sql += ' ORDER BY created_date DESC LIMIT 100';

    return await this.db.all(sql, params);
  }
}
