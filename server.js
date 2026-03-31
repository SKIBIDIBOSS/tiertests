const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- CONFIG ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DB ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ SKIBIDIBOSS DB CONNECTED"))
    .catch(err => console.error("❌ DB ERROR:", err.message));

const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    role: { type: String, default: 'user' },
    tier: { type: String, default: 'Unranked' }
}));

// --- SECURITY KEY (Change 'skibidi123' to whatever you want) ---
const ADMIN_KEY = "skibidi123"; 

// --- ROUTES ---

// 1. LANDING PAGE (Leaderboard - Everyone sees this)
app.get('/', async (req, res) => {
    try {
        const users = await User.find().sort({ tier: 1 });
        res.render('index', { users });
    } catch (err) {
        res.render('index', { users: [] });
    }
} );

// 2. ADMIN TERMINAL (Protected)
app.get('/admin', async (req, res) => {
    if (req.query.key !== ADMIN_KEY) {
        return res.status(403).send("<h1>ACCESS DENIED</h1><p>You need the Staff Key to enter.</p>");
    }
    const users = await User.find();
    res.render('admin', { users, key: ADMIN_KEY });
});

app.post('/admin/action', async (req, res) => {
    const { username, tier, role, action, userId, key } = req.body;
    if (key !== ADMIN_KEY) return res.status(403).send("Invalid Key");
    
    if (action === 'create') await User.create({ username, tier, role });
    if (action === 'delete') await User.findByIdAndDelete(userId);
    res.redirect(`/admin?key=${ADMIN_KEY}`);
});

// 3. TESTER TERMINAL (Protected)
app.get('/tester', async (req, res) => {
    if (req.query.key !== ADMIN_KEY) return res.status(403).send("Access Denied");
    const users = await User.find();
    res.render('tester', { users, key: ADMIN_KEY });
});

app.post('/tester/update', async (req, res) => {
    const { userId, newTier, key } = req.body;
    if (key !== ADMIN_KEY) return res.status(403).send("Invalid Key");
    
    await User.findByIdAndUpdate(userId, { tier: newTier });
    res.redirect(`/tester?key=${ADMIN_KEY}`);
});

app.listen(PORT, () => console.log(`🚀 SKIBIDIBOSS HUB ONLINE`));
