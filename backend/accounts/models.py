import random
from django.db import models
from django.conf import settings

def generate_account_number():
    while True:
        # Generate a random 10-digit number
        num = ''.join([str(random.randint(0, 9)) for _ in range(10)])
        # Check if it already exists (we handle this safely during import time or runtime)
        # Note: In standard Django, to avoid circular reference issues if we query here,
        # we can lazy-reference the model or handle it in save().
        try:
            if not Account.objects.filter(account_number=num).exists():
                return num
        except Exception:
            return num

class Account(models.Model):
    CHECKING = 'checking'
    SAVINGS = 'savings'
    
    TYPE_CHOICES = (
        (CHECKING, 'Checking'),
        (SAVINGS, 'Savings'),
    )

    ACTIVE = 'active'
    SUSPENDED = 'suspended'
    CLOSED = 'closed'
    
    STATUS_CHOICES = (
        (ACTIVE, 'Active'),
        (SUSPENDED, 'Suspended'),
        (CLOSED, 'Closed'),
    )

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='accounts'
    )
    account_number = models.CharField(
        max_length=20,
        unique=True,
        default=generate_account_number
    )
    account_type = models.CharField(
        max_length=15,
        choices=TYPE_CHOICES,
        default=CHECKING
    )
    # Monetary values must be Decimal, never float
    balance = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0.00
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default=ACTIVE
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.account_number} ({self.account_type}) - Balance: {self.balance}"


class Statement(models.Model):
    account = models.ForeignKey(
        Account,
        on_delete=models.CASCADE,
        related_name='statements'
    )
    month = models.CharField(max_length=7) # format: YYYY-MM
    pdf_file = models.FileField(upload_to='statements/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('account', 'month')

    def __str__(self):
        return f"Statement for Account {self.account.account_number} ({self.month})"

