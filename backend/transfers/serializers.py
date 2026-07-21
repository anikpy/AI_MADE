from rest_framework import serializers
from django.utils import timezone
from .models import Transfer
from accounts.models import Account
from .services import execute_transfer
from audit.utils import log_audit
from notifications.models import Notification

class TransferSerializer(serializers.ModelSerializer):
    source_account_number = serializers.ReadOnlyField(source='source_account.account_number')
    destination_account_number = serializers.ReadOnlyField(source='destination_account.account_number')

    class Meta:
        model = Transfer
        fields = (
            'id', 'source_account', 'source_account_number', 'destination_account', 
            'destination_account_number', 'amount', 'status', 'scheduled_for', 
            'created_at', 'is_external', 'external_bank_name', 
            'external_account_number', 'external_routing_number'
        )
        read_only_fields = ('id', 'status', 'created_at')

    def validate(self, attrs):
        request = self.context.get('request')
        user = request.user
        source_account = attrs.get('source_account')
        destination_account = attrs.get('destination_account')
        amount = attrs.get('amount')
        scheduled_for = attrs.get('scheduled_for')
        is_external = attrs.get('is_external', False)

        # 1. User must own the source account unless staff/admin
        is_staff = user.role in ('staff', 'admin') or user.is_staff or user.is_superuser
        if not is_staff and source_account.owner != user:
            raise serializers.ValidationError({"source_account": "You do not own this source account."})

        # 2. Source account must be active
        if source_account.status != Account.ACTIVE:
            raise serializers.ValidationError({"source_account": "Source account is not active."})

        # 3. Validation on amount
        if amount <= 0:
            raise serializers.ValidationError({"amount": "Transfer amount must be greater than zero."})

        # 4. Check sufficient balance
        if source_account.balance < amount:
            raise serializers.ValidationError({"amount": "Insufficient balance."})

        # 5. Scheduled time validation
        if scheduled_for and scheduled_for < timezone.now():
            raise serializers.ValidationError({"scheduled_for": "Scheduled time must be in the future."})

        if is_external:
            # External transfer requirements
            if not attrs.get('external_bank_name'):
                raise serializers.ValidationError({"external_bank_name": "External bank name is required."})
            if not attrs.get('external_account_number'):
                raise serializers.ValidationError({"external_account_number": "External account number is required."})
            if not attrs.get('external_routing_number'):
                raise serializers.ValidationError({"external_routing_number": "External routing number is required."})
            if destination_account:
                raise serializers.ValidationError({"destination_account": "Destination account must be empty for external transfers."})
        else:
            # Internal transfer requirements
            if not destination_account:
                raise serializers.ValidationError({"destination_account": "Destination account is required."})
            if destination_account == source_account:
                raise serializers.ValidationError({"destination_account": "Source and destination accounts must be different."})
            if destination_account.status != Account.ACTIVE:
                raise serializers.ValidationError({"destination_account": "Destination account is not active."})
            # Require transfers to own accounts for regular customers
            if not is_staff and destination_account.owner != user:
                raise serializers.ValidationError({"destination_account": "You can only transfer between your own accounts."})

        return attrs

    def create(self, validated_data):
        scheduled_for = validated_data.get('scheduled_for')
        request = self.context.get('request')
        
        if scheduled_for:
            validated_data['status'] = Transfer.SCHEDULED
            transfer = super().create(validated_data)
            
            # Audit log for scheduled event
            log_audit(
                request.user,
                'transfer_scheduled',
                'Transfer',
                transfer.id,
                {
                    'source': transfer.source_account.account_number,
                    'amount': transfer.amount,
                    'scheduled_for': transfer.scheduled_for
                }
            )
            
            Notification.objects.create(
                user=request.user,
                title="Transfer Scheduled",
                message=f"Your transfer of {transfer.amount} has been scheduled for {transfer.scheduled_for}."
            )
        else:
            validated_data['status'] = Transfer.PENDING
            transfer = super().create(validated_data)
            
            # Execute immediately
            execute_transfer(transfer.id)
            transfer.refresh_from_db()

        return transfer
