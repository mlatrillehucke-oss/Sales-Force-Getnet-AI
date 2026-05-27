import sqlite3 from 'sqlite3';
import fs from 'fs';
import path from 'path';

export default class Database {
  constructor() {
    const dataDir = './data';
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
    
    this.db = new sqlite3.Database('./data/app.db');
    this.run = (sql, params = []) => 
      new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else resolve({ id: this.lastID, changes: this.changes });
        });
      });
    
    this.all = (sql, params = []) =>
      new Promise((resolve, reject) => {
        this.db.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows || []);
        });
      });
    
    this.get = (sql, params = []) =>
      new Promise((resolve, reject) => {
        this.db.get(sql, params, (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
  }

  async init() {
    // Commerces table
    await this.run(`
      CREATE TABLE IF NOT EXISTS commerces (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT,
        city TEXT,
        country TEXT,
        address TEXT,
        latitude REAL,
        longitude REAL,
        status TEXT DEFAULT 'prospecto',
        priority TEXT DEFAULT 'media',
        has_card_terminal BOOLEAN DEFAULT 0,
        owner_name TEXT,
        owner_email TEXT,
        phone TEXT,
        notes TEXT,
        created_date TEXT,
        updated_date TEXT
      )
    `);

    // Messages table
    await this.run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        channel TEXT NOT NULL,
        content TEXT NOT NULL,
        author_name TEXT,
        author_email TEXT,
        commerce_id TEXT,
        commerce_name TEXT,
        created_date TEXT
      )
    `);

    // Conversations table
    await this.run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        agent_name TEXT,
        metadata TEXT,
        created_date TEXT,
        updated_date TEXT
      )
    `);

    // Conversation messages table
    await this.run(`
      CREATE TABLE IF NOT EXISTS conversation_messages (
        id TEXT PRIMARY KEY,
        conversation_id TEXT,
        role TEXT,
        content TEXT,
        created_date TEXT,
        FOREIGN KEY(conversation_id) REFERENCES conversations(id)
      )
    `);

    // Visit routes table
    await this.run(`
      CREATE TABLE IF NOT EXISTS visit_routes (
        id TEXT PRIMARY KEY,
        name TEXT,
        city TEXT,
        country TEXT,
        ai_generated BOOLEAN DEFAULT 0,
        ai_notes TEXT,
        status TEXT DEFAULT 'planificada',
        commerce_ids TEXT,
        created_date TEXT
      )
    `);

    console.log('✅ Database initialized');
  }
}
