from django.contrib import admin
from .models import Transaction

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'account', 'amount', 'type', 'category', 'status', 'merchant', 'created_at')
    list_filter = ('type', 'category', 'status', 'created_at')
    search_fields = ('account__account_number', 'merchant', 'id')
    readonly_fields = ('created_at',)
    ordering = ('-created_at',)
