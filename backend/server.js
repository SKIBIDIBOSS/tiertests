const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const session = require('express-session');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const Database = require('./database');
const auth = require('./auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.set('io', io);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(session({
    secret: 'minecraft-tier-testing-secret-key-2024',
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        const uploadDir = path.join(__dirname, '../frontend/uploads');
        cb(null, uploadDir);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

const db = new Database();
const fs = require('fs');
const uploadDir = path.join(__dirname, '../frontend/uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

io.on('connection', (socket) => {
    console.log('New client connected');
    
    socket.on('join-test', (testId) => {
        socket.join('test-' + testId);
        console.log('User joined test-' + testId);
    });
    
    socket.on('test-message', (data) => {
        io.to('test-' + data.testId).emit('test-message', {
            username: data.username,
            message: data.message,
            timestamp: new Date()
        });
    });

    socket.on('join-forum', () => {
        socket.join('forum');
    });

    socket.on('join-ticket', (ticketId) => {
        socket.join('ticket-' + ticketId);
    });
    
    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

app.post('/api/register', async (req, res) => {
    try {
        const { username, password, ign, timezone, preferredServer } = req.body;
        const hashedPassword = await auth.hashPassword(password);
        const user = await db.createUser(username, hashedPassword, ign, timezone, preferredServer);
        res.json({ success: true, user: { id: user.id, username: user.username } });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await db.getUserByUsername(username);
        
        if (!user) {
            return res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
        
        const isValid = await auth.verifyPassword(password, user.password);
        
        if (isValid) {
            if (user.is_banned === 1) {
                return res.status(403).json({ success: false, error: 'Your account has been banned' });
            }
            req.session.userId = user.id;
            req.session.username = user.username;
            req.session.isAdmin = user.is_admin === 1;
            
            res.json({ 
                success: true, 
                user: {
                    id: user.id,
                    username: user.username,
                    isAdmin: user.is_admin === 1,
                    isTester: user.is_tester === 1
                }
            });
        } else {
            res.status(401).json({ success: false, error: 'Invalid credentials' });
        }
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

app.post('/api/logout', (req, res) => {
    req.session.destroy();
    res.json({ success: true });
});

app.get('/api/check-auth', async (req, res) => {
    if (req.session.userId) {
        try {
            const user = await db.getUserById(req.session.userId);
            res.json({ 
                authenticated: true, 
                username: req.session.username,
                isAdmin: req.session.isAdmin || false,
                isTester: user ? user.is_tester === 1 : false,
                userId: req.session.userId
            });
        } catch (e) {
            res.json({ 
                authenticated: true, 
                username: req.session.username,
                isAdmin: req.session.isAdmin || false,
                isTester: false,
                userId: req.session.userId
            });
        }
    } else {
        res.json({ authenticated: false });
    }
});

app.get('/api/leaderboard', async (req, res) => {
    try {
        const leaderboard = await db.getLeaderboard();
        res.json(leaderboard);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/join-queue', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        const { ign, timezone, preferredServer, username } = req.body;
        const queueEntry = await db.addToQueue(req.session.userId, ign, timezone, preferredServer, username);
        res.json({ success: true, queueId: queueEntry.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/queue', async (req, res) => {
    try {
        const queue = await db.getQueue();
        res.json(queue);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/accept-test/:queueId', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const isTester = await db.isTester(req.session.userId);
        const user = await db.getUserById(req.session.userId);
        
        if (!isTester && !user.is_admin) {
            return res.status(403).json({ error: 'Not authorized to test' });
        }
        
        const test = await db.acceptTest(req.params.queueId, req.session.userId);
        res.json({ success: true, testId: test.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/submit-test', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { testId, testerScore, testeeScore, testerName, testeeName, testeeIgn, server } = req.body;
        await db.submitTestResult(testId, testerScore, testeeScore, testerName, testeeName, testeeIgn, server);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/test/details/:testId', async (req, res) => {
    try {
        const test = await db.getTestDetails(req.params.testId);
        res.json(test);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/test/messages/:testId', async (req, res) => {
    try {
        const messages = await db.getTestMessages(req.params.testId);
        res.json(messages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/test/send-message', async (req, res) => {
    try {
        if (!req.session.userId) {
            return res.status(401).json({ error: 'Not authenticated' });
        }
        
        const { testId, message } = req.body;
        await db.saveTestMessage(testId, req.session.userId, message);
        
        const io = req.app.get('io');
        io.to('test-' + testId).emit('test-message', {
            username: req.session.username,
            message: message,
            timestamp: new Date()
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/profile/:username', async (req, res) => {
    try {
        const profile = await db.getUserProfile(req.params.username);
        if (!profile) return res.status(404).json({ error: 'User not found' });
        res.json(profile);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/update-profile', upload.single('profilePicture'), async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { ign, timezone, preferredServer } = req.body;
        let profilePicture = null;
        if (req.file) profilePicture = '/uploads/' + req.file.filename;
        await db.updateProfile(req.session.userId, ign, timezone, preferredServer, profilePicture);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/change-password', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { currentPassword, newPassword } = req.body;
        const user = await db.getUserById(req.session.userId);
        if (await auth.verifyPassword(currentPassword, user.password)) {
            const hashedPassword = await auth.hashPassword(newPassword);
            await db.changePassword(req.session.userId, hashedPassword);
            res.json({ success: true });
        } else {
            res.status(401).json({ error: 'Current password is incorrect' });
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ── Forum Endpoints ────────────────────────────────────────────────────────

app.get('/api/forum/posts', async (req, res) => {
    try {
        const posts = await db.getForumPosts();
        res.json(posts);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/forum/post', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { title, content } = req.body;
        if (!title || !content) return res.status(400).json({ error: 'Title and content required' });
        const post = await db.createForumPost(req.session.userId, title, content);
        const user = await db.getUserById(req.session.userId);
        const newPost = {
            id: post.id,
            title,
            content,
            username: user.username,
            is_admin: user.is_admin,
            is_tester: user.is_tester,
            created_at: new Date().toISOString(),
            comment_count: 0
        };
        const io = req.app.get('io');
        io.to('forum').emit('forum-post', newPost);
        res.json({ success: true, post: newPost });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/forum/post/:postId', async (req, res) => {
    try {
        const post = await db.getForumPostWithComments(req.params.postId);
        if (!post) return res.status(404).json({ error: 'Post not found' });
        res.json(post);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/forum/comment', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { postId, content } = req.body;
        if (!postId || !content) return res.status(400).json({ error: 'Post ID and content required' });
        await db.createForumComment(req.session.userId, postId, content);
        const user = await db.getUserById(req.session.userId);
        const comment = {
            post_id: postId,
            content,
            username: user.username,
            is_admin: user.is_admin,
            is_tester: user.is_tester,
            created_at: new Date().toISOString()
        };
        const io = req.app.get('io');
        io.to('forum-post-' + postId).emit('forum-comment', comment);
        res.json({ success: true, comment });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ── Ticket Endpoints ───────────────────────────────────────────────────────

app.get('/api/tickets', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const user = await db.getUserById(req.session.userId);
        let tickets;
        if (user.is_admin) {
            tickets = await db.getTickets();
        } else {
            tickets = await db.getTicketsByUser(req.session.userId);
        }
        res.json(tickets);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/ticket/create', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { subject, message } = req.body;
        if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });
        const ticket = await db.createTicket(req.session.userId, subject, message);
        res.json({ success: true, ticketId: ticket.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/ticket/:ticketId/messages', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const ticket = await db.getTicketWithMessages(req.params.ticketId);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        const user = await db.getUserById(req.session.userId);
        if (!user.is_admin && ticket.user_id !== req.session.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        res.json(ticket);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/ticket/:ticketId/message', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { message } = req.body;
        if (!message) return res.status(400).json({ error: 'Message required' });
        const ticket = await db.getTicketWithMessages(req.params.ticketId);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        const user = await db.getUserById(req.session.userId);
        if (!user.is_admin && ticket.user_id !== req.session.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        if (ticket.status === 'closed') return res.status(400).json({ error: 'Ticket is closed' });
        await db.addTicketMessage(req.params.ticketId, req.session.userId, message);
        const msgData = {
            ticket_id: req.params.ticketId,
            message,
            username: user.username,
            is_admin: user.is_admin,
            is_tester: user.is_tester,
            created_at: new Date().toISOString()
        };
        const io = req.app.get('io');
        io.to('ticket-' + req.params.ticketId).emit('ticket-message', msgData);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/ticket/:ticketId/close', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const user = await db.getUserById(req.session.userId);
        const ticket = await db.getTicketWithMessages(req.params.ticketId);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        if (!user.is_admin && ticket.user_id !== req.session.userId) {
            return res.status(403).json({ error: 'Access denied' });
        }
        await db.closeTicket(req.params.ticketId);
        const io = req.app.get('io');
        io.to('ticket-' + req.params.ticketId).emit('ticket-closed', { ticketId: req.params.ticketId });
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// ── Admin Endpoints ────────────────────────────────────────────────────────

app.get('/api/admin/users', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const users = await db.getAllUsersWithTiers();
        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/admin/tickets', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const tickets = await db.getTickets();
        res.json(tickets);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/update-tier', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const { userId, sumo, bedfight, classic, skywars, boxing } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        await db.updateUserTiers(userId, sumo || 'Unrated', bedfight || 'Unrated', classic || 'Unrated', skywars || 'Unrated', boxing || 'Unrated');
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/ban-user', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const { userId, action } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        const target = await db.getUserById(userId);
        if (!target) return res.status(404).json({ error: 'User not found' });
        if (target.is_admin) return res.status(400).json({ error: 'Cannot ban an admin' });
        if (action === 'unban') {
            await db.unbanUser(userId);
        } else {
            await db.banUser(userId);
        }
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/delete-user', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const { username } = req.body;
        if (!username) return res.status(400).json({ error: 'Username required' });
        const user = await db.getUserByUsername(username);
        if (!user) return res.status(404).json({ error: 'User not found' });
        if (user.is_admin) return res.status(400).json({ error: 'Cannot delete an admin account' });
        await db.deleteUserTiers(user.id);
        await db.deleteUserQueueEntries(user.id);
        await db.deleteUserTests(user.id);
        await db.deleteUserForumPosts(user.id);
        await db.deleteUserComments(user.id);
        await db.deleteUserTickets(user.id);
        await db.deleteUser(user.id);
        res.json({ success: true, message: `User ${username} deleted` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/add-tester', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const { userId } = req.body;
        if (!userId) return res.status(400).json({ error: 'User ID required' });
        await db.makeTester(userId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/admin/user-details/:username', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const user = await db.getUserProfile(req.params.username);
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/reset-password', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const { username, newPassword } = req.body;
        if (!username || !newPassword) return res.status(400).json({ error: 'Username and new password required' });
        const user = await db.getUserByUsername(username);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const hashed = await auth.hashPassword(newPassword);
        await db.changePassword(user.id, hashed);
        res.json({ success: true, message: `Password reset for ${username}` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/remove-from-queue', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const { queueId } = req.body;
        if (!queueId) return res.status(400).json({ error: 'Queue ID required' });
        await db.deleteQueueEntry(queueId);
        res.json({ success: true, message: 'Removed from queue' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/clear-queue', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        await db.clearAllQueue();
        res.json({ success: true, message: 'Queue cleared' });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/admin/update-tiers', async (req, res) => {
    try {
        if (!req.session.userId || !req.session.isAdmin) return res.status(403).json({ error: 'Admin access required' });
        const { username, tiers } = req.body;
        if (!username || !tiers) return res.status(400).json({ error: 'Username and tiers required' });
        const user = await db.getUserByUsername(username);
        if (!user) return res.status(404).json({ error: 'User not found' });
        await db.updateUserTiers(user.id, tiers.sumo || 'Unrated', tiers.bedfight || 'Unrated', tiers.classic || 'Unrated', tiers.skywars || 'Unrated', tiers.boxing || 'Unrated');
        res.json({ success: true, message: `Tiers updated for ${username}` });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;

async function initialize() {
    try {
        await db.init();
        console.log('Database initialized');
        
        let adminUser = await db.getUserByUsername('admin');
        if (adminUser) {
            const newHash = await auth.hashPassword('123123');
            await db.changePassword(adminUser.id, newHash);
            console.log('Admin password reset: admin / 123123');
        } else {
            const hashedPassword = await auth.hashPassword('123123');
            adminUser = await db.createUser('admin', hashedPassword, 'Admin', 'UTC', 'US', true);
            console.log('Admin created: admin / 123123');
        }
        
        let liningUser = await db.getUserByUsername('lining');
        if (liningUser) {
            const newHash = await auth.hashPassword('lining123');
            await db.changePassword(liningUser.id, newHash);
            console.log('Lining password reset: lining / lining123');
        } else {
            const hashedPassword = await auth.hashPassword('lining123');
            liningUser = await db.createUser('lining', hashedPassword, 'lining123', 'UTC', 'US');
            await db.updateUserTiers(liningUser.id, 'LT2', 'HT2', 'HT3', 'LT3', 'LT3');
            await db.makeTester(liningUser.id);
            console.log('Lining created: lining / lining123');
        }
        
        let skibiUser = await db.getUserByUsername('SKIBIDIBOSS');
        if (skibiUser) {
            const newHash = await auth.hashPassword('skibidiboss123');
            await db.changePassword(skibiUser.id, newHash);
            console.log('SKIBIDIBOSS password reset');
        } else {
            const hashedPassword = await auth.hashPassword('skibidiboss123');
            skibiUser = await db.createUser('SKIBIDIBOSS', hashedPassword, 'SKIBIDIBOSS', 'UTC', 'US');
            await db.updateUserTiers(skibiUser.id, 'LT3', 'LT3', 'LT3', 'LT3', 'LT3');
            await db.makeTester(skibiUser.id);
            console.log('SKIBIDIBOSS created: SKIBIDIBOSS / skibidiboss123');
        }
        
        server.listen(PORT, () => {
            console.log('===================================');
            console.log('SERVER STARTED ON PORT: ' + PORT);
            console.log('===================================');
            console.log('LOGIN CREDENTIALS:');
            console.log('  Admin:      admin / 123123');
            console.log('  Lining:     lining / lining123');
            console.log('  SKIBIDIBOSS: SKIBIDIBOSS / skibidiboss123');
            console.log('===================================');
        });
    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

initialize();
