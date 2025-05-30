from django.contrib import admin
from django.urls import path, include
from django.views.generic.base import TemplateView
from django.contrib.sitemaps.views import sitemap
from django.contrib.sitemaps import GenericSitemap, Sitemap
from django.http import HttpResponse  # MISSING IMPORT
from django.conf import settings  # MISSING IMPORT
from django.conf.urls.static import static  # MISSING IMPORT
from ip_app.views import index

def ads_txt_view(request):
    """Serve ads.txt file"""
    content = "google.com, pub-6913093595582462, DIRECT, f08c47fec0942fa0"
    return HttpResponse(content, content_type='text/plain')

def robots_txt_view(request):
    """Serve robots.txt file"""
    lines = [
        "User-agent: *",
        "Allow: /",
        "Sitemap: https://whatismyipaddress.world/sitemap.xml",
        "",
        "# Google AdSense",
        "User-agent: Mediapartners-Google",
        "Allow: /",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")

# Create Sitemap class
class StaticSitemap(Sitemap):
    changefreq = "weekly"
    priority = 0.8
    
    def items(self):
        return ['index', 'privacy', 'terms', 'contact']
    
    def location(self, item):
        return f'/{item}/' if item != 'index' else '/'

# Sitemap dictionary
sitemaps = {
    'static': StaticSitemap,
}

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('ip_app.urls')),
    path('sitemap.xml', sitemap, {'sitemaps': sitemaps},
         name='django.contrib.sitemaps.views.sitemap'),
    path('robots.txt', TemplateView.as_view(template_name="robots.txt",
         content_type="text/plain")),
    path('ads.txt', ads_txt_view, name='ads_txt'),
]

if settings.DEBUG:
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
