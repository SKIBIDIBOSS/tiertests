const express = require('express');
const mongoose = require('mongoose');
const path = require('path'); // Required to find folders
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- THE FIX FOR THE WHITE SCREEN ---
// 1. Tell Express where the "views" folder is
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// 2. Tell Express where the "public" (CSS/Images) folder is
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE CONNECTION ---
const MONGO_URI = process.env.MONGODB_URI;

mongoose.connect(MONGO_URI)
    .then(() => {
        console.log("✅ DATABASE CONNECTED");
        app.listen(PORT, () => console.log(`🚀 SITE LIVE ON PORT ${PORT}`));
    })
    .catch(err => console.error("❌ DB ERROR:", err.message));

// --- DATA MODEL ---
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    role: { type: String, default: 'user' },
    tier: { type: String, default: 'Unranked' },
    isBanned: { type: Boolean, default: false }
}));

// --- ROUTES ---
app.get('/', async (req, res) => {
    try {
        // This looks for "views/index.ejs"
        const users = await User.find({ isBanned: false }).sort({ tier: 1 });
        res.render('index', { users }); 
    } catch (err) {
        res.status(500).send("Check logs: Database issue or missing index.ejs");
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
