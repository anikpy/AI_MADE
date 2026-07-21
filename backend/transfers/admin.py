from django.contrib import admin
from .models import Transfer

@admin.register(Transfer)
class TransferAdmin(admin.ModelAdmin):
    list_display = ('id', 'source_account', 'destination_account', 'amount', 'status', 'scheduled_for', 'created_at', 'is_external')
    list_filter = ('status', 'is_external', 'created_at')
    search_fields = ('source_account__account_number', 'destination_account__account_number', 'external_account_number')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
