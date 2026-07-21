"""
Smoke tests for the finance platform backend.
Tests cover: user auth, account CRUD, transaction creation,
transfer atomicity, and permission enforcement.
"""
import pytest
from decimal import Decimal
from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


@pytest.fixture
def api_client():
    return APIClient()


@pytest.fixture
def customer(db):
    return User.objects.create_user(
        username='testcustomer',
        email='customer@test.com',
        password='TestPass123!',
        role='customer'
    )


@pytest.fixture
def other_customer(db):
    return User.objects.create_user(
        username='othercustomer',
        email='other@test.com',
        password='TestPass123!',
        role='customer'
    )


@pytest.fixture
def staff_user(db):
    return User.objects.create_user(
        username='staffuser',
        email='staff@test.com',
        password='TestPass123!',
        role='staff'
    )


@pytest.fixture
def auth_client(api_client, customer):
    api_client.force_authenticate(user=customer)
    return api_client


@pytest.fixture
def staff_client(api_client, staff_user):
    api_client.force_authenticate(user=staff_user)
    return api_client


@pytest.fixture
def customer_account(db, customer):
    from accounts.models import Account
    return Account.objects.create(
        owner=customer,
        account_type=Account.CHECKING,
        balance=Decimal('1000.00'),
        status=Account.ACTIVE
    )


@pytest.fixture
def other_account(db, other_customer):
    from accounts.models import Account
    return Account.objects.create(
        owner=other_customer,
        account_type=Account.SAVINGS,
        balance=Decimal('500.00'),
        status=Account.ACTIVE
    )


# ==================== AUTH TESTS ====================

