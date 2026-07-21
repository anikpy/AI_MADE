from django.contrib.auth.models import AbstractUser
from django.db import models

class User(AbstractUser):
    CUSTOMER = 'customer'
    STAFF = 'staff'
    ADMIN = 'admin'
    
    ROLE_CHOICES = (
        (CUSTOMER, 'Customer'),
        (STAFF, 'Staff'),
        (ADMIN, 'Admin'),
    )
    
    role = models.CharField(
        max_length=15,
        choices=ROLE_CHOICES,
        default=CUSTOMER
    )

    def save(self, *args, **kwargs):
        if self.role == self.ADMIN:
            self.is_staff = True
            self.is_superuser = True
        elif self.role == self.STAFF:
            self.is_staff = True
            self.is_superuser = False
        else:
            # If the user is a customer, they shouldn't access admin
            # unless explicitly specified by superuser
            if not self.is_superuser:
                self.is_staff = False
        
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.username} ({self.role})"
