const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// --- SETTINGS ---
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- DATABASE CONNECTION ---
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("✅ HUB DATABASE CONNECTED"))
    .catch(err => console.error("❌ CONNECTION ERROR:", err.message));

// --- USER MODEL ---
const User = mongoose.model('User', new mongoose.Schema({
    username: String,
    role: { type: String, default: 'user' },
    tier: { type: String, default: 'Unranked' },
    isBanned: { type: Boolean, default: false }
}));

// --- ROUTES ---

// Main Hub (Leaderboard + Sidebar + Chat)
app.get('/', async (req, res) => {
    try {
        const users = await User.find({ isBanned: false }).sort({ tier: 1 });
        // We pass fake 'stats' to make the UI look professional
        res.render('index', { 
            users: users,
            stats: { active: users.length + 5, queuing: 12, status: "Online" }
        });
    } catch (err) {
        res.render('index', { users: [], stats: { active: 0, queuing: 0, status: "Offline" } });
    }
});

// Admin Panel
app.get('/admin', async (req, res) => {
    const users = await User.find();
    res.render('admin', { users });
});

// Create/Update Logic for Admin
app.post('/admin/action', async (req, res) => {
    const { username, tier, role, action, userId } = req.body;
    if (action === 'create') await User.create({ username, tier, role });
    if (action === 'delete') await User.findByIdAndDelete(userId);
    res.redirect('/admin');
});

app.listen(PORT, () => console.log(`🚀 HUB ONLINE ON PORT ${PORT}`));
