const Database = require('./database');
const auth = require('./auth');

class AdminManagement {
    constructor(db) {
        this.db = db;
    }

    // Reset password for any user
    async resetUserPassword(username, newPassword, adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin is performing this action
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                const user = await this.db.getUserByUsername(username);
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }

                const hashedPassword = await auth.hashPassword(newPassword);
                await this.db.changePassword(user.id, hashedPassword);
                
                resolve({ 
                    success: true, 
                    message: `Password reset for ${username} successfully`,
                    userId: user.id
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Delete user account and all associated data
    async deleteUserAccount(username, adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                const user = await this.db.getUserByUsername(username);
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }

                if (user.is_admin === 1) {
                    reject(new Error('Cannot delete another admin account'));
                    return;
                }

                // Delete all user data
                await this.db.deleteUserTiers(user.id);
                await this.db.deleteUserQueueEntries(user.id);
                await this.db.deleteUserTests(user.id);
                await this.db.deleteUserForumPosts(user.id);
                await this.db.deleteUserComments(user.id);
                await this.db.deleteUserTickets(user.id);
                await this.db.deleteUser(user.id);
                
                resolve({ 
                    success: true, 
                    message: `User ${username} and all associated data deleted successfully`
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Update user tiers on leaderboard
    async updateUserTiers(username, tiers, adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                const user = await this.db.getUserByUsername(username);
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }

                await this.db.updateUserTiers(
                    user.id,
                    tiers.sumo || user.sumo_tier,
                    tiers.bedfight || user.bedfight_tier,
                    tiers.classic || user.classic_tier,
                    tiers.skywars || user.skywars_tier,
                    tiers.boxing || user.boxing_tier
                );
                
                resolve({ 
                    success: true, 
                    message: `Tiers updated for ${username} successfully`
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Remove user from queue
    async removeFromQueue(queueId, adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                const queueEntry = await this.db.getQueueEntryById(queueId);
                if (!queueEntry) {
                    reject(new Error('Queue entry not found'));
                    return;
                }

                await this.db.deleteQueueEntry(queueId);
                
                resolve({ 
                    success: true, 
                    message: `User removed from queue successfully`
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Clear entire queue
    async clearAllQueue(adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                await this.db.clearAllQueue();
                
                resolve({ 
                    success: true, 
                    message: `All queue entries cleared successfully`
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    // Get all users list for management
    async getAllUsers(adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                const users = await this.db.getAllUsers();
                resolve(users);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Get user details for editing
    async getUserDetails(username, adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                const user = await this.db.getUserProfile(username);
                if (!user) {
                    reject(new Error('User not found'));
                    return;
                }

                resolve(user);
            } catch (error) {
                reject(error);
            }
        });
    }

    // Bulk tier update
    async bulkUpdateTiers(updates, adminId) {
        return new Promise(async (resolve, reject) => {
            try {
                // Verify admin
                const admin = await this.db.getUserById(adminId);
                if (!admin || admin.is_admin !== 1) {
                    reject(new Error('Unauthorized: Admin access required'));
                    return;
                }

                const results = [];
                for (const update of updates) {
                    try {
                        const user = await this.db.getUserByUsername(update.username);
                        if (user) {
                            await this.db.updateUserTiers(
                                user.id,
                                update.sumo || user.sumo_tier,
                                update.bedfight || user.bedfight_tier,
                                update.classic || user.classic_tier,
                                update.skywars || user.skywars_tier,
                                update.boxing || user.boxing_tier
                            );
                            results.push({ username: update.username, success: true });
                        } else {
                            results.push({ username: update.username, success: false, error: 'User not found' });
                        }
                    } catch (error) {
                        results.push({ username: update.username, success: false, error: error.message });
                    }
                }
                
                resolve({ 
                    success: true, 
                    message: `Updated ${results.filter(r => r.success).length} users`,
                    results: results
                });
            } catch (error) {
                reject(error);
            }
        });
    }
}

module.exports = AdminManagement;