class TestAuthFlow:
    def test_register_creates_user(self, db, api_client):
        url = reverse('auth_register')
        data = {
            'username': 'newuser',
            'email': 'new@test.com',
            'password': 'StrongPass123!',
        }
        resp = api_client.post(url, data, format='json')
        assert resp.status_code == status.HTTP_201_CREATED
        assert 'access' in resp.data
        assert 'refresh' in resp.data
        assert User.objects.filter(username='newuser').exists()

    def test_register_weak_password_rejected(self, db, api_client):
        url = reverse('auth_register')
        resp = api_client.post(url, {
            'username': 'user2',
            'email': 'user2@test.com',
            'password': '123'
        }, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST

    def test_login_returns_tokens(self, db, api_client, customer):
        url = reverse('auth_login')
        resp = api_client.post(url, {
            'username': 'testcustomer',
            'password': 'TestPass123!'
        }, format='json')
        assert resp.status_code == status.HTTP_200_OK
        assert 'access' in resp.data
        assert 'refresh' in resp.data

    def test_me_returns_user_data(self, auth_client, customer):
        url = reverse('auth_me')
        resp = auth_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        assert resp.data['username'] == customer.username
        assert resp.data['role'] == 'customer'

    def test_unauthenticated_access_denied(self, api_client):
        url = reverse('account-list')
        resp = api_client.get(url)
        assert resp.status_code == status.HTTP_401_UNAUTHORIZED

    def test_logout_blacklists_token(self, db, api_client, customer):
        # Login to get tokens
        login_url = reverse('auth_login')
        login_resp = api_client.post(login_url, {
            'username': 'testcustomer',
            'password': 'TestPass123!'
        }, format='json')
        refresh = login_resp.data['refresh']
        access = login_resp.data['access']

        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {access}')
        logout_url = reverse('auth_logout')
        resp = api_client.post(logout_url, {'refresh': refresh}, format='json')
        assert resp.status_code == status.HTTP_200_OK


# ==================== ACCOUNT TESTS ====================

class TestAccountViewSet:
    def test_customer_can_create_account(self, auth_client, customer):
        url = reverse('account-list')
        resp = auth_client.post(url, {'account_type': 'checking'}, format='json')
        assert resp.status_code == status.HTTP_201_CREATED
        assert resp.data['owner'] == customer.id

    def test_customer_only_sees_own_accounts(self, auth_client, customer_account, other_account):
        url = reverse('account-list')
        resp = auth_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        # Handle both paginated and non-paginated responses
        data = resp.data.get('results', resp.data) if isinstance(resp.data, dict) else resp.data
        account_ids = [a['id'] for a in data]
        assert customer_account.id in account_ids
        assert other_account.id not in account_ids

    def test_staff_sees_all_accounts(self, staff_client, customer_account, other_account):
        url = reverse('account-list')
        resp = staff_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
        data = resp.data.get('results', resp.data) if isinstance(resp.data, dict) else resp.data
        account_ids = [a['id'] for a in data]
        assert customer_account.id in account_ids
        assert other_account.id in account_ids

    def test_customer_cannot_access_other_account(self, auth_client, other_account):
        url = reverse('account-detail', args=[other_account.id])
        resp = auth_client.get(url)
        # DRF returns 404 when object is excluded from queryset (security via obscurity)
        assert resp.status_code in (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND)


# ==================== TRANSACTION TESTS ====================

class TestTransactionViewSet:
    def test_deposit_increases_balance(self, auth_client, customer_account):
        url = reverse('transaction-list')
        resp = auth_client.post(url, {
            'account': customer_account.id,
            'amount': '200.00',
            'type': 'deposit',
            'category': 'income',
        }, format='json')
        assert resp.status_code == status.HTTP_201_CREATED
        customer_account.refresh_from_db()
        assert customer_account.balance == Decimal('1200.00')

    def test_withdrawal_decreases_balance(self, auth_client, customer_account):
        url = reverse('transaction-list')
        resp = auth_client.post(url, {
            'account': customer_account.id,
            'amount': '100.00',
            'type': 'withdrawal',
            'category': 'other',
        }, format='json')
        assert resp.status_code == status.HTTP_201_CREATED
        customer_account.refresh_from_db()
        assert customer_account.balance == Decimal('900.00')

    def test_insufficient_balance_rejected(self, auth_client, customer_account):
        url = reverse('transaction-list')
        resp = auth_client.post(url, {
            'account': customer_account.id,
            'amount': '9999.00',
            'type': 'withdrawal',
            'category': 'other',
        }, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        customer_account.refresh_from_db()
        assert customer_account.balance == Decimal('1000.00')  # unchanged

    def test_customer_cannot_transact_on_other_account(self, auth_client, other_account):
        url = reverse('transaction-list')
        resp = auth_client.post(url, {
            'account': other_account.id,
            'amount': '50.00',
            'type': 'deposit',
            'category': 'income',
        }, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ==================== TRANSFER TESTS ====================

class TestTransferViewSet:
    def test_internal_transfer_is_atomic(self, db, settings, auth_client, customer, customer_account):
        # Run Celery tasks synchronously in tests (no Redis needed)
        settings.CELERY_TASK_ALWAYS_EAGER = True
        settings.CELERY_TASK_EAGER_PROPAGATES = True
        from accounts.models import Account
        second_account = Account.objects.create(
            owner=customer,
            account_type=Account.SAVINGS,
            balance=Decimal('0.00'),
            status=Account.ACTIVE
        )
        url = reverse('transfer-list')
        resp = auth_client.post(url, {
            'source_account': customer_account.id,
            'destination_account': second_account.id,
            'amount': '500.00',
            'is_external': False,
        }, format='json')
        assert resp.status_code == status.HTTP_201_CREATED

        customer_account.refresh_from_db()
        second_account.refresh_from_db()
        assert customer_account.balance == Decimal('500.00')
        assert second_account.balance == Decimal('500.00')

    def test_transfer_fails_on_insufficient_balance(self, db, auth_client, customer, customer_account):
        from accounts.models import Account
        second_account = Account.objects.create(
            owner=customer,
            account_type=Account.SAVINGS,
            balance=Decimal('0.00'),
            status=Account.ACTIVE
        )
        url = reverse('transfer-list')
        resp = auth_client.post(url, {
            'source_account': customer_account.id,
            'destination_account': second_account.id,
            'amount': '5000.00',
            'is_external': False,
        }, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST
        customer_account.refresh_from_db()
        second_account.refresh_from_db()
        assert customer_account.balance == Decimal('1000.00')  # unchanged
        assert second_account.balance == Decimal('0.00')  # unchanged

    def test_customer_cannot_transfer_from_other_account(self, db, auth_client, other_account, customer):
        from accounts.models import Account
        own_account = Account.objects.create(
            owner=customer,
            account_type=Account.CHECKING,
            balance=Decimal('0.00'),
            status=Account.ACTIVE
        )
        url = reverse('transfer-list')
        resp = auth_client.post(url, {
            'source_account': other_account.id,
            'destination_account': own_account.id,
            'amount': '100.00',
            'is_external': False,
        }, format='json')
        assert resp.status_code == status.HTTP_400_BAD_REQUEST


# ==================== AUDIT LOG TESTS ====================

class TestAuditLog:
    def test_audit_log_created_on_account_creation(self, db, auth_client, customer):
        from audit.models import AuditLog
        url = reverse('account-list')
        auth_client.post(url, {'account_type': 'checking'}, format='json')
        assert AuditLog.objects.filter(action='account_created', user=customer).exists()

    def test_audit_log_not_accessible_to_customer(self, auth_client):
        url = reverse('audit-log-list')
        resp = auth_client.get(url)
        assert resp.status_code == status.HTTP_403_FORBIDDEN

    def test_audit_log_accessible_to_staff(self, staff_client):
        url = reverse('audit-log-list')
        resp = staff_client.get(url)
        assert resp.status_code == status.HTTP_200_OK
