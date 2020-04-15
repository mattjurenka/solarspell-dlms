
from django.contrib import admin
from django.urls import path,include

urlpatterns = [
    path('', include('content_management.urls')),
]
