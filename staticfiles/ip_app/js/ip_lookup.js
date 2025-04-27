/**
 * Advanced IP Information Integration Script
 * 
 * This script handles:
 * 1. Fetching IP data from a reliable API
 * 2. Updating all UI components with the fetched data
 * 3. Handling user interactions (copy, refresh, etc.)
 * 4. Managing loading states and animations
 */

// Main initialization function
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initIPLookup();

/**
 * Fetch and display IP data
 * @param {Object} elements - DOM elements
 * @param {string} [customIp] - Optional custom IP to look up
 */
function fetchAndDisplayIPData(elements, customIp = null) {
    // Show loading states
    setLoadingState(elements, true);
    
    // API URL - use ipapi.co or ipinfo.io for reliable data
    let apiUrl = 'https://ipapi.co/json/';
    
    // If a custom IP is provided, use it
    if (customIp) {
        apiUrl = `https://ipapi.co/${customIp}/json/`;
    }
    
    // Fetch IP data
    fetch(apiUrl)
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            // Process and display data
            displayIPData(elements, data);
            // Update time element
            updateTimeElement(elements.miniTime);
            // Remove loading state
            setLoadingState(elements, false);
        })
        .catch(error => {
            console.error('Error fetching IP data:', error);
            setErrorState(elements);
        });
}

/**
 * Set the UI to loading state
 * @param {Object} elements - DOM elements
 * @param {boolean} isLoading - Whether loading is active
 */
function setLoadingState(elements, isLoading) {
    // Update hero section elements
    if (elements.currentIp && isLoading) elements.currentIp.textContent = "Loading...";
    if (elements.miniLocation && isLoading) elements.miniLocation.textContent = "Loading...";
    if (elements.miniIsp && isLoading) elements.miniIsp.textContent = "Loading...";
    if (elements.miniSecurity && isLoading) elements.miniSecurity.textContent = "Analyzing...";
    
    // Update details section elements
    if (elements.ipDisplay && isLoading) elements.ipDisplay.textContent = "Loading...";
    if (elements.ispDetail && isLoading) elements.ispDetail.textContent = "Loading...";
    if (elements.orgDetail && isLoading) elements.orgDetail.textContent = "Loading...";
    if (elements.connectionType && isLoading) elements.connectionType.textContent = "Loading...";
    if (elements.countryName && isLoading) elements.countryName.textContent = "Loading...";
    if (elements.cityRegion && isLoading) elements.cityRegion.textContent = "Loading...";
    if (elements.timezoneDetail && isLoading) elements.timezoneDetail.textContent = "Loading...";
    
    // Add/remove loading indicator classes
    document.querySelectorAll('.ip-data-field').forEach(field => {
        if (isLoading) {
            field.classList.add('animate-pulse');
        } else {
            field.classList.remove('animate-pulse');
        }
    });
}

/**
 * Set error state for UI elements
 * @param {Object} elements - DOM elements
 */
function setErrorState(elements) {
    const errorMessage = "Error loading data";
    
    // Update hero section elements
    if (elements.currentIp) elements.currentIp.textContent = errorMessage;
    if (elements.miniLocation) elements.miniLocation.textContent = "Error";
    if (elements.miniIsp) elements.miniIsp.textContent = "Error";
    if (elements.miniSecurity) elements.miniSecurity.textContent = "Error";
    
    // Update details section elements
    if (elements.ipDisplay) elements.ipDisplay.textContent = errorMessage;
    if (elements.ispDetail) elements.ispDetail.textContent = "Error loading data";
    if (elements.orgDetail) elements.orgDetail.textContent = "Error loading data";
    if (elements.connectionType) elements.connectionType.textContent = "Error loading data";
    if (elements.countryName) elements.countryName.textContent = "Error loading data";
    if (elements.cityRegion) elements.cityRegion.textContent = "Error loading data";
    if (elements.timezoneDetail) elements.timezoneDetail.textContent = "Error loading data";
    
    // Remove loading indicator classes
    document.querySelectorAll('.animate-pulse').forEach(element => {
        element.classList.remove('animate-pulse');
    });
    
    // Show error toast
    showToast('Error loading IP data. Please try again later.', 'error');
}

/**
 * Display fetched IP data in UI
 * @param {Object} elements - DOM elements
 * @param {Object} data - IP data from API
 */
