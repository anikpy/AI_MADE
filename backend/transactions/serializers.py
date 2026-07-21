from django.db import transaction
from rest_framework import serializers
from .models import Transaction
from accounts.models import Account
from audit.utils import log_audit

class TransactionSerializer(serializers.ModelSerializer):
    account_number = serializers.ReadOnlyField(source='account.account_number')

    class Meta:
        model = Transaction
        fields = ('id', 'account', 'account_number', 'amount', 'type', 'category', 'status', 'merchant', 'created_at')
        read_only_fields = ('id', 'created_at')

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        account = attrs.get('account')
        
        # 1. Customer user can only create transactions for their own account
        is_staff = user.role in ('staff', 'admin') or user.is_staff or user.is_superuser
        if not is_staff and account.owner != user:
            raise serializers.ValidationError({"account": "You do not own this account."})

        # 2. Account must be active
        if account.status != Account.ACTIVE:
            raise serializers.ValidationError({"account": "Account is not active."})

        # 3. Validation on amount
        amount = attrs.get('amount')
        if amount <= 0:
            raise serializers.ValidationError({"amount": "Amount must be greater than zero."})

        # 4. Withdrawals: check insufficient balance
        type_ = attrs.get('type')
        if type_ in (Transaction.WITHDRAWAL, Transaction.TRANSFER_OUT) and account.balance < amount:
            raise serializers.ValidationError({"amount": "Insufficient balance."})

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        account_data = validated_data['account']
        
        # Lock account row for update
        account = Account.objects.select_for_update().get(id=account_data.id)
        
        amount = validated_data['amount']
        type_ = validated_data['type']
        
        # Apply balance change
        if type_ in (Transaction.DEPOSIT, Transaction.TRANSFER_IN):
            account.balance += amount
        elif type_ in (Transaction.WITHDRAWAL, Transaction.TRANSFER_OUT):
            account.balance -= amount
            
        account.save()
        
        # Save transaction (defaults status to COMPLETED for direct deposits/withdrawals)
        validated_data['status'] = Transaction.COMPLETED
        tx = super().create(validated_data)
        
        # Write Audit Log
        request = self.context.get('request')
        log_audit(
            request.user,
            'transaction_completed',
            'Transaction',
            tx.id,
            {
                'account': account.account_number,
                'amount': tx.amount,
                'type': tx.type,
                'category': tx.category,
                'new_balance': account.balance
            }
        )
        return tx
