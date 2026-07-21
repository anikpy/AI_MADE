import io
import os
from celery import shared_task
from django.core.files.base import ContentFile
from django.utils import timezone
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT


@shared_task
def generate_statement(account_id, month_str):
    """
    Generate a PDF statement for an account for a given month (YYYY-MM).
    Saves it to the Statement model and returns the statement ID.
    """
    from accounts.models import Account, Statement
    from transactions.models import Transaction

    try:
        account = Account.objects.select_related('owner').get(id=account_id)
    except Account.DoesNotExist:
        return f"Account {account_id} not found."

    # Parse month
    try:
        year, month = map(int, month_str.split('-'))
    except ValueError:
        return f"Invalid month format: {month_str}. Expected YYYY-MM."

    # Get transactions for this month
    transactions = Transaction.objects.filter(
        account=account,
        created_at__year=year,
        created_at__month=month
    ).order_by('created_at')

    # Build PDF in memory
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=1 * inch,
        bottomMargin=1 * inch
    )
    styles = getSampleStyleSheet()
    story = []

    # Header
    title_style = ParagraphStyle('title', parent=styles['Title'], fontSize=18, spaceAfter=6)
    story.append(Paragraph("FinanceCore — Account Statement", title_style))

    subtitle_style = ParagraphStyle('subtitle', parent=styles['Normal'], fontSize=11, spaceAfter=4)
    story.append(Paragraph(f"Account Number: {account.account_number}", subtitle_style))
    story.append(Paragraph(f"Account Type: {account.get_account_type_display()}", subtitle_style))
    story.append(Paragraph(f"Owner: {account.owner.get_full_name() or account.owner.username}", subtitle_style))
    story.append(Paragraph(f"Statement Period: {month_str}", subtitle_style))
    story.append(Paragraph(f"Generated: {timezone.now().strftime('%Y-%m-%d %H:%M UTC')}", subtitle_style))
    story.append(Spacer(1, 0.25 * inch))

    # Current Balance
    balance_style = ParagraphStyle('balance', parent=styles['Normal'], fontSize=13, textColor=colors.HexColor('#1a6b3a'), spaceAfter=12)
    story.append(Paragraph(f"Current Balance: ${account.balance:,.2f}", balance_style))
    story.append(Spacer(1, 0.1 * inch))

    # Transactions Table
    if transactions.exists():
        table_data = [['Date', 'Type', 'Category', 'Merchant', 'Amount', 'Status']]
        for tx in transactions:
            sign = '+' if tx.type in ('deposit', 'transfer_in') else '-'
            table_data.append([
                tx.created_at.strftime('%Y-%m-%d'),
                tx.get_type_display(),
                tx.get_category_display(),
                tx.merchant or '—',
                f"{sign}${tx.amount:,.2f}",
                tx.get_status_display(),
            ])

        table = Table(table_data, colWidths=[1.1*inch, 1.1*inch, 1.1*inch, 1.5*inch, 1.1*inch, 1.0*inch])
        table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1a6b3a')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f5f5f5'), colors.white]),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#cccccc')),
            ('LEFTPADDING', (0, 0), (-1, -1), 6),
            ('RIGHTPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 4),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(table)
    else:
        story.append(Paragraph("No transactions found for this period.", styles['Normal']))

    doc.build(story)
    pdf_content = buffer.getvalue()
    buffer.close()

    # Save or update Statement record
    statement, created = Statement.objects.get_or_create(
        account=account,
        month=month_str
    )
    filename = f"statement_{account.account_number}_{month_str}.pdf"
    statement.pdf_file.save(filename, ContentFile(pdf_content), save=True)

    return f"Statement {statement.id} generated for account {account.account_number} ({month_str})."
