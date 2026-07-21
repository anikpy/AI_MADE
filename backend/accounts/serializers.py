from rest_framework import serializers
from .models import Account, Statement
from django.contrib.auth import get_user_model

User = get_user_model()

class AccountSerializer(serializers.ModelSerializer):
    owner_username = serializers.ReadOnlyField(source='owner.username')
    owner = serializers.PrimaryKeyRelatedField(queryset=User.objects.all(), required=False)

    class Meta:
        model = Account
        fields = ('id', 'owner', 'owner_username', 'account_number', 'account_type', 'balance', 'status', 'created_at')
        read_only_fields = ('id', 'account_number', 'balance', 'created_at')

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        request = self.context.get('request')
        if request and request.user:
            # If standard customer user, make owner and status read_only
            user = request.user
            is_staff = user.role in ('staff', 'admin') or user.is_staff or user.is_superuser
            if not is_staff:
                self.fields['owner'].read_only = True
                self.fields['status'].read_only = True
            else:
                self.fields['owner'].required = True

    def create(self, validated_data):
        request = self.context.get('request')
        # If owner is not provided (or customer user who can't provide it), default to self
        if 'owner' not in validated_data:
            validated_data['owner'] = request.user
        return super().create(validated_data)


class StatementSerializer(serializers.ModelSerializer):
    account_number = serializers.ReadOnlyField(source='account.account_number')

    class Meta:
        model = Statement
        fields = ('id', 'account', 'account_number', 'month', 'pdf_file', 'created_at')
        read_only_fields = ('id', 'account', 'account_number', 'month', 'pdf_file', 'created_at')

