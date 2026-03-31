const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const session = require('express-session'); // Install this: npm install express-session
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIG ---
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));

// SESSION SETUP (Temporary login memory)
app.use(session({
    secret: 'skibidiboss-secret-99',
    resave: false,
    saveUninitialized: true
}));

// --- DB CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ SKIBIDIBOSS SECURE DB CONNECTED"))
    .catch(err => console.error(err));

// --- USER MODEL (Updated for Passwords) ---
const User = mongoose.model('User', new mongoose.Schema({
    username: { type: String, unique: true },
    password: { type: String, required: true },
    role: { type: String, default: 'user' }, // 'admin', 'tester', 'user'
    tier: { type: String, default: 'Unranked' }
}));

// --- AUTH MIDDLEWARE ---
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'admin') next();
    else res.redirect('/login');
};

const isTester = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'tester' || req.session.user.role === 'admin')) next();
    else res.redirect('/login');
};

// --- ROUTES ---

// 1. LANDING PAGE
app.get('/', async (req, res) => {
    const users = await User.find({ role: 'user' }).sort({ tier: 1 });
    res.render('index', { users, currentUser: req.session.user });
});

// 2. LOGIN PAGE
app.get('/login', (req, res) => res.render('login', { error: null }));

app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    const user = await User.findOne({ username, password });
    if (user) {
        req.session.user = user;
        if (user.role === 'admin') return res.redirect('/admin');
        if (user.role === 'tester') return res.redirect('/tester');
        res.redirect('/');
    } else {
        res.render('login', { error: 'Invalid Credentials' });
    }
});

app.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/');
});

// 3. ADMIN PANEL (Protected)
app.get('/admin', isAdmin, async (req, res) => {
    const allUsers = await User.find();
    res.render('admin', { users: allUsers });
});

app.post('/admin/add', isAdmin, async (req, res) => {
    const { username, password, role, tier } = req.body;
    try {
        await User.create({ username, password, role, tier });
        res.redirect('/admin');
    } catch (e) { res.send("User already exists!"); }
});

app.post('/admin/delete', isAdmin, async (req, res) => {
    await User.findByIdAndDelete(req.body.userId);
    res.redirect('/admin');
});

// 4. TESTER PANEL (Protected)
app.get('/tester', isTester, async (req, res) => {
    const players = await User.find({ role: 'user' });
    res.render('tester', { users: players });
});

app.post('/tester/update', isTester, async (req, res) => {
    await User.findByIdAndUpdate(req.body.userId, { tier: req.body.newTier });
    res.redirect('/tester');
});

app.listen(PORT, () => console.log(`🚀 HUB SECURE ON PORT ${PORT}`));
