from django.db import transaction
from accounts.models import Account
from transactions.models import Transaction
from notifications.models import Notification
from audit.utils import log_audit
from .models import Transfer

@transaction.atomic
def execute_transfer(transfer_id):
    """
    Executes a transfer transactionally.
    """
    try:
        # Lock transfer row
        transfer = Transfer.objects.select_for_update().get(id=transfer_id)
    except Transfer.DoesNotExist:
        return False

    if transfer.status not in (Transfer.PENDING, Transfer.SCHEDULED):
        return False

    # Standard database lock ordering to prevent deadlocks: lock lower ID first
    src_id = transfer.source_account.id
    dest_id = transfer.destination_account.id if transfer.destination_account else None
    
    if dest_id:
        if src_id < dest_id:
            source = Account.objects.select_for_update().get(id=src_id)
            destination = Account.objects.select_for_update().get(id=dest_id)
        else:
            destination = Account.objects.select_for_update().get(id=dest_id)
            source = Account.objects.select_for_update().get(id=src_id)
    else:
        source = Account.objects.select_for_update().get(id=src_id)
        destination = None

    # Verify balance at execution time
    if source.balance < transfer.amount:
        transfer.status = Transfer.FAILED
        transfer.save()
        log_audit(
            source.owner,
            'transfer_failed_insufficient_funds',
            'Transfer',
            transfer.id,
            {'amount': transfer.amount, 'balance': source.balance}
        )
        Notification.objects.create(
            user=source.owner,
            title="Transfer Failed",
            message=f"Your transfer of {transfer.amount} failed due to insufficient funds."
        )
        return False

    # 1. Debit the source account
    source.balance -= transfer.amount
    source.save()

    # Create outgoing transaction record
    Transaction.objects.create(
        account=source,
        amount=transfer.amount,
        type=Transaction.TRANSFER_OUT,
        category=Transaction.TRANSFER,
        status=Transaction.COMPLETED,
        merchant=transfer.external_bank_name if transfer.is_external else "Internal Transfer"
    )

    if transfer.is_external:
        # Mock external bank rail process
        # The transfer moves to COMPLETED state immediately for the demo, or we trigger async mock later.
        transfer.status = Transfer.COMPLETED
        transfer.save()
        
        Notification.objects.create(
            user=source.owner,
            title="External Transfer Executed",
            message=f"External transfer of {transfer.amount} to {transfer.external_bank_name} has been initiated."
        )
    else:
        # 2. Credit the destination account
        destination.balance += transfer.amount
        destination.save()

        # Create incoming transaction record
        Transaction.objects.create(
            account=destination,
            amount=transfer.amount,
            type=Transaction.TRANSFER_IN,
            category=Transaction.TRANSFER,
            status=Transaction.COMPLETED,
            merchant="Internal Transfer"
        )

        transfer.status = Transfer.COMPLETED
        transfer.save()

        # Notify destination owner (if different from source owner)
        if destination.owner != source.owner:
            Notification.objects.create(
                user=destination.owner,
                title="Funds Received",
                message=f"You have received {transfer.amount} from {source.owner.username}."
            )

        Notification.objects.create(
            user=source.owner,
            title="Transfer Completed",
            message=f"Your transfer of {transfer.amount} to account {destination.account_number} was completed."
        )

    log_audit(
        source.owner,
        'transfer_completed',
        'Transfer',
        transfer.id,
        {
            'source_account': source.account_number,
            'destination_account': destination.account_number if destination else None,
            'is_external': transfer.is_external,
            'amount': transfer.amount
        }
    )
    return True
