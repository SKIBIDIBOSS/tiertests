const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 1. DATABASE CONNECTION
// This uses the MONGODB_URI variable you just filled
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ DATABASE CONNECTED SUCCESSFULLY");
        app.listen(PORT, () => console.log(`🚀 SITE LIVE ON PORT ${PORT}`));
    })
    .catch(err => {
        console.error("❌ CONNECTION ERROR:", err.message);
    });

// 2. USER MODEL (For Tiers & Roles)
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    role: { type: String, default: 'user' }, // admin, tester, user
    tier: { type: String, default: 'Unranked' },
    isBanned: { type: Boolean, default: false }
}));

// 3. ROUTES
app.get('/', async (req, res) => {
    try {
        const users = await User.find({ isBanned: false }).sort({ tier: 1 });
        res.render('index', { users });
    } catch (err) {
        res.send("<h1>Connecting to Database...</h1><p>Please refresh in 5 seconds.</p>");
    }
});

app.get('/admin', async (req, res) => {
    try {
        const users = await User.find();
        res.render('admin', { users });
    } catch (err) {
        res.send("Error loading admin panel.");
    }
});

app.post('/admin/action', async (req, res) => {
    const { userId, action, tier } = req.body;
    if (action === 'ban') await User.findByIdAndUpdate(userId, { isBanned: true });
    if (action === 'updateTier') await User.findByIdAndUpdate(userId, { tier: tier });
    res.redirect('/admin');
});
