from rest_framework import serializers
from .models import Restaurant

class RestaurantSerializer(serializers.ModelSerializer):
    class Meta:
        model = Restaurant
        fields = ['id', 'cuisine', 'name', 'rating', 'reviews', 'address', 'url', 'created_at']
        read_only_fields = ['id', 'created_at']
