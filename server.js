const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI).then(() => console.log("SKIBIDIBOSS X LINING DB CONNECTED"));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    ign: String,
    pfp: { type: String, default: 'https://i.imgur.com/6VBx3io.png' },
    role: { type: String, default: 'user' }, // admin, tester, user
    ranks: {
        sumo: { type: String, default: 'Unrated' },
        bedfight: { type: String, default: 'Unrated' },
        classic: { type: String, default: 'Unrated' }
    }
}));

const Queue = mongoose.model('Queue', new mongoose.Schema({
    username: String, ign: String, timezone: String, server: String, mode: String, status: { type: String, default: 'Pending' }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    username: String, text: String, role: String, createdAt: { type: Date, default: Date.now }
}));

// --- MIDDLEWARE ---
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'lining-secret', resave: false, saveUninitialized: true }));

// --- DYNAMIC TIER LOGIC ---
function calculateNewTier(testeeCurrent, testerTier, scoreY, scoreX) {
    // Example logic: if testee(Y) gets 2 rounds against HT2 tester(X)
    if (testerTier === 'HT2' && scoreY >= 2) return 'HT3';
    if (scoreY > scoreX) return testerTier; // Beat the tester? Take their rank.
    return testeeCurrent;
}

// --- ROUTES ---

// HUB (Leaderboard)
app.get('/', async (req, res) => {
    const players = await User.find({ role: 'user' }).sort({ "ranks.sumo": 1 });
    const chat = await Message.find().sort({ createdAt: -1 }).limit(20);
    res.render('index', { players, chat: chat.reverse(), user: req.session.user || null });
});

// SIGNUP
app.get('/signup', (req, res) => res.render('signup'));
app.post('/signup', async (req, res) => {
    const { username, password, ign, pfp } = req.body;
    await User.create({ username, password, ign, pfp, role: 'user' });
    res.redirect('/login');
});

// LOGIN
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === '123123' && password === '123123') {
        req.session.user = { username: 'Admin', role: 'admin' };
        return res.redirect('/admin');
    }
    const found = await User.findOne({ username, password });
    if (found) { req.session.user = found; res.redirect('/'); }
    else res.render('login', { error: 'Invalid credentials' });
});

// QUEUE & TESTER ACTIONS
app.post('/queue/join', async (req, res) => {
    await Queue.create(req.body);
    res.redirect('/');
});

app.post('/test/submit', async (req, res) => {
    const { testeeName, testerName, mode, scoreX, scoreY } = req.body;
    const testee = await User.findOne({ username: testeeName });
    const tester = await User.findOne({ username: testerName });
    
    const newTier = calculateNewTier(testee.ranks[mode], tester.ranks[mode], parseInt(scoreY), parseInt(scoreX));
    
    await User.findOneAndUpdate({ username: testeeName }, { [`ranks.${mode}`]: newTier });
    await Queue.findOneAndDelete({ username: testeeName });
    res.redirect('/');
});

app.listen(process.env.PORT || 3000);
