from rest_framework import viewsets, permissions
from .models import AuditLog
from .serializers import AuditLogSerializer

class IsAdminOrStaff(permissions.BasePermission):
    """
    Allows access only to admin/staff users.
    """
    def has_permission(self, request, view):
        user = request.user
        return user and user.is_authenticated and (
            user.role in ('admin', 'staff') or user.is_staff or user.is_superuser
        )

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Admin-only read-only viewset for system audits.
    """
    serializer_class = AuditLogSerializer
    permission_classes = [IsAdminOrStaff]
    queryset = AuditLog.objects.all().order_by('-timestamp')
    filterset_fields = ('action', 'model_name', 'user')
