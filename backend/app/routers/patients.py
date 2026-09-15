import math
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/patients", tags=["patients"])

@router.get("")
def get_all_patients(
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Patient)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (models.Patient.firstName.ilike(s)) |
            (models.Patient.lastName.ilike(s)) |
            (models.Patient.mrn.ilike(s)) |
            (models.Patient.phone.ilike(s))
        )

    total = query.count()
    skip = (page - 1) * limit
    patients = query.order_by(models.Patient.createdAt.desc()).offset(skip).limit(limit).all()

    result = []
    for p in patients:
        result.append({
            "id": p.id,
            "userId": p.userId,
            "mrn": p.mrn,
            "firstName": p.firstName,
            "lastName": p.lastName,
            "dateOfBirth": p.dateOfBirth.isoformat() if p.dateOfBirth else None,
            "gender": p.gender,
            "bloodGroup": p.bloodGroup,
            "phone": p.phone,
            "address": p.address,
            "emergencyContact": p.emergencyContact,
            "medicalHistory": p.medicalHistory,
            "createdAt": p.createdAt,
            "updatedAt": p.updatedAt
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

@router.get("/{id}")
def get_patient_by_id(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Patient not found"})

    return {
        "success": True,
        "data": {
            "id": patient.id,
            "userId": patient.userId,
            "mrn": patient.mrn,
            "firstName": patient.firstName,
            "lastName": patient.lastName,
            "dateOfBirth": patient.dateOfBirth.isoformat() if patient.dateOfBirth else None,
            "gender": patient.gender,
            "bloodGroup": patient.bloodGroup,
            "phone": patient.phone,
            "address": patient.address,
            "emergencyContact": patient.emergencyContact,
            "medicalHistory": patient.medicalHistory,
            "createdAt": patient.createdAt,
            "updatedAt": patient.updatedAt
        }
    }

@router.post("")
def create_patient(
    req: schemas.PatientCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    count = db.query(models.Patient).count()
    mrn = f"MRN-2026-{str(count + 1).zfill(3)}"

    dob = None
    if req.dateOfBirth:
        try:
            dob = datetime.fromisoformat(req.dateOfBirth.replace("Z", ""))
        except Exception:
            dob = datetime(1990, 1, 1)

    patient = models.Patient(
        mrn=mrn,
        firstName=req.firstName.strip(),
        lastName=req.lastName.strip(),
        dateOfBirth=dob,
        gender=req.gender,
        bloodGroup=req.bloodGroup,
        phone=req.phone.strip(),
        address=req.address.strip() if req.address else None,
        emergencyContact=req.emergencyContact.strip() if req.emergencyContact else None,
        medicalHistory=req.medicalHistory.strip() if req.medicalHistory else None
    )
    db.add(patient)
    db.flush()

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="CREATE_PATIENT",
        resource="PATIENT",
        details=f"Created patient record for {patient.firstName} {patient.lastName} ({patient.mrn})",
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": patient.id,
            "mrn": patient.mrn,
            "firstName": patient.firstName,
            "lastName": patient.lastName,
            "dateOfBirth": patient.dateOfBirth.isoformat() if patient.dateOfBirth else None,
            "gender": patient.gender,
            "bloodGroup": patient.bloodGroup,
            "phone": patient.phone,
            "address": patient.address,
            "emergencyContact": patient.emergencyContact,
            "medicalHistory": patient.medicalHistory
        }
    }

@router.put("/{id}")
def update_patient(
    id: str,
    req: schemas.PatientUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    patient = db.query(models.Patient).filter(models.Patient.id == id).first()
    if not patient:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Patient not found"})

    if req.firstName is not None:
        patient.firstName = req.firstName.strip()
    if req.lastName is not None:
        patient.lastName = req.lastName.strip()
    if req.phone is not None:
        patient.phone = req.phone.strip()
    if req.address is not None:
        patient.address = req.address.strip()
    if req.emergencyContact is not None:
        patient.emergencyContact = req.emergencyContact.strip()
    if req.medicalHistory is not None:
        patient.medicalHistory = req.medicalHistory.strip()

    db.commit()

    return {
        "success": True,
        "data": {
            "id": patient.id,
            "mrn": patient.mrn,
            "firstName": patient.firstName,
            "lastName": patient.lastName,
            "phone": patient.phone,
            "address": patient.address,
            "emergencyContact": patient.emergencyContact,
            "medicalHistory": patient.medicalHistory
        }
    }
