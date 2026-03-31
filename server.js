const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// --- DATABASE MODELS ---
const userSchema = new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    ign: String,
    role: { type: String, default: 'user' }, // user, tester, admin
    ranks: {
        sumo: { type: String, default: 'Unrated' },
        bedfight: { type: String, default: 'Unrated' },
        classic: { type: String, default: 'Unrated' }
    },
    pfp: { type: String, default: 'https://i.imgur.com/6VBx3io.png' }
});

const User = mongoose.model('User', userSchema);

// --- APP CONFIG ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'skibidi-secret', resave: false, saveUninitialized: true }));

// --- ROUTES ---

// 1. Landing Page (Leaderboard)
app.get('/', async (req, res) => {
    const players = await User.find({ role: 'user' });
    res.render('index', { players, user: req.session.user || null });
});

// 2. Login Logic
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    // Hardcoded Admin Login per your request
    if (username === '123123' && password === '123123') {
        req.session.user = { username: 'Admin', role: 'admin' };
        return res.redirect('/admin');
    }
    const found = await User.findOne({ username, password });
    if (found) {
        req.session.user = found;
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid Credentials' });
    }
});

// 3. Admin Panel
app.get('/admin', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/login');
    const allUsers = await User.find();
    res.render('admin', { users: allUsers });
});

// --- START SERVER ---
mongoose.connect(process.env.MONGODB_URI).then(() => {
    app.listen(process.env.PORT || 3000, () => console.log("SKIBIDIBOSS System Live"));
});
