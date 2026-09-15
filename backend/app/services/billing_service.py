from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app import models
from app.services.audit_service import log_audit
from app.services.notification_service import create_notification

def add_invoice_line_item(
    db: Session,
    patient_id: str,
    item_description: str,
    unit_price: float,
    billing_type: str = "RECEPTION",
    source_department: str = "CLINICAL",
    item_billing_type: str = "SERVICE",
    quantity: int = 1,
    medicine_id: Optional[str] = None,
    source_entity: Optional[str] = None,
    source_id: Optional[str] = None
) -> Dict[str, Any]:
    total_price = float(unit_price) * int(quantity)

    # Strict idempotency check
    if source_entity and source_id:
        existing_item = db.query(models.InvoiceItem).filter(
            models.InvoiceItem.sourceEntity == source_entity,
            models.InvoiceItem.sourceId == str(source_id)
        ).first()

        if existing_item:
            return {"item": existing_item, "alreadyExisted": True}

    # Find pending invoice or create new one
    invoice = db.query(models.Invoice).filter(
        models.Invoice.patientId == patient_id,
        models.Invoice.billingType == billing_type,
        models.Invoice.status == "PENDING"
    ).first()

    if not invoice:
        count = db.query(models.Invoice).count()
        invoice_number = f"INV-2026-{str(count + 1).zfill(4)}"
        invoice = models.Invoice(
            patientId=patient_id,
            invoiceNumber=invoice_number,
            billingType=billing_type,
            amount=total_price,
            discount=0.00,
            netAmount=total_price,
            paidAmount=0.00,
            status="PENDING",
            description=f"{billing_type} Services Invoice"
        )
        db.add(invoice)
        db.flush()

    item = models.InvoiceItem(
        invoiceId=invoice.id,
        sourceDepartment=source_department,
        billingType=item_billing_type,
        itemDescription=item_description,
        quantity=quantity,
        unitPrice=unit_price,
        totalPrice=total_price,
        medicineId=medicine_id,
        sourceEntity=source_entity,
        sourceId=str(source_id) if source_id else None
    )
    db.add(item)
    db.flush()

    # Recalculate totals
    all_items = db.query(models.InvoiceItem).filter(models.InvoiceItem.invoiceId == invoice.id).all()
    gross_amount = sum(itm.totalPrice for itm in all_items)
    net_amount = max(0.0, gross_amount - (invoice.discount or 0.0))

    invoice.amount = gross_amount
    invoice.netAmount = net_amount
    db.flush()

    return {"item": item, "invoice": invoice, "alreadyExisted": False}

def process_payment(
    db: Session,
    invoice_id: str,
    amount: float,
    payment_method: str = "CARD",
    transaction_id: Optional[str] = None,
    notes: Optional[str] = None,
    received_by_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    invoice = db.query(models.Invoice).filter(models.Invoice.id == invoice_id).first()
    if not invoice:
        raise ValueError(f"Invoice {invoice_id} not found")

    pay_amount = float(amount)
    if pay_amount <= 0:
        raise ValueError("Payment amount must be greater than zero")

    new_paid_total = (invoice.paidAmount or 0.0) + pay_amount
    new_status = "PAID" if new_paid_total >= invoice.netAmount else "PARTIALLY_PAID"

    payment_count = db.query(models.Payment).count()
    receipt_number = f"REC-2026-{str(payment_count + 1).zfill(4)}"

    payment = models.Payment(
        invoiceId=invoice.id,
        receiptNumber=receipt_number,
        amount=pay_amount,
        paymentMethod=payment_method,
        transactionId=transaction_id,
        status="COMPLETED",
        notes=notes,
        receivedById=received_by_id
    )
    db.add(payment)

    invoice.paidAmount = new_paid_total
    invoice.status = new_status
    invoice.paymentMethod = payment_method
    db.flush()

    patient_mrn = invoice.patient.mrn if invoice.patient else "N/A"

    log_audit(
        db=db,
        user_id=received_by_id,
        action="PAYMENT_RECEIVED",
        resource="BILLING",
        details={
            "invoiceNumber": invoice.invoiceNumber,
            "receiptNumber": receipt_number,
            "amount": pay_amount,
            "paymentMethod": payment_method,
            "status": new_status,
            "patientMrn": patient_mrn
        },
        ip_address=ip_address
    )

    create_notification(
        db=db,
        role="ACCOUNTANT",
        title="Payment Received",
        message=f"Received ${pay_amount:.2f} ({payment_method}) for Invoice {invoice.invoiceNumber} (Receipt #{receipt_number})",
        type="PAYMENT",
        entity_id=payment.id
    )

    return {"payment": payment, "invoice": invoice}
