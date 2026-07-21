from rest_framework import serializers
from .models import AuditLog

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AuditLog
        fields = ('id', 'user', 'username', 'action', 'model_name', 'object_id', 'changes', 'timestamp')
        read_only_fields = ('id', 'user', 'username', 'action', 'model_name', 'object_id', 'changes', 'timestamp')
