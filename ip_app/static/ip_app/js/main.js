// main.js - Enhanced for better IP detection and performance

document.addEventListener('DOMContentLoaded', function() {
    // Initialize UI components
    initToasts();
    setupMobileMenu();
    
    // Set up event listeners
    const ipLookupForm = document.getElementById('ip-lookup-form');
    const ipInput = document.getElementById('ip-input');
    const currentIpElement = document.getElementById('current-ip');
    const copyButtons = document.querySelectorAll('.copy-ip-btn');
    
    // Handle IP lookup form submission
    if (ipLookupForm) {
        ipLookupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            showLoader('Looking up IP information...');
            
            const formData = new FormData(this);
            const ip = formData.get('ip');
            
            // If no IP provided, use the current IP
            if (!ip && currentIpElement) {
                window.location.href = '/ip-lookup';
            } else {
                window.location.href = '/ip-lookup?ip=' + encodeURIComponent(ip);
            }
        });
    }
    
    // Add debounced search for input changes
    if (ipInput) {
        ipInput.addEventListener('input', debounce(function() {
            if (ipInput.value.trim() !== '') {
                performIPLookup(ipInput.value.trim());
            }
        }, 500));
    }
    
    // Initialize map if it exists on the page
    if (document.getElementById('ip-map')) {
        setTimeout(initMap, 300);
    }
    
    // Auto-fetch user's IP if not already displayed
    if (currentIpElement && currentIpElement.textContent.trim() === '') {
        fetchUserIP();
    }
    
    // Set up copy button functionality
    if (copyButtons.length > 0) {
        copyButtons.forEach(button => {
            button.addEventListener('click', function() {
                const textToCopy = currentIpElement ? currentIpElement.textContent.trim() : '';
                copyToClipboard(textToCopy);
            });
        });
    }
});

// Fetch user's IP using server API with external service fallback
function fetchUserIP() {
    const currentIpElement = document.getElementById('current-ip');
    if (!currentIpElement) return;
    
    // Start with loading state
    currentIpElement.textContent = 'Loading...';
    
    // Use the server API first for consistent results
    fetch('/api/ip-info')
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            if (data.query) {
                currentIpElement.textContent = data.query;
                updateIPDetails(data);
            } else {
                throw new Error('No IP found in response');
            }
        })
        .catch(error => {
            console.error('Error fetching IP from server:', error);
            // Fallback to external service
            fetch('https://api.ipify.org?format=json')
                .then(response => response.json())
                .then(data => {
                    currentIpElement.textContent = data.ip;
                })
                .catch(error => {
                    console.error('Error fetching IP from fallback:', error);
                    currentIpElement.textContent = 'Could not detect IP';
                });
        });
}

// Update IP details on the page based on API response
function updateIPDetails(data) {
    // Update IP type badge
    const ipTypeBadge = document.getElementById('ip-type');
    if (ipTypeBadge) {
        const isIPv6 = data.query.includes(':');
        ipTypeBadge.textContent = isIPv6 ? 'IPv6' : 'IPv4';
    }
    
    // Update location display
    const locationDisplay = document.querySelector('.location-display');
    if (locationDisplay && data.city && data.country) {
        locationDisplay.textContent = `${data.city}, ${data.country}`;
    }
}

