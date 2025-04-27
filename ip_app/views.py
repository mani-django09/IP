from django.shortcuts import render
from django.http import JsonResponse
import requests
from django.core.mail import send_mail
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings
from django.views.decorators.cache import cache_page
from django.views.decorators.http import require_http_methods
import re

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
        # Add logging to check what's happening
        print("Attempting to fetch IP data")
        
        # Your existing IP fetching code
        response = requests.get('https://ipinfo.io/json')
        
        if response.status_code == 200:
            ip_data = response.json()
            print(f"Successfully retrieved IP data: {ip_data}")
        else:
            print(f"Failed to get IP data. Status code: {response.status_code}")
            ip_data = {'error': 'Failed to retrieve IP data'}
            
        # Rest of your view code
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

# Simple IP validation function
def is_valid_ip(ip):
    """Check if the provided string is a valid IPv4 or IPv6 address"""
    # IPv4 pattern
    ipv4_pattern = r'^(\d{1,3}\.){3}\d{1,3}$'
    # Simple IPv6 pattern
    ipv6_pattern = r'^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$|^::1$|^([0-9a-fA-F]{1,4}:){0,6}:[0-9a-fA-F]{1,4}$'
    
    return bool(re.match(ipv4_pattern, ip) or re.match(ipv6_pattern, ip))

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
            # Get user IP address
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            if x_forwarded_for:
                ip = x_forwarded_for.split(',')[0].strip()
            else:
                ip = request.META.get('REMOTE_ADDR')
        
        # Handle local development
        if ip in ['127.0.0.1', 'localhost', '::1']:
            try:
                response = requests.get('https://api.ipify.org?format=json', timeout=5)
                if response.status_code == 200:
                    ip = response.json().get('ip')
            except Exception as e:
                print(f"Error getting external IP: {e}")
                # Fallback to a default IP for testing
                ip = '8.8.8.8'  # Google DNS as fallback
        
        print(f"Looking up IP: {ip}")
        
        # Use ipinfo.io API with timeout
        response = requests.get(f'https://ipinfo.io/{ip}/json', timeout=5)
        if response.status_code == 200:
            data = response.json()
            print(f"Successfully got data for IP {ip}: {data}")
            
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
            }
            
            # Extract latitude and longitude
            if data.get('loc'):
                try:
                    lat, lon = data.get('loc').split(',')
                    location_data['lat'] = float(lat)
                    location_data['lon'] = float(lon)
                except Exception as e:
                    print(f"Error parsing location: {e}")
                    # Set default coordinates for better error handling
                    location_data['lat'] = 0
                    location_data['lon'] = 0
            else:
                # Set default coordinates if not provided
                location_data['lat'] = 0
                location_data['lon'] = 0
            
            return JsonResponse(location_data)
        else:
            print(f"Error from ipinfo.io API: {response.status_code}")
            return JsonResponse({
                'status': 'error',
                'message': f'Unable to get location data for IP: {response.status_code}'
            })
            
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
    
    # Get the search IP from request parameters
    search_ip = request.GET.get('ip')
    
    if search_ip and is_valid_ip(search_ip):
        ip_to_lookup = search_ip
        context['ip_searched'] = True
    else:
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip_to_lookup = x_forwarded_for.split(',')[0].strip()
        else:
            ip_to_lookup = request.META.get('REMOTE_ADDR')
        
        # Handle local development
        if ip_to_lookup in ['127.0.0.1', 'localhost', '::1']:
            try:
                response = requests.get('https://api.ipify.org?format=json')
                if response.status_code == 200:
                    ip_to_lookup = response.json().get('ip')
            except:
                pass
        
        context['ip_searched'] = False
    
    # Store the IP directly in the context as well
    context['ip_to_lookup'] = ip_to_lookup
    
    # Create simple data structure with IP
    ip_data = {
        'query': ip_to_lookup,
        'status': 'success'
    }
    
    # Try to fetch additional data
    try:
        response = requests.get(f'https://ipinfo.io/{ip_to_lookup}/json')
        if response.status_code == 200:
            api_data = response.json()
            
            # Merge data but preserve our query field
            ip_data.update({
                'country': api_data.get('country', 'Unknown'),
                'regionName': api_data.get('region', 'Unknown'),
                'city': api_data.get('city', 'Unknown'),
                'zip': api_data.get('postal', 'Unknown'),
                'timezone': api_data.get('timezone', 'Unknown'),
                'org': api_data.get('org', 'Unknown'),
                'isp': api_data.get('org', 'Unknown').split(' ')[0] if api_data.get('org') else 'Unknown',
                'as': api_data.get('org', 'Unknown')
            })
            
            # Extract latitude and longitude
            if api_data.get('loc'):
                try:
                    lat, lon = api_data.get('loc').split(',')
                    ip_data['lat'] = float(lat)
                    ip_data['lon'] = float(lon)
                except:
                    ip_data['lat'] = 0
                    ip_data['lon'] = 0
            else:
                ip_data['lat'] = 0
                ip_data['lon'] = 0
            
            # IP type
            ip_type = "IPv4" if "." in ip_to_lookup else "IPv6"
            context['ip_type'] = ip_type
            
            # Connection type
            org = api_data.get('org', '').lower()
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
    except Exception as e:
        print(f"Error fetching IP data: {str(e)}")
    
    # Add IP data to context
    context['ip_data'] = ip_data
    
    # Debug print
    print(f"Final IP Data: {ip_data}")
    print(f"IP address in context: {ip_to_lookup}")
    
    return render(request, 'ip_app/ip_lookup.html', context)

def get_client_ip(request):
    """Get the client's IP address from the request."""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip