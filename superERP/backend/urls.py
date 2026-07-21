from django.urls import path, include
from rest_framework.routers import DefaultRouter
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)
from backend.views import (
    UserViewSet,
    DepartmentViewSet,
    TaskViewSet,
    DailyLogViewSet,
    ExecutiveDashboardViewSet,
)

router = DefaultRouter()
router.register(r"users", UserViewSet, basename="user")
router.register(r"departments", DepartmentViewSet, basename="department")
router.register(r"tasks", TaskViewSet, basename="task")
router.register(r"logs", DailyLogViewSet, basename="log")
router.register(r"dashboard", ExecutiveDashboardViewSet, basename="dashboard")

urlpatterns = [
    # API Routes
    path("", include(router.urls)),
    # OpenAPI Schema generator
    path("schema/", SpectacularAPIView.as_view(), name="schema"),
    # Swagger UI Endpoint
    path(
        "docs/",
        SpectacularSwaggerView.as_view(url_name="schema"),
        name="swagger-ui",
    ),
    # Optional Redoc Documentation alternative
    path(
        "redoc/",
        SpectacularRedocView.as_view(url_name="schema"),
        name="redoc",
    ),
]