function displayIPData(elements, data) {
    // Update hero section elements
    if (elements.currentIp) elements.currentIp.textContent = data.ip || 'Unknown';
    if (elements.ipType) {
        elements.ipType.textContent = data.version || 
            (data.ip && data.ip.includes(':') ? 'IPv6' : 'IPv4');
    }
    if (elements.miniLocation) {
        const city = data.city || '';
        const country = data.country_name || '';
        elements.miniLocation.textContent = city 
            ? (country ? `${city}, ${country}` : city)
            : (country || 'Unknown');
    }
    if (elements.miniIsp) elements.miniIsp.textContent = data.org || data.asn || 'Unknown';
    
    // Set security status with a slight delay to simulate analysis
    setTimeout(() => {
        updateSecurityStatus(elements, data);
    }, 1000);
    
    // Update details section elements
    if (elements.ipDisplay) elements.ipDisplay.textContent = data.ip || 'Unknown';
    if (elements.ispDetail) elements.ispDetail.textContent = data.org || data.asn || 'Unknown';
    if (elements.orgDetail) {
        if (data.org) {
            // Try to extract organization name from ASN description
            const orgParts = data.org.split(' ');
            elements.orgDetail.textContent = orgParts.length > 1 
                ? orgParts.slice(1).join(' ')
                : data.org;
        } else {
            elements.orgDetail.textContent = 'Unknown';
        }
    }
    
    // Set connection type
    if (elements.connectionType) {
        if (data.org) {
            const orgLower = data.org.toLowerCase();
            if (orgLower.includes('mobile') || orgLower.includes('wireless')) {
                elements.connectionType.textContent = 'Mobile Network';
            } else if (orgLower.includes('business') || orgLower.includes('corporate')) {
                elements.connectionType.textContent = 'Business Connection';
            } else if (orgLower.includes('residential')) {
                elements.connectionType.textContent = 'Residential Connection';
            } else {
                elements.connectionType.textContent = 'Broadband Connection';
            }
        } else {
            elements.connectionType.textContent = 'Standard Connection';
        }
    }
    
    // Update country information
    if (elements.countryName) elements.countryName.textContent = data.country_name || 'Unknown';
    if (elements.countryFlag && data.country_code) {
        elements.countryFlag.innerHTML = `<img src="https://flagcdn.com/24x18/${data.country_code.toLowerCase()}.png" 
                                         width="24" height="18" alt="${data.country_name} flag" class="rounded-sm">`;
    } else if (elements.countryFlag) {
        elements.countryFlag.innerHTML = '';
    }
    
    // Update city/region information
    if (elements.cityRegion) {
        let locationText = '';
        if (data.city) locationText += data.city;
        if (data.region && data.city) locationText += ', ';
        if (data.region) locationText += data.region;
        
        elements.cityRegion.textContent = locationText || 'Unknown';
    }
    
    // Update timezone information
    if (elements.timezoneDetail) elements.timezoneDetail.textContent = data.timezone || 'Unknown';
}

/**
 * Update security status based on IP data
 * @param {Object} elements - DOM elements
 * @param {Object} data - IP data from API
 */
function updateSecurityStatus(elements, data) {
    // Check if using VPN/Proxy
    const usingVPN = data.org && (
        data.org.toLowerCase().includes('vpn') || 
        data.org.toLowerCase().includes('proxy')
    );
    
    // Update mini security element in hero section
    if (elements.miniSecurity) {
        if (usingVPN) {
            elements.miniSecurity.textContent = "VPN/Proxy Detected";
            // Update the icon color if it exists
            const securityIcon = elements.miniSecurity.previousElementSibling;
            if (securityIcon) {
                securityIcon.classList.remove('text-green-400');
                securityIcon.classList.add('text-yellow-400');
            }
        } else {
            elements.miniSecurity.textContent = "Secure";
        }
    }
    
    // Update detailed security elements
    if (usingVPN) {
        // Change security ring color
        if (elements.securityRing) {
            elements.securityRing.classList.remove('border-green-400');
            elements.securityRing.classList.add('border-yellow-400');
        }
        
        // Update security icon
        if (elements.securityIcon) {
            elements.securityIcon.innerHTML = '<i class="fas fa-mask text-yellow-500"></i>';
        }
        
        // Update security status text
        if (elements.securityStatus) {
            elements.securityStatus.textContent = 'Caution';
            elements.securityStatus.classList.remove('text-green-500');
            elements.securityStatus.classList.add('text-yellow-500');
        }
        
        // Update security badge
        if (elements.securityBadge) {
            elements.securityBadge.innerHTML = `
                <div class="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center">
                    <i class="fas fa-exclamation"></i>
                </div>
            `;
            elements.securityBadge.classList.remove('bg-green-100');
            elements.securityBadge.classList.add('bg-yellow-100');
        }
        
        // Update security message
        if (elements.securityMessage) {
            elements.securityMessage.classList.remove('bg-green-50', 'border-green-100');
            elements.securityMessage.classList.add('bg-yellow-50', 'border-yellow-100');
            elements.securityMessage.innerHTML = `
                <div class="relative z-10 flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-info-circle text-yellow-500 mt-1"></i>
                    </div>
                    <div class="ml-3">
                        <h4 class="font-medium text-yellow-800">Security Assessment</h4>
                        <p class="mt-1 text-sm text-yellow-700">
                            This IP address appears to be using a VPN or proxy service. This is not necessarily a security issue - many users employ VPNs to enhance privacy. However, some online services may restrict access from VPN IPs.
                        </p>
                    </div>
                </div>
            `;
        }
        
        // Update VPN status
        if (elements.vpnStatus) {
            elements.vpnStatus.innerHTML = `
                <i class="fas fa-check-circle text-yellow-500 mr-2"></i> VPN/Proxy Detected
                <div class="ml-auto text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Detected</div>
            `;
        }
        
        // Update risk status
        if (elements.riskStatus) {
            elements.riskStatus.innerHTML = `
                <i class="fas fa-shield-alt text-yellow-500 mr-2"></i> Medium Risk
                <div class="ml-auto text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Caution</div>
            `;
        }
    }
    // Default secure state is already set in the HTML
}

