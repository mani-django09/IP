let map = null;
let mapMobile = null;
let marker = null;
let markerMobile = null;

// Initialize map with coordinates
function initMap(lat, lon, isMobile = false) {
    const mapId = isMobile ? 'map-mobile' : 'map';
    const currentMap = isMobile ? mapMobile : map;
    
    // Remove existing map if it exists
    if (currentMap) {
        currentMap.remove();
    }

    // Create map instance
    const newMap = L.map(mapId, {
        center: [lat, lon],
        zoom: 13,
        zoomControl: true
    });

    // Add tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(newMap);

    // Add marker
    const newMarker = L.marker([lat, lon]).addTo(newMap);

    // Force refresh
    setTimeout(() => {
        newMap.invalidateSize(true);
    }, 100);

    // Update references
    if (isMobile) {
        mapMobile = newMap;
        markerMobile = newMarker;
    } else {
        map = newMap;
        marker = newMarker;
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

// Handle search functionality with focused loading spinner
async function searchIP() {
    const searchInput = document.getElementById('ip-search');
    const ip = searchInput.value.trim();
    
    if (!ip) {
        showToast('Please enter an IP address', 'error');
        return;
    }

    // Find target elements to show loading state
    const ipInfoContent = document.querySelector('.ip-info-content');
    const mapContainer = document.querySelector('.map-container');
    const mapContainerMobile = document.querySelector('.map-container-mobile');
    const locationInfo = document.getElementById('location-country')?.closest('.info-panel');
    const networkInfo = document.getElementById('org')?.closest('.info-panel');
    
    // Create loading spinners for each section
    if (ipInfoContent) {
        const originalContent = ipInfoContent.innerHTML;
        ipInfoContent.innerHTML = `
            <div class="section-loading">
                <div class="spinner-border text-primary" role="status" style="width: 3rem; height: 3rem;">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-3 text-light">Looking up IP information...</p>
            </div>
        `;
        ipInfoContent.classList.add('loading-state');
    }
    
    // Add loading state to map containers
    [mapContainer, mapContainerMobile].forEach(container => {
        if (container) {
            const loadingOverlay = document.createElement('div');
            loadingOverlay.className = 'map-loading-overlay';
            loadingOverlay.innerHTML = `
                <div class="spinner-border text-light" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            `;
            container.appendChild(loadingOverlay);
        }
    });
    
    // Add loading state to location and network info panels
    [locationInfo, networkInfo].forEach(panel => {
        if (panel) {
            panel.classList.add('loading-panel');
        }
    });

    // Add CSS for loading states if it doesn't exist
    if (!document.getElementById('loading-spinner-styles')) {
        const style = document.createElement('style');
        style.id = 'loading-spinner-styles';
        style.innerHTML = `
            .loading-state {
                position: relative;
                min-height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(27, 74, 107, 0.7);
                border-radius: 15px;
            }
            
            .section-loading {
                text-align: center;
                padding: 2rem;
            }
            
            .map-loading-overlay {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                border-radius: 15px;
            }
            
            .loading-panel {
                position: relative;
            }
            
            .loading-panel::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(255, 255, 255, 0.7);
                border-radius: 15px;
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10;
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 50 50'%3E%3Cpath fill='%231b4a6b' d='M25.251,6.461c-10.318,0-18.683,8.365-18.683,18.683h4.068c0-8.071,6.543-14.615,14.615-14.615V6.461z'%3E%3CanimateTransform attributeType='xml' attributeName='transform' type='rotate' from='0 25 25' to='360 25 25' dur='0.6s' repeatCount='indefinite'/%3E%3C/path%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-position: center;
            }
            
            @keyframes highlight-pulse {
                0% { 
                    box-shadow: 0 0 0 0 rgba(42, 159, 214, 0.7);
                    transform: translateY(0);
                }
                50% {
                    box-shadow: 0 0 15px 5px rgba(42, 159, 214, 0.5);
                    transform: translateY(-5px);
                }
                100% { 
                    box-shadow: 0 0 0 0 rgba(42, 159, 214, 0);
                    transform: translateY(0);
                }
            }
            
            .highlight-pulse {
                animation: highlight-pulse 2s ease-in-out;
            }
            
            @keyframes map-highlight {
                0% { border-color: rgba(255, 255, 255, 0.1); }
                50% { border-color: rgba(42, 159, 214, 0.8); }
                100% { border-color: rgba(255, 255, 255, 0.1); }
            }
            
            .map-highlight {
                animation: map-highlight 2s ease-in-out;
            }
            
            .loading-row {
                position: relative;
                overflow: hidden;
            }
            
            .loading-row::after {
                content: "";
                position: absolute;
                top: 0;
                left: 0;
                height: 100%;
                width: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                animation: loading-shine 1.5s infinite;
            }
            
            @keyframes loading-shine {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
        `;
        document.head.appendChild(style);
    }

    try {
        // Add artificial delay (1.5 seconds) for better UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        const response = await fetch(`/api/ip-info/?ip=${encodeURIComponent(ip)}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            // Clear loading states
            clearLoadingStates();
            
            // Update UI with data
            updateUIWithData(data);
            searchInput.value = '';
            
            // Scroll to IP info section with smooth animation
            const ipInfoSection = document.getElementById('my-ip');
            if (ipInfoSection) {
                ipInfoSection.scrollIntoView({ 
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        } else {
            // Clear loading states
            clearLoadingStates();
            showToast('Invalid IP address', 'error');
        }
    } catch (error) {
        // Clear loading states in case of error
        clearLoadingStates();
        console.error('Error:', error);
        showToast('Error fetching IP information', 'error');
    }
}

// Function to clear all loading states
function clearLoadingStates() {
    // Remove loading state from IP info content
    const ipInfoContent = document.querySelector('.ip-info-content');
    if (ipInfoContent) {
        ipInfoContent.classList.remove('loading-state');
    }
    
    // Remove loading overlays from map containers
    document.querySelectorAll('.map-loading-overlay').forEach(overlay => {
        overlay.remove();
    });
    
    // Remove loading state from info panels
    document.querySelectorAll('.loading-panel').forEach(panel => {
        panel.classList.remove('loading-panel');
    });
}

// Handle Enter key press
function handleSearchKeyPress(event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent form submission if in a form
        searchIP();
    }
}

// Update UI with data and add focus effects
function updateUIWithData(data) {
    try {
        // Sequential update with small delays for a nice visual effect
        setTimeout(() => {
            // Update the main IP information - with horizontal layout for ISP, city, region, country
            document.querySelector('.ip-info-content').innerHTML = `
                <div class="ip-info-header"><i class="fas fa-network-wired me-2"></i>My IP Information:</div>
                <div class="ip-info-row">
                    <div class="info-label">IPv4:</div>
                    <div class="info-value" id="ip-display">${data.query}</div>
                </div>
                <div class="ip-info-row">
                    <div class="info-label">IPv6:</div>
                    <div class="info-value">Not detected</div>
                </div>
                
                <!-- Horizontal details layout -->
                <div class="ip-details-horizontal">
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-wifi"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">ISP:</span>
                            <span class="detail-value">${data.isp || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-map-marker-alt"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">City:</span>
                            <span class="detail-value">${data.city || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-globe"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">Region:</span>
                            <span class="detail-value">${data.regionName || 'N/A'}</span>
                        </div>
                    </div>
                    
                    <div class="detail-item">
                        <div class="detail-icon">
                            <i class="fas fa-flag"></i>
                        </div>
                        <div class="detail-content">
                            <span class="detail-label">Country:</span>
                            <span class="detail-value">${data.country || 'N/A'}</span>
                        </div>
                    </div>
                </div>`;
            
            // Add CSS for horizontal layout if it doesn't exist
            if (!document.getElementById('horizontal-details-styles')) {
                const style = document.createElement('style');
                style.id = 'horizontal-details-styles';
                style.innerHTML = `
                    .ip-details-horizontal {
                        display: flex;
                        flex-wrap: wrap;
                        gap: 10px;
                        margin-top: 15px;
                        background: rgba(255, 255, 255, 0.1);
                        border-radius: 10px;
                        padding: 15px;
                    }
                    
                    .ip-details-horizontal .detail-item {
                        display: flex;
                        align-items: center;
                        flex: 1 1 auto;
                        min-width: calc(50% - 10px);
                        padding: 8px;
                        background: rgba(255, 255, 255, 0.05);
                        border-radius: 8px;
                        transition: all 0.3s ease;
                    }
                    
                    .ip-details-horizontal .detail-item:hover {
                        background: rgba(255, 255, 255, 0.1);
                        transform: translateY(-3px);
                    }
                    
                    .ip-details-horizontal .detail-icon {
                        background: rgba(42, 159, 214, 0.2);
                        width: 30px;
                        height: 30px;
                        border-radius: 8px;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        margin-right: 10px;
                    }
                    
                    .ip-details-horizontal .detail-content {
                        display: flex;
                        flex-direction: column;
                    }
                    
                    .ip-details-horizontal .detail-label {
                        color: rgba(255, 255, 255, 0.7);
                        font-size: 0.8rem;
                    }
                    
                    .ip-details-horizontal .detail-value {
                        color: white;
                        font-size: 0.95rem;
                        font-weight: 500;
                    }
                    
                    @media (max-width: 768px) {
                        .ip-details-horizontal .detail-item {
                            min-width: 100%;
                        }
                    }
                `;
                document.head.appendChild(style);
            }

            // Add highlight effect to IP info box
            const ipInfoBox = document.querySelector('.ip-info-box');
            if (ipInfoBox) {
                ipInfoBox.classList.add('highlight-pulse');
                setTimeout(() => {
                    ipInfoBox.classList.remove('highlight-pulse');
                }, 2000);
            }
            
            // After a small delay, update the location information
            setTimeout(() => {
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
                        // Add a brief highlight effect to each updated field
                        element.style.backgroundColor = 'rgba(42, 159, 214, 0.2)';
                        setTimeout(() => {
                            element.style.backgroundColor = '';
                        }, 1000);
                    }
                });

                // After another delay, update the network information
                setTimeout(() => {
                    // Update network information
                    const networkFields = {
                        'org': data.org || data.isp,
                        'as': data.as,
                        'timezone': data.timezone,
                        'connection-type': 'Broadband', // This is just an example, update as needed
                        'domain': data.domain || 'N/A'
                    };

                    Object.entries(networkFields).forEach(([id, value]) => {
                        const element = document.getElementById(id);
                        if (element) {
                            element.textContent = value || 'N/A';
                            // Add a brief highlight effect to each updated field
                            element.style.backgroundColor = 'rgba(42, 159, 214, 0.2)';
                            setTimeout(() => {
                                element.style.backgroundColor = '';
                            }, 1000);
                        }
                    });

                    // Finally, update the maps
                    setTimeout(() => {
                        // Update both desktop and mobile maps
                        if (data.lat && data.lon) {
                            initMap(parseFloat(data.lat), parseFloat(data.lon), false); // Desktop map
                            initMap(parseFloat(data.lat), parseFloat(data.lon), true);  // Mobile map
                            
                            // Add highlight effect to map containers
                            const mapContainers = document.querySelectorAll('.map-container, .map-container-mobile');
                            mapContainers.forEach(container => {
                                container.classList.add('map-highlight');
                                setTimeout(() => {
                                    container.classList.remove('map-highlight');
                                }, 2000);
                            });
                            
                            // Update location text for both maps
                            const locationText = `${data.city}, ${data.regionName}, ${data.country}`;
                            const locationElement = document.getElementById('location');
                            const locationMobileElement = document.getElementById('location-mobile');
                            
                            if (locationElement) {
                                locationElement.textContent = locationText;
                            }
                            if (locationMobileElement) {
                                locationMobileElement.textContent = locationText;
                            }
                        }
                    }, 200);
                }, 200);
            }, 200);
        }, 200);
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
        case 'detect':
            fetchIPInfo();
            setTimeout(() => {
                const ipInfoSection = document.getElementById('my-ip');
                if (ipInfoSection) {
                    ipInfoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }, 500);
            break;
        case 'geo':
            const mapContainers = document.querySelectorAll('.map-container, .map-container-mobile');
            mapContainers.forEach(container => {
                container.classList.add('map-highlight');
                setTimeout(() => {
                    container.classList.remove('map-highlight');
                }, 2000);
            });
            // Scroll to map
            setTimeout(() => {
                const mapElement = document.querySelector('.map-container') || document.querySelector('.map-container-mobile');
                if (mapElement) {
                    mapElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 300);
            break;
        case 'lookup':
            const searchInput = document.getElementById('ip-search');
            if (searchInput) {
                searchInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                searchInput.focus();
                // Add a subtle highlight effect
                searchInput.style.boxShadow = '0 0 15px rgba(42, 159, 214, 0.7)';
                setTimeout(() => {
                    searchInput.style.boxShadow = '';
                }, 2000);
            }
            break;
        case 'security':
        case 'network':
            // Similar handling for other features
            showToast('Feature coming soon!', 'info');
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
    // Apply horizontal layout to the IP details section
    const ipDetails = document.querySelector('.ip-details');
    if (ipDetails) {
        // Add CSS for horizontal layout
        const style = document.createElement('style');
        style.innerHTML = `
            .ip-details {
                display: flex;
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .ip-details .detail-row {
                flex: 1 1 calc(50% - 10px);
                min-width: 200px;
                border-bottom: none;
                background: rgba(255, 255, 255, 0.05);
                border-radius: 8px;
                padding: 10px;
                margin-bottom: 0;
            }
            
            @media (max-width: 768px) {
                .ip-details .detail-row {
                    flex: 1 1 100%;
                }
            }
        `;
        document.head.appendChild(style);
    }

    // Rest of your initialization code...
    // Initialize maps with default location
    initMap(40.7128, -74.0060, false); // Desktop map
    initMap(40.7128, -74.0060, true);  // Mobile map
    
    // Fetch IP information
    fetchIPInfo();
    
    // Add event listeners to feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', handleFeatureCardClick);
        card.addEventListener('mouseenter', handleCardHover);
        card.addEventListener('mouseleave', handleCardLeave);
    });
    
    // Add event listener to search input for Enter key
    const searchInput = document.getElementById('ip-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearchKeyPress);
    }
    
    // Make sure search button has event listener
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        // Remove any existing event listeners to prevent duplicates
        searchButton.removeEventListener('click', searchIP);
        // Add event listener
        searchButton.addEventListener('click', searchIP);
    }
});
// Initialize all features on page load
document.addEventListener('DOMContentLoaded', () => {
    // Initialize both maps with default location
    initMap(40.7128, -74.0060, false); // Desktop map
    initMap(40.7128, -74.0060, true);  // Mobile map
    
    // Fetch IP information
    fetchIPInfo();
    
    // Add event listeners to feature cards
    document.querySelectorAll('.feature-card').forEach(card => {
        card.addEventListener('click', handleFeatureCardClick);
        card.addEventListener('mouseenter', handleCardHover);
        card.addEventListener('mouseleave', handleCardLeave);
    });
    
    // Add event listener to search input for Enter key
    const searchInput = document.getElementById('ip-search');
    if (searchInput) {
        searchInput.addEventListener('keypress', handleSearchKeyPress);
    }
    
    // Make sure search button has event listener
    const searchButton = document.querySelector('.search-button');
    if (searchButton) {
        // Remove any existing event listeners to prevent duplicates
        searchButton.removeEventListener('click', searchIP);
        // Add event listener
        searchButton.addEventListener('click', searchIP);
    }
});

