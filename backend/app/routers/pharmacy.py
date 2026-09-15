from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.pharmacy_service import dispense_medicines_transaction
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/pharmacy", tags=["pharmacy"])

@router.get("/inventory")
def get_inventory(
    category: Optional[str] = None,
    search: Optional[str] = None,
    lowStockOnly: Optional[str] = "false",
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Medicine)
    if category:
        query = query.filter(models.Medicine.category == category)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (models.Medicine.name.ilike(s)) |
            (models.Medicine.code.ilike(s)) |
            (models.Medicine.supplier.ilike(s))
        )

    medicines = query.order_by(models.Medicine.name.asc()).all()

    if lowStockOnly == "true":
        medicines = [m for m in medicines if m.quantity <= m.reorderThreshold]

    result = []
    for m in medicines:
        result.append({
            "id": m.id,
            "code": m.code,
            "name": m.name,
            "category": m.category,
            "quantity": m.quantity,
            "unitPrice": m.unitPrice,
            "reorderThreshold": m.reorderThreshold,
            "expiryDate": m.expiryDate.isoformat() if m.expiryDate else None,
            "supplier": m.supplier,
            "createdAt": m.createdAt,
            "updatedAt": m.updatedAt
        })

    return {"success": True, "data": result}

@router.post("/medicine")
def add_medicine(
    req: schemas.MedicineCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    code = req.code.strip().upper()
    name = req.name.strip()

    if not code or not name:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Code, Name, Quantity, and Unit Price are required"})

    existing = db.query(models.Medicine).filter(models.Medicine.code == code).first()
    if existing:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Medicine item code already exists"})

    exp_date = datetime(2028, 12, 31)
    if req.expiryDate:
        try:
            exp_date = datetime.fromisoformat(req.expiryDate.replace("Z", ""))
        except Exception:
            exp_date = datetime(2028, 12, 31)

    med = models.Medicine(
        code=code,
        name=name,
        category=req.category or "General",
        quantity=req.quantity,
        unitPrice=req.unitPrice,
        reorderThreshold=req.reorderThreshold or 20,
        expiryDate=exp_date,
        supplier=req.supplier.strip() if req.supplier else None
    )
    db.add(med)
    db.flush()

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="ADD_MEDICINE",
        resource="PHARMACY",
        details={"code": med.code, "name": med.name, "quantity": med.quantity},
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": med.id,
            "code": med.code,
            "name": med.name,
            "category": med.category,
            "quantity": med.quantity,
            "unitPrice": med.unitPrice,
            "reorderThreshold": med.reorderThreshold,
            "expiryDate": med.expiryDate.isoformat(),
            "supplier": med.supplier
        }
    }

@router.patch("/medicine/{id}/stock")
def update_stock(
    id: str,
    req: schemas.StockUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    med = db.query(models.Medicine).filter(models.Medicine.id == id).first()
    if not med:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Medicine not found"})

    if req.quantity is not None:
        med.quantity = req.quantity
    if req.reorderThreshold is not None:
        med.reorderThreshold = req.reorderThreshold
    if req.unitPrice is not None:
        med.unitPrice = req.unitPrice

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE_MEDICINE_STOCK",
        resource="PHARMACY",
        details={"id": id, "name": med.name, "newQuantity": med.quantity},
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": med.id,
            "code": med.code,
            "name": med.name,
            "quantity": med.quantity,
            "unitPrice": med.unitPrice,
            "reorderThreshold": med.reorderThreshold
        }
    }

@router.post("/dispense")
def dispense_medicines(
    req: schemas.DispenseRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        ip_address = request.client.host if request.client else None
        items_dict = [{"medicineId": item.medicineId, "quantity": item.quantity} for item in req.items]
        result = dispense_medicines_transaction(
            db=db,
            patient_id=req.patientId,
            items=items_dict,
            dispensed_by_user_id=current_user.id,
            ip_address=ip_address
        )
        return {
            "success": True,
            "message": "Medicines dispensed, inventory deducted atomically, and billing line created",
            "data": result
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail={"success": False, "message": str(err)})

@router.get("/alerts")
def get_low_stock_alerts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    medicines = db.query(models.Medicine).order_by(models.Medicine.quantity.asc()).all()
    low_stock = [
        {
            "id": m.id,
            "code": m.code,
            "name": m.name,
            "quantity": m.quantity,
            "reorderThreshold": m.reorderThreshold,
            "unitPrice": m.unitPrice
        }
        for m in medicines if m.quantity <= m.reorderThreshold
    ]
    return {"success": True, "data": low_stock}
