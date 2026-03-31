// ── State ──────────────────────────────────────────────
let currentUser = null;
let currentTestId = null;
let currentGamemode = null;
let socket = null;

// ── Init ───────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadLandingLeaderboard();
    initSocket();
});

function initSocket() {
    if (typeof io !== 'undefined') {
        socket = io();
        socket.on('chat-message', (data) => {
            appendChatMessage(data.user, data.message, data.user === currentUser?.username);
        });
    }
}

// ── Auth ───────────────────────────────────────────────
async function checkAuth() {
    try {
        const res = await fetch('/api/check-auth');
        const data = await res.json();
        if (data.authenticated) {
            currentUser = { username: data.username, isAdmin: data.isAdmin };
            updateSidebarAuth();
        }
    } catch (e) {}
}

function updateSidebarAuth() {
    if (currentUser) {
        document.getElementById('sidebarLoggedIn').style.display = 'block';
        document.getElementById('sidebarLoggedOut').style.display = 'none';
        document.getElementById('sidebarUsername').textContent = currentUser.username;
        document.getElementById('sidebarRole').textContent = currentUser.isAdmin ? 'admin' : 'player';
        document.getElementById('sidebarAvatar').textContent = currentUser.username[0].toUpperCase();
        if (currentUser.isAdmin) {
            document.getElementById('adminNavSection').style.display = 'block';
        }
        loadProfileData();
    } else {
        document.getElementById('sidebarLoggedIn').style.display = 'none';
        document.getElementById('sidebarLoggedOut').style.display = 'block';
        document.getElementById('adminNavSection').style.display = 'none';
    }
}

async function doLogin() {
    const username = document.getElementById('loginUsername').value.trim();
    const password = document.getElementById('loginPassword').value;
    const errEl = document.getElementById('loginError');
    errEl.innerHTML = '';
    if (!username || !password) { errEl.innerHTML = '<div class="error-msg">Fill in all fields</div>'; return; }
    try {
        const res = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = data.user;
            updateSidebarAuth();
            showPage(data.user.isAdmin ? 'admin' : 'gamemodes');
        } else {
            errEl.innerHTML = `<div class="error-msg">${data.error}</div>`;
        }
    } catch (e) {
        errEl.innerHTML = '<div class="error-msg">Login failed</div>';
    }
}

async function doSignup() {
    const username = document.getElementById('signupUsername').value.trim();
    const ign = document.getElementById('signupIgn').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirm = document.getElementById('signupConfirm').value;
    const errEl = document.getElementById('signupError');
    errEl.innerHTML = '';
    if (!username || !password) { errEl.innerHTML = '<div class="error-msg">Fill in all fields</div>'; return; }
    if (password !== confirm) { errEl.innerHTML = '<div class="error-msg">Passwords do not match</div>'; return; }
    if (password.length < 6) { errEl.innerHTML = '<div class="error-msg">Password must be at least 6 characters</div>'; return; }
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, ign: ign || username })
        });
        const data = await res.json();
        if (data.success) {
            currentUser = { username: data.user.username, isAdmin: false };
            updateSidebarAuth();
            showPage('gamemodes');
        } else {
            errEl.innerHTML = `<div class="error-msg">${data.error}</div>`;
        }
    } catch (e) {
        errEl.innerHTML = '<div class="error-msg">Signup failed</div>';
    }
}

async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    currentUser = null;
    updateSidebarAuth();
    showPage('landing');
}

// ── Navigation ─────────────────────────────────────────
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    const page = document.getElementById('page-' + name);
    if (page) page.classList.add('active');
    const nav = document.getElementById('nav-' + name);
    if (nav) nav.classList.add('active');

    // Load data for page
    if (name === 'leaderboard') loadLeaderboard('sumo', document.querySelector('#lbTabs .gm-tab'));
    if (name === 'queue') loadQueue();
    if (name === 'forum') loadForum();
    if (name === 'profile') loadProfileData();
    if (name === 'admin') loadAdminData();
    if (name === 'landing') loadLandingLeaderboard();

    window.scrollTo(0, 0);
}