// Initialize the map with better error handling
function initMap() {
    const mapElement = document.getElementById('ip-map');
    if (!mapElement) return;
    
    // Check if Leaflet is loaded
    if (typeof L === 'undefined') {
        console.error('Leaflet is not loaded');
        loadLeaflet();
        return;
    }
    
    try {
        // Get coordinates from data attributes
        let lat = parseFloat(mapElement.dataset.lat || '0');
        let lon = parseFloat(mapElement.dataset.lon || '0');
        let city = mapElement.dataset.city || '';
        let region = mapElement.dataset.region || '';
        let country = mapElement.dataset.country || '';
        
        // If coordinates are invalid, show error
        if ((lat === 0 && lon === 0) || isNaN(lat) || isNaN(lon)) {
            console.warn('Invalid coordinates, using fallback location');
        }
        
        // Create map
        const map = L.map('ip-map', {
            center: [lat, lon],
            zoom: 10,
            zoomControl: false,
        });
        
        // Add zoom control to top right
        L.control.zoom({
            position: 'topright'
        }).addTo(map);
        
        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
        }).addTo(map);
        
        // Custom marker for better visibility
        const customIcon = L.divIcon({
            className: 'custom-map-marker',
            html: '<div class="marker-pin"></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        // Add marker at the specified location
        const marker = L.marker([lat, lon], { icon: customIcon }).addTo(map);
        
        // Add a circle to indicate the approximate area
        L.circle([lat, lon], {
            color: '#2a9fd6',
            fillColor: '#2a9fd6',
            fillOpacity: 0.1,
            radius: 5000
        }).addTo(map);
        
        // Add popup with location information
        const locationText = [city, region, country].filter(Boolean).join(', ');
        marker.bindPopup(`
            <div class="text-center px-2 py-1">
                <div class="font-medium mb-1">${locationText || 'Unknown Location'}</div>
                <div class="text-xs text-gray-500">
                    Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}
                </div>
            </div>
        `).openPopup();
        
        // Hide loading placeholder if it exists
        const placeholder = document.getElementById('map-placeholder');
        if (placeholder) {
            placeholder.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error initializing map:', error);
        
        // Show error in map container
        const placeholder = document.getElementById('map-placeholder');
        if (placeholder) {
            placeholder.innerHTML = `
                <div class="text-center p-4">
                    <i class="fas fa-exclamation-triangle text-red-500 text-3xl mb-2"></i>
                    <p class="text-red-500 font-medium">Could not load map</p>
                    <p class="text-sm text-gray-600 mt-1">Please try refreshing the page</p>
                </div>
            `;
        }
    }
}

// Function to load Leaflet dynamically if needed
function loadLeaflet() {
    if (document.querySelector('script[src*="leaflet"]')) {
        return; // Already loaded or loading
    }
    
    // Create script element
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
    script.crossOrigin = '';
    script.onload = function() {
        console.log('Leaflet loaded successfully');
        setTimeout(initMap, 300);
    };
    script.onerror = function() {
        console.error('Failed to load Leaflet');
    };
    
    // Create CSS element if not already loaded
    if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        link.crossOrigin = '';
        document.head.appendChild(link);
    }
    
    document.head.appendChild(script);
}

// Copy to clipboard with fallback for older browsers
function copyToClipboard(text) {
    if (!text) {
        showToast('No text to copy', 'error');
        return;
    }
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text)
            .then(() => {
                showToast('IP address copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Failed to copy:', err);
                fallbackCopyToClipboard(text);
            });
    } else {
        fallbackCopyToClipboard(text);
    }
}

// Fallback copy method for older browsers
function fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showToast('IP address copied to clipboard!', 'success');
        } else {
            showToast('Failed to copy IP address', 'error');
        }
    } catch (err) {
        console.error('Fallback copy failed:', err);
        showToast('Failed to copy IP address', 'error');
    }
    
    document.body.removeChild(textArea);
}

