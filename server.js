const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI).then(() => console.log("SKIBIDIBOSS X LINING SYSTEM ONLINE"));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String },
    ign: String,
    role: { type: String, default: 'user' }, // admin, tester, user
    ranks: {
        sumo: { type: String, default: 'Unrated' },
        bedfight: { type: String, default: 'Unrated' },
        classic: { type: String, default: 'Unrated' }
    }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    username: String, text: String, role: String, createdAt: { type: Date, default: Date.now }
}));

// --- CONFIG ---
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(session({ secret: 'skibidi-lining-ultra-secret', resave: false, saveUninitialized: true }));

// --- ROUTES ---
app.get('/', async (req, res) => {
    const players = await User.find({ role: 'user' });
    const chat = await Message.find().sort({ createdAt: -1 }).limit(30);
    res.render('index', { players, chat: chat.reverse(), user: req.session.user || null });
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (username === '123123' && password === '123123') {
        req.session.user = { username: 'Admin', role: 'admin' };
        return res.redirect('/');
    }
    const found = await User.findOne({ username, password });
    if (found) { req.session.user = found; res.redirect('/'); }
    else res.redirect('/');
});

app.post('/chat/send', async (req, res) => {
    if (req.session.user) {
        await Message.create({ 
            username: req.session.user.username, 
            text: req.body.text, 
            role: req.session.user.role 
        });
    }
    res.redirect('/');
});

app.listen(process.env.PORT || 3000);
