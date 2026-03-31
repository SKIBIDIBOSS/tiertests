// Get all users (admin only)
app.get('/api/users', async (req, res) => {
    try {
        if (!req.session.isAdmin) return res.status(403).json({ error: 'Not authorized' });
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Ban/delete user (admin only)
app.post('/api/ban-user/:userId', async (req, res) => {
    try {
        if (!req.session.isAdmin) return res.status(403).json({ error: 'Not authorized' });
        await db.deleteUser(req.params.userId);
        await db.deleteUserTiers(req.params.userId);
        await db.deleteUserQueueEntries(req.params.userId);
        await db.deleteUserTests(req.params.userId);
        await db.deleteUserForumPosts(req.params.userId);
        await db.deleteUserComments(req.params.userId);
        await db.deleteUserTickets(req.params.userId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Get user profile
app.get('/api/user/:userId', async (req, res) => {
    try {
        const user = await db.getUserById(req.params.userId);
        const profile = await db.getUserProfile(user.username);
        res.json(profile);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Update user tiers (admin only)
app.post('/api/admin/update-user-tiers/:userId', async (req, res) => {
    try {
        if (!req.session.isAdmin) return res.status(403).json({ error: 'Not authorized' });
        const { sumo, bedfight, classic, skywars, boxing } = req.body;
        await db.updateUserTiers(req.params.userId, sumo, bedfight, classic, skywars, boxing);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

// Ticket endpoints
app.post('/api/tickets', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { subject, message } = req.body;
        const ticket = await db.createTicket(req.session.userId, subject, message);
        res.json({ success: true, ticketId: ticket.id });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/tickets', async (req, res) => {
    try {
        if (!req.session.isAdmin) return res.status(403).json({ error: 'Not authorized' });
        const tickets = await db.getTickets();
        res.json(tickets);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/tickets/:ticketId', async (req, res) => {
    try {
        const ticket = await db.getTicketById(req.params.ticketId);
        if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/tickets/:ticketId/message', async (req, res) => {
    try {
        if (!req.session.userId) return res.status(401).json({ error: 'Not authenticated' });
        const { message } = req.body;
        await db.saveTicketMessage(req.params.ticketId, req.session.userId, message);
        
        const io = req.app.get('io');
        const user = await db.getUserById(req.session.userId);
        io.to('ticket-' + req.params.ticketId).emit('ticket-message', {
            username: req.session.username,
            message: message,
            isAdmin: req.session.isAdmin,
            isTester: await db.isTester(req.session.userId),
            timestamp: new Date()
        });
        
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.get('/api/tickets/:ticketId/messages', async (req, res) => {
    try {
        const messages = await db.getTicketMessages(req.params.ticketId);
        res.json(messages);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});

app.post('/api/tickets/:ticketId/close', async (req, res) => {
    try {
        if (!req.session.isAdmin) return res.status(403).json({ error: 'Not authorized' });
        const { sumo, bedfight, classic, skywars, boxing } = req.body;
        const ticket = await db.getTicketById(req.params.ticketId);
        await db.updateUserTiers(ticket.user_id, sumo, bedfight, classic, skywars, boxing);
        await db.closeTicket(req.params.ticketId);
        res.json({ success: true });
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
});
