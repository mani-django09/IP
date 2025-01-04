from django.urls import path
from . import views
from .api import IPInfoView

urlpatterns = [
    path('', views.index, name='index'),
    #path('api/ip-info/', IPInfoView.as_view(), name='ip_info'),
    path('api/ip-info/', views.get_ip_info, name='ip_info'),
    path('privacy/', views.privacy, name='privacy'),
    path('terms/', views.terms, name='terms'),
    path('contact/', views.contact, name='contact'),
    path('api/contact/', views.contact_submit, name='contact_submit'),  # New contact API endpoint

]
