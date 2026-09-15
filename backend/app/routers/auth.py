from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import verify_password, create_access_token, get_current_user
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/login")
def login(req: schemas.LoginRequest, request: Request, db: Session = Depends(get_db)):
    email = req.email.strip().lower()
    password = req.password

    if not email or not password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Email and password are required"}
        )

    user = db.query(models.User).filter(models.User.email == email).first()
    if not user or not verify_password(password, user.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail={"success": False, "message": "Invalid credentials"}
        )

    token = create_access_token(data={"userId": user.id, "role": user.role, "email": user.email})

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=user.id,
        action="USER_LOGIN",
        resource="AUTH",
        details=f"Successful login for user {user.email}",
        ip_address=ip_address
    )
    db.commit()

    doctor_data = None
    if user.doctor:
        doctor_data = {
            "id": user.doctor.id,
            "specialization": user.doctor.specialization,
            "department": user.doctor.department,
            "qualification": user.doctor.qualification,
            "consultationFee": user.doctor.consultationFee,
            "availability": user.doctor.availability,
            "roomNumber": user.doctor.roomNumber
        }

    patient_data = None
    if user.patient:
        patient_data = {
            "id": user.patient.id,
            "mrn": user.patient.mrn,
            "firstName": user.patient.firstName,
            "lastName": user.patient.lastName,
            "phone": user.patient.phone
        }

    return {
        "success": True,
        "message": "Login successful",
        "token": token,
        "user": {
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "role": user.role,
            "phone": user.phone,
            "doctor": doctor_data,
            "patient": patient_data
        }
    }

@router.get("/me")
def get_me(current_user: models.User = Depends(get_current_user)):
    doctor_data = None
    if current_user.doctor:
        doctor_data = {
            "id": current_user.doctor.id,
            "specialization": current_user.doctor.specialization,
            "department": current_user.doctor.department,
            "qualification": current_user.doctor.qualification,
            "consultationFee": current_user.doctor.consultationFee,
            "availability": current_user.doctor.availability,
            "roomNumber": current_user.doctor.roomNumber
        }

    patient_data = None
    if current_user.patient:
        patient_data = {
            "id": current_user.patient.id,
            "mrn": current_user.patient.mrn,
            "firstName": current_user.patient.firstName,
            "lastName": current_user.patient.lastName,
            "phone": current_user.patient.phone
        }

    return {
        "success": True,
        "user": {
            "id": current_user.id,
            "email": current_user.email,
            "name": current_user.name,
            "role": current_user.role,
            "phone": current_user.phone,
            "doctor": doctor_data,
            "patient": patient_data
        }
    }
