const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.set('view engine', 'ejs');
app.use(express.static('public'));

// Basic Route to test if it's working
app.get('/', (req, res) => {
    res.send('<h1>Site is Live!</h1><p>Discord style coming soon.</p>');
});

const PORT = process.env.PORT || 3000;
const MONGO_URL = process.env.MONGODB_URI || "your_mongodb_url_here";

mongoose.connect(MONGO_URL).then(() => {
    server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(err => console.log(err));