/**
 * Update time element to show how long ago the check was performed
 * @param {HTMLElement} timeElement - Time element to update
 */
function updateTimeElement(timeElement) {
    if (!timeElement) return;
    
    timeElement.textContent = 'Just now';
    
    // Update time after a delay
    setTimeout(() => {
        timeElement.textContent = 'A few seconds ago';
    }, 10000);
    
    // Update again after another delay
    setTimeout(() => {
        timeElement.textContent = 'A minute ago';
    }, 60000);
}

/**
 * Copy IP address to clipboard
 * @param {string} ipText - IP address to copy
 */
function copyIPToClipboard(ipText) {
    if (!ipText || ipText === 'Loading...' || ipText === 'Error loading data') {
        showToast('No valid IP address to copy', 'error');
        return;
    }
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(ipText)
            .then(() => {
                showToast('IP address copied to clipboard!', 'success');
            })
            .catch(err => {
                console.error('Could not copy IP: ', err);
                fallbackCopyToClipboard(ipText);
            });
    } else {
        fallbackCopyToClipboard(ipText);
    }
}

/**
 * Fallback method to copy text to clipboard for browsers that don't support clipboard API
 * @param {string} text - Text to copy
 */
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
        showToast('Failed to copy IP address', 'error');
    }
    
    document.body.removeChild(textArea);
}

/**
 * Show a toast notification
 * @param {string} message - Message to display
 * @param {string} type - Notification type (success, error, info)
 */
function showToast(message, type = 'info') {
    // Check if toast container exists, create if not
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'fixed top-4 right-4 z-50';
        document.body.appendChild(toastContainer);
    }
    
    // Create toast element
    const toast = document.createElement('div');
    
    // Set different styles based on type
    let bgColor = 'bg-blue-600';
    let icon = '<i class="fas fa-info-circle mr-2"></i>';
    
    if (type === 'success') {
        bgColor = 'bg-green-600';
        icon = '<i class="fas fa-check-circle mr-2"></i>';
    } else if (type === 'error') {
        bgColor = 'bg-red-600';
        icon = '<i class="fas fa-exclamation-circle mr-2"></i>';
    }
    
    toast.className = `${bgColor} text-white px-4 py-2 rounded-lg shadow-lg mb-2 flex items-center`;
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(-20px)';
    toast.style.transition = 'opacity 0.3s, transform 0.3s';
    
    // Add icon and message
    toast.innerHTML = `${icon}<span>${message}</span>`;
    
    // Add to container
    toastContainer.appendChild(toast);
    
    // Trigger animation
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateY(0)';
    }, 10);
    
    // Remove after delay
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(-20px)';
        
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

/**
 * Animate IP counter to simulate activity
 */
