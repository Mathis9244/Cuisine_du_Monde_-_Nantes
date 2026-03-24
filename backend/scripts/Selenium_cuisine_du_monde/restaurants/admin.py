from django.contrib import admin
from .models import Restaurant

@admin.register(Restaurant)
class RestaurantAdmin(admin.ModelAdmin):
    list_display = ['name', 'cuisine', 'rating', 'reviews', 'created_at']
    list_filter = ['cuisine', 'rating']
    search_fields = ['name', 'cuisine', 'address']
    readonly_fields = ['created_at']
