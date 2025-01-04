let map = null;
let marker = null;

// Initialize map with coordinates
function initMap(lat, lon) {
    // Remove existing map if it exists
    if (map) {
        map.remove();
    }

    // Create map instance
    map = L.map('map', {
        center: [lat, lon],
        zoom: 13,
        zoomControl: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add marker
    marker = L.marker([lat, lon]).addTo(map);

    // Force refresh
    setTimeout(() => {
        map.invalidateSize(true);
    }, 100);
}

// Copy to clipboard functionality
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('IP copied to clipboard!', 'success');
    } catch (err) {
        showToast('Failed to copy', 'error');
    }
}

// Show toast notification
function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = 'position-fixed top-0 end-0 p-3';
    toast.style.zIndex = 1000;
    
    const bgColor = type === 'success' ? 'bg-success' : 
                    type === 'error' ? 'bg-danger' : 
                    'bg-dark';
    
    toast.innerHTML = `
        <div class="toast show ${bgColor} text-white" role="alert">
            <div class="toast-body d-flex justify-content-between align-items-center">
                <span>${message}</span>
                <button type="button" class="btn-close btn-close-white ms-3" onclick="this.parentElement.parentElement.remove()"></button>
            </div>
        </div>
    `;
    
    document.body.appendChild(toast);
    setTimeout(() => {
        toast.classList.add('fade');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

// Handle search functionality
async function searchIP() {
    const searchInput = document.getElementById('ip-search');
    const ip = searchInput.value.trim();
    
    if (!ip) {
        showToast('Please enter an IP address', 'error');
        return;
    }

    try {
        const response = await fetch(`/api/ip-info/?ip=${encodeURIComponent(ip)}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            updateUIWithData(data);
            searchInput.value = '';
        } else {
            showToast('Invalid IP address', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error fetching IP information', 'error');
    }
}

// Handle Enter key press
function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        searchIP();
    }
}

// Update UI with data
function updateUIWithData(data) {
    try {
        // Update main IP info section
        document.querySelector('.ip-info-content').innerHTML = `
            <div class="ip-info-header">My IP Information:</div>
            <div class="ip-info-row">
                <div class="info-label">IPv4:</div>
                <div class="info-value" id="ip-display">
                    ${data.query}
                    <button onclick="copyToClipboard('${data.query}')" class="btn btn-primary btn-sm ms-2">
                        Copy IP
                    </button>
                </div>
            </div>
            <div class="ip-info-row">
                <div class="info-label">IPv6:</div>
                <div class="info-value">Not detected</div>
            </div>
            <div class="ip-details">
                <div class="detail-row">
                    <span class="detail-label">ISP:</span>
                    <span class="detail-value">${data.isp || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">City:</span>
                    <span class="detail-value">${data.city || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Region:</span>
                    <span class="detail-value">${data.regionName || 'N/A'}</span>
                </div>
                <div class="detail-row">
                    <span class="detail-label">Country:</span>
                    <span class="detail-value">${data.country || 'N/A'}</span>
                </div>
            </div>
        `;

        // Update location information
        const locationFields = {
            'location-country': data.country,
            'location-region': data.regionName,
            'location-city': data.city,
            'location-postal': data.zip,
            'location-coordinates': `${data.lat}, ${data.lon}`
        };

        Object.entries(locationFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'N/A';
            }
        });

        // Update network information
        const networkFields = {
            'org': data.org || data.isp,
            'as': data.as,
            'timezone': data.timezone
        };

        Object.entries(networkFields).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value || 'N/A';
            }
        });

        // Update map and location text
        if (data.lat && data.lon) {
            initMap(parseFloat(data.lat), parseFloat(data.lon));
            const locationElement = document.getElementById('location');
            if (locationElement) {
                locationElement.textContent = `${data.city}, ${data.regionName}, ${data.country}`;
            }
        }

    } catch (error) {
        console.error('Error updating UI:', error);
        showToast('Error updating information', 'error');
    }
}

// Fetch initial IP info
async function fetchIPInfo() {
    try {
        const response = await fetch('/api/ip-info/');
        const data = await response.json();
        
        if (data.status === 'success' || data.query) {
            updateUIWithData(data);
        } else {
            console.error('Invalid data received:', data);
            showToast('Error loading IP information', 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showToast('Error fetching IP information', 'error');
    }
}

// Handle feature card clicks
function handleFeatureCardClick(event) {
    const card = event.currentTarget;
    const action = card.dataset.action;

    switch(action) {
        case 'proxy':
            showToast('Checking proxy/VPN status...', 'info');
            break;
        case 'speed':
            showToast('Initiating speed test...', 'info');
            break;
        case 'threat':
            showToast('Analyzing IP reputation...', 'info');
            break;
        case 'domain':
            showToast('Performing reverse DNS lookup...', 'info');
            break;
        case 'ping':
            showToast('Loading network tools...', 'info');
            break;
        case 'api':
            showToast('Opening API documentation...', 'info');
            break;
    }
}

// Handle card hover effects
function handleCardHover(event) {
    const card = event.currentTarget;
    card.style.transform = 'translateY(-5px)';
    card.style.boxShadow = '0 12px 20px rgba(0,0,0,0.15)';
    
    const icon = card.querySelector('.card-icon');
    if (icon) {
        icon.style.transform = 'scale(1.1) rotate(10deg)';
    }
}

function handleCardLeave(event) {
    const card = event.currentTarget;
    card.style.transform = '';
    card.style.boxShadow = '';
    
    const icon = card.querySelector('.card-icon');
    if (icon) {
        icon.style.transform = '';
    }
}

// Initialize all features on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize map with default location (will be updated when IP data is loaded)
    initMap(40.7128, -74.0060);
    
    // Fetch IP information
    fetchIPInfo();
    
    // Add event listeners to feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', handleFeatureCardClick);
        card.addEventListener('mouseenter', handleCardHover);
        card.addEventListener('mouseleave', handleCardLeave);
    });
});



// Handle logo click for smooth scrolling
document.addEventListener('DOMContentLoaded', function() {
    const logoLink = document.querySelector('.logo-link');
    
    if (logoLink) {
        logoLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // If we're already at the top, refresh the page
            if (window.scrollY === 0) {
                window.location.reload();
                return;
            }
            
            // Smooth scroll to top
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            
            // Update URL without reload
            history.pushState(null, '', window.location.pathname);
        });
    }
});

// Additional scroll-to-top behavior
window.addEventListener('scroll', function() {
    const logoLink = document.querySelector('.logo-link');
    if (logoLink) {
        if (window.scrollY > 100) {
            logoLink.classList.add('scrolled');
        } else {
            logoLink.classList.remove('scrolled');
        }
    }
});