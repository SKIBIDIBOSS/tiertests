const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session'); 
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// LOGIN SYSTEM MEMORY
app.use(session({
    secret: 'skibidiboss-lining-ultra-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ SKIBIDIBOSS X LINING SYSTEM ONLINE"))
    .catch(err => console.error("❌ DB ERROR:", err));

// --- MODELS ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }, 
    tier: { type: String, default: 'Unranked' }
}));

const Message = mongoose.model('Message', new mongoose.Schema({
    username: String,
    text: String,
    role: String,
    createdAt: { type: Date, default: Date.now }
}));

// --- AUTH MIDDLEWARE ---
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') return next();
    res.redirect('/login');
};

// --- ROUTES ---

// HUB & FORUM
app.get('/', async (req, res) => {
    const users = await User.find({ role: 'user' }).sort({ tier: 1 });
    const chat = await Message.find().sort({ createdAt: -1 }).limit(30);
    res.render('index', { users, chat: chat.reverse(), user: req.session.user || null });
});

app.post('/chat/send', async (req, res) => {
    if (!req.session.user) return res.redirect('/login');
    await Message.create({
        username: req.session.user.username,
        text: req.body.text,
        role: req.session.user.role
    });
    res.redirect('/');
});

// ADMIN COMMAND
app.get('/admin', isAdmin, async (req, res) => {
    const users = await User.find();
    res.render('admin', { users });
});

app.post('/admin/add', isAdmin, async (req, res) => {
    const { username, password, role, tier } = req.body;
    try {
        await User.create({ username, password, role, tier });
        res.redirect('/admin');
    } catch (err) {
        res.send("User already exists or data error.");
    }
});

app.post('/admin/delete', isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.body.userId);
    res.redirect('/admin');
});

// LOGIN
app.get('/login', (req, res) => res.render('login', { error: null }));
app.post('/login', async (req, res) => {
    const user = await User.findOne({ username: req.body.username, password: req.body.password });
    if (user) { 
        req.session.user = user; 
        res.redirect(user.role === 'admin' ? '/admin' : '/'); 
    } else {
        res.render('login', { error: 'Invalid Credentials' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

app.listen(PORT, () => console.log(`🚀 SKIBIDIBOSS X LINING LIVE`));