// ── Leaderboard ────────────────────────────────────────
const RANK_COLORS = {
    lt5:'#6c6c6c',lt4:'#7a8a9a',lt3:'#4a9eff',lt2:'#9b59ff',lt1:'#ff9b3d',
    ht5:'#ff5e5e',ht4:'#ff3d9a',ht3:'#ff3dff',ht2:'#ffd700',ht1:'#ff6b00'
};

async function loadLandingLeaderboard() {
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        const players = data['sumo'] || [];
        const el = document.getElementById('landingLeaderboard');
        if (!el) return;
        if (players.length === 0) {
            el.innerHTML = '<div class="empty-state"><p>No ranked players yet</p></div>';
            return;
        }
        el.innerHTML = players.slice(0, 8).map((p, i) => `
            <div class="lb-row ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">
                <span class="lb-pos">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
                <span class="lb-name"><div style="width:32px;height:32px;border-radius:4px;background:var(--bg-elevated);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--accent);font-size:13px;">${p.username[0].toUpperCase()}</div>${p.username}</span>
                <span class="lb-ign">${p.ign || p.username}</span>
                <span class="rank-badge" style="color:${RANK_COLORS[p.rank]||'#fff'}">${(p.rank||'UNRATED').toUpperCase()}</span>
            </div>
        `).join('');
    } catch (e) {}
}

async function loadLeaderboard(gamemode, btn) {
    if (btn) {
        document.querySelectorAll('#lbTabs .gm-tab').forEach(t => t.classList.remove('active'));
        btn.classList.add('active');
    }
    try {
        const res = await fetch('/api/leaderboard');
        const data = await res.json();
        const players = data[gamemode] || [];
        const el = document.getElementById('leaderboardBody');
        if (players.length === 0) {
            el.innerHTML = '<div class="empty-state"><span class="empty-icon">👻</span><p>No ranked players in ' + gamemode + ' yet</p></div>';
            return;
        }
        el.innerHTML = players.map((p, i) => `
            <div class="lb-row ${i===0?'gold':i===1?'silver':i===2?'bronze':''}">
                <span class="lb-pos">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</span>
                <span class="lb-name"><div style="width:36px;height:36px;border-radius:4px;background:var(--bg-elevated);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--accent);font-size:14px;">${p.username[0].toUpperCase()}</div>${p.username}</span>
                <span class="lb-ign">${p.ign || p.username}</span>
                <span class="rank-badge" style="color:${RANK_COLORS[p.rank]||'#fff'}">${(p.rank||'UNRATED').toUpperCase()}</span>
            </div>
        `).join('');
    } catch (e) {}
}

// ── Queue ──────────────────────────────────────────────
function openQueueModal(gamemode) {
    if (!currentUser) { showPage('login'); return; }
    currentGamemode = gamemode;
    document.getElementById('queueModalTitle').textContent = 'JOIN ' + gamemode.toUpperCase() + ' QUEUE';
    document.getElementById('qIgn').value = '';
    document.getElementById('qTimezone').value = '';
    document.getElementById('qLeaderboardName').value = currentUser.username;
    document.getElementById('queueError').innerHTML = '';
    openModal('queueModal');
}

async function joinQueue() {
    const ign = document.getElementById('qIgn').value.trim();
    const timezone = document.getElementById('qTimezone').value;
    const preferredServer = document.getElementById('qServer').value;
    const username = document.getElementById('qLeaderboardName').value.trim();
    const errEl = document.getElementById('queueError');
    if (!ign || !timezone) { errEl.innerHTML = '<div class="error-msg">Fill in all required fields</div>'; return; }
    try {
        const res = await fetch('/api/join-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ign, timezone, preferredServer, username })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('queueModal');
            showPage('queue');
        } else {
            errEl.innerHTML = `<div class="error-msg">${data.error}</div>`;
        }
    } catch (e) {
        errEl.innerHTML = '<div class="error-msg">Failed to join queue</div>';
    }
}

