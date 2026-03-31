const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const RANKS = ['lt5','lt4','lt3','lt2','lt1','ht5','ht4','ht3','ht2','ht1'];
const RANK_INDEX = {};
RANKS.forEach((r, i) => RANK_INDEX[r] = i);

class Database {
  constructor() {
    this.users = [];
    this.queue = [];
    this.tests = [];
    this.forumPosts = [];
    this.forumComments = [];
    this.tickets = [];
  }

  async init() {
    const adminPass = await bcrypt.hash('123123', 10);
    const liningPass = await bcrypt.hash('lining123', 10);
    const skibidiPass = await bcrypt.hash('skibidi123', 10);

    this.users = [
      {
        id: 'admin-001', username: 'admin', password: adminPass,
        ign: 'Admin', is_admin: 1, is_tester: 1,
        timezone: 'GMT+0', preferred_server: 'EU',
        profile_picture: null, ranks: {}
      },
      {
        id: 'user-lining', username: 'lining', password: liningPass,
        ign: 'lining', is_admin: 0, is_tester: 1,
        timezone: 'GMT+0', preferred_server: 'EU',
        profile_picture: null,
        ranks: { sumo: 'lt2', bedfight: 'ht2', classic: 'ht3', nodebuff: 'lt3', builduhc: 'lt3', spleef: 'lt3' }
      },
      {
        id: 'user-skibidi', username: 'SKIBIDIBOSS', password: skibidiPass,
        ign: 'SKIBIDIBOSS', is_admin: 0, is_tester: 1,
        timezone: 'GMT+0', preferred_server: 'EU',
        profile_picture: null,
        ranks: { sumo: 'lt3', bedfight: 'lt3', classic: 'lt3', nodebuff: 'lt3', builduhc: 'lt3', spleef: 'lt3' }
      }
    ];
  }

  async createUser(username, password, ign, timezone, preferredServer) {
    if (this.users.find(u => u.username.toLowerCase() === username.toLowerCase()))
      throw new Error('Username already taken');
    const user = {
      id: uuidv4(), username, password,
      ign: ign || username, is_admin: 0, is_tester: 0,
      timezone: timezone || '', preferred_server: preferredServer || 'EU',
      profile_picture: null, ranks: {}
    };
    this.users.push(user);
    return { id: user.id, username: user.username };
  }

  async getUserByUsername(username) {
    return this.users.find(u => u.username.toLowerCase() === username.toLowerCase()) || null;
  }

  async getUserById(id) {
    return this.users.find(u => u.id === id) || null;
  }

  async getUserProfile(username) {
    const user = await this.getUserByUsername(username);
    if (!user) return null;
    const { password, ...safe } = user;
    return safe;
  }

  async updateProfile(userId, ign, timezone, preferredServer, profilePicture) {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    if (ign) user.ign = ign;
    if (timezone) user.timezone = timezone;
    if (preferredServer) user.preferred_server = preferredServer;
    if (profilePicture) user.profile_picture = profilePicture;
  }

  async changePassword(userId, hashedPassword) {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.password = hashedPassword;
  }

  async makeTester(userId) {
    const user = this.users.find(u => u.id === userId);
    if (!user) throw new Error('User not found');
    user.is_tester = 1;
  }

  async isTester(userId) {
    const user = this.users.find(u => u.id === userId);
    return user ? user.is_tester === 1 : false;
  }

  async getLeaderboard() {
    const gamemodes = ['sumo','bedfight','classic','nodebuff','builduhc','spleef'];
    const result = {};
    for (const gm of gamemodes) {
      result[gm] = this.users
        .filter(u => u.ranks && u.ranks[gm])
        .map(u => ({
          username: u.username, ign: u.ign,
          profile_picture: u.profile_picture,
          rank: u.ranks[gm],
          rankIndex: RANK_INDEX[u.ranks[gm]] !== undefined ? RANK_INDEX[u.ranks[gm]] : -1
        }))
        .sort((a, b) => b.rankIndex - a.rankIndex);
    }
    return result;
  }