// Handle logo click for smooth scrolling
document.addEventListener('DOMContentLoaded', function() {
    // Add impressive background styles
    if (!document.getElementById('impressive-bg-styles')) {
      const style = document.createElement('style');
      style.id = 'impressive-bg-styles';
      style.innerHTML = `
        /* Impressive background for IP info box */
        .ip-info-box {
          position: relative;
          overflow: hidden;
          z-index: 1;
          background: rgba(27, 74, 107, 0.8) !important;
          backdrop-filter: blur(15px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset,
            0 0 20px rgba(42, 159, 214, 0.2) inset;
          transition: all 0.3s ease;
        }
        
        .ip-info-box::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(135deg, rgba(42, 159, 214, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 20% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 30%),
            radial-gradient(circle at 80% 80%, rgba(42, 159, 214, 0.1) 0%, transparent 30%);
          z-index: -1;
          opacity: 0.8;
        }
        
        /* Dark glass effect when hovering */
        .ip-info-box:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 15px 35px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.15) inset,
            0 0 30px rgba(42, 159, 214, 0.3) inset;
        }
        
        /* Impressive background for map container */
        .map-container, .map-container-mobile {
          position: relative;
          overflow: hidden;
          z-index: 1;
          border: none;
          background: rgba(27, 74, 107, 0.6) !important;
          backdrop-filter: blur(15px);
          box-shadow: 
            0 10px 30px rgba(0, 0, 0, 0.3),
            0 0 0 1px rgba(255, 255, 255, 0.1) inset;
        }
        
        .map-container::before, .map-container-mobile::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            linear-gradient(135deg, rgba(42, 159, 214, 0.15) 0%, transparent 70%),
            radial-gradient(circle at 80% 20%, rgba(255, 255, 255, 0.1) 0%, transparent 30%);
          z-index: -1;
          opacity: 0.8;
        }
        
        .map-container:hover, .map-container-mobile:hover {
          transform: translateY(-5px);
          box-shadow: 
            0 15px 35px rgba(0, 0, 0, 0.4),
            0 0 0 1px rgba(255, 255, 255, 0.15) inset;
        }
        
        /* Impressive styling for detail items */
        .ip-details-horizontal {
          background: rgba(13, 37, 53, 0.5) !important;
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          overflow: hidden;
        }
        
        .ip-details-horizontal .detail-item {
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 10px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: all 0.3s ease;
          overflow: hidden;
        }
        
        .ip-details-horizontal .detail-item:hover {
          background: rgba(42, 159, 214, 0.1);
          transform: translateY(-4px);
          box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
          border-color: rgba(42, 159, 214, 0.3);
        }
        
        .ip-details-horizontal .detail-icon {
          background: linear-gradient(135deg, #1e3c72, #2a9fd6);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
          color: white;
          transition: all 0.3s ease;
        }
        
        .ip-details-horizontal .detail-item:hover .detail-icon {
          transform: scale(1.1) rotate(10deg);
        }
        
        .ip-details-horizontal .detail-value {
          background: rgba(255, 255, 255, 0.1);
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.3s ease;
        }
        
        .ip-details-horizontal .detail-item:hover .detail-value {
          background: rgba(255, 255, 255, 0.2);
        }
        
        /* IP info header styling */
        .ip-info-header {
          color: white;
          font-weight: 600;
          letter-spacing: 0.5px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
          padding-bottom: 10px;
          margin-bottom: 15px;
        }
        
        /* IP info row styling */
        .ip-info-row {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
          margin-bottom: 10px;
          padding: 10px 12px;
          transition: all 0.3s ease;
          border: none;
        }
        
        .ip-info-row:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateX(0);
        }
        
        /* Map footer styling */
        .map-footer {
          background: rgba(0, 0, 0, 0.7);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add interactive hover and click effects
    const ipInfoBox = document.querySelector('.ip-info-box');
    const mapContainer = document.querySelector('.map-container');
    const mapContainerMobile = document.querySelector('.map-container-mobile');
    
    // Make elements interactive without animation
    function makeInteractive(element) {
      if (!element) return;
      
      // Add subtle shadow effect on hover
      element.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-5px)';
        this.style.boxShadow = '0 15px 35px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.15) inset';
      });
      
      element.addEventListener('mouseleave', function() {
        this.style.transform = '';
        this.style.boxShadow = '';
      });
    }
    
    // Apply interactive effects
    makeInteractive(ipInfoBox);
    makeInteractive(mapContainer);
    if (mapContainerMobile) {
      makeInteractive(mapContainerMobile);
    }
  
    // Make detail items interactive
    const detailItems = document.querySelectorAll('.ip-details-horizontal .detail-item');
    detailItems.forEach(item => {
      item.addEventListener('mouseenter', function() {
        this.style.background = 'rgba(42, 159, 214, 0.1)';
        this.style.transform = 'translateY(-4px)';
        this.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.2)';
        this.style.borderColor = 'rgba(42, 159, 214, 0.3)';
        
        // Make icon pop
        const icon = this.querySelector('.detail-icon');
        if (icon) {
          icon.style.transform = 'scale(1.1) rotate(10deg)';
        }
      });
      
      item.addEventListener('mouseleave', function() {
        this.style.background = '';
        this.style.transform = '';
        this.style.boxShadow = '';
        this.style.borderColor = '';
        
        // Reset icon
        const icon = this.querySelector('.detail-icon');
        if (icon) {
          icon.style.transform = '';
        }
      });
      
      // Click effect
      item.addEventListener('click', function() {
        // Flash effect
        this.style.transition = 'background-color 0.1s ease';
        this.style.backgroundColor = 'rgba(42, 159, 214, 0.3)';
        
        setTimeout(() => {
          this.style.transition = 'all 0.3s ease';
          this.style.backgroundColor = 'rgba(42, 159, 214, 0.1)';
        }, 100);
      });
    });
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