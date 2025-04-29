from django.shortcuts import render
from django.http import JsonResponse
import requests
from django.core.mail import send_mail
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods
import re
import ipaddress

# Try to import ratelimit, but have a fallback if it's not available
try:
    from ratelimit.decorators import ratelimit
    has_ratelimit = True
except ImportError:
    # Define a dummy decorator that does nothing if ratelimit isn't installed
    def ratelimit(key=None, rate=None, method=None, block=False):
        def decorator(fn):
            return fn
        return decorator
    has_ratelimit = False

def index(request):
    try:
        # Get client's real IP address
        client_ip = get_client_ip(request)
        print(f"Client IP for index view: {client_ip}")
        
        # Fetch IP data
        ip_data = get_ip_data(client_ip)
        print(f"Successfully retrieved IP data: {ip_data}")
            
        # Return the rendered template with IP data
        return render(request, 'ip_app/index.html', {'ip_data': ip_data})
        
    except Exception as e:
        print(f"Exception occurred: {str(e)}")
        # Return a fallback response that doesn't depend on the API
        return render(request, 'ip_app/index.html', {'ip_data': {'query': 'Error loading', 'error': str(e)}})

def privacy(request):
    return render(request, 'ip_app/privacy.html')

def terms(request):
    return render(request, 'ip_app/terms.html')

@ensure_csrf_cookie
def contact(request):
    return render(request, 'ip_app/contact.html')

# Improved IP validation function using ipaddress module
def is_valid_ip(ip):
    """Check if the provided string is a valid IPv4 or IPv6 address"""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False

# Get client's real IP with improved proxy handling
def get_client_ip(request):
    """Get the client's IP address from the request with better proxy handling."""
    # Print all relevant headers for debugging
    print(f"All IP-related headers:")
    for key, value in request.META.items():
        if 'ADDR' in key or 'IP' in key or 'FORWARD' in key:
            print(f"  {key}: {value}")
            
    # Check for X-Forwarded-For header (common in proxy setups)
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        # The first IP in the list is usually the original client IP
        ip = x_forwarded_for.split(',')[0].strip()
        print(f"Using IP from X-Forwarded-For: {ip}")
    # Try X-Real-IP header (used by Nginx and some other proxies)
    elif request.META.get('HTTP_X_REAL_IP'):
        ip = request.META.get('HTTP_X_REAL_IP')
        print(f"Using IP from X-Real-IP: {ip}")
    # Fall back to REMOTE_ADDR if no proxy headers are found
    else:
        ip = request.META.get('REMOTE_ADDR')
        print(f"Using IP from REMOTE_ADDR: {ip}")
    
    # Check if we got a private/reserved IP, which indicates improper proxy configuration
    try:
        import ipaddress
        ip_obj = ipaddress.ip_address(ip)
        if ip_obj.is_private or ip_obj.is_loopback:
            print(f"Detected private/loopback IP: {ip}, falling back to external service")
            # Try to use external service as fallback
            try:
                import requests
                response = requests.get('https://api.ipify.org?format=json', timeout=5)
                if response.status_code == 200:
                    ip = response.json().get('ip')
                    print(f"Got external IP from ipify: {ip}")
            except Exception as e:
                print(f"Error getting external IP: {e}")
                # Try alternate service
                try:
                    response = requests.get('https://ifconfig.me/ip', timeout=5)
                    if response.status_code == 200:
                        ip = response.text.strip()
                        print(f"Got external IP from ifconfig.me: {ip}")
                except Exception as e:
                    print(f"Error getting external IP from ifconfig.me: {e}")
    except Exception as e:
        print(f"Error checking if IP is private: {e}")
    
    return ip
