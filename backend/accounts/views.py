from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Account, Statement
from .serializers import AccountSerializer, StatementSerializer
from custom_auth.permissions import IsOwnerOrStaff
from audit.utils import log_audit


class AccountViewSet(viewsets.ModelViewSet):
    serializer_class = AccountSerializer
    permission_classes = [IsOwnerOrStaff]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Account.objects.none()
            
        # Staff and Admin can view all accounts
        if user.role in ('staff', 'admin') or user.is_staff or user.is_superuser:
            return Account.objects.all().order_by('-created_at')
            
        # Regular customers can only view their own accounts
        return Account.objects.filter(owner=user).order_by('-created_at')

    def perform_create(self, serializer):
        account = serializer.save()
        log_audit(
            self.request.user,
            'account_created',
            'Account',
            account.id,
            {
                'account_number': account.account_number,
                'account_type': account.account_type,
                'balance': account.balance,
                'status': account.status
            }
        )

    def perform_update(self, serializer):
        # Fetch status and info before saving
        old_instance = self.get_object()
        old_status = old_instance.status
        old_type = old_instance.account_type
        
        account = serializer.save()
        
        log_audit(
            self.request.user,
            'account_updated',
            'Account',
            account.id,
            {
                'status': f"{old_status} -> {account.status}",
                'account_type': f"{old_type} -> {account.account_type}"
            }
        )

    def perform_destroy(self, instance):
        account_id = instance.id
        account_number = instance.account_number
        
        instance.delete()
        
        log_audit(
            self.request.user,
            'account_deleted',
            'Account',
            account_id,
            {
                'account_number': account_number
            }
        )

    @action(detail=True, methods=['post'], url_path='generate-statement')
    def generate_statement(self, request, pk=None):
        """
        Trigger async PDF statement generation for a given account and month.
        POST body: { "month": "YYYY-MM" }
        """
        account = self.get_object()
        month = request.data.get('month')

        if not month:
            return Response({'detail': 'month is required (format: YYYY-MM).'}, status=status.HTTP_400_BAD_REQUEST)

        # Validate format
        import re
        if not re.match(r'^\d{4}-\d{2}$', month):
            return Response({'detail': 'month must be in YYYY-MM format.'}, status=status.HTTP_400_BAD_REQUEST)

        from .tasks import generate_statement as gen_task
        task = gen_task.delay(account.id, month)

        return Response({
            'detail': f'Statement generation queued for {month}.',
            'task_id': task.id,
        }, status=status.HTTP_202_ACCEPTED)


class StatementViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = StatementSerializer
    permission_classes = [IsOwnerOrStaff]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Statement.objects.none()

        if user.role in ('staff', 'admin') or user.is_staff or user.is_superuser:
            return Statement.objects.all().order_by('-month')

        return Statement.objects.filter(account__owner=user).order_by('-month')


