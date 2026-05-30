document.addEventListener('DOMContentLoaded', () => {
    const complaintsContainer = document.getElementById('complaints-container');
    const emptyState = document.getElementById('empty-state');
    const searchInput = document.getElementById('search-input');
    const statusFilter = document.getElementById('status-filter');
    const pendingCountEl = document.getElementById('pending-count');
    const resolvedCountEl = document.getElementById('resolved-count');
    const exportCsvBtn = document.getElementById('export-csv-btn');
    
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
    let wasteTypeChartInstance = null;
    let timelineChartInstance = null;

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
            const response = await fetch('https://garbage-reporting-system-2-0.onrender.com/api/complaints');
            if (!response.ok) throw new Error('Failed to fetch complaints');
            allComplaints = await response.json();
            renderComplaints();
            updateStats();
            renderCharts();
        } catch (error) {
            console.error('Error loading complaints:', error);
            // Optionally handle UI state for error
            allComplaints = [];
            renderComplaints();
            renderCharts();
        }
    }

    function renderCharts() {
        if (typeof Chart === 'undefined') return;
        
        const wasteTypes = {};
        const datesCount = {};
        
        allComplaints.forEach(c => {
            const wType = c.wasteType || 'Not Specified';
            wasteTypes[wType] = (wasteTypes[wType] || 0) + 1;
            
            const dateStr = new Date(c.date).toLocaleDateString();
            datesCount[dateStr] = (datesCount[dateStr] || 0) + 1;
        });

        const wtCtx = document.getElementById('wasteTypeChart');
        if (wtCtx) {
            if (wasteTypeChartInstance) wasteTypeChartInstance.destroy();
            wasteTypeChartInstance = new Chart(wtCtx, {
                type: 'doughnut',
                data: {
                    labels: Object.keys(wasteTypes),
                    datasets: [{
                        data: Object.values(wasteTypes),
                        backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#94a3b8'],
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { position: 'right', labels: { color: '#f8fafc' } } }
                }
            });
        }

        const tlCtx = document.getElementById('timelineChart');
        if (tlCtx) {
            if (timelineChartInstance) timelineChartInstance.destroy();
            
            const sortedDates = Object.keys(datesCount).sort((a,b) => new Date(a) - new Date(b));
            const dataValues = sortedDates.map(d => datesCount[d]);

            timelineChartInstance = new Chart(tlCtx, {
                type: 'bar',
                data: {
                    labels: sortedDates,
                    datasets: [{
                        label: 'Reports Filed',
                        data: dataValues,
                        backgroundColor: '#3b82f6',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, ticks: { stepSize: 1, color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
                        x: { ticks: { color: '#94a3b8' }, grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });
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
                ${comp.wasteType ? `
                <div class="complaint-waste-type" style="margin-top: 8px; margin-bottom: 12px; display: inline-flex; align-items: center; background: rgba(16, 185, 129, 0.1); color: var(--success-color); padding: 4px 10px; border-radius: 6px; font-size: 0.8rem; font-weight: 500;">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right: 4px;">
                        <path d="M3 6h18"></path><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                    ${comp.wasteType}
                </div>` : ''}
                <div class="complaint-desc" style="${!comp.wasteType ? 'margin-top: 12px;' : 'margin-top: 0px;'}">
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

    // Export to CSV functionality
    if (exportCsvBtn) {
        exportCsvBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (allComplaints.length === 0) {
                alert('No data available to export.');
                return;
            }

            // Define CSV headers
            const headers = ['ID', 'Date', 'Location', 'Waste Type', 'Description', 'Status'];
            
            // Map data to CSV rows
            const csvRows = allComplaints.map(comp => {
                const dateObj = new Date(comp.date);
                const formattedDate = dateObj.toLocaleDateString() + ' ' + dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
                
                // Escape quotes and wrap in quotes for safety
                const escapeCSV = (str) => {
                    if (!str) return '""';
                    return '"' + str.toString().replace(/"/g, '""') + '"';
                };

                return [
                    escapeCSV(comp.id),
                    escapeCSV(formattedDate),
                    escapeCSV(comp.location),
                    escapeCSV(comp.wasteType || 'Not Specified'),
                    escapeCSV(comp.description || ''),
                    escapeCSV(comp.status.toUpperCase())
                ].join(',');
            });

            // Combine headers and rows
            const csvContent = headers.join(',') + '\n' + csvRows.join('\n');
            
            // Create a Blob and trigger download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.setAttribute('href', url);
            link.setAttribute('download', `eco_report_data_${new Date().getTime()}.csv`);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }
});
