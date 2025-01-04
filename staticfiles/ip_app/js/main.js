let map;
let marker;

function showLoading() {
    document.getElementById('loading-overlay').classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loading-overlay').classList.add('hidden');
}

function initMap(lat, lon) {
    if (!map) {
        map = L.map('map').setView([lat, lon], 13);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(map);
        marker = L.marker([lat, lon]).addTo(map);
    } else {
        map.setView([lat, lon], 13);
        marker.setLatLng([lat, lon]);
    }
}

function showCopyTooltip(text) {
    const tooltip = document.createElement('div');
    tooltip.className = 'copy-tooltip';
    tooltip.textContent = text;
    document.body.appendChild(tooltip);
    
    setTimeout(() => {
        tooltip.remove();
    }, 2000);
}

async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showCopyTooltip('Copied to clipboard!');
    } catch (err) {
        showCopyTooltip('Failed to copy');
    }
}

async function fetchIPInfo() {
    try {
        showLoading();
        console.log("Fetching IP info..."); // Debug log
        
        const response = await fetch('/api/ip-info/', {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        });
        
        console.log("Response received:", response); // Debug log
        const data = await response.json();
        console.log("Data:", data); // Debug log

        if (data.status === 'success' || response.ok) {
            // Update IP with animation
            const ipElement = document.getElementById('ip-address');
            ipElement.style.opacity = '0';
            setTimeout(() => {
                ipElement.innerHTML = `${data.query} 
                    <span id="copy-button" 
                          class="text-sm cursor-pointer hover:text-blue-300 bg-blue-800 px-2 py-1 rounded"
                          onclick="copyToClipboard('${data.query}')">
                        Copy IP
                    </span>`;
                ipElement.style.opacity = '1';
            }, 200);

            // Update other fields
            document.getElementById('isp').textContent = data.isp || 'N/A';
            document.getElementById('country').textContent = data.country || 'N/A';
            document.getElementById('region').textContent = data.regionName || 'N/A';
            document.getElementById('city').textContent = data.city || 'N/A';
            document.getElementById('zip').textContent = data.zip || 'N/A';
            document.getElementById('coordinates').textContent = `${data.lat}, ${data.lon}` || 'N/A';
            document.getElementById('org').textContent = data.org || data.isp || 'N/A';
            document.getElementById('as').textContent = data.as || 'N/A';
            document.getElementById('timezone').textContent = data.timezone || 'N/A';
            document.getElementById('location').textContent = `${data.city}, ${data.regionName}, ${data.country}`;

            // Initialize or update map if coordinates are available
            if (data.lat && data.lon) {
                initMap(data.lat, data.lon);
            }
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('ip-address').textContent = 'Error loading IP';
    } finally {
        hideLoading();
    }
}

// Add smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    fetchIPInfo();
    
    // Add hover effects for boxes
    document.querySelectorAll('.ip-box').forEach(box => {
        box.addEventListener('mouseenter', () => {
            box.style.transform = 'translateY(-2px)';
            box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
        });
        
        box.addEventListener('mouseleave', () => {
            box.style.transform = 'translateY(0)';
            box.style.boxShadow = 'none';
        });
    });

    // Add click effect for tool cards
    document.querySelectorAll('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            card.classList.add('pulse');
            setTimeout(() => card.classList.remove('pulse'), 1000);
        });
    });
});