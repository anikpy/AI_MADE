from django.contrib.auth import get_user_model
from django.contrib.auth.tokens import default_token_generator
from django.core.mail import send_mail
from rest_framework import status, permissions
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView

from .serializers import (
    RegisterSerializer,
    UserSerializer,
    PasswordResetRequestSerializer,
    PasswordResetConfirmSerializer
)
from audit.utils import log_audit

User = get_user_model()


class CustomTokenObtainPairView(TokenObtainPairView):
    """
    Override login view to apply custom throttling and audit log.
    """
    throttle_scope = 'auth'
    
    def post(self, request, *args, **kwargs):
        response = super().post(request, *args, **kwargs)
        if response.status_code == 200:
            username = request.data.get('username')
            try:
                user = User.objects.get(username=username)
                log_audit(user, 'login_success', 'User', user.id, {'username': username})
            except User.DoesNotExist:
                pass
        else:
            log_audit(None, 'login_failed', 'User', None, {'username': request.data.get('username')})
        return response


class RegisterView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            log_audit(user, 'user_registered', 'User', user.id, {
                'username': user.username,
                'email': user.email,
                'role': user.role
            })
            
            # Generate JWT token upon registration
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'access': str(refresh.access_token),
                'refresh': str(refresh),
            }, status=status.HTTP_201_CREATED)
            
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LogoutView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get("refresh")
            if not refresh_token:
                return Response({"detail": "Refresh token is required."}, status=status.HTTP_400_BAD_REQUEST)
                
            token = RefreshToken(refresh_token)
            token.blacklist()
            log_audit(request.user, 'user_logout', 'User', request.user.id)
            return Response({"detail": "Successfully logged out."}, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class UserMeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data, status=status.HTTP_200_OK)


class PasswordResetRequestView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                token = default_token_generator.make_token(user)
                
                # In development, the EMAIL_BACKEND prints to console
                send_mail(
                    subject="Password Reset Request",
                    message=f"Use the following token to reset your password: {token}\nFor email: {email}",
                    from_email="support@financecompany.local",
                    recipient_list=[email],
                    fail_silently=False,
                )
                log_audit(user, 'password_reset_requested', 'User', user.id, {'email': email})
                return Response({
                    "detail": "Password reset token sent to email.",
                    # We also return it here in development context so the user/API doesn't have to check console logs.
                    "token_dev_helper": token
                }, status=status.HTTP_200_OK)
            except User.DoesNotExist:
                # Return 200 for security reasons (don't leak user emails)
                return Response({"detail": "Password reset token sent to email."}, status=status.HTTP_200_OK)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [permissions.AllowAny]
    throttle_scope = 'auth'

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            token = serializer.validated_data['token']
            new_password = serializer.validated_data['new_password']
            
            try:
                user = User.objects.get(email=email)
                if default_token_generator.check_token(user, token):
                    user.set_password(new_password)
                    user.save()
                    log_audit(user, 'password_reset_completed', 'User', user.id, {'email': email})
                    return Response({"detail": "Password reset completed successfully."}, status=status.HTTP_200_OK)
                else:
                    return Response({"detail": "Invalid or expired token."}, status=status.HTTP_400_BAD_REQUEST)
            except User.DoesNotExist:
                return Response({"detail": "Invalid email or token."}, status=status.HTTP_400_BAD_REQUEST)
                
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
