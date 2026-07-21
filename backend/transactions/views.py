from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend
from .models import Transaction
from .serializers import TransactionSerializer
from .filters import TransactionFilter
from custom_auth.permissions import IsOwnerOrStaff

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsOwnerOrStaff]
    filter_backends = (DjangoFilterBackend, filters.OrderingFilter)
    filterset_class = TransactionFilter
    ordering_fields = ('created_at', 'amount')
    ordering = ('-created_at',)

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Transaction.objects.none()
            
        # Staff and admins can see all transactions
        if user.role in ('staff', 'admin') or user.is_staff or user.is_superuser:
            return Transaction.objects.all()
            
        # Regular users can only see transactions on accounts they own
        return Transaction.objects.filter(account__owner=user)