async function loadQueue() {
    try {
        const res = await fetch('/api/queue');
        const queue = await res.json();
        const el = document.getElementById('queueList');
        if (queue.length === 0) {
            el.innerHTML = '<div class="empty-state"><span class="empty-icon">📋</span><p>No players in queue right now</p></div>';
            return;
        }
        const isTester = currentUser && (currentUser.isAdmin || currentUser.isTester);
        el.innerHTML = queue.map(q => `
            <div class="queue-card">
                <div class="queue-gm">${(q.gamemode||'QUEUE').toUpperCase()}</div>
                <div class="queue-info">
                    <span>👤 <strong>${q.username || q.queue_username}</strong></span>
                    <span>🎮 IGN: ${q.ign}</span>
                    <span>🌐 ${q.preferred_server}</span>
                    <span>🕐 ${q.timezone}</span>
                </div>
                ${isTester ? `<button class="btn btn-primary btn-sm" onclick="acceptTest('${q.id}')">✓ Accept</button>` : ''}
            </div>
        `).join('');
    } catch (e) {}
}

async function acceptTest(queueId) {
    try {
        const res = await fetch('/api/accept-test/' + queueId, { method: 'POST' });
        const data = await res.json();
        if (data.success) {
            currentTestId = data.testId;
            openTestRoom(data.testId);
        }
    } catch (e) {}
}

// ── Test Room ──────────────────────────────────────────
function openTestRoom(testId) {
    currentTestId = testId;
    document.getElementById('chatMessages').innerHTML = '';
    document.getElementById('testRoomInfo').textContent = 'Test ID: ' + testId;
    document.getElementById('submitScoreBtn').style.display = currentUser?.isAdmin || currentUser?.isTester ? 'block' : 'none';
    if (socket) socket.emit('join-test', testId);
    showPage('testroom');
}

function sendChat() {
    const input = document.getElementById('chatInput');
    const msg = input.value.trim();
    if (!msg || !socket) return;
    socket.emit('chat-message', { testId: currentTestId, user: currentUser.username, message: msg });
    input.value = '';
}

function appendChatMessage(sender, message, isOwn) {
    const el = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-msg' + (isOwn ? ' own' : '');
    div.innerHTML = `<div class="chat-sender">${sender}</div><div class="chat-bubble">${message}</div>`;
    el.appendChild(div);
    el.scrollTop = el.scrollHeight;
}

function openScoreModal() {
    document.getElementById('scoreTesterName').value = currentUser?.username || '';
    openModal('scoreModal');
}

async function submitScore() {
    const testerScore = document.getElementById('scoreTester').value;
    const testeeScore = document.getElementById('scoreTestee').value;
    const testerName = document.getElementById('scoreTesterName').value;
    const testeeName = document.getElementById('scoreTesteeName').value;
    const testeeIgn = document.getElementById('scoreTesteeIgn').value;
    const server = document.getElementById('scoreServer').value;
    if (!testerScore || !testeeScore || !testerName || !testeeName) return;
    try {
        const res = await fetch('/api/submit-test', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ testId: currentTestId, testerScore, testeeScore, testerName, testeeName, testeeIgn, server })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('scoreModal');
            appendChatMessage('SYSTEM', `✅ Test completed! Score: ${testerScore}-${testeeScore}`, false);
        }
    } catch (e) {}
}

// ── Forum ──────────────────────────────────────────────
async function loadForum() {
    try {
        const res = await fetch('/api/forum/posts');
        const posts = await res.json();
        const el = document.getElementById('forumList');
        if (posts.length === 0) {
            el.innerHTML = '<div class="empty-state"><span class="empty-icon">💬</span><p>No posts yet. Be first!</p></div>';
            return;
        }
        el.innerHTML = posts.map(p => `
            <div class="forum-post">
                <div style="width:40px;height:40px;border-radius:4px;background:var(--bg-elevated);border:2px solid var(--border);display:flex;align-items:center;justify-content:center;font-family:var(--font-display);font-weight:700;color:var(--accent);font-size:16px;flex-shrink:0;">${(p.username||'?')[0].toUpperCase()}</div>
                <div style="flex:1">
                    <div class="post-title">${p.title}</div>
                    <div class="post-meta">${p.username} · ${new Date(p.created_at).toLocaleDateString()}</div>
                    <div style="font-size:13px;color:var(--text-secondary);margin-top:4px;">${(p.content||'').substring(0,100)}${p.content?.length>100?'...':''}</div>
                </div>
            </div>
        `).join('');
    } catch (e) {}
}

