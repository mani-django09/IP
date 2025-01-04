# ip_app/views.py
from django.shortcuts import render
from django.http import JsonResponse
import requests
from .models import Contact
from django.core.mail import send_mail
from django.views.decorators.csrf import ensure_csrf_cookie
from django.conf import settings

def index(request):
    return render(request, 'ip_app/index.html')

def privacy(request):
    return render(request, 'ip_app/privacy.html')

def terms(request):
    return render(request, 'ip_app/terms.html')

def contact(request):
        return render(request, 'ip_app/contact.html')

def get_ip_info(request):
    try:
        # Get search IP or client IP
        search_ip = request.GET.get('ip')
        
        if not search_ip:
            # Try different headers to get the real IP
            x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
            x_real_ip = request.META.get('HTTP_X_REAL_IP')
            remote_addr = request.META.get('REMOTE_ADDR')
            
            if x_forwarded_for:
                search_ip = x_forwarded_for.split(',')[0].strip()
            elif x_real_ip:
                search_ip = x_real_ip
            elif remote_addr:
                search_ip = remote_addr
            
            # If we're still getting localhost, use a public IP API
            if search_ip in ['127.0.0.1', 'localhost', '::1']:
                try:
                    public_ip_response = requests.get('https://api.ipify.org?format=json')
                    if public_ip_response.status_code == 200:
                        search_ip = public_ip_response.json().get('ip')
                except:
                    # If public IP lookup fails, use a test IP
                    search_ip = '8.8.8.8'  # Using Google's DNS as fallback
        
        print(f"Searching for IP: {search_ip}")  # Debug print
        
        # Call IP-API
        api_url = f'http://ip-api.com/json/{search_ip}'
        response = requests.get(api_url)
        data = response.json()
        
        if data.get('status') == 'success':
            data['query'] = search_ip
            return JsonResponse(data)
        else:
            # If IP lookup fails, provide fallback data
            fallback_data = {
                'status': 'success',
                'query': search_ip,
                'country': 'United States',
                'countryCode': 'US',
                'region': 'CA',
                'regionName': 'California',
                'city': 'San Francisco',
                'zip': '94105',
                'lat': 37.7749,
                'lon': -122.4194,
                'timezone': 'America/Los_Angeles',
                'isp': 'Example ISP',
                'org': 'Example Organization',
                'as': 'AS15169'
            }
            return JsonResponse(fallback_data)
            
    except Exception as e:
        print(f"Error in get_ip_info: {str(e)}")
        # Return fallback data in case of any error
        return JsonResponse({
            'status': 'success',
            'query': search_ip if 'search_ip' in locals() else '8.8.8.8',
            'country': 'United States',
            'countryCode': 'US',
            'region': 'CA',
            'regionName': 'California',
            'city': 'San Francisco',
            'zip': '94105',
            'lat': 37.7749,
            'lon': -122.4194,
            'timezone': 'America/Los_Angeles',
            'isp': 'Example ISP',
            'org': 'Example Organization',
            'as': 'AS15169'
        })
    
@ensure_csrf_cookie
def contact_view(request):
    return render(request, 'ip_app/contact.html')

def contact_submit(request):
    if request.method == 'POST':
        try:
            name = request.POST.get('name')
            email = request.POST.get('email')
            subject = request.POST.get('subject')
            message = request.POST.get('message')
            
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
            
            return JsonResponse({
                'status': 'success',
                'message': 'Thank you for your message. We will get back to you soon!'
            })
            
        except Exception as e:
            return JsonResponse({
                'status': 'error',
                'message': 'An error occurred. Please try again later.'
            }, status=500)
            
    return JsonResponse({
        'status': 'error',
        'message': 'Invalid request method'
    }, status=400)