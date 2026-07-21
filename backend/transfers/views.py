from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Transfer
from .serializers import TransferSerializer
from custom_auth.permissions import IsOwnerOrStaff

class TransferViewSet(viewsets.ModelViewSet):
    serializer_class = TransferSerializer
    permission_classes = [IsOwnerOrStaff]
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_fields = ('status', 'is_external')
    ordering_fields = ('created_at', 'amount')
    ordering = ('-created_at',)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Transfer.objects.none()
            
        # Staff and admins can see all transfers
        if user.role in ('staff', 'admin') or user.is_staff or user.is_superuser:
            return Transfer.objects.all()
            
        # Regular users can see transfers where they own the source or destination account
        return Transfer.objects.filter(
            source_account__owner=user
        ) | Transfer.objects.filter(
            destination_account__owner=user
        )
