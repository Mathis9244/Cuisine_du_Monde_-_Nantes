from django.db import models

class Restaurant(models.Model):
    cuisine = models.CharField(max_length=500)
    name = models.CharField(max_length=500)
    rating = models.FloatField(null=True, blank=True)
    reviews = models.IntegerField(null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    url = models.URLField(unique=True, max_length=1000)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-rating', '-reviews']
        indexes = [
            models.Index(fields=['cuisine']),
            models.Index(fields=['-rating']),
        ]
    
    def __str__(self):
        return f"{self.name} ({self.cuisine})"
