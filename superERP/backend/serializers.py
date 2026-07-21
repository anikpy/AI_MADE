from rest_framework import serializers
from backend.models import Department, User, Role, Task, DailyLog


class DepartmentSerializer(serializers.ModelSerializer):
    head_name = serializers.ReadOnlyField(source="head.name")
    employee_count = serializers.IntegerField(source="employees.count", read_only=True)

    class Meta:
        model = Department
        fields = ["id", "name", "head", "head_name", "employee_count", "created_at"]


class UserSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source="department.name")

    class Meta:
        model = User
        fields = [
            "id",
            "name",
            "email",
            "role",
            "department",
            "department_name",
            "created_at",
        ]

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "current_user", None)
        target_role = attrs.get("role", getattr(self.instance, "role", None))

        # Restriction: Admins cannot assign SUPER_ADMIN or ADMIN roles
        if actor and actor.role == Role.ADMIN:
            if target_role in [Role.SUPER_ADMIN, Role.ADMIN]:
                raise serializers.ValidationError(
                    {"role": "Admins cannot assign Super Admin or Admin roles."}
                )

        return attrs


class TaskSerializer(serializers.ModelSerializer):
    assigned_to_name = serializers.ReadOnlyField(source="assigned_to.name")
    assigned_by_name = serializers.ReadOnlyField(source="assigned_by.name")
    department_name = serializers.ReadOnlyField(source="department.name")

    class Meta:
        model = Task
        fields = [
            "id",
            "title",
            "description",
            "department",
            "department_name",
            "assigned_to",
            "assigned_to_name",
            "assigned_by",
            "assigned_by_name",
            "status",
            "due_date",
            "created_at",
        ]
        read_only_fields = ["assigned_by"]

    def validate(self, attrs):
        request = self.context.get("request")
        actor = getattr(request, "current_user", None)
        assigned_to = attrs.get("assigned_to", getattr(self.instance, "assigned_to", None))
        department = attrs.get("department", getattr(self.instance, "department", None))

        # Dept Head scope validation
        if actor and actor.role == Role.DEPT_HEAD:
            if actor.managed_department != department:
                raise serializers.ValidationError(
                    {"department": "Department Heads can only assign tasks inside their own department."}
                )

        if assigned_to and department and assigned_to.department != department:
            raise serializers.ValidationError(
                {"assigned_to": "Assigned employee must belong to the selected department."}
            )

        return attrs


class DailyLogSerializer(serializers.ModelSerializer):
    user_name = serializers.ReadOnlyField(source="user.name")
    task_title = serializers.ReadOnlyField(source="task.title")

    class Meta:
        model = DailyLog
        fields = [
            "id",
            "task",
            "task_title",
            "user",
            "user_name",
            "log_date",
            "hours_spent",
            "notes",
            "created_at",
        ]
        read_only_fields = ["user"]

    def validate_hours_spent(self, value):
        if value <= 0 or value > 24:
            raise serializers.ValidationError("Hours spent must be between 0.1 and 24.0.")
        return value
