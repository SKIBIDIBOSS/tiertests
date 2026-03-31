const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = new sqlite3.Database('./tier_testing.db');
    }

    init() {
        return new Promise((resolve, reject) => {
            this.db.serialize(() => {
                this.db.run(`CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL,
                    ign TEXT,
                    timezone TEXT,
                    preferred_server TEXT,
                    profile_picture TEXT,
                    is_admin INTEGER DEFAULT 0,
                    is_tester INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS tiers (
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
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS queue (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    ign TEXT NOT NULL,
                    timezone TEXT,
                    preferred_server TEXT,
                    username TEXT,
                    status TEXT DEFAULT 'pending',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS tests (
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
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS forum_posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    title TEXT NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS forum_comments (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    post_id INTEGER NOT NULL,
                    user_id INTEGER NOT NULL,
                    content TEXT NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (post_id) REFERENCES forum_posts(id),
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`);

                this.db.run(`CREATE TABLE IF NOT EXISTS tickets (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    subject TEXT NOT NULL,
                    message TEXT NOT NULL,
                    status TEXT DEFAULT 'open',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                )`, (err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        });
    }

    createUser(username, password, ign, timezone, preferredServer, isAdmin = false) {
        return new Promise((resolve, reject) => {
            const self = this;
            this.db.run(
                'INSERT INTO users (username, password, ign, timezone, preferred_server, is_admin) VALUES (?, ?, ?, ?, ?, ?)',
                [username, password, ign, timezone, preferredServer, isAdmin ? 1 : 0],
                function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        const userId = this.lastID;
                        self.db.run('INSERT INTO tiers (user_id) VALUES (?)', [userId], (err2) => {
                            if (err2) reject(err2);
                            else resolve({ id: userId, username });
                        });
                    }
                }
            );
        });
    }

    getUserByUsername(username) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getUserById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM users WHERE id = ?', [id], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    getUserProfile(username) {
        return new Promise((resolve, reject) => {
            this.db.get(
                'SELECT u.*, t.* FROM users u LEFT JOIN tiers t ON u.id = t.user_id WHERE u.username = ?',
                [username],
                (err, row) => {
                    if (err) reject(err);
                    else resolve(row);
                }
            );
        });
    }

    updateProfile(userId, ign, timezone, preferredServer, profilePicture) {
        return new Promise((resolve, reject) => {
            if (profilePicture) {
                this.db.run('UPDATE users SET ign = ?, timezone = ?, preferred_server = ?, profile_picture = ? WHERE id = ?',
                    [ign, timezone, preferredServer, profilePicture, userId], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            } else {
                this.db.run('UPDATE users SET ign = ?, timezone = ?, preferred_server = ? WHERE id = ?',
                    [ign, timezone, preferredServer, userId], (err) => {
                        if (err) reject(err);
                        else resolve();
                    });
            }
        });
    }

    changePassword(userId, hashedPassword) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    changePasswordByUsername(username, hashedPassword) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE users SET password = ? WHERE username = ?', [hashedPassword, username], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    updateUserTiers(userId, sumo, bedfight, classic, skywars, boxing) {
        return new Promise((resolve, reject) => {
            this.db.run(
                'UPDATE tiers SET sumo_tier = ?, bedfight_tier = ?, classic_tier = ?, skywars_tier = ?, boxing_tier = ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?',
                [sumo, bedfight, classic, skywars, boxing, userId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    }

    makeTester(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE users SET is_tester = 1 WHERE id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    isTester(userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT is_tester FROM users WHERE id = ?', [userId], (err, row) => {
                if (err) reject(err);
                else resolve(row && row.is_tester === 1);
            });
        });
    }

    getLeaderboard() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT u.username, u.ign, t.* FROM users u JOIN tiers t ON u.id = t.user_id ORDER BY u.created_at DESC LIMIT 50`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    addToQueue(userId, ign, timezone, preferredServer, username) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO queue (user_id, ign, timezone, preferred_server, username) VALUES (?, ?, ?, ?, ?)',
                [userId, ign, timezone, preferredServer, username], function(err) {
                    if (err) reject(err);
                    else resolve({ id: this.lastID });
                });
        });
    }

    getQueue() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT q.*, u.username as queue_username FROM queue q JOIN users u ON q.user_id = u.id WHERE q.status = 'pending' ORDER BY q.created_at ASC`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    acceptTest(queueId, testerId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM queue WHERE id = ? AND status = "pending"', [queueId], (err, queue) => {
                if (err) reject(err);
                else if (!queue) reject(new Error('Queue entry not found'));
                else {
                    this.db.run('UPDATE queue SET status = "processing" WHERE id = ?', [queueId], (err2) => {
                        if (err2) reject(err2);
                        else {
                            this.db.run('INSERT INTO tests (queue_id, tester_id, testee_id) VALUES (?, ?, ?)',
                                [queueId, testerId, queue.user_id], function(err3) {
                                    if (err3) reject(err3);
                                    else resolve({ id: this.lastID });
                                });
                        }
                    });
                }
            });
        });
    }

    submitTestResult(testId, testerScore, testeeScore, testerName, testeeName, testeeIgn, server) {
        return new Promise((resolve, reject) => {
            this.db.run('UPDATE tests SET tester_score = ?, testee_score = ?, tester_name = ?, testee_name = ?, testee_ign = ?, server = ?, status = "completed", completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                [testerScore, testeeScore, testerName, testeeName, testeeIgn, server, testId], (err) => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    }

    getTickets() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT t.*, u.username FROM tickets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getForumPosts() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT p.*, u.username FROM forum_posts p JOIN users u ON p.user_id = u.id ORDER BY p.created_at DESC`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    createForumPost(userId, title, content) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO forum_posts (user_id, title, content) VALUES (?, ?, ?)', [userId, title, content], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
        });
    }

    createForumComment(userId, postId, content) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO forum_comments (post_id, user_id, content) VALUES (?, ?, ?)', [postId, userId, content], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    getAllUsers() {
        return new Promise((resolve, reject) => {
            this.db.all(`SELECT u.*, t.* FROM users u LEFT JOIN tiers t ON u.id = t.user_id ORDER BY u.created_at DESC`, (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });
    }

    getQueueEntryById(queueId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM queue WHERE id = ?', [queueId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    }

    deleteQueueEntry(queueId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM queue WHERE id = ?', [queueId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    clearAllQueue() {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM queue WHERE status = "pending"', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deleteUser(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deleteUserTiers(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM tiers WHERE user_id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deleteUserQueueEntries(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM queue WHERE user_id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deleteUserTests(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM tests WHERE tester_id = ? OR testee_id = ?', [userId, userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deleteUserForumPosts(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM forum_posts WHERE user_id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deleteUserComments(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM forum_comments WHERE user_id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }

    deleteUserTickets(userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM tickets WHERE user_id = ?', [userId], (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    }
}

module.exports = Database;
// Get test details
getTestDetails(testId) {
    return new Promise((resolve, reject) => {
        this.db.get(`
            SELECT t.*, 
                   u1.username as tester_username,
                   u2.username as testee_username
            FROM tests t
            LEFT JOIN users u1 ON t.tester_id = u1.id
            LEFT JOIN users u2 ON t.testee_id = u2.id
            WHERE t.id = ?
        `, [testId], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

// Save test message
saveTestMessage(testId, userId, message) {
    return new Promise((resolve, reject) => {
        this.db.run(
            'INSERT INTO test_messages (test_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)',
            [testId, userId, message, new Date().toISOString()],
            (err) => {
                if (err) reject(err);
                else resolve();
            }
        );
    });
}

// Get test messages
getTestMessages(testId) {
    return new Promise((resolve, reject) => {
        this.db.all(`
            SELECT tm.*, u.username 
            FROM test_messages tm
            JOIN users u ON tm.user_id = u.id
            WHERE tm.test_id = ?
            ORDER BY tm.timestamp ASC
        `, [testId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}
