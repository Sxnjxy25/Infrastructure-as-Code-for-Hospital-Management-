import math
import random
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.appointment_service import complete_appointment_transaction
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/appointments", tags=["appointments"])

@router.get("")
def get_all_appointments(
    status: Optional[str] = None,
    doctorId: Optional[str] = None,
    patientId: Optional[str] = None,
    channel: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Appointment)

    if status:
        query = query.filter(models.Appointment.status == status)
    if doctorId:
        query = query.filter(models.Appointment.doctorId == doctorId)
    if patientId:
        query = query.filter(models.Appointment.patientId == patientId)
    if channel:
        query = query.filter(models.Appointment.channel == channel)

    # Scoping for DOCTOR and PATIENT
    if current_user.role == "DOCTOR":
        doc = db.query(models.Doctor).filter(models.Doctor.userId == current_user.id).first()
        if doc:
            query = query.filter(models.Appointment.doctorId == doc.id)
    elif current_user.role == "PATIENT":
        pat = db.query(models.Patient).filter(models.Patient.userId == current_user.id).first()
        if pat:
            query = query.filter(models.Appointment.patientId == pat.id)

    total = query.count()
    skip = (page - 1) * limit
    appointments = query.order_by(models.Appointment.tokenNumber.asc(), models.Appointment.appointmentDate.asc()).offset(skip).limit(limit).all()

    result = []
    for a in appointments:
        result.append({
            "id": a.id,
            "patientId": a.patientId,
            "doctorId": a.doctorId,
            "createdById": a.createdById,
            "tokenNumber": a.tokenNumber,
            "appointmentDate": a.appointmentDate.isoformat() if a.appointmentDate else None,
            "channel": a.channel,
            "reason": a.reason,
            "status": a.status,
            "diagnosis": a.diagnosis,
            "prescription": a.prescription,
            "createdAt": a.createdAt,
            "updatedAt": a.updatedAt,
            "patient": {
                "id": a.patient.id,
                "mrn": a.patient.mrn,
                "firstName": a.patient.firstName,
                "lastName": a.patient.lastName,
                "phone": a.patient.phone,
                "bloodGroup": a.patient.bloodGroup
            } if a.patient else None,
            "doctor": {
                "id": a.doctor.id,
                "specialization": a.doctor.specialization,
                "department": a.doctor.department,
                "roomNumber": a.doctor.roomNumber,
                "consultationFee": a.doctor.consultationFee,
                "user": {
                    "id": a.doctor.user.id if a.doctor.user else None,
                    "name": a.doctor.user.name if a.doctor.user else "Doctor",
                    "email": a.doctor.user.email if a.doctor.user else ""
                } if a.doctor else None
            } if a.doctor else None,
            "createdBy": {
                "id": a.createdBy.id if a.createdBy else None,
                "name": a.createdBy.name if a.createdBy else None,
                "role": a.createdBy.role if a.createdBy else None
            } if a.createdBy else None
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

@router.post("")
def create_appointment(
    req: schemas.AppointmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not req.patientId or not req.doctorId or not req.appointmentDate:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Patient, Doctor, and Appointment Date are required"})

    # Doctor-specific token queue (starts at #101)
    max_token_app = db.query(models.Appointment).filter(
        models.Appointment.doctorId == req.doctorId
    ).order_by(models.Appointment.tokenNumber.desc()).first()

    token_number = (max_token_app.tokenNumber + 1) if (max_token_app and max_token_app.tokenNumber >= 100) else 101

    try:
        app_date = datetime.fromisoformat(req.appointmentDate.replace("Z", ""))
    except Exception:
        app_date = datetime.utcnow()

    appointment = models.Appointment(
        patientId=req.patientId,
        doctorId=req.doctorId,
        createdById=current_user.id,
        tokenNumber=token_number,
        appointmentDate=app_date,
        channel=req.channel or "OFFLINE",
        reason=req.reason,
        status="SCHEDULED"
    )
    db.add(appointment)
    db.flush()

    pat = db.query(models.Patient).filter(models.Patient.id == req.patientId).first()
    pat_name = f"{pat.firstName} {pat.lastName}" if pat else "Patient"

    create_notification(
        db=db,
        role="DOCTOR",
        title="New Appointment Scheduled",
        message=f"Token #{token_number} booked for {pat_name} ({req.channel}).",
        type="APPOINTMENT",
        entity_id=appointment.id
    )

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="BOOK_APPOINTMENT",
        resource="APPOINTMENT",
        details={
            "appointmentId": appointment.id,
            "patientMrn": pat.mrn if pat else "N/A",
            "tokenNumber": token_number,
            "channel": req.channel
        },
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": appointment.id,
            "tokenNumber": appointment.tokenNumber,
            "appointmentDate": appointment.appointmentDate.isoformat(),
            "channel": appointment.channel,
            "status": appointment.status,
            "reason": appointment.reason
        }
    }

@router.post("/quick-book")
def quick_book_public_appointment(
    req: schemas.QuickBookRequest,
    db: Session = Depends(get_db)
):
    if not req.patientName or not req.phone:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Patient Name and Phone Number are required"})

    target_doctor = None
    if req.doctorId:
        target_doctor = db.query(models.Doctor).filter(models.Doctor.id == req.doctorId).first()
    if not target_doctor and req.doctorName:
        target_doctor = db.query(models.Doctor).join(models.User).filter(models.User.name.ilike(f"%{req.doctorName}%")).first()
    if not target_doctor:
        target_doctor = db.query(models.Doctor).first()

    if not target_doctor:
        raise HTTPException(status_code=404, detail={"success": False, "message": "No doctor found for this appointment"})

    patient = db.query(models.Patient).filter(models.Patient.phone == req.phone.strip()).first()
    if not patient:
        name_parts = req.patientName.strip().split()
        first_name = name_parts[0] if name_parts else "Patient"
        last_name = " ".join(name_parts[1:]) if len(name_parts) > 1 else "Walk-in"
        random_suffix = random.randint(1000, 9999)
        mrn = f"MRN-2026-{random_suffix}"

        patient = models.Patient(
            mrn=mrn,
            firstName=first_name,
            lastName=last_name,
            phone=req.phone.strip(),
            dateOfBirth=datetime(1995, 1, 1),
            gender="Not Specified",
            address="Self-registered Outpatient"
        )
        db.add(patient)
        db.flush()

    try:
        app_date = datetime.fromisoformat(req.appointmentDate.replace("Z", "")) if req.appointmentDate else datetime.utcnow()
    except Exception:
        app_date = datetime.utcnow()

    max_token_app = db.query(models.Appointment).filter(
        models.Appointment.doctorId == target_doctor.id
    ).order_by(models.Appointment.tokenNumber.desc()).first()

    token_number = (max_token_app.tokenNumber + 1) if (max_token_app and max_token_app.tokenNumber >= 100) else 101

    slot_info = f" [Slot: {req.timeSlot}]" if req.timeSlot else ""
    appointment = models.Appointment(
        patientId=patient.id,
        doctorId=target_doctor.id,
        tokenNumber=token_number,
        appointmentDate=app_date,
        channel=req.channel or "OFFLINE",
        reason=(req.reason or "Direct Consultation Booking") + slot_info,
        status="SCHEDULED"
    )
    db.add(appointment)
    db.flush()

    create_notification(
        db=db,
        role="DOCTOR",
        title="New Online / Direct Slot Booked",
        message=f"Token #{token_number} booked by {patient.firstName} {patient.lastName} ({req.phone}) for {req.timeSlot or 'Scheduled time'}.",
        type="APPOINTMENT",
        entity_id=appointment.id
    )

    create_notification(
        db=db,
        role="RECEPTIONIST",
        title="New Direct Appointment Token",
        message=f"Token #{token_number} assigned for Dr. {target_doctor.user.name} to {patient.firstName} {patient.lastName}.",
        type="APPOINTMENT",
        entity_id=appointment.id
    )
    db.commit()

    return {
        "success": True,
        "message": "Consultation slot successfully booked!",
        "data": {
            "id": appointment.id,
            "tokenNumber": appointment.tokenNumber,
            "patientName": f"{patient.firstName} {patient.lastName}",
            "patientPhone": patient.phone,
            "mrn": patient.mrn,
            "doctorName": target_doctor.user.name if target_doctor.user else "Doctor",
            "specialization": target_doctor.specialization,
            "roomNumber": target_doctor.roomNumber,
            "consultationFee": target_doctor.consultationFee,
            "appointmentDate": appointment.appointmentDate.isoformat(),
            "timeSlot": req.timeSlot or "09:00 AM - 10:00 AM",
            "channel": appointment.channel,
            "status": appointment.status
        }
    }

@router.patch("/{id}/complete")
def complete_appointment(
    id: str,
    req: schemas.CompleteAppointmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    ip_address = request.client.host if request.client else None
    result = complete_appointment_transaction(
        db=db,
        appointment_id=id,
        diagnosis=req.diagnosis,
        prescription=req.prescription,
        ordered_tests=[t.dict() for t in req.orderedTests] if req.orderedTests else [],
        completed_by_user_id=current_user.id,
        ip_address=ip_address
    )

    return {
        "success": True,
        "message": "Appointment consultation completed, billing recorded, and clinical orders dispatched",
        "data": {
            "id": result["appointment"].id,
            "status": result["appointment"].status,
            "diagnosis": result["appointment"].diagnosis,
            "prescription": result["appointment"].prescription
        },
        "createdLabTests": [
            {
                "id": t.id,
                "testName": t.testName,
                "category": t.category,
                "cost": t.cost,
                "status": t.status
            } for t in result.get("createdLabTests", [])
        ]
    }

@router.patch("/{id}/status")
def update_appointment_status(
    id: str,
    req: schemas.AppointmentStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    appointment = db.query(models.Appointment).filter(models.Appointment.id == id).first()
    if not appointment:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Appointment not found"})

    if req.status is not None:
        appointment.status = req.status
    if req.diagnosis is not None:
        appointment.diagnosis = req.diagnosis
    if req.prescription is not None:
        appointment.prescription = req.prescription

    # Doctor availability sync
    if req.status == "IN_PROGRESS" and appointment.doctorId and appointment.doctor:
        appointment.doctor.availability = "BUSY"
        if appointment.doctor.userId:
            db.query(models.StaffProfile).filter(models.StaffProfile.userId == appointment.doctor.userId).update({"availability": "BUSY"})
    elif req.status in ["COMPLETED", "CANCELLED"] and appointment.doctorId and appointment.doctor:
        appointment.doctor.availability = "AVAILABLE"
        if appointment.doctor.userId:
            db.query(models.StaffProfile).filter(models.StaffProfile.userId == appointment.doctor.userId).update({"availability": "AVAILABLE"})

    db.commit()

    return {
        "success": True,
        "data": {
            "id": appointment.id,
            "status": appointment.status,
            "diagnosis": appointment.diagnosis,
            "prescription": appointment.prescription
        }
    }