# Function to try multiple IP geolocation services
def get_ip_data(ip):
    """Try multiple IP geolocation services for better reliability"""
    # First try ipinfo.io
    try:
        print(f"Trying ipinfo.io for IP: {ip}")
        response = requests.get(f'https://ipinfo.io/{ip}/json', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"Successfully got data from ipinfo.io: {data}")
            
            # Format the data
            location_data = {
                'status': 'success',
                'query': ip,
                'country': data.get('country', 'Unknown'),
                'regionName': data.get('region', 'Unknown'),
                'city': data.get('city', 'Unknown'),
                'zip': data.get('postal', 'Unknown'),
                'timezone': data.get('timezone', 'Unknown'),
                'org': data.get('org', 'Unknown'),
                'isp': data.get('org', 'Unknown').split(' ')[0] if data.get('org') else 'Unknown',
                'as': data.get('org', 'Unknown')
            }
            
            # Extract latitude and longitude
            if data.get('loc'):
                try:
                    lat, lon = data.get('loc').split(',')
                    location_data['lat'] = float(lat)
                    location_data['lon'] = float(lon)
                except Exception as e:
                    print(f"Error parsing location: {e}")
                    location_data['lat'] = 0
                    location_data['lon'] = 0
            else:
                location_data['lat'] = 0
                location_data['lon'] = 0
                
            return location_data
    except Exception as e:
        print(f"Error with ipinfo.io: {e}")
    
    # Fallback to ip-api.com
    try:
        print(f"Trying ip-api.com for IP: {ip}")
        response = requests.get(f'http://ip-api.com/json/{ip}', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"Successfully got data from ip-api.com: {data}")
            
            # Convert ip-api.com format to match our expected format
            location_data = {
                'status': 'success',
                'query': ip,
                'country': data.get('countryCode', 'Unknown'),
                'regionName': data.get('regionName', 'Unknown'),
                'city': data.get('city', 'Unknown'),
                'zip': data.get('zip', 'Unknown'),
                'timezone': data.get('timezone', 'Unknown'),
                'org': data.get('org', 'Unknown'),
                'isp': data.get('isp', 'Unknown'),
                'as': data.get('as', 'Unknown')
            }
            
            # Extract latitude and longitude
            location_data['lat'] = data.get('lat', 0)
            location_data['lon'] = data.get('lon', 0)
            
            return location_data
    except Exception as e:
        print(f"Error with ip-api.com: {e}")
    
    # Final fallback - extreme-ip-lookup.com
    try:
        print(f"Trying extreme-ip-lookup.com for IP: {ip}")
        response = requests.get(f'https://extreme-ip-lookup.com/json/{ip}', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"Successfully got data from extreme-ip-lookup.com: {data}")
            
            # Convert extreme-ip-lookup.com format to match our expected format
            location_data = {
                'status': 'success',
                'query': ip,
                'country': data.get('countryCode', 'Unknown'),
                'regionName': data.get('region', 'Unknown'),
                'city': data.get('city', 'Unknown'),
                'zip': 'Unknown',  # This API doesn't provide ZIP
                'timezone': 'Unknown',  # This API doesn't provide timezone
                'org': data.get('org', 'Unknown'),
                'isp': data.get('isp', 'Unknown'),
                'as': 'Unknown'  # This API doesn't provide AS information
            }
            
            # Extract latitude and longitude
            location_data['lat'] = float(data.get('lat', 0))
            location_data['lon'] = float(data.get('lon', 0))
            
            return location_data
    except Exception as e:
        print(f"Error with extreme-ip-lookup.com: {e}")
    
    # Return minimal data as last resort
    print("All IP lookup services failed, returning minimal data")
    return {
        'status': 'error',
        'query': ip,
        'country': 'Unknown',
        'regionName': 'Unknown',
        'city': 'Unknown',
        'lat': 0,
        'lon': 0,
        'error': 'Could not fetch location data'
    }

@ratelimit(key='ip', rate='30/m')
@cache_page(60 * 5)  # Cache for 5 minutes
def get_ip_info(request):
    try:
        # Check if an IP was provided in the query parameters
        search_ip = request.GET.get('ip')
        
        if search_ip and is_valid_ip(search_ip):
            # Use the provided IP
            ip = search_ip
        else:
            # Get user IP address using improved function
            ip = get_client_ip(request)
        
        print(f"Looking up IP: {ip}")
        
        # Get IP data from services
        location_data = get_ip_data(ip)
        
        return JsonResponse(location_data)
            
    except Exception as e:
        print(f"Exception in get_ip_info: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })

@require_http_methods(["POST"])
@ratelimit(key='ip', rate='5/m')
def contact_submit(request):
    try:
        name = request.POST.get('name')
        email = request.POST.get('email')
        subject = request.POST.get('subject')
        message = request.POST.get('message')
        
        # Simple validation
        if not all([name, email, subject, message]):
            return JsonResponse({
                'status': 'error',
                'message': 'All fields are required'
            }, status=400)
        
        # Validate email format
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_pattern, email):
            return JsonResponse({
                'status': 'error',
                'message': 'Invalid email format'
            }, status=400)
        
        # Create email message
        email_body = f"""
        New Contact Form Submission
        
        Name: {name}
        Email: {email}
        Subject: {subject}
        Message: {message}
        """
        
        # Send email
        send_mail(
            subject=f'New Contact Form Submission: {subject}',
            message=email_body,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[settings.DEFAULT_FROM_EMAIL],  # Send to admin email
            fail_silently=False,
        )
        
        # Save to database if you have a Contact model
        try:
            from .models import Contact
            Contact.objects.create(
                name=name,
                email=email,
                subject=subject,
                message=message
            )
        except:
            # Continue even if DB save fails
            pass
        
        return JsonResponse({
            'status': 'success',
            'message': 'Thank you for your message. We will get back to you soon!'
        })
        
    except Exception as e:
        return JsonResponse({
            'status': 'error',
            'message': 'An error occurred. Please try again later.'
        }, status=500)

@ratelimit(key='ip', rate='60/m')
def ip_info(request):
    """Alias for get_ip_info for cleaner API endpoint"""
    return get_ip_info(request)

@ratelimit(key='ip', rate='30/m')
def ip_lookup(request):
    context = {}
    
    # Log request details for debugging
    print("==== IP LOOKUP REQUEST ====")
    print(f"User Agent: {request.META.get('HTTP_USER_AGENT', 'Unknown')}")
    
    # Get the search IP from request parameters
    search_ip = request.GET.get('ip')
    
    if search_ip and is_valid_ip(search_ip):
        ip_to_lookup = search_ip
        print(f"Using provided IP from query params: {ip_to_lookup}")
        context['ip_searched'] = True
    else:
        # Get user IP address using improved function
        ip_to_lookup = get_client_ip(request)
        print(f"Using detected client IP: {ip_to_lookup}")
        context['ip_searched'] = False
    
    # Store the IP directly in the context as well
    context['ip_to_lookup'] = ip_to_lookup
    
    # Get IP data using the improved multi-service function
    ip_data = get_ip_data(ip_to_lookup)
    
    # IP type
    ip_type = "IPv4" if "." in ip_to_lookup else "IPv6"
    context['ip_type'] = ip_type
    
    # Determine connection type based on organization data if available
    org = ip_data.get('org', '').lower()
    if "mobile" in org or "cellular" in org:
        context['connection_type'] = "Mobile"
    elif "vpn" in org or "proxy" in org:
        context['connection_type'] = "VPN/Proxy"
    else:
        context['connection_type'] = "Broadband"
    
    # Security status
    if "vpn" in org or "proxy" in org:
        context['security_status'] = "VPN/Proxy Detected"
    else:
        context['security_status'] = "Secure"
    
    # Add IP data to context
    context['ip_data'] = ip_data
    
    # Debug print
    print(f"Final IP Data: {ip_data}")
    print(f"IP address in context: {ip_to_lookup}")
    
    dynamic_meta = generate_dynamic_meta(ip_data)
    context['dynamic_meta'] = dynamic_meta
    return render(request, 'ip_app/ip_lookup.html', context)

# Add dynamic meta description generation function
def generate_meta_description(ip_data):
    base_description = "Discover your IP address details, including location, ISP, and network information. Fast, secure, and accurate IP lookup tool."
    
    if ip_data and ip_data.get('city') and ip_data.get('country'):
        return f"Find IP geolocation for {ip_data['city']}, {ip_data['country']}. Get comprehensive network details and security insights."
    
    return base_description

# In views.py, update context

# Generate dynamic sitemap
from django.contrib.sitemaps import Sitemap
from django.urls import reverse

class StaticViewSitemap(Sitemap):
    priority = 0.8
    changefreq = 'weekly'

    def items(self):
        return [
            'index',
            'ip_lookup',
            'privacy',
            'terms',
            'contact'
        ]

    def location(self, item):
        return reverse(item)
    
def generate_dynamic_meta(ip_data):
    return {
        'title': f"IP Lookup: {ip_data.get('city', 'Global')} IP Address Details | WhatIsMyIPAddress.World",
        'description': f"Discover detailed IP geolocation for {ip_data.get('city', 'your location')}. Get precise network information, ISP details, and security insights for IP {ip_data.get('query', 'address')}.",
        'keywords': f"IP lookup, {ip_data.get('city', '')}, {ip_data.get('country', '')} IP, network information, geolocation, {ip_data.get('isp', '')} ISP"
    }
