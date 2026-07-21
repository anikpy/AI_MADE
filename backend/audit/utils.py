from .models import AuditLog

def log_audit(user, action, model_name, object_id, changes=None):
    """
    Utility function to write an entry to the AuditLog.
    """
    actor = user if (user and user.is_authenticated) else None
    
    # Clean up changes to ensure it's serializable if not already
    changes_dict = {}
    if changes:
        for k, v in changes.items():
            # Convert Decimals/datetimes to string for JSON serialization
            changes_dict[k] = str(v)
            
    return AuditLog.objects.create(
        user=actor,
        action=action,
        model_name=model_name,
        object_id=str(object_id),
        changes=changes_dict if changes_dict else None
    )
