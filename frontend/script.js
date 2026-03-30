let socket = null;
let currentTestId = null;
let currentUser = null;

// Check authentication on page load
async function checkAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (data.authenticated) {
            currentUser = data;
            document.getElementById('authLink').textContent = 'Logout';
            document.getElementById('authLink').href = '#';
            document.getElementById('dashboardLink').style.display = 'inline';
            document.getElementById('profileLink').style.display = 'inline';
            
            if (data.isAdmin) {
                const adminLink = document.getElementById('adminLink');
                if (adminLink) adminLink.style.display = 'inline';
            }
        } else {
            document.getElementById('authLink').textContent = 'Login';
            document.getElementById('authLink').href = '#';
            document.getElementById('dashboardLink').style.display = 'none';
            document.getElementById('profileLink').style.display = 'none';
        }
    } catch (error) {
        console.error('Auth check error:', error);
    }
}

// Load leaderboard
async function loadLeaderboard(gamemode = 'all') {
    try {
        const response = await fetch('/api/leaderboard');
        const data = await response.json();
        
        const leaderboardDiv = document.getElementById('leaderboard');
        leaderboardDiv.innerHTML = '';
        
        data.forEach((player, index) => {
            const tier = getTierForGamemode(player, gamemode);
            const item = document.createElement('div');
            item.className = 'leaderboard-item';
            item.innerHTML = `
                <div class="rank">#${index + 1}</div>
                <div class="username">${player.username}</div>
                <div class="tiers">
                    <span class="tier-badge tier-${tier.replace('/', '-')}">${tier}</span>
                </div>
            `;
            leaderboardDiv.appendChild(item);
        });
    } catch (error) {
        console.error('Error loading leaderboard:', error);
    }
}

function getTierForGamemode(player, gamemode) {
    switch(gamemode) {
        case 'sumo': return player.sumo_tier || 'Unrated';
        case 'bedfight': return player.bedfight_tier || 'Unrated';
        case 'classic': return player.classic_tier || 'Unrated';
        case 'skywars': return player.skywars_tier || 'Unrated';
        case 'boxing': return player.boxing_tier || 'Unrated';
        default: return 'Unrated';
    }
}

// Handle queue modal
document.getElementById('getTestedBtn')?.addEventListener('click', () => {
    if (!currentUser) {
        alert('Please login first');
        return;
    }
    document.getElementById('queueModal').style.display = 'block';
});

document.querySelectorAll('.close').forEach(closeBtn => {
    closeBtn.addEventListener('click', () => {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    });
});

// Queue form submission
document.getElementById('queueForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const queueData = {
        ign: document.getElementById('ign').value,
        timezone: document.getElementById('timezone').value,
        preferredServer: document.getElementById('preferredServer').value,
        username: document.getElementById('leaderboardUsername').value
    };
    
    try {
        const response = await fetch('/api/join-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(queueData)
        });
        
        const data = await response.json();
        if (data.success) {
            alert('Added to queue! A tester will contact you soon.');
            document.getElementById('queueModal').style.display = 'none';
            document.getElementById('queueForm').reset();
        }
    } catch (error) {
        console.error('Error joining queue:', error);
        alert('Error joining queue');
    }
});

// Authentication handling
document.getElementById('authLink')?.addEventListener('click', async (e) => {
    e.preventDefault();
    
    if (currentUser) {
        // Logout
        await fetch('/api/logout', { method: 'POST' });
        currentUser = null;
        window.location.reload();
    } else {
        // Show login modal
        showLoginModal();
    }
});

function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Login</h2>
            <form id="loginForm">
                <div class="form-group">
                    <label>Username:</label>
                    <input type="text" id="loginUsername" required>
                </div>
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" id="loginPassword" required>
                </div>
                <button type="submit" class="submit-btn">Login</button>
            </form>
            <p style="margin-top: 1rem; text-align: center;">
                Don't have an account? <a href="#" id="showRegister">Register</a>
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.querySelector('.close').onclick = () => modal.remove();
    
    document.getElementById('loginForm').onsubmit = async (e) => {
        e.preventDefault();
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            
            const data = await response.json();
            if (data.success) {
                modal.remove();
                window.location.reload();
            } else {
                alert('Invalid credentials');
            }
        } catch (error) {
            alert('Login error');
        }
    };
    
    document.getElementById('showRegister')?.addEventListener('click', (e) => {
        e.preventDefault();
        modal.remove();
        showRegisterModal();
    });
}

function showRegisterModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'block';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close">&times;</span>
            <h2>Register</h2>
            <form id="registerForm">
                <div class="form-group">
                    <label>Username:</label>
                    <input type="text" id="regUsername" required>
                </div>
                <div class="form-group">
                    <label>Password:</label>
                    <input type="password" id="regPassword" required>
                </div>
                <div class="form-group">
                    <label>IGN:</label>
                    <input type="text" id="regIgn" required>
                </div>
                <div class="form-group">
                    <label>Timezone:</label>
                    <input type="text" id="regTimezone" required>
                </div>
                <div class="form-group">
                    <label>Preferred Server:</label>
                    <select id="regServer">
                        <option value="US">US Server</option>
                        <option value="EU">EU Server</option>
                        <option value="ASIA">Asia Server</option>
                    </select>
                </div>
                <button type="submit" class="submit-btn">Register</button>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal
