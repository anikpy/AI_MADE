from celery import shared_task
from django.core.mail import send_mail
from django.conf import settings
from notifications.models import Notification, NotificationPreference

@shared_task
def dispatch_notification(notification_id):
    """
    Celery task to send email for a given Notification object
    if the user has email notifications enabled.
    """
    try:
        notification = Notification.objects.select_related('user').get(id=notification_id)
    except Notification.DoesNotExist:
        return f"Notification {notification_id} not found."

    if notification.email_sent:
        return f"Email already sent for notification {notification_id}."

    user = notification.user

    # Check user preferences
    try:
        pref = user.notification_preference
        if not pref.email_enabled:
            return f"Email notifications disabled for user {user.username}."
    except NotificationPreference.DoesNotExist:
        pass  # Default: send email

    if not user.email:
        return f"No email address for user {user.username}."

    try:
        send_mail(
            subject=notification.title,
            message=notification.message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            fail_silently=False,
        )
        notification.email_sent = True
        notification.save(update_fields=['email_sent'])
        return f"Email sent for notification {notification_id} to {user.email}."
    except Exception as e:
        return f"Failed to send email for notification {notification_id}: {str(e)}"
