import time
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app import models
from app.services.billing_service import add_invoice_line_item
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit

def dispense_medicines_transaction(
    db: Session,
    patient_id: str,
    items: List[Dict[str, Any]],
    dispensed_by_user_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    if not items:
        raise ValueError("At least one medicine item must be specified for dispensing")

    dispensed_details = []

    for itm in items:
        med_id = itm.get("medicineId") if isinstance(itm, dict) else getattr(itm, "medicineId")
        qty = int(itm.get("quantity") if isinstance(itm, dict) else getattr(itm, "quantity"))

        if qty <= 0:
            raise ValueError("Dispense quantity must be greater than 0")

        medicine = db.query(models.Medicine).filter(models.Medicine.id == med_id).first()
        if not medicine:
            raise ValueError(f"Medicine with ID {med_id} not found")

        if medicine.quantity < qty:
            raise ValueError(f"Insufficient inventory for {medicine.name}. Requested: {qty}, Available: {medicine.quantity}")

        new_qty = medicine.quantity - qty
        medicine.quantity = new_qty
        db.flush()

        dispense_ref_id = f"DISP_{int(time.time() * 1000)}_{med_id[:6]}"
        add_invoice_line_item(
            db=db,
            patient_id=patient_id,
            billing_type="PHARMACY",
            source_department="PHARMACY",
            item_billing_type="MEDICINE",
            item_description=f"{medicine.name} (Qty: {qty})",
            quantity=qty,
            unit_price=medicine.unitPrice,
            medicine_id=medicine.id,
            source_entity="PHARMACY_SALE",
            source_id=dispense_ref_id
        )

        dispensed_details.append({
            "medicine": medicine,
            "dispensedQuantity": qty,
            "unitPrice": medicine.unitPrice,
            "totalCost": qty * medicine.unitPrice
        })

        if new_qty == 0:
            create_notification(
                db=db,
                role="PHARMACIST",
                title="Critical: Medicine Out of Stock",
                message=f"{medicine.name} ({medicine.code}) is now OUT OF STOCK (0 units remaining).",
                type="OUT_OF_STOCK",
                entity_id=medicine.id
            )
            create_notification(
                db=db,
                role="ADMIN",
                title="Inventory Alert: Stock Exhausted",
                message=f"{medicine.name} ({medicine.code}) has reached 0 units.",
                type="OUT_OF_STOCK",
                entity_id=medicine.id
            )
        elif new_qty <= medicine.reorderThreshold:
            create_notification(
                db=db,
                role="PHARMACIST",
                title="Low Medicine Stock Alert",
                message=f"{medicine.name} ({medicine.code}) stock level is down to {new_qty} units (Reorder threshold: {medicine.reorderThreshold}).",
                type="LOW_STOCK",
                entity_id=medicine.id
            )
            create_notification(
                db=db,
                role="ADMIN",
                title="Pharmacy Reorder Threshold Breached",
                message=f"{medicine.name} ({medicine.code}) has dropped to {new_qty} units.",
                type="LOW_STOCK",
                entity_id=medicine.id
            )

    log_audit(
        db=db,
        user_id=dispensed_by_user_id,
        action="PHARMACY_DISPENSE",
        resource="PHARMACY",
        details={
            "patientId": patient_id,
            "itemsDispensed": [
                {
                    "name": d["medicine"].name,
                    "quantity": d["dispensedQuantity"],
                    "remaining": d["medicine"].quantity
                } for d in dispensed_details
            ]
        },
        ip_address=ip_address
    )

    db.commit()
    return {"success": True, "dispensed": dispensed_details}
