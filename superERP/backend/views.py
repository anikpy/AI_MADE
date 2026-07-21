from rest_framework import viewsets
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from drf_spectacular.utils import extend_schema

from backend.models import Department, User, Task, DailyLog
from backend.serializers import (
    DepartmentSerializer,
    UserSerializer,
    TaskSerializer,
    DailyLogSerializer,
)


@extend_schema(tags=["User Management"])
class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().select_related("department")
    serializer_class = UserSerializer
    permission_classes = [AllowAny]


@extend_schema(tags=["Department Management"])
class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all().prefetch_related("employees")
    serializer_class = DepartmentSerializer
    permission_classes = [AllowAny]


@extend_schema(tags=["Task Management"])
class TaskViewSet(viewsets.ModelViewSet):
    queryset = Task.objects.all().select_related("department", "assigned_to", "assigned_by")
    serializer_class = TaskSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        # Fallback creator to current_user or the first user in DB if none exists
        creator = getattr(self.request, "current_user", None) or User.objects.first()
        serializer.save(assigned_by=creator)


@extend_schema(tags=["Daily Log Management"])
class DailyLogViewSet(viewsets.ModelViewSet):
    queryset = DailyLog.objects.all().select_related("task", "user")
    serializer_class = DailyLogSerializer
    permission_classes = [AllowAny]

    def perform_create(self, serializer):
        logger_user = getattr(self.request, "current_user", None) or User.objects.first()
        serializer.save(user=logger_user)


@extend_schema(tags=["Executive Dashboard"])
class ExecutiveDashboardViewSet(viewsets.ViewSet):
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Get Executive Overview Metrics",
        description="Returns company-wide active task counts, headcount metrics, and department workload breakdown.",
    )
    def list(self, request):
        total_employees = User.objects.count()
        total_departments = Department.objects.count()
        active_tasks = Task.objects.exclude(status=Task.Status.COMPLETED).count()

        return Response(
            {
                "metrics": {
                    "total_employees": total_employees,
                    "total_departments": total_departments,
                    "active_tasks": active_tasks,
                },
            }
        )