// Show toast notification with improved accessibility
function showToast(message, type = 'info') {
    // If we already have a toast container, use it
    let toastContainer = document.getElementById('toast-container');
    
    // If not, create one
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'toast-notification flex items-center p-3 rounded shadow-lg text-white max-w-xs sm:max-w-sm transform transition-all duration-300 translate-x-full';
    toast.setAttribute('role', 'alert');
    toast.setAttribute('aria-live', 'polite');
    
    // Set background color based on type
    let bgColor = 'bg-blue-600';
    let icon = 'info-circle';
    
    if (type === 'success') {
        bgColor = 'bg-green-600';
        icon = 'check-circle';
    } else if (type === 'error') {
        bgColor = 'bg-red-600';
        icon = 'exclamation-circle';
    } else if (type === 'warning') {
        bgColor = 'bg-yellow-600';
        icon = 'exclamation-triangle';
    }
    
    toast.classList.add(bgColor);
    
    toast.innerHTML = `
        <i class="fas fa-${icon} mr-2" aria-hidden="true"></i>
        <span>${message}</span>
        <button class="ml-auto text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 rounded-full p-1" 
                aria-label="Close notification">
            <i class="fas fa-times" aria-hidden="true"></i>
        </button>
    `;
    
    // Add toast to container
    toastContainer.appendChild(toast);
    
    // Add click listener to close button
    toast.querySelector('button').addEventListener('click', function() {
        closeToast(toast);
    });
    
    // Animate in
    setTimeout(() => {
        toast.classList.remove('translate-x-full');
    }, 10);
    
    // Auto close after 5 seconds
    setTimeout(() => {
        closeToast(toast);
    }, 5000);
}

// Close toast animation
function closeToast(toast) {
    toast.classList.add('translate-x-full');
    setTimeout(() => {
        if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
        }
    }, 300);
}

// Initialize toast system
function initToasts() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
        const toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50 flex flex-col gap-2';
        document.body.appendChild(toastContainer);
    }
}

// Setup mobile menu toggle with improved accessibility
function setupMobileMenu() {
    const menuButton = document.getElementById('mobileMenuButton');
    const mobileMenu = document.getElementById('mobileMenu');
    
    if (menuButton && mobileMenu) {
        menuButton.addEventListener('click', function() {
            const expanded = menuButton.getAttribute('aria-expanded') === 'true';
            menuButton.setAttribute('aria-expanded', !expanded);
            mobileMenu.classList.toggle('hidden');
            
            // Toggle icon
            const icon = menuButton.querySelector('i');
            if (icon) {
                if (expanded) {
                    icon.classList.remove('fa-times');
                    icon.classList.add('fa-bars');
                } else {
                    icon.classList.remove('fa-bars');
                    icon.classList.add('fa-times');
                }
            }
        });
    }
}

// Show loading spinner with message
function showLoader(message = 'Loading...') {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        const messageElement = loader.querySelector('p');
        if (messageElement) {
            messageElement.textContent = message;
        }
        loader.classList.remove('opacity-0', 'pointer-events-none');
        document.body.setAttribute('aria-busy', 'true');
    }
}

// Hide loading spinner
function hideLoader() {
    const loader = document.getElementById('loadingOverlay');
    if (loader) {
        loader.classList.add('opacity-0', 'pointer-events-none');
        document.body.setAttribute('aria-busy', 'false');
    }
}

// Debounce function to prevent excessive API calls
function debounce(func, wait) {
    let timeout;
    return function(...args) {
        const context = this;
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(context, args), wait);
    };
}

// Perform IP lookup via fetch API
function performIPLookup(ip) {
    if (!ip) return;
    
    showLoader('Looking up IP information...');
    
    fetch(`/api/ip-info?ip=${encodeURIComponent(ip)}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('IP lookup successful:', data);
            hideLoader();
            // Handle the response data here
            updateIPDetails(data);
        })
        .catch(error => {
            console.error('Error performing IP lookup:', error);
            hideLoader();
            showToast('Error looking up IP information', 'error');
        });
}

// Add smooth scrolling for navigation links
document.addEventListener('DOMContentLoaded', function() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                e.preventDefault();
                
                // Close mobile menu if open
                const mobileMenu = document.getElementById('mobileMenu');
                if (mobileMenu && !mobileMenu.classList.contains('hidden')) {
                    const menuButton = document.getElementById('mobileMenuButton');
                    if (menuButton) {
                        menuButton.click();
                    }
                }
                
                // Scroll smoothly to the target
                window.scrollTo({
                    top: targetElement.offsetTop - 80, // Offset for header
                    behavior: 'smooth'
                });
            }
        });
    });
});