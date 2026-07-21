import sys
from django.http import JsonResponse
from django.utils.deprecation import MiddlewareMixin


class TokenAuthenticationMiddleware(MiddlewareMixin):
    """
    Token-based authentication middleware.
    Validates X-API-Token header against token in config.py
    """

    def process_request(self, request):
        # Import token from config
        try:
            from config import token as token_config
            required_token = token_config.get("token")
        except ImportError:
            # If config not available, deny access
            return JsonResponse(
                {"error": "Token configuration not found"},
                status=500
            )

        # Get token from request headers
        request_token = request.META.get('HTTP_X_API_TOKEN')

        # Allow swagger/schema endpoints without token for development
        if request.path.startswith('/api/v1/schema') or \
           request.path.startswith('/api/v1/docs') or \
           request.path.startswith('/api/v1/redoc') or \
           request.path.startswith('/admin'):
            return None

        # Check token for API endpoints
        if not request_token:
            return JsonResponse(
                {"error": "X-API-Token header is required"},
                status=401
            )

        if request_token != required_token:
            return JsonResponse(
                {"error": "Invalid API token"},
                status=401
            )

        return None
