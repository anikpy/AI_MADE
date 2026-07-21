from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Notification

@receiver(post_save, sender=Notification)
def on_notification_created(sender, instance, created, **kwargs):
    if created:
        # Dispatch email asynchronously via Celery
        from .tasks import dispatch_notification
        dispatch_notification.delay(instance.id)
