from django.db import models

class Transfer(models.Model):
    PENDING = 'pending'
    SCHEDULED = 'scheduled'
    COMPLETED = 'completed'
    FAILED = 'failed'
    
    STATUS_CHOICES = (
        (PENDING, 'Pending'),
        (SCHEDULED, 'Scheduled'),
        (COMPLETED, 'Completed'),
        (FAILED, 'Failed'),
    )

    source_account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='outgoing_transfers',
        null=True,
        blank=True
    )
    destination_account = models.ForeignKey(
        'accounts.Account',
        on_delete=models.CASCADE,
        related_name='incoming_transfers',
        null=True,
        blank=True
    )
    # Monetary values must be Decimal, never float
    amount = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default=PENDING
    )
    scheduled_for = models.DateTimeField(
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Fields to support external transfers (mocked bank rail)
    is_external = models.BooleanField(default=False)
    external_bank_name = models.CharField(max_length=100, blank=True, null=True)
    external_account_number = models.CharField(max_length=30, blank=True, null=True)
    external_routing_number = models.CharField(max_length=30, blank=True, null=True)

    def __str__(self):
        dest = self.destination_account.account_number if self.destination_account else f"External ({self.external_bank_name})"
        src = self.source_account.account_number if self.source_account else "External Deposit"
        return f"Transfer of {self.amount} from {src} to {dest} ({self.status})"
