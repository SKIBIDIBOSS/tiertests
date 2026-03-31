createTicket(userId, subject, message) {
    return new Promise((resolve, reject) => {
        this.db.run('INSERT INTO tickets (user_id, subject, message) VALUES (?, ?, ?)', 
            [userId, subject, message], function(err) {
                if (err) reject(err);
                else resolve({ id: this.lastID });
            });
    });
}

getTickets() {
    return new Promise((resolve, reject) => {
        this.db.all(`SELECT t.*, u.username FROM tickets t JOIN users u ON t.user_id = u.id ORDER BY t.created_at DESC`, 
            (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
    });
}

getTicketById(ticketId) {
    return new Promise((resolve, reject) => {
        this.db.get(`SELECT t.*, u.username FROM tickets t JOIN users u ON t.user_id = u.id WHERE t.id = ?`, 
            [ticketId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
    });
}

saveTicketMessage(ticketId, userId, message) {
    return new Promise((resolve, reject) => {
        this.db.run('INSERT INTO test_messages (test_id, user_id, message, timestamp) VALUES (?, ?, ?, ?)',
            [ticketId, userId, message, new Date().toISOString()], (err) => {
                if (err) reject(err);
                else resolve();
            });
    });
}

getTicketMessages(ticketId) {
    return new Promise((resolve, reject) => {
        this.db.all(`SELECT tm.*, u.username, u.is_admin, u.is_tester FROM test_messages tm 
                     JOIN users u ON tm.user_id = u.id WHERE tm.test_id = ? ORDER BY tm.timestamp ASC`, 
            [ticketId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
    });
}

closeTicket(ticketId) {
    return new Promise((resolve, reject) => {
        this.db.run('UPDATE tickets SET status = ? WHERE id = ?', ['closed', ticketId], (err) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

banUser(userId) {
    return new Promise((resolve, reject) => {
        this.deleteUser(userId).then(() => {
            this.deleteUserTiers(userId).then(() => {
                this.deleteUserQueueEntries(userId).then(() => {
                    this.deleteUserTests(userId).then(() => {
                        this.deleteUserForumPosts(userId).then(() => {
                            this.deleteUserComments(userId).then(() => {
                                this.deleteUserTickets(userId).then(() => {
                                    resolve();
                                }).catch(reject);
                            }).catch(reject);
                        }).catch(reject);
                    }).catch(reject);
                }).catch(reject);
            }).catch(reject);
        }).catch(reject);
    });
}
