from rest_framework import permissions

class IsOwnerOrStaff(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to access it.
    Staff/Admin roles have bypass permissions.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated

    def has_object_permission(self, request, view, obj):
        user = request.user
        
        # Staff and admins can see/modify all objects
        if user.role in ('staff', 'admin') or user.is_staff or user.is_superuser:
            return True
            
        # Object ownership checks:
        
        # 1. Accounts: check obj.owner
        if hasattr(obj, 'owner'):
            return obj.owner == user
            
        # 2. Transactions: check obj.account.owner
        if hasattr(obj, 'account'):
            return obj.account.owner == user
            
        # 3. Transfers: check obj.source_account.owner or obj.destination_account.owner
        if hasattr(obj, 'source_account') or hasattr(obj, 'destination_account'):
            is_source_owner = False
            is_dest_owner = False
            
            if obj.source_account:
                is_source_owner = obj.source_account.owner == user
            if obj.destination_account:
                is_dest_owner = obj.destination_account.owner == user
                
            return is_source_owner or is_dest_owner
            
        # 4. Notification / NotificationPreference: check obj.user
        if hasattr(obj, 'user'):
            return obj.user == user
            
        return False