async function submitPost() {
    const title = document.getElementById('postTitle').value.trim();
    const content = document.getElementById('postContent').value.trim();
    if (!title || !content) return;
    try {
        const res = await fetch('/api/forum/post', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, content })
        });
        const data = await res.json();
        if (data.success) {
            closeModal('newPostModal');
            document.getElementById('postTitle').value = '';
            document.getElementById('postContent').value = '';
            loadForum();
        }
    } catch (e) {}
}

// ── Profile ────────────────────────────────────────────
async function loadProfileData() {
    if (!currentUser) return;
    try {
        const res = await fetch('/api/profile/' + currentUser.username);
        const data = await res.json();
        document.getElementById('profileUsername').textContent = data.username || currentUser.username;
        document.getElementById('profileIgn').textContent = data.ign || currentUser.username;
        document.getElementById('profileRoleBadge').textContent = data.is_admin ? 'admin' : data.is_tester ? 'tester' : 'player';
        document.getElementById('editIgn').value = data.ign || '';

        if (data.profile_picture) {
            document.getElementById('profileAvatar').innerHTML = `<img src="${data.profile_picture}" alt="">`;
        } else {
            document.getElementById('profileAvatar').textContent = (data.username||'?')[0].toUpperCase();
        }

        const GAMEMODE_ICONS = { sumo:'⚔️',bedfight:'🛏️',classic:'🗡️',nodebuff:'💊',builduhc:'🏗️',spleef:'❄️' };
        const gamemodes = ['sumo','bedfight','classic','nodebuff','builduhc','spleef'];
        const ranksEl = document.getElementById('profileRanks');
        ranksEl.innerHTML = gamemodes.map(gm => {
            const rank = data.ranks && data.ranks[gm];
            return `
                <div class="rank-card">
                    <span style="font-size:22px">${GAMEMODE_ICONS[gm]}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;letter-spacing:2px;color:var(--text-dim);text-transform:uppercase;flex:1">${gm.toUpperCase()}</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${rank?RANK_COLORS[rank]:'var(--text-dim)'}">${rank?rank.toUpperCase():'UNRATED'}</span>
                </div>
            `;
        }).join('');
    } catch (e) {}
}

function toggleEditProfile() {
    const el = document.getElementById('editProfileArea');
    el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function saveProfile() {
    const ign = document.getElementById('editIgn').value.trim();
    try {
        const res = await fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ign })
        });
        const data = await res.json();
        if (data.success) {
            document.getElementById('profileIgn').textContent = ign;
            toggleEditProfile();
            showMsg('profileMsg', 'Profile updated!', 'success');
        }
    } catch (e) {}
}

async function uploadAvatar(input) {
    const file = input.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('profilePicture', file);
    try {
        const res = await fetch('/api/update-profile', { method: 'POST', body: fd });
        const data = await res.json();
        if (data.success) {
            loadProfileData();
            showMsg('profileMsg', 'Avatar updated!', 'success');
        }
    } catch (e) {}
}

async function changePassword() {
    const current = document.getElementById('pwCurrent').value;
    const next = document.getElementById('pwNew').value;
    const confirm = document.getElementById('pwConfirm').value;
    if (next !== confirm) { showMsg('pwMsg', 'Passwords do not match', 'error'); return; }
    if (next.length < 6) { showMsg('pwMsg', 'Min 6 characters', 'error'); return; }
    try {
        const res = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ currentPassword: current, newPassword: next })
        });
        const data = await res.json();
        if (data.success) {
            showMsg('pwMsg', 'Password changed!', 'success');
            document.getElementById('pwCurrent').value = '';
            document.getElementById('pwNew').value = '';
            document.getElementById('pwConfirm').value = '';
        } else {
            showMsg('pwMsg', data.error || 'Failed', 'error');
        }
    } catch (e) {}
}

