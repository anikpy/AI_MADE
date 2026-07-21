import os
import django
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'finance_core.settings')
django.setup()

from django.conf import settings
settings.CELERY_TASK_ALWAYS_EAGER = True
settings.CELERY_TASK_EAGER_PROPAGATES = True


from django.contrib.auth import get_user_model
from accounts.models import Account, Statement
from transactions.models import Transaction
from transfers.models import Transfer
from notifications.models import Notification, NotificationPreference

User = get_user_model()

def run():
    print("Ingesting demo data...")

    # 1. Create Users
    # Admin is already set up as: admin / AdminPass123!
    
    # Customer 1 (John Doe)
    c1, created = User.objects.get_or_create(
        username='johndoe',
        email='john.doe@example.com',
        defaults={
            'first_name': 'John',
            'last_name': 'Doe',
            'role': 'customer',
        }
    )
    if created or c1.check_password(''):
        c1.set_password('CustomerPass123!')
        c1.save()
        
    # Customer 2 (Jane Smith)
    c2, created = User.objects.get_or_create(
        username='janesmith',
        email='jane.smith@example.com',
        defaults={
            'first_name': 'Jane',
            'last_name': 'Smith',
            'role': 'customer',
        }
    )
    if created or c2.check_password(''):
        c2.set_password('CustomerPass123!')
        c2.save()

    print(f"Users ensured: {c1.username}, {c2.username}")

    # 2. Ensure Notification Preferences
    NotificationPreference.objects.get_or_create(user=c1, defaults={'email_enabled': True, 'in_app_enabled': True})
    NotificationPreference.objects.get_or_create(user=c2, defaults={'email_enabled': True, 'in_app_enabled': True})

    # 3. Create Accounts
    # Delete old demo data for clean state if desired, but here we just get or create
    # John's Checking
    john_checking, created = Account.objects.get_or_create(
        owner=c1,
        account_type=Account.CHECKING,
        defaults={
            'balance': Decimal('5420.50'),
            'status': Account.ACTIVE
        }
    )
    if not created:
        john_checking.balance = Decimal('5420.50')
        john_checking.save()

    # John's Savings
    john_savings, created = Account.objects.get_or_create(
        owner=c1,
        account_type=Account.SAVINGS,
        defaults={
            'balance': Decimal('25000.00'),
            'status': Account.ACTIVE
        }
    )
    if not created:
        john_savings.balance = Decimal('25000.00')
        john_savings.save()

    # Jane's Checking
    jane_checking, created = Account.objects.get_or_create(
        owner=c2,
        account_type=Account.CHECKING,
        defaults={
            'balance': Decimal('1250.00'),
            'status': Account.ACTIVE
        }
    )
    if not created:
        jane_checking.balance = Decimal('1250.00')
        jane_checking.save()

    print("Accounts created / reset:")
    print(f"  - John Checking: #{john_checking.account_number} (Bal: ${john_checking.balance})")
    print(f"  - John Savings: #{john_savings.account_number} (Bal: ${john_savings.balance})")
    print(f"  - Jane Checking: #{jane_checking.account_number} (Bal: ${jane_checking.balance})")

    # Clear old transactions and transfers to populate clean history
    Transaction.objects.filter(account__in=[john_checking, john_savings, jane_checking]).delete()
    Transfer.objects.filter(source_account__in=[john_checking, john_savings, jane_checking]).delete()

    # 4. Populate John's Checking Transactions
    now = timezone.now()
    
    txs_data = [
        # (offset_days, type, category, merchant, amount, status)
        (15, 'deposit', 'income', 'Apex Tech Corp Payroll', Decimal('3500.00'), 'completed'),
        (14, 'withdrawal', 'utilities', 'City Power & Light', Decimal('125.40'), 'completed'),
        (12, 'withdrawal', 'groceries', 'Supermarket Mart', Decimal('240.50'), 'completed'),
        (10, 'withdrawal', 'entertainment', 'Cinema Complex', Decimal('35.00'), 'completed'),
        (8, 'withdrawal', 'other', 'Local Coffee Shop', Decimal('6.75'), 'completed'),
        (6, 'withdrawal', 'groceries', 'Organic Foods Market', Decimal('89.20'), 'completed'),
        (4, 'withdrawal', 'utilities', 'FastNet Broadband', Decimal('79.99'), 'completed'),
        (2, 'deposit', 'other', 'Mobile Check Deposit', Decimal('150.00'), 'completed'),
    ]

    for offset, tx_type, category, merchant, amount, status in txs_data:
        Transaction.objects.create(
            account=john_checking,
            amount=amount,
            type=tx_type,
            category=category,
            status=status,
            merchant=merchant,
            created_at=now - timedelta(days=offset)
        )

    # 5. Populate John's Savings Transactions
    Transaction.objects.create(
        account=john_savings,
        amount=Decimal('25000.00'),
        type='deposit',
        category='income',
        status='completed',
        merchant='Initial Deposit Transfer',
        created_at=now - timedelta(days=30)
    )
    Transaction.objects.create(
        account=john_savings,
        amount=Decimal('12.50'),
        type='deposit',
        category='income',
        status='completed',
        merchant='Monthly Savings Interest',
        created_at=now - timedelta(days=1)
    )

    # 6. Populate Jane's Checking Transactions
    Transaction.objects.create(
        account=jane_checking,
        amount=Decimal('1500.00'),
        type='deposit',
        category='income',
        status='completed',
        merchant='State Service Salary',
        created_at=now - timedelta(days=5)
    )
    Transaction.objects.create(
        account=jane_checking,
        amount=Decimal('250.00'),
        type='withdrawal',
        category='other',
        status='completed',
        merchant='Atm Cash Withdrawal',
        created_at=now - timedelta(days=3)
    )

    # 7. Create Transfers History
    t1 = Transfer.objects.create(
        source_account=john_checking,
        destination_account=john_savings,
        amount=Decimal('1000.00'),
        status='completed',
        is_external=False,
        created_at=now - timedelta(days=11)
    )
    # Also log matching transactions for complete balance record
    Transaction.objects.create(
        account=john_checking,
        amount=Decimal('1000.00'),
        type='transfer_out',
        category='transfer',
        status='completed',
        merchant=f'Transfer to Savings #{john_savings.account_number}',
        created_at=t1.created_at
    )
    Transaction.objects.create(
        account=john_savings,
        amount=Decimal('1000.00'),
        type='transfer_in',
        category='transfer',
        status='completed',
        merchant=f'Transfer from Checking #{john_checking.account_number}',
        created_at=t1.created_at
    )

    # External Transfer
    Transfer.objects.create(
        source_account=john_checking,
        amount=Decimal('450.00'),
        status='completed',
        is_external=True,
        external_bank_name='Chase Bank',
        external_account_number='987654321',
        external_routing_number='123456789',
        created_at=now - timedelta(days=7)
    )
    Transaction.objects.create(
        account=john_checking,
        amount=Decimal('450.00'),
        type='transfer_out',
        category='transfer',
        status='completed',
        merchant='External Transfer to Chase Bank',
        created_at=now - timedelta(days=7)
    )

    print("Demo transactions and transfers generated.")

    # 8. Create In-app Notifications
    Notification.objects.create(
        user=c1,
        title='Welcome to ApexFinance',
        message='Your client portal is active. You can now manage checkings, savings, and transfer funds.',
        read=False
    )
    Notification.objects.create(
        user=c1,
        title='Internal Transfer Complete',
        message='Your transfer of $1,000.00 from checking to savings succeeded.',
        read=True,
        created_at=now - timedelta(days=11)
    )

    print("Demo data ingestion finished successfully!")

if __name__ == '__main__':
    run()
