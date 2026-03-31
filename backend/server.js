const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// Database Schema
const userSchema = new mongoose.Schema({
    username: String,
    role: { type: String, default: 'user' }, // admin, tester, user
    tier: { type: String, default: 'Unranked' },
    isBanned: { type: Boolean, default: false },
    wins: { type: Number, default: 0 }
});
const User = mongoose.model('User', userSchema);

// ROUTES
// 1. Leaderboard (Home)
app.get('/', async (req, res) => {
    const users = await User.find({ isBanned: false }).sort({ tier: 1, wins: -1 });
    res.render('index', { users });
});

// 2. Admin Panel
app.get('/admin', async (req, res) => {
    const users = await User.find();
    res.render('admin', { users });
});

// 3. Admin Actions (Ban/Tier/Delete)
app.post('/admin/action', async (req, res) => {
    const { userId, action, tier } = req.body;
    if (action === 'ban') await User.findByIdAndUpdate(userId, { isBanned: true });
    if (action === 'delete') await User.findByIdAndDelete(userId);
    if (action === 'updateTier') await User.findByIdAndUpdate(userId, { tier: tier });
    res.redirect('/admin');
});

// 4. Ticket System (Simple Chat Room)
app.get('/ticket/:id', async (req, res) => {
    const player = await User.findById(req.params.id);
    res.render('ticket', { player });
});

// Real-time Socket.io Chat
io.on('connection', (socket) => {
    socket.on('joinRoom', (room) => socket.join(room));
    socket.on('chatMessage', (data) => {
        io.to(data.room).emit('message', data);
    });
});

// Start Server
const PORT = process.env.PORT || 3000;
mongoose.connect(process.env.MONGODB_URI).then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
});
