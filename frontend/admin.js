let currentUsers = [];
let currentQueue = [];

// Check admin authentication
async function checkAdminAuth() {
    try {
        const response = await fetch('/api/check-auth');
        const data = await response.json();
        
        if (!data.authenticated || !data.isAdmin) {
            window.location.href = 'index.html';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Auth check error:', error);
        window.location.href = 'index.html';
        return false;
    }
}

// Load all users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users');
        const users = await response.json();
        currentUsers = users;
        displayUsers(users);
        populateUserSelects(users);
    } catch (error) {
        console.error('Error loading users:', error);
        document.getElementById('userList').innerHTML = '<p class="error-message">Error loading users</p>';
    }
}

// Display users in list
function displayUsers(users) {
    const searchTerm = document.getElementById('userSearch')?.value.toLowerCase() || '';
    const filteredUsers = users.filter(user => 
        user.username.toLowerCase().includes(searchTerm) ||
        (user.ign && user.ign.toLowerCase().includes(searchTerm))
    );
    
    const userListDiv = document.getElementById('userList');
    if (filteredUsers.length === 0) {
        userListDiv.innerHTML = '<p>No users found</p>';
        return;
    }
    
    userListDiv.innerHTML = filteredUsers.map(user => `
        <div class="user-item">
            <div>
                <strong>${user.username}</strong><br>
                IGN: ${user.ign || 'Not set'} | 
                Tester: ${user.is_tester ? 'Yes' : 'No'} | 
                Admin: ${user.is_admin ? 'Yes' : 'No'}
            </div>
            <div>
                <button class="admin-btn" onclick="showResetPassword('${user.username}')">Reset PW</button>
                <button class="admin-btn" onclick="editUserTiers('${user.username}')">Edit Tiers</button>
                <button class="admin-btn admin-btn-danger" onclick="deleteUser('${user.username}')">Delete</button>
            </div>
        </div>
    `).join('');
}

// Populate user select dropdowns
function populateUserSelects(users) {
    const tierSelect = document.getElementById('tierUserSelect');
    if (tierSelect) {
        tierSelect.innerHTML = '<option value="">Select a user...</option>' + 
            users.map(user => `<option value="${user.username}">${user.username}</option>`).join('');
    }
}

// Load queue
async function loadQueue() {
    try {
        const response = await fetch('/api/queue');
        const queue = await response.json();
        currentQueue = queue;
        displayQueue(queue);
    } catch (error) {
        console.error('Error loading queue:', error);
        document.getElementById('queueList').innerHTML = '<p class="error-message">Error loading queue</p>';
    }
}

// Display queue
function displayQueue(queue) {
    const queueListDiv = document.getElementById('queueList');
    if (queue.length === 0) {
        queueListDiv.innerHTML = '<p>No users in queue</p>';
        return;
    }
    
    queueListDiv.innerHTML = queue.map(entry => `
        <div class="queue-item">
            <div>
                <strong>${entry.username || entry.queue_username}</strong><br>
                IGN: ${entry.ign} | Server: ${entry.preferred_server} | Timezone: ${entry.timezone}
            </div>
            <div>
                <button class="admin-btn admin-btn-danger" onclick="removeFromQueue(${entry.id})">Remove</button>
            </div>
        </div>
    `).join('');
}

// Show reset password modal
function showResetPassword(username) {
    document.getElementById('resetUsername').value = username;
    document.getElementById('passwordResetModal').style.display = 'block';
}

// Reset user password
async function resetUserPassword() {
    const username = document.getElementById('resetUsername').value;
    const newPassword = document.getElementById('newPassword').value;
    
    try {
        const response = await fetch('/api/admin/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, newPassword })
        });
        
        const data = await response.json();
        if (data.success) {
            alert(data.message);
            document.getElementById('passwordResetModal').style.display = 'none';
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error resetting password: ' + error.message);
    }
}

// Delete user
async function deleteUser(username) {
    if (!confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone!`)) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/delete-user', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        if (data.success) {
            alert(data.message);
            loadUsers();
            loadQueue();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}

// Edit user tiers
async function editUserTiers(username) {
    try {
        const response = await fetch(`/api/admin/user-details/${username}`);
        const user = await response.json();
        
        document.getElementById('tierUserSelect').value = username;
        document.getElementById('editSumoTier').value = user.sumo_tier || 'Unrated';
        document.getElementById('editBedfightTier').value = user.bedfight_tier || 'Unrated';
        document.getElementById('editClassicTier').value = user.classic_tier || 'Unrated';
        document.getElementById('editSkywarsTier').value = user.skywars_tier || 'Unrated';
        document.getElementById('editBoxingTier').value = user.boxing_tier || 'Unrated';
        
        // Scroll to tier section
        document.querySelector('.admin-section:last-child').scrollIntoView({ behavior: 'smooth' });
    } catch (error) {
        alert('Error loading user details: ' + error.message);
    }
}

// Update tiers
async function updateTiers() {
    const username = document.getElementById('tierUserSelect').value;
    if (!username) {
        alert('Please select a user');
        return;
    }
    
    const tiers = {
        sumo: document.getElementById('editSumoTier').value,
        bedfight: document.getElementById('editBedfightTier').value,
        classic: document.getElementById('editClassicTier').value,
        skywars: document.getElementById('editSkywarsTier').value,
        boxing: document.getElementById('editBoxingTier').value
    };
    
    try {
        const response = await fetch('/api/admin/update-tiers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, tiers })
        });
        
        const data = await response.json();
        if (data.success) {
            alert(data.message);
            loadUsers();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error updating tiers: ' + error.message);
    }
}

// Remove from queue
async function removeFromQueue(queueId) {
    if (!confirm('Remove this user from queue?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/remove-from-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ queueId })
        });
        
        const data = await response.json();
        if (data.success) {
            alert(data.message);
            loadQueue();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error removing from queue: ' + error.message);
    }
}

// Clear all queue
async function clearAllQueue() {
    if (!confirm('WARNING: This will remove ALL users from the queue. Are you sure?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/admin/clear-queue', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        });
        
        const data = await response.json();
        if (data.success) {
            alert(data.message);
            loadQueue();
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        alert('Error clearing queue: ' + error.message);
    }
}

// Logout
async function logout() {
    await fetch('/api/logout', { method: 'POST' });
    window.location.href = 'index.html';
}

// Event listeners
document.addEventListener('DOMContentLoaded', async () => {
    const isAdmin = await checkAdminAuth();
    if (!isAdmin) return;
    
    await loadUsers();
    await loadQueue();
    
    // Set up event listeners
    document.getElementById('userSearch')?.addEventListener('input', () => displayUsers(currentUsers));
    document.getElementById('updateTierBtn')?.addEventListener('click', updateTiers);
    document.getElementById('clearAllQueueBtn')?.addEventListener('click', clearAllQueue);
    document.getElementById('confirmResetBtn')?.addEventListener('click', resetUserPassword);
    document.getElementById('logoutLink')?.addEventListener('click', logout);
    
    // Modal close buttons
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', () => {
            document.querySelectorAll('.modal').forEach(modal => {
                modal.style.display = 'none';
            });
        });
    });
});

// Make functions global for onclick handlers
window.showResetPassword = showResetPassword;
window.deleteUser = deleteUser;
window.editUserTiers = editUserTiers;
window.removeFromQueue = removeFromQueue;
