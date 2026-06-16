const AUTH_KEY = 'luxe_hotel_user';

function getCurrentUser() {
    const userStr = localStorage.getItem(AUTH_KEY);
    if (userStr) {
        try {
            return JSON.parse(userStr);
        } catch (e) {
            return null;
        }
    }
    return null;
}

function loginUser(user) {
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
}

function logoutUser() {
    localStorage.removeItem(AUTH_KEY);
    window.location.href = 'index.html';
}

function updateNav() {
    const user = getCurrentUser();
    const navUl = document.querySelector('nav ul');
    if (!navUl) return;

    if (user) {
        let adminLink = '';
        let manageLink = '<li><a href="manage.html">My Bookings</a></li>';
        if (user.role === 'ADMIN') {
            adminLink = '<li><a href="admin.html" style="color: var(--accent); font-weight: bold;">Admin Dashboard</a></li>';
            manageLink = '<li><a href="manage.html">Manage Bookings</a></li>';
        }
        navUl.innerHTML = `
            <li><a href="index.html">Home</a></li>
            ${manageLink}
            ${adminLink}
            <li style="color: var(--primary); font-weight: bold; margin-left: 1rem;">Welcome, ${user.name}</li>
            <li><a href="#" onclick="logoutUser()">Logout</a></li>
        `;
    } else {
        navUl.innerHTML = `
            <li><a href="index.html">Home</a></li>
            <li><a href="manage.html">Manage Bookings</a></li>
            <li><a href="login.html" class="btn" style="padding: 0.5rem 1rem; margin-left: 1rem;">Login</a></li>
            <li><a href="register.html" class="btn btn-secondary" style="padding: 0.5rem 1rem;">Register</a></li>
        `;
    }
}

document.addEventListener('DOMContentLoaded', updateNav);
