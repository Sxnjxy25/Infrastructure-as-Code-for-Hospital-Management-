import math
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.billing_service import process_payment
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/billing", tags=["billing"])

@router.get("/invoices")
def get_invoices(
    billingType: Optional[str] = None,
    status: Optional[str] = None,
    patientId: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Invoice)

    if billingType:
        query = query.filter(models.Invoice.billingType == billingType)
    if status:
        query = query.filter(models.Invoice.status == status)
    if patientId:
        query = query.filter(models.Invoice.patientId == patientId)

    if current_user.role == "PATIENT":
        pat = db.query(models.Patient).filter(models.Patient.userId == current_user.id).first()
        if pat:
            query = query.filter(models.Invoice.patientId == pat.id)

    total = query.count()
    skip = (page - 1) * limit
    invoices = query.order_by(models.Invoice.createdAt.desc()).offset(skip).limit(limit).all()

    result = []
    for inv in invoices:
        result.append({
            "id": inv.id,
            "patientId": inv.patientId,
            "invoiceNumber": inv.invoiceNumber,
            "billingType": inv.billingType,
            "amount": inv.amount,
            "discount": inv.discount,
            "netAmount": inv.netAmount,
            "paidAmount": inv.paidAmount,
            "status": inv.status,
            "paymentMethod": inv.paymentMethod,
            "description": inv.description,
            "createdAt": inv.createdAt,
            "updatedAt": inv.updatedAt,
            "patient": {
                "id": inv.patient.id,
                "mrn": inv.patient.mrn,
                "firstName": inv.patient.firstName,
                "lastName": inv.patient.lastName
            } if inv.patient else None,
            "items": [
                {
                    "id": itm.id,
                    "sourceDepartment": itm.sourceDepartment,
                    "billingType": itm.billingType,
                    "itemDescription": itm.itemDescription,
                    "quantity": itm.quantity,
                    "unitPrice": itm.unitPrice,
                    "totalPrice": itm.totalPrice
                } for itm in inv.items
            ],
            "payments": [
                {
                    "id": p.id,
                    "receiptNumber": p.receiptNumber,
                    "amount": p.amount,
                    "paymentMethod": p.paymentMethod,
                    "createdAt": p.createdAt
                } for p in inv.payments
            ]
        })

    return {
        "success": True,
        "data": result,
        "pagination": {
            "total": total,
            "page": page,
            "pages": math.ceil(total / limit) if limit > 0 else 1
        }
    }

@router.get("/invoices/{id}")
def get_invoice_by_id(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    inv = db.query(models.Invoice).filter(models.Invoice.id == id).first()
    if not inv:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Invoice not found"})

    return {
        "success": True,
        "data": {
            "id": inv.id,
            "patientId": inv.patientId,
            "invoiceNumber": inv.invoiceNumber,
            "billingType": inv.billingType,
            "amount": inv.amount,
            "discount": inv.discount,
            "netAmount": inv.netAmount,
            "paidAmount": inv.paidAmount,
            "status": inv.status,
            "paymentMethod": inv.paymentMethod,
            "description": inv.description,
            "createdAt": inv.createdAt,
            "patient": {
                "id": inv.patient.id,
                "mrn": inv.patient.mrn,
                "firstName": inv.patient.firstName,
                "lastName": inv.patient.lastName
            } if inv.patient else None,
            "items": [
                {
                    "id": itm.id,
                    "sourceDepartment": itm.sourceDepartment,
                    "billingType": itm.billingType,
                    "itemDescription": itm.itemDescription,
                    "quantity": itm.quantity,
                    "unitPrice": itm.unitPrice,
                    "totalPrice": itm.totalPrice
                } for itm in inv.items
            ],
            "payments": [
                {
                    "id": p.id,
                    "receiptNumber": p.receiptNumber,
                    "amount": p.amount,
                    "paymentMethod": p.paymentMethod,
                    "createdAt": p.createdAt,
                    "receivedBy": {
                        "name": p.receivedBy.name if p.receivedBy else "Cashier"
                    } if p.receivedBy else None
                } for p in inv.payments
            ]
        }
    }

@router.post("/invoices")
def create_invoice(
    req: schemas.InvoiceCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not req.patientId or not req.items or len(req.items) == 0:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Patient and at least one billable item are required"})

    count = db.query(models.Invoice).count()
    invoice_number = f"INV-2026-{str(count + 1).zfill(4)}"

    gross_amount = sum(float(itm.unitPrice) * int(itm.quantity or 1) for itm in req.items)
    discount = float(req.discount or 0.0)
    net_amount = max(0.0, gross_amount - discount)

    invoice = models.Invoice(
        patientId=req.patientId,
        invoiceNumber=invoice_number,
        billingType=req.billingType or "RECEPTION",
        amount=gross_amount,
        discount=discount,
        netAmount=net_amount,
        paidAmount=0.00,
        status="PENDING",
        description=req.description or f"{req.billingType or 'RECEPTION'} Invoice"
    )
    db.add(invoice)
    db.flush()

    for itm in req.items:
        total_price = float(itm.unitPrice) * int(itm.quantity or 1)
        line_item = models.InvoiceItem(
            invoiceId=invoice.id,
            sourceDepartment=itm.sourceDepartment or "RECEPTION",
            billingType=itm.billingType or "SERVICE",
            itemDescription=itm.itemDescription,
            quantity=int(itm.quantity or 1),
            unitPrice=float(itm.unitPrice),
            totalPrice=total_price,
            medicineId=itm.medicineId,
            sourceEntity=itm.sourceEntity,
            sourceId=itm.sourceId
        )
        db.add(line_item)

    db.flush()

    pat = db.query(models.Patient).filter(models.Patient.id == req.patientId).first()
    pat_mrn = pat.mrn if pat else "N/A"

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="CREATE_INVOICE",
        resource="BILLING",
        details={"invoiceNumber": invoice.invoiceNumber, "patientMrn": pat_mrn, "netAmount": net_amount},
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": invoice.id,
            "invoiceNumber": invoice.invoiceNumber,
            "billingType": invoice.billingType,
            "amount": invoice.amount,
            "netAmount": invoice.netAmount,
            "status": invoice.status
        }
    }

