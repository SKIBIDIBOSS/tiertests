const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// --- CONFIGURATION ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE SCHEMA ---
const userSchema = new mongoose.Schema({
    username: String,
    role: { type: String, enum: ['admin', 'tester', 'user'], default: 'user' },
    tier: { type: String, default: 'Unranked' },
    isBanned: { type: Boolean, default: false },
    profileBio: { type: String, default: "No bio set." }
});
const User = mongoose.model('User', userSchema);

// --- ROUTES ---

// 1. Leaderboard & Profiles
app.get('/', async (req, res) => {
    try {
        const users = await User.find({ isBanned: false }).sort({ tier: 1 });
        res.render('index', { users });
    } catch (err) {
        res.status(500).send("Error loading leaderboard");
    }
});

// 2. Admin Panel (View & Manage Users)
app.get('/admin', async (req, res) => {
    const users = await User.find();
    res.render('admin', { users });
});

// 3. Admin Actions (Ban, Delete, Change Tier)
app.post('/admin/action', async (req, res) => {
    const { userId, action, tier } = req.body;
    if (action === 'ban') await User.findByIdAndUpdate(userId, { isBanned: true });
    if (action === 'delete') await User.findByIdAndDelete(userId);
    if (action === 'updateTier') await User.findByIdAndUpdate(userId, { tier: tier });
    res.redirect('/admin');
});

// 4. Ticket/Chat System
app.get('/ticket/:id', async (req, res) => {
    const player = await User.findById(req.params.id);
    res.render('ticket', { player });
});

// --- REAL-TIME CHAT (Socket.io) ---
io.on('connection', (socket) => {
    socket.on('joinTicket', (roomId) => socket.join(roomId));
    socket.on('sendMessage', (data) => {
        // data includes: room, message, username, role
        io.to(data.room).emit('receiveMessage', data);
    });
});

// --- SERVER START & DATABASE CONNECTION ---
const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI;

if (!MONGO_URI || MONGO_URI.includes("${{")) {
    console.log("⏳ Waiting for Railway to provide MONGODB_URI...");
} else {
    mongoose.connect(MONGO_URI)
        .then(() => {
            server.listen(PORT, () => {
                console.log(`🚀 Server live at: http://localhost:${PORT}`);
                console.log(`✅ Connected to MongoDB`);
            });
        })
        .catch(err => console.error("❌ DB Connection Error:", err));
}
