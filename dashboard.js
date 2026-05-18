document.addEventListener('DOMContentLoaded', () => {
    const complaintsContainer = document.getElementById('complaints-container');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const pendingCountEl = document.getElementById('pending-count');
    const resolvedCountEl = document.getElementById('resolved-count');
    
    // Modal elements
    const modal = document.getElementById('image-modal');
    const modalImg = document.getElementById('modal-image');
    const closeModalBtn = document.querySelector('.close-modal');

    // Login Elements
    const loginOverlay = document.getElementById('login-overlay');
    const dashboardMain = document.getElementById('dashboard-main');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');

    let allComplaints = [];

    // Check login state
    const isLoggedIn = sessionStorage.getItem('isAdminLoggedIn') === 'true';

    if (isLoggedIn) {
        showDashboard();
    }

    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('username').value;
            const pass = document.getElementById('password').value;

            if (user === 'Devang@123' && pass === '123456789') {
                sessionStorage.setItem('isAdminLoggedIn', 'true');
                showDashboard();
            } else {
                loginError.style.display = 'block';
            }
        });
    }

    function showDashboard() {
        if (loginOverlay) loginOverlay.style.display = 'none';
        if (dashboardMain) dashboardMain.style.display = 'block';
        loadComplaints();
    }

    // Load complaints from API
    async function loadComplaints() {
        try {
            const response = await fetch('/api/complaints');
            if (!response.ok) throw new Error('Failed to fetch complaints');
            allComplaints = await response.json();
            renderComplaints();
            updateStats();
        } catch (error) {
            console.error('Error loading complaints:', error);
            // Optionally handle UI state for error
            allComplaints = [];
            renderComplaints();
        }
    }

    function renderComplaints() {
        const searchTerm = searchInput.value.toLowerCase();
        const statusTerm = statusFilter.value;

        // Filter data
        const filtered = allComplaints.filter(comp => {
            const matchesSearch = comp.location.toLowerCase().includes(searchTerm) || 
                                  (comp.description && comp.description.toLowerCase().includes(searchTerm));
            const matchesStatus = statusTerm === 'all' || comp.status === statusTerm;
            return matchesSearch && matchesStatus;
        });

        // Clear container (except empty state which we will hide/show)
        complaintsContainer.innerHTML = '';

        if (filtered.length === 0) {
            complaintsContainer.appendChild(emptyState);
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            filtered.forEach(comp => {
                const card = createComplaintCard(comp);
                complaintsContainer.appendChild(card);
            });
        }
    }

    function createComplaintCard(comp) {
        const dateObj = new Date(comp.date);
        const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        const card = document.createElement('div');
        card.className = 'complaint-card';
        
        card.innerHTML = `
            <img src="${comp.image}" alt="Garbage at ${comp.location}" class="complaint-image" onclick="openModal('${comp.image}')">
            <div class="complaint-details">
                <div class="complaint-header">
                    <span class="complaint-date">${formattedDate}</span>
                    <span class="badge ${comp.status === 'pending' ? 'badge-pending' : 'badge-resolved'}">
                        ${comp.status}
                    </span>
                </div>
                <div class="complaint-location">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${comp.location}</span>
                </div>
                <div class="complaint-desc">
                    ${comp.description || 'No additional details provided.'}
                </div>
                <div class="complaint-actions">
                    ${comp.status === 'pending' ? 
                        `<button class="btn-primary resolve-btn" onclick="resolveComplaint('${comp.id}')">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 6px;">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                            Mark as Resolved
                        </button>` 
                        : 
                        `<div style="color: var(--success-color); font-weight: 500; display: flex; align-items: center; gap: 6px;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                                <polyline points="22 4 12 14.01 9 11.01"></polyline>
                            </svg>
                            Issue Resolved
                        </div>`
                    }
                </div>
            </div>
        `;
        return card;
    }

    function updateStats() {
        const pending = allComplaints.filter(c => c.status === 'pending').length;
        const resolved = allComplaints.filter(c => c.status === 'resolved').length;
        
        pendingCountEl.textContent = pending;
        resolvedCountEl.textContent = resolved;
    }

    // Global function to resolve complaint
    window.resolveComplaint = async function(id) {
        try {
            const response = await fetch(`/api/complaints/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ status: 'resolved' })
            });

            if (!response.ok) throw new Error('Failed to resolve complaint');

            const index = allComplaints.findIndex(c => c.id === id);
            if (index !== -1) {
                allComplaints[index].status = 'resolved';
                renderComplaints();
                updateStats();
            }
        } catch (error) {
            alert('Error updating status. Please try again.');
            console.error(error);
        }
    };

    // Global function to open modal
    window.openModal = function(imageSrc) {
        modal.style.display = 'block';
        modalImg.src = imageSrc;
    };

    // Close modal
    closeModalBtn.onclick = function() {
        modal.style.display = 'none';
    };

    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = 'none';
        }
    };

    // Event listeners for filters
    searchInput.addEventListener('input', renderComplaints);
    statusFilter.addEventListener('change', renderComplaints);
});
