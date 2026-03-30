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
cors: {
origin: "*",
methods: ["GET", "POST"]
}
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(session({
secret: 'minecraft-tier-testing-secret-key',
resave: false,
saveUninitialized: false,
cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 } // 24 hours
}));

// File upload configuration for profile pictures
const storage = multer.diskStorage({
destination: function (req, file, cb) {
cb(null, path.join(__dirname, '../frontend/uploads/'))
},
filename: function (req, file, cb) {
cb(null, Date.now() + '-' + file.originalname)
}
});
const upload = multer({ storage: storage });

// Initialize database
const db = new Database();

// Ensure uploads directory exists
const fs = require('fs');
const uploadDir = path.join(__dirname, '../frontend/uploads');
if (!fs.existsSync(uploadDir)) {
fs.mkdirSync(uploadDir, { recursive: true });
}

// Socket.io for real-time chat during tests
const activeTests = new Map();

io.on('connection', (socket) => {
console.log('New client connected');

socket.on('join-test', (testId) => {
socket.join(test-${testId});
activeTests.set(socket.id, testId);
});

socket.on('chat-message', (data) => {
io.to(test-${data.testId}).emit('chat-message', {
user: data.user,
message: data.message,
timestamp: new Date()
});
});

socket.on('disconnect', () => {
activeTests.delete(socket.id);
});
});

// API Routes

// User authentication
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

if (user && await auth.verifyPassword(password, user.password)) {
  req.session.userId = user.id;
  req.session.username = user.username;
  req.session.isAdmin = user.is_admin === 1;
  
  res.json({ 
    success: true, 
    user: {
      id: user.id,
      username: user.username,
      isAdmin: user.is_admin === 1
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

app.get('/api/check-auth', (req, res) => {
if (req.session.userId) {
res.json({
authenticated: true,
username: req.session.username,
isAdmin: req.session.isAdmin
});
} else {
res.json({ authenticated: false });
}
});

// Profile management
app.get('/api/profile/:username', async (req, res) => {
try {
const profile = await db.getUserProfile(req.params.username);
res.json(profile);
} catch (error) {
res.status(404).json({ error: error.message });
}
});

app.post('/api/update-profile', upload.single('profilePicture'), async (req, res) => {
try {
if (!req.session.userId) {
return res.status(401).json({ error: 'Not authenticated' });
}

const { ign, timezone, preferredServer } = req.body;
let profilePicture = null;

if (req.file) {
  profilePicture = `/uploads/${req.file.filename}`;
}

await db.updateProfile(req.session.userId, ign, timezone, preferredServer, profilePicture);
res.json({ success: true });
} catch (error) {
res.status(400).json({ error: error.message });
}
});

app.post('/api/change-password', async (req, res) => {
try {
if (!req.session.userId) {
return res.status(401).json({ error: 'Not authenticated' });
}

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

// Leaderboard
app.get('/api/leaderboard', async (req, res) => {
try {
const leaderboard = await db.getLeaderboard();
res.json(leaderboard);
} catch (error) {
res.status(400).json({ error: error.message });
}
});

// Queue system
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

const user = await db.getUserById(req.session.userId);
const isTester = await db.isTester(req.session.userId);

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

// Admin routes
app.post('/api/admin/add-tester', async (req, res) => {
try {
if (!req.session.userId || !req.session.isAdmin) {
return res.status(403).json({ error: 'Not authorized' });
}

const { userId } = req.body;
await db.makeTester(userId);
res.json({ success: true });
} catch (error) {
res.status(400).json({ error: error.message });
}
});

app.get('/api/admin/tickets', async (req, res) => {
try {
if (!req.session.userId || !req.session.isAdmin) {
return res.status(403).json({ error: 'Not authorized' });
}

const tickets = await db.getTickets();
res.json(tickets);
} catch (error) {
res.status(400).json({ error: error.message });
}
});

// Forum routes
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
if (!req.session.userId) {
return res.status(401).json({ error: 'Not authenticated' });
}

const { title, content } = req.body;
const post = await db.createForumPost(req.session.userId, title, content);
res.json({ success: true, postId: post.id });
} catch (error) {
res.status(400).json({ error: error.message });
}
});

app.post('/api/forum/comment', async (req, res) => {
try {
if (!req.session.userId) {
return res.status(401).json({ error: 'Not authenticated' });
}

const { postId, content } = req.body;
const comment = await db.createForumComment(req.session.userId, postId, content);
res.json({ success: true });
} catch (error) {
res.status(400).json({ error: error.message });
}
});

// Initialize database with default users
async function initializeDatabase() {
try {
await db.init();

// Create admin user if not exists
const adminExists = await db.getUserByUsername('admin');
if (!adminExists) {
  const adminPassword = await auth.hashPassword('123123');
  await db.createUser('admin', adminPassword, 'AdminIGN', 'UTC', 'US', true);
}

// Create test users
const skibidibossExists = await db.getUserByUsername('SKIBIDIBOSS');
if (!skibidibossExists) {
  const skibidibossPassword = await auth.hashPassword('skibidiboss123');
  const user = await db.createUser('SKIBIDIBOSS', skibidibossPassword, 'SKIBIDIBOSS', 'UTC', 'US');
  await db.updateUserTiers(user.id, 'LT3', 'LT3', 'LT3', 'LT3', 'LT3');
  await db.makeTester(user.id);
}

const liningExists = await db.getUserByUsername('lining');
if (!liningExists) {
  const liningPassword = await auth.hashPassword('lining123');
  const user = await db.createUser('lining', liningPassword, 'lining123', 'UTC', 'US');
  await db.updateUserTiers(user.id, 'LT2', 'HT2', 'HT3', 'LT3', 'LT3');
  await db.makeTester(user.id);
}
} catch (error) {
console.error('Database initialization error:', error);
}
}

// Start server
const PORT = process.env.PORT || 3000;
initializeDatabase().then(() => {
server.listen(PORT, () => {
console.log(Server running on port ${PORT});
});
});
