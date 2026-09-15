from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user

router = APIRouter(prefix="/api/doctors", tags=["doctors"])

@router.get("")
def get_all_doctors(db: Session = Depends(get_db)):
    doctors = db.query(models.Doctor).order_by(models.Doctor.department.asc()).all()
    result = []
    for d in doctors:
        result.append({
            "id": d.id,
            "userId": d.userId,
            "specialization": d.specialization,
            "department": d.department,
            "qualification": d.qualification,
            "consultationFee": d.consultationFee,
            "availability": d.availability,
            "roomNumber": d.roomNumber,
            "user": {
                "name": d.user.name if d.user else "Doctor",
                "email": d.user.email if d.user else "",
                "phone": d.user.phone if d.user else ""
            }
        })
    return {"success": True, "data": result}

@router.get("/{id}")
def get_doctor_by_id(id: str, db: Session = Depends(get_db)):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Doctor not found"})

    return {"success": True, "data": {
        "id": doctor.id,
        "userId": doctor.userId,
        "specialization": doctor.specialization,
        "department": doctor.department,
        "qualification": doctor.qualification,
        "consultationFee": doctor.consultationFee,
        "availability": doctor.availability,
        "roomNumber": doctor.roomNumber,
        "user": {
            "name": doctor.user.name if doctor.user else "",
            "email": doctor.user.email if doctor.user else "",
            "phone": doctor.user.phone if doctor.user else ""
        }
    }}

@router.patch("/{id}/availability")
def update_doctor_availability(
    id: str,
    req: schemas.DoctorAvailabilityUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doctor = db.query(models.Doctor).filter(models.Doctor.id == id).first()
    if not doctor:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Doctor not found"})

    doctor.availability = req.availability
    if doctor.userId:
        db.query(models.StaffProfile).filter(models.StaffProfile.userId == doctor.userId).update({"availability": req.availability})
    db.commit()

    return {"success": True, "data": {
        "id": doctor.id,
        "availability": doctor.availability
    }}