// ── Admin ──────────────────────────────────────────────
async function loadAdminData() {
    if (!currentUser?.isAdmin) return;
    try {
        const [qRes, tRes] = await Promise.all([
            fetch('/api/queue'),
            fetch('/api/admin/tickets')
        ]);
        const queue = await qRes.json();
        const tickets = await tRes.json();

        document.getElementById('adminStats').innerHTML = `
            <div class="stat-card"><div class="stat-icon">📋</div><div class="stat-value">${queue.length}</div><div class="stat-label">In Queue</div></div>
            <div class="stat-card"><div class="stat-icon">🎫</div><div class="stat-value">${tickets.length}</div><div class="stat-label">Tickets</div></div>
            <div class="stat-card"><div class="stat-icon">⚔️</div><div class="stat-value">-</div><div class="stat-label">Active Tests</div></div>
        `;

        document.getElementById('adminTicketsTable').innerHTML = tickets.map(t => `
            <tr>
                <td style="font-family:var(--font-mono);font-size:12px">${t.username}</td>
                <td>${t.subject}</td>
                <td style="font-family:var(--font-mono);font-size:11px;color:${t.status==='open'?'#ffd700':'#6c6c6c'}">${t.status}</td>
                <td style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim)">${new Date(t.created_at).toLocaleDateString()}</td>
            </tr>
        `).join('');

        document.getElementById('adminQueueTable').innerHTML = queue.map(q => `
            <tr>
                <td style="font-family:var(--font-display);font-weight:600">${q.username||q.queue_username}</td>
                <td style="font-family:var(--font-mono);font-size:12px">${q.ign}</td>
                <td style="font-family:var(--font-mono);font-size:12px">${q.preferred_server}</td>
                <td style="font-family:var(--font-mono);font-size:11px;color:#ffd700">${q.status}</td>
                <td><button class="btn btn-primary btn-sm" onclick="acceptTest('${q.id}')">Accept</button></td>
            </tr>
        `).join('');
    } catch (e) {}
}

function switchAdminTab(name, btn) {
    document.querySelectorAll('.admin-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.admin-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('ap-' + name).classList.add('active');
}

async function addTester() {
    const username = document.getElementById('newTesterUsername').value.trim();
    const password = document.getElementById('newTesterPassword').value;
    const ign = document.getElementById('newTesterIgn').value.trim();
    const msgEl = document.getElementById('addTesterMsg');
    if (!username || !password) { msgEl.innerHTML = '<div class="error-msg">Username and password required</div>'; return; }
    try {
        const res = await fetch('/api/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password, ign: ign || username })
        });
        const data = await res.json();
        if (data.success) {
            await fetch('/api/admin/add-tester', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: data.user.id })
            });
            msgEl.innerHTML = '<div class="success-msg">Tester added!</div>';
            document.getElementById('newTesterUsername').value = '';
            document.getElementById('newTesterPassword').value = '';
            document.getElementById('newTesterIgn').value = '';
        } else {
            msgEl.innerHTML = `<div class="error-msg">${data.error}</div>`;
        }
    } catch (e) {
        msgEl.innerHTML = '<div class="error-msg">Failed to add tester</div>';
    }
}

// ── Modal Helpers ──────────────────────────────────────
function openModal(id) { document.getElementById(id).classList.add('open'); }
function closeModal(id) { document.getElementById(id).classList.remove('open'); }

document.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.classList.remove('open');
    }
});

// ── Message Helper ─────────────────────────────────────
function showMsg(elId, msg, type) {
    const el = document.getElementById(elId);
    if (!el) return;
    el.innerHTML = `<div class="${type}-msg">${msg}</div>`;
    setTimeout(() => { el.innerHTML = ''; }, 3000);
}
