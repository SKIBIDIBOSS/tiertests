const sqlite3 = require('sqlite3');
const { promisify } = require('util');

class Database {
constructor() {
this.db = new sqlite3.Database('./tier_testing.db');
this.db.exec = promisify(this.db.exec);
this.db.get = promisify(this.db.get);
this.db.all = promisify(this.db.all);
this.db.run = promisify(this.db.run);
}

async init() {
// Users table
await this.db.exec(CREATE TABLE IF NOT EXISTS users ( id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE NOT NULL, password TEXT NOT NULL, ign TEXT, timezone TEXT, preferred_server TEXT, profile_picture TEXT, is_admin INTEGER DEFAULT 0, is_tester INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP ));

// Tiers table
await this.db.exec(`
  CREATE TABLE IF NOT EXISTS tiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    sumo_tier TEXT DEFAULT 'Unrated',
    bedfight_tier TEXT DEFAULT 'Unrated',
    classic_tier TEXT DEFAULT 'Unrated',
    skywars_tier TEXT DEFAULT 'Unrated',
    boxing_tier TEXT DEFAULT 'Unrated',
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id)
  )
`);

// Queue table
await this.db.exec(`
  CREATE TABLE IF NOT EXISTS queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    ign TEXT NOT NULL,
    timezone TEXT,
    preferred_server TEXT,
    username TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Tests table
await this.db.exec(`
  CREATE TABLE IF NOT EXISTS tests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    queue_id INTEGER NOT NULL,
    tester_id INTEGER NOT NULL,
    testee_id INTEGER NOT NULL,
    status TEXT DEFAULT 'active',
    tester_score INTEGER,
    testee_score INTEGER,
    tester_name TEXT,
    testee_name TEXT,
    testee_ign TEXT,
    server TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    FOREIGN KEY (queue_id) REFERENCES queue(id),
    FOREIGN KEY (tester_id) REFERENCES users(id),
    FOREIGN KEY (testee_id) REFERENCES users(id)
  )
`);

// Forum posts table
await this.db.exec(`
  CREATE TABLE IF NOT EXISTS forum_posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Forum comments table
await this.db.exec(`
  CREATE TABLE IF NOT EXISTS forum_comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    post_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);

// Tickets table (for admin)
await this.db.exec(`
  CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    subject TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT DEFAULT 'open',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  )
`);