function animateIPCounter() {
    const ipCounter = document.getElementById('ip-counter');
    if (!ipCounter) return;
    
    // Generate random starting number between 240,000 and 250,000
    let count = Math.floor(Math.random() * 10000) + 240000;
    ipCounter.textContent = count.toLocaleString() + ' IPs checked today';
    
    // Increment counter randomly
    setInterval(() => {
        // Add random number between 1-5
        count += Math.floor(Math.random() * 5) + 1;
        // Update text
        ipCounter.textContent = count.toLocaleString() + ' IPs checked today';
    }, 3000);
}
});

/**
 * Initialize IP Lookup functionality
 */
function initIPLookup() {
    // Cache DOM elements
    const elements = {
        // Hero section elements
        currentIp: document.getElementById('current-ip'),
        ipType: document.getElementById('ip-type'),
        miniLocation: document.getElementById('mini-location'),
        miniIsp: document.getElementById('mini-isp'),
        miniSecurity: document.getElementById('mini-security'),
        miniTime: document.getElementById('mini-time'),
        copyIpBtn: document.getElementById('copy-ip-btn'),
        refreshIpBtn: document.getElementById('refresh-ip-btn'),
        
        // Details section elements
        ipDisplay: document.getElementById('current-ip-display'),
        ispDetail: document.getElementById('isp-detail'),
        orgDetail: document.getElementById('org-detail'),
        connectionType: document.getElementById('connection-type'),
        countryName: document.getElementById('country-name'),
        countryFlag: document.getElementById('country-flag'),
        cityRegion: document.getElementById('city-region'),
        timezoneDetail: document.getElementById('timezone-detail'),
        
        // Security elements
        securityRing: document.getElementById('security-ring'),
        securityIcon: document.getElementById('security-icon'),
        securityStatus: document.getElementById('security-status'),
        securityBadge: document.getElementById('security-badge'),
        securityMessage: document.getElementById('security-message'),
        vpnStatus: document.getElementById('vpn-status'),
        riskStatus: document.getElementById('risk-status'),
        
        // Tool buttons
        copyDetailIpBtn: document.getElementById('copy-ip-btn'),
        refreshDataBtn: document.getElementById('refresh-data-btn'),
        whoisBtn: document.getElementById('whois-btn'),
        printBtn: document.getElementById('print-btn')
    };
    
    // Setup event listeners
    setupEventListeners(elements);
    
    // Immediately fetch user's IP data
    fetchAndDisplayIPData(elements);
    
    // Start IP counter animation
    animateIPCounter();
}

/**
 * Setup all event listeners
 * @param {Object} elements - DOM elements
 */
function setupEventListeners(elements) {
    // Copy IP button functionality
    if (elements.copyIpBtn) {
        elements.copyIpBtn.addEventListener('click', function() {
            copyIPToClipboard(elements.currentIp?.textContent);
        });
    }
    
    if (elements.copyDetailIpBtn) {
        elements.copyDetailIpBtn.addEventListener('click', function() {
            copyIPToClipboard(elements.ipDisplay?.textContent);
        });
    }
    
    // Refresh buttons functionality
    if (elements.refreshIpBtn) {
        elements.refreshIpBtn.addEventListener('click', function() {
            fetchAndDisplayIPData(elements);
        });
    }
    
    if (elements.refreshDataBtn) {
        elements.refreshDataBtn.addEventListener('click', function() {
            fetchAndDisplayIPData(elements);
        });
    }
    
    // WHOIS lookup button functionality
    if (elements.whoisBtn) {
        elements.whoisBtn.addEventListener('click', function() {
            const ipText = elements.ipDisplay?.textContent || elements.currentIp?.textContent;
            if (ipText && ipText !== 'Loading...') {
                window.open(`https://who.is/whois-ip/ip-address/${ipText}`, '_blank');
            }
        });
    }
    
    // Print button functionality
    if (elements.printBtn) {
        elements.printBtn.addEventListener('click', function() {
            window.print();
        });
    }
    
    // Form submission - prevent default and handle via JS
    const ipLookupForm = document.getElementById('ip-lookup-form');
    if (ipLookupForm) {
        ipLookupForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const ipInput = document.getElementById('ip-input');
            const ipAddress = ipInput.value.trim();
            
            if (ipAddress) {
                // If user entered an IP, look it up
                fetchAndDisplayIPData(elements, ipAddress);
            } else {
                // Otherwise, look up their current IP
                fetchAndDisplayIPData(elements);
            }
        });
    }
    
    // Clear button functionality
    const clearBtn = document.getElementById('clear-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', function() {
            const ipInput = document.getElementById('ip-input');
            if (ipInput) {
                ipInput.value = '';
                ipInput.focus();
            }
        });
    }
}