from django.contrib import admin
from .models import Account, Statement

@admin.register(Account)
class AccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'owner', 'account_type', 'balance', 'status', 'created_at')
    list_filter = ('account_type', 'status', 'created_at')
    search_fields = ('account_number', 'owner__username', 'owner__email')
    readonly_fields = ('account_number', 'created_at')
    ordering = ('-created_at',)


@admin.register(Statement)
class StatementAdmin(admin.ModelAdmin):
    list_display = ('id', 'account', 'month', 'pdf_file', 'created_at')
    list_filter = ('month', 'created_at')
    search_fields = ('account__account_number',)