  async addToQueue(userId, ign, timezone, preferredServer, username) {
    const user = this.users.find(u => u.id === userId);
    if (this.queue.find(q => q.user_id === userId && q.status === 'pending'))
      throw new Error('Already in queue');
    const entry = {
      id: uuidv4(), user_id: userId,
      username: username || (user && user.username),
      ign: ign || (user && user.ign),
      timezone, preferred_server: preferredServer,
      status: 'pending', created_at: new Date().toISOString()
    };
    this.queue.push(entry);
    return { id: entry.id };
  }

  async getQueue() {
    return this.queue.filter(q => q.status === 'pending');
  }

  async acceptTest(queueId, testerId) {
    const entry = this.queue.find(q => q.id === queueId && q.status === 'pending');
    if (!entry) throw new Error('Queue entry not found or already processed');
    entry.status = 'processing';
    const tester = this.users.find(u => u.id === testerId);
    const test = {
      id: uuidv4(), queue_id: queueId,
      tester_id: testerId, tester_name: tester ? tester.username : '',
      testee_id: entry.user_id, testee_name: entry.username,
      testee_ign: entry.ign, preferred_server: entry.preferred_server,
      status: 'active', started_at: new Date().toISOString(), messages: []
    };
    this.tests.push(test);
    return { id: test.id };
  }

  async submitTestResult(testId, testerScore, testeeScore, testerName, testeeName, testeeIgn, server) {
    const test = this.tests.find(t => t.id === testId);
    if (!test) throw new Error('Test not found');
    test.status = 'completed';
    test.tester_score = parseInt(testerScore);
    test.testee_score = parseInt(testeeScore);
    test.tester_name = testerName;
    test.testee_name = testeeName;
    test.testee_ign = testeeIgn;
    test.server = server;
    test.completed_at = new Date().toISOString();

    const testee = this.users.find(u => u.id === test.testee_id);
    const tester = this.users.find(u => u.id === test.tester_id);
    if (testee && tester) {
      const total = test.tester_score + test.testee_score;
      const winRate = total > 0 ? test.testee_score / total : 0;
      const gamemodes = ['sumo','bedfight','classic','nodebuff','builduhc','spleef'];
      for (const gm of gamemodes) {
        const testerRank = tester.ranks && tester.ranks[gm];
        if (!testerRank) continue;
        const testerIdx = RANK_INDEX[testerRank];
        let newIdx;
        if (winRate >= 0.6) newIdx = testerIdx + 1;
        else if (winRate >= 0.4) newIdx = testerIdx;
        else if (winRate >= 0.2) newIdx = testerIdx - 1;
        else newIdx = testerIdx - 2;
        const clamped = Math.max(0, Math.min(RANKS.length - 1, newIdx));
        if (!testee.ranks) testee.ranks = {};
        testee.ranks[gm] = RANKS[clamped];
      }
    }
    this.queue = this.queue.filter(q => q.id !== test.queue_id);
  }

  async getTickets() {
    return this.tickets.map(t => {
      const user = this.users.find(u => u.id === t.user_id);
      return Object.assign({}, t, { username: user ? user.username : 'Unknown' });
    });
  }

  async createTicket(userId, subject, message) {
    const ticket = {
      id: uuidv4(), user_id: userId, subject, message,
      status: 'open', created_at: new Date().toISOString()
    };
    this.tickets.push(ticket);
    return ticket;
  }

  async getForumPosts() {
    return this.forumPosts.map(p => {
      const user = this.users.find(u => u.id === p.user_id);
      return Object.assign({}, p, { username: user ? user.username : 'Unknown' });
    }).reverse();
  }

  async createForumPost(userId, title, content) {
    const post = {
      id: uuidv4(), user_id: userId, title, content,
      created_at: new Date().toISOString()
    };
    this.forumPosts.push(post);
    return { id: post.id };
  }

  async createForumComment(userId, postId, content) {
    const user = this.users.find(u => u.id === userId);
    this.forumComments.push({
      id: uuidv4(), post_id: postId, user_id: userId,
      username: user ? user.username : 'Unknown',
      content, created_at: new Date().toISOString()
    });
  }

  async getForumComments(postId) {
    return this.forumComments.filter(c => c.post_id === postId);
  }
}

module.exports = Database;
