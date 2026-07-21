from rest_framework.permissions import BasePermission
from backend.models import Role


class IsSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        return getattr(request, "current_user", None) and request.current_user.role == Role.SUPER_ADMIN


class IsAdminOrSuperAdmin(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "current_user", None)
        return user and user.role in [Role.SUPER_ADMIN, Role.ADMIN]


class IsDepartmentHeadOrAbove(BasePermission):
    def has_permission(self, request, view):
        user = getattr(request, "current_user", None)
        return user and user.role in [Role.SUPER_ADMIN, Role.ADMIN, Role.DEPT_HEAD]


class CanManageUser(BasePermission):
    """
    Enforces that Admins CANNOT modify, demote, or create Super Admins or other Admins.
    """

    def has_permission(self, request, view):
        user = getattr(request, "current_user", None)
        return user and user.role in [Role.SUPER_ADMIN, Role.ADMIN]

    def has_object_permission(self, request, view, obj):
        actor = request.current_user

        # Super Admin has absolute permission
        if actor.role == Role.SUPER_ADMIN:
            return True

        # Admin CANNOT touch Super Admin or other Admin records
        if obj.role in [Role.SUPER_ADMIN, Role.ADMIN]:
            return False

        return True