@router.post("/invoices/{id}/payments")
def record_payment(
    id: str,
    req: schemas.PaymentRecordRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        ip_address = request.client.host if request.client else None
        result = process_payment(
            db=db,
            invoice_id=id,
            amount=req.amount,
            payment_method=req.paymentMethod or "CARD",
            transaction_id=req.transactionId,
            notes=req.notes,
            received_by_id=current_user.id,
            ip_address=ip_address
        )
        db.commit()
        return {
            "success": True,
            "message": "Payment recorded and receipt generated successfully",
            "data": {
                "payment": {
                    "id": result["payment"].id,
                    "receiptNumber": result["payment"].receiptNumber,
                    "amount": result["payment"].amount,
                    "paymentMethod": result["payment"].paymentMethod,
                    "status": result["payment"].status
                },
                "invoice": {
                    "id": result["invoice"].id,
                    "invoiceNumber": result["invoice"].invoiceNumber,
                    "paidAmount": result["invoice"].paidAmount,
                    "status": result["invoice"].status
                }
            }
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail={"success": False, "message": str(err)})

@router.get("/reception")
def get_reception_invoices(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    invoices = db.query(models.Invoice).filter(models.Invoice.billingType == "RECEPTION").order_by(models.Invoice.createdAt.desc()).all()
    result = []
    for inv in invoices:
        result.append({
            "id": inv.id,
            "invoiceNumber": inv.invoiceNumber,
            "amount": inv.amount,
            "netAmount": inv.netAmount,
            "paidAmount": inv.paidAmount,
            "status": inv.status,
            "patient": {
                "firstName": inv.patient.firstName if inv.patient else "",
                "lastName": inv.patient.lastName if inv.patient else "",
                "mrn": inv.patient.mrn if inv.patient else ""
            } if inv.patient else None
        })
    return {"success": True, "data": result}

@router.get("/pharmacy")
def get_pharmacy_invoices(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    invoices = db.query(models.Invoice).filter(models.Invoice.billingType == "PHARMACY").order_by(models.Invoice.createdAt.desc()).all()
    result = []
    for inv in invoices:
        result.append({
            "id": inv.id,
            "invoiceNumber": inv.invoiceNumber,
            "amount": inv.amount,
            "netAmount": inv.netAmount,
            "paidAmount": inv.paidAmount,
            "status": inv.status,
            "patient": {
                "firstName": inv.patient.firstName if inv.patient else "",
                "lastName": inv.patient.lastName if inv.patient else "",
                "mrn": inv.patient.mrn if inv.patient else ""
            } if inv.patient else None
        })
    return {"success": True, "data": result}

@router.get("/revenue")
def get_department_revenue(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    items = db.query(models.InvoiceItem).join(models.Invoice).filter(
        models.Invoice.status.in_(["PAID", "PARTIALLY_PAID"])
    ).all()

    rev = {"CLINICAL": 0.0, "PHARMACY": 0.0, "LABORATORY": 0.0, "RECEPTION": 0.0, "TOTAL": 0.0}
    for itm in items:
        dept = itm.sourceDepartment or "RECEPTION"
        rev[dept] = rev.get(dept, 0.0) + itm.totalPrice
        rev["TOTAL"] += itm.totalPrice

    return {
        "success": True,
        "data": {k: f"{v:.2f}" for k, v in rev.items()}
    }
