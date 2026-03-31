const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIGURATION ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ SKIBIDIBOSS DB CONNECTED"))
    .catch(err => console.error("❌ DB ERROR:", err.message));

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    role: { type: String, default: 'user' }, // admin, tester, user
    tier: { type: String, default: 'Unranked' }
}));

// --- ROUTES ---

// 1. PUBLIC HUB (Leaderboard + Sidebar + Chat)
app.get('/', async (req, res) => {
    try {
        const users = await User.find().sort({ tier: 1 });
        res.render('index', { users });
    } catch (err) {
        res.render('index', { users: [] });
    }
});

// 2. ADMIN TERMINAL (Full Management)
app.get('/admin', async (req, res) => {
    const users = await User.find();
    res.render('admin', { users });
});

app.post('/admin/action', async (req, res) => {
    const { username, tier, role, action, userId } = req.body;
    if (action === 'create') await User.create({ username, tier, role });
    if (action === 'delete') await User.findByIdAndDelete(userId);
    res.redirect('/admin');
});

// 3. TESTER TERMINAL (Rank Updates Only)
app.get('/tester', async (req, res) => {
    const users = await User.find();
    res.render('tester', { users });
});

app.post('/tester/update', async (req, res) => {
    const { userId, newTier } = req.body;
    await User.findByIdAndUpdate(userId, { tier: newTier });
    res.redirect('/tester');
});

app.listen(PORT, () => console.log(`🚀 SKIBIDIBOSS ONLINE`));
