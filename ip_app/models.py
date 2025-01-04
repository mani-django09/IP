from django.db import models

class IPAddress(models.Model):
    ip = models.GenericIPAddressField()
    country = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    region = models.CharField(max_length=100)
    loc = models.CharField(max_length=100)
    org = models.CharField(max_length=200)
    postal = models.CharField(max_length=20)
    timezone = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.ip} - {self.country}"
    

    # ip_app/models.py
from django.db import models

class Contact(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} - {self.subject}"