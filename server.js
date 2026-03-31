const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI).then(() => console.log("SKIBIDIBOSS X LINING ONLINE"));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    ign: String,
    pfp: { type: String, default: 'https://i.imgur.com/6VBx3io.png' },
    role: { type: String, default: 'user' },
    ranks: {
        sumo: { type: String, default: 'Unrated' },
        bedfight: { type: String, default: 'Unrated' },
        classic: { type: String, default: 'Unrated' }
    }
}));

const Queue = mongoose.model('Queue', new mongoose.Schema({
    username: String, ign: String, timezone: String, server: String, status: { type: String, default: 'Waiting' }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    username: String, text: String, role: String, createdAt: { type: Date, default: Date.now }
}));

// --- APP CONFIG ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'skibidi-lining-secret', resave: false, saveUninitialized: true }));

// --- DYNAMIC SCORING ENGINE ---
function updateTier(current, testerTier, scoreTester, scoreTestee) {
    const tiers = ['LT5', 'LT4', 'LT3', 'LT2', 'LT1', 'HT3', 'HT2', 'HT1'];
    // If testee gets 2+ rounds against HT2, they get HT3
    if (testerTier === 'HT2' && scoreTestee >= 2) return 'HT3';
    // If testee actually wins the set, they take the tester's rank
    if (scoreTestee > scoreTester) return testerTier;
    return current;
}

// --- ROUTES ---

app.get('/', async (req, res) => {
    const players = await User.find({ role: 'user' });
    const chat = await Message.find().sort({ createdAt: -1 }).limit(20);
    const queue = await Queue.find();
    res.render('index', { players, chat: chat.reverse(), queue, user: req.session.user || null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === '123123' && password === '123123') {
        req.session.user = { username: 'Admin', role: 'admin' };
        return res.redirect('/admin');
    }
    const found = await User.findOne({ username, password });
    if (found) { req.session.user = found; res.redirect('/'); }
    else res.redirect('/login');
});

app.post('/queue/join', async (req, res) => {
    await Queue.create(req.body);
    res.redirect('/');
});

app.get('/admin', async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'admin') return res.redirect('/');
    const users = await User.find();
    res.render('admin', { users });
});

app.post('/chat/send', async (req, res) => {
    if (req.session.user) {
        await Message.create({ username: req.session.user.username, text: req.body.text, role: req.session.user.role });
    }
    res.redirect('/');
});

app.listen(process.env.PORT || 3000);
