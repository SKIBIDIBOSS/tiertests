const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- 1. SETTINGS & PATHS ---
// This tells the app where to find your "views" folder
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// This tells the app where to find images/css if you use them later
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- 2. DATABASE CONNECTION ---
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ DATABASE CONNECTED");
        app.listen(PORT, () => console.log(`🚀 LIVE AT: http://localhost:${PORT}`));
    })
    .catch(err => {
        console.error("❌ CONNECTION ERROR:", err.message);
    });

// --- 3. DATABASE SCHEMA (The "User" Blueprint) ---
const userSchema = new mongoose.Schema({
    username: String,
    role: { type: String, default: 'user' },    // Options: admin, tester, user
    tier: { type: String, default: 'Unranked' }, // Options: HT1, LT1, etc.
    isBanned: { type: Boolean, default: false }
});

const User = mongoose.model('User', userSchema);

// --- 4. ROUTES (The Pages) ---

// MAIN LEADERBOARD PAGE
app.get('/', async (req, res) => {
    try {
        // Fetch all users who are NOT banned, sorted by tier
        const users = await User.find({ isBanned: false }).sort({ tier: 1 });
        
        // Send the data to your index.ejs
        res.render('index', { users: users });
    } catch (err) {
        console.log("Error fetching users:", err);
        // If the database fails, send an empty list so the site still loads
        res.render('index', { users: [] });
    }
});

// ADMIN PANEL PAGE
app.get('/admin', async (req, res) => {
    try {
        const users = await User.find();
        res.render('admin', { users: users });
    } catch (err) {
        res.send("Error loading admin panel. Make sure admin.ejs exists in /views");
    }
});

// ADMIN ACTIONS (Ban, Update Tier, etc.)
app.post('/admin/action', async (req, res) => {
    const { userId, action, tier, username, role } = req.body;

    try {
        if (action === 'create') {
            await User.create({ username, role, tier });
        } else if (action === 'ban') {
            await User.findByIdAndUpdate(userId, { isBanned: true });
        } else if (action === 'updateTier') {
            await User.findByIdAndUpdate(userId, { tier: tier });
        } else if (action === 'delete') {
            await User.findByIdAndDelete(userId);
        }
        res.redirect('/admin');
    } catch (err) {
        res.status(500).send("Admin action failed.");
    }
});

// PROFILE / TICKET PAGE
app.get('/ticket/:id', async (req, res) => {
    try {
        const player = await User.findById(req.params.id);
        res.render('ticket', { player });
    } catch (err) {
        res.redirect('/');
    }
});
