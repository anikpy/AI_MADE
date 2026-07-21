from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from custom_auth.views import (
    CustomTokenObtainPairView,
    RegisterView,
    LogoutView,
    UserMeView,
    PasswordResetRequestView,
    PasswordResetConfirmView
)
from accounts.views import AccountViewSet, StatementViewSet
from transactions.views import TransactionViewSet
from transfers.views import TransferViewSet
from audit.views import AuditLogViewSet
from notifications.views import NotificationViewSet, NotificationPreferenceView

# Define REST API Router
router = DefaultRouter()
router.register(r'accounts', AccountViewSet, basename='account')
router.register(r'statements', StatementViewSet, basename='statement')
router.register(r'transactions', TransactionViewSet, basename='transaction')
router.register(r'transfers', TransferViewSet, basename='transfer')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-log')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # REST Framework Router URLS
    path('api/', include(router.urls)),
    
    # Custom Authentication endpoints
    path('api/auth/register/', RegisterView.as_view(), name='auth_register'),
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='auth_login'),
    path('api/auth/logout/', LogoutView.as_view(), name='auth_logout'),
    path('api/auth/token/refresh/', TokenRefreshView.as_view(), name='auth_token_refresh'),
    path('api/auth/me/', UserMeView.as_view(), name='auth_me'),
    path('api/auth/password-reset/', PasswordResetRequestView.as_view(), name='auth_password_reset_request'),
    path('api/auth/password-reset/confirm/', PasswordResetConfirmView.as_view(), name='auth_password_reset_confirm'),
    
    # Notification Preferences
    path('api/notifications/preferences/', NotificationPreferenceView.as_view(), name='notification_preferences'),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
