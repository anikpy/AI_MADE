from celery import shared_task
from django.utils import timezone
from .models import Transfer
from .services import execute_transfer

@shared_task
def process_scheduled_transfers():
    """
    Celery task to scan for and execute scheduled transfers whose execution time has reached.
    """
    now = timezone.now()
    scheduled_transfers = Transfer.objects.filter(
        status=Transfer.SCHEDULED,
        scheduled_for__lte=now
    )
    
    count = 0
    for transfer in scheduled_transfers:
        # execute_transfer handles database isolation internally
        success = execute_transfer(transfer.id)
        if success:
            count += 1
            
    return f"Processed {count} scheduled transfers."
