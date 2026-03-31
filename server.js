const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI).then(() => console.log("✅ SKIBIDIBOSS X LINING ONLINE"));

// --- USER MODEL (Enhanced) ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    ign: String,
    role: { type: String, default: 'user' }, // 'admin', 'tester', 'user'
    pfp: { type: String, default: 'https://i.imgur.com/6VBx3io.png' },
    ranks: {
        sumo: { type: String, default: 'Unrated' },
        bedfight: { type: String, default: 'Unrated' },
        classic: { type: String, default: 'Unrated' }
    }
}));

// --- CONFIG ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'ultra-secret-key', resave: false, saveUninitialized: true }));

// --- ROUTES ---

app.get('/', async (req, res) => {
    const players = await User.find({ role: 'user' }).sort({ "ranks.sumo": 1 });
    const chat = await User.find().limit(5); // Placeholder for chat
    res.render('index', { players, user: req.session.user || null });
});

// ADMIN PANEL: Create Testers
app.get('/admin', (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
    res.render('admin');
});

app.post('/admin/create-tester', async (req, res) => {
    const { username, password } = req.body;
    await User.create({ username, password, role: 'tester', ign: 'STAFF' });
    res.redirect('/');
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === '123123' && password === '123123') {
        req.session.user = { username: 'MasterAdmin', role: 'admin' };
        return res.redirect('/');
    }
    const found = await User.findOne({ username, password });
    if (found) { req.session.user = found; res.redirect('/'); }
    else res.redirect('/login');
});

app.get('/logout', (req, res) => { req.session.destroy(); res.redirect('/'); });

app.listen(process.env.PORT || 3000);
