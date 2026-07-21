from django.db import models

class Transaction(models.Model):
    DEPOSIT = 'deposit'
    WITHDRAWAL = 'withdrawal'
    TRANSFER_IN = 'transfer_in'
    TRANSFER_OUT = 'transfer_out'
    
    TYPE_CHOICES = (
        (DEPOSIT, 'Deposit'),
        (WITHDRAWAL, 'Withdrawal'),
        (TRANSFER_IN, 'Transfer In'),
        (TRANSFER_OUT, 'Transfer Out'),
    )

    INCOME = 'income'
    UTILITIES = 'utilities'
    GROCERIES = 'groceries'
    ENTERTAINMENT = 'entertainment'
    TRANSFER = 'transfer'
    OTHER = 'other'
    
    CATEGORY_CHOICES = (
        (INCOME, 'Income'),
        (UTILITIES, 'Utilities'),
        (GROCERIES, 'Groceries'),
        (ENTERTAINMENT, 'Entertainment'),
        (TRANSFER, 'Transfer'),
        (OTHER, 'Other'),
    )

    PENDING = 'pending'
    COMPLETED = 'completed'
    FAILED = 'failed'
    
    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
    )

    account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='transactions'
    )
    # Monetary values must be Decimal, never float
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    type = models.CharField(
        max_length=15,
        choices=TYPE_CHOICES
    )
    category = models.CharField(
        max_length=20,
        choices=CATEGORY_CHOICES,
        default=OTHER
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    merchant = models.CharField(
        max_length=100,
        blank=True,
        null=True
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.type.upper()} of {self.amount} for Account {self.account.account_number} ({self.status})"
