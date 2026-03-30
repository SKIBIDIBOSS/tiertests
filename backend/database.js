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
}

async createUser(username, password, ign, timezone, preferredServer, isAdmin = false) {
const result = await this.db.run(
'INSERT INTO users (username, password, ign, timezone, preferred_server, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
[username, password, ign, timezone, preferredServer, isAdmin ? 1 : 0]
);

await this.db.run(
  'INSERT INTO tiers (user_id) VALUES (?)',
  [result.lastID]
);

return { id: result.lastID, username };
}

async getUserByUsername(username) {
return await this.db.get('SELECT * FROM users WHERE username = ?', [username]);
}

async getUserById(id) {
return await this.db.get('SELECT * FROM users WHERE id = ?', [id]);
}

async getUserProfile(username) {
const user = await this.db.get(
'SELECT u., t. FROM users u LEFT JOIN tiers t ON u.id = t.user_id WHERE u.username = ?',
[username]
);
return user;
}

async updateProfile(userId, ign, timezone, preferredServer, profilePicture) {
if (profilePicture) {
await this.db.run(
'UPDATE users SET ign = ?, timezone = ?, preferred_server = ?, profile_picture = ? WHERE id = ?',
[ign, timezone, preferredServer, profilePicture, userId]
);
} else {
await this.db.run(
'UPDATE users SET ign = ?, timezone = ?, preferred_server = ? WHERE id = ?',
[ign, timezone, preferredServer, userId]
);
}
}

async changePassword(userId, hashedPassword) {
await this.db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);
}

async updateUserTiers(userId, sumo, bedfight, classic, skywars, boxing) {
await this.db.run(
UPDATE tiers SET sumo_tier = ?, bedfight_tier = ?, classic_tier = ?, skywars_tier = ?, boxing_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?,
[sumo, bedfight, classic, skywars, boxing, userId]
);
}

async makeTester(userId) {
await this.db.run('UPDATE users SET is_tester = 1 WHERE id = ?', [userId]);
}

async isTester(userId) {
const user = await this.db.get('SELECT is_tester FROM users WHERE id = ?', [userId]);
return user && user.is_tester === 1;
}

async getLeaderboard() {
return await this.db.all(SELECT u.username, u.ign, t.*  FROM users u  JOIN tiers t ON u.id = t.user_id  ORDER BY  CASE t.sumo_tier  WHEN 'HT1' THEN 1 WHEN 'HT2' THEN 2 WHEN 'HT3' THEN 3  WHEN 'LT1' THEN 4 WHEN 'LT2' THEN 5 WHEN 'LT3' THEN 6  ELSE 7  END ASC LIMIT 50);
}

async addToQueue(userId, ign, timezone, preferredServer, username) {
const result = await this.db.run(
'INSERT INTO queue (user_id, ign, timezone, preferred_server, username) VALUES (?, ?, ?, ?, ?)',
[userId, ign, timezone, preferredServer, username]
);
return { id: result.lastID };
}

async getQueue() {
return await this.db.all(SELECT q.*, u.username as queue_username  FROM queue q  JOIN users u ON q.user_id = u.id  WHERE q.status = 'pending' ORDER BY q.created_at ASC);
}

async acceptTest(queueId, testerId) {
const queue = await this.db.get('SELECT * FROM queue WHERE id = ? AND status = "pending"', [queueId]);
if (!queue) throw new Error('Queue entry not found or already processed');

await this.db.run('UPDATE queue SET status = "processing" WHERE id = ?', [queueId]);

const result = await this.db.run(
  'INSERT INTO tests (queue_id, tester_id, testee_id) VALUES (?, ?, ?)',
  [queueId, testerId, queue.user_id]
);

return { id: result.lastID };
}

async submitTestResult(testId, testerScore, testeeScore, testerName, testeeName, testeeIgn, server) {
await this.db.run(
UPDATE tests SET  tester_score = ?, testee_score = ?,  tester_name = ?, testee_name = ?,  testee_ign = ?, server = ?,  status = "completed", completed_at = CURRENT_TIMESTAMP  WHERE id = ?,
[testerScore, testeeScore, testerName, testeeName, testeeIgn, server, testId]
);

// Update testee's tiers based on performance
const test = await this.db.get('SELECT testee_id FROM tests WHERE id = ?', [testId]);
await this.updateTiersBasedOnTest(test.testee_id, testerScore, testeeScore);
}

async updateTiersBasedOnTest(userId, testerScore, testeeScore) {
// Dynamic tier update logic
const currentTiers = await this.db.get('SELECT * FROM tiers WHERE user_id = ?', [userId]);
const ratio = testerScore / testeeScore;

// Simple dynamic tier adjustment
// This is a basic implementation - you can make it more sophisticated
if (ratio >= 2) {
  // Testee performed very well, consider upgrading
  const tiers = ['sumo_tier', 'bedfight_tier', 'classic_tier', 'skywars_tier', 'boxing_tier'];
  for (const tier of tiers) {
    if (currentTiers[tier] === 'LT3') await this.upgradeTier(userId, tier, 'LT2');
    else if (currentTiers[tier] === 'LT2') await this.upgradeTier(userId, tier, 'LT1');
    else if (currentTiers[tier] === 'LT1') await this.upgradeTier(userId, tier, 'HT3');
    else if (currentTiers[tier] === 'HT3') await this.upgradeTier(userId, tier, 'HT2');
    else if (currentTiers[tier] === 'HT2') await this.upgradeTier(userId, tier, 'HT1');
  }
}
}

async upgradeTier(userId, tierName, newTier) {
await this.db.run(UPDATE tiers SET ${tierName} = ? WHERE user_id = ?, [newTier, userId]);
}

async getTickets() {
return await this.db.all(SELECT t.*, u.username  FROM tickets t  JOIN users u ON t.user_id = u.id  ORDER BY t.created_at DESC);
}

async getForumPosts() {
return await this.db.all(SELECT p.*, u.username  FROM forum_posts p  JOIN users u ON p.user_id = u.id  ORDER BY p.created_at DESC);
}

async createForumPost(userId, title, content) {
const result = await this.db.run(
'INSERT INTO forum_posts (user_id, title, content) VALUES (?, ?, ?)',
[userId, title, content]
);
return { id: result.lastID };
}

async createForumComment(userId, postId, content) {
await this.db.run(
'INSERT INTO forum_comments (post_id, user_id, content) VALUES (?, ?, ?)',
[postId, userId, content]
);
}
}

module.exports = Database;
