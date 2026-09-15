from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app import models
from app.services.billing_service import add_invoice_line_item
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit

def complete_appointment_transaction(
    db: Session,
    appointment_id: str,
    diagnosis: Optional[str] = None,
    prescription: Optional[str] = None,
    ordered_tests: Optional[List[Dict[str, Any]]] = None,
    completed_by_user_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    appointment = db.query(models.Appointment).filter(models.Appointment.id == appointment_id).first()
    if not appointment:
        raise ValueError(f"Appointment {appointment_id} not found")

    if appointment.status == "COMPLETED":
        return {"appointment": appointment, "alreadyCompleted": True, "createdLabTests": []}

    # 1. Update appointment
    appointment.status = "COMPLETED"
    if diagnosis:
        appointment.diagnosis = diagnosis
    if prescription:
        appointment.prescription = prescription

    # 2. Reset Doctor & StaffProfile availability
    if appointment.doctorId and appointment.doctor:
        appointment.doctor.availability = "AVAILABLE"
        if appointment.doctor.userId:
            db.query(models.StaffProfile).filter(models.StaffProfile.userId == appointment.doctor.userId).update({"availability": "AVAILABLE"})

    # 3. Add Consultation Fee Line Item
    consultation_fee = appointment.doctor.consultationFee if appointment.doctor else 100.00
    doc_name = appointment.doctor.user.name if (appointment.doctor and appointment.doctor.user) else "Attending Physician"
    doc_spec = appointment.doctor.specialization if appointment.doctor else "General"

    add_invoice_line_item(
        db=db,
        patient_id=appointment.patientId,
        billing_type="RECEPTION",
        source_department="CLINICAL",
        item_billing_type="CONSULTATION",
        item_description=f"Doctor Consultation - {doc_name} ({doc_spec})",
        quantity=1,
        unit_price=consultation_fee,
        source_entity="APPOINTMENT",
        source_id=appointment.id
    )

    # 4. Create Lab Tests if ordered
    created_lab_tests = []
    if ordered_tests:
        for t in ordered_tests:
            test_name = t.get("testName") if isinstance(t, dict) else getattr(t, "testName", None)
            if test_name:
                category = t.get("category", "Diagnostics") if isinstance(t, dict) else getattr(t, "category", "Diagnostics")
                cost = float(t.get("cost", 50.0)) if isinstance(t, dict) else float(getattr(t, "cost", 50.0))

                lab_test = models.LabTest(
                    patientId=appointment.patientId,
                    testName=test_name,
                    category=category,
                    cost=cost,
                    requestedBy=doc_name,
                    status="PENDING"
                )
                db.add(lab_test)
                db.flush()
                created_lab_tests.append(lab_test)

                pat_name = f"{appointment.patient.firstName} {appointment.patient.lastName}" if appointment.patient else "Patient"
                create_notification(
                    db=db,
                    role="LAB_TECHNICIAN",
                    title="New Diagnostic Test Ordered",
                    message=f"{test_name} ordered for patient {pat_name} by {doc_name}.",
                    type="LAB_REQUEST",
                    entity_id=lab_test.id
                )

    # 5. Notify Pharmacist if prescription written
    if prescription and prescription.strip():
        pat_name = f"{appointment.patient.firstName} {appointment.patient.lastName}" if appointment.patient else "Patient"
        pat_mrn = appointment.patient.mrn if appointment.patient else "N/A"
        create_notification(
            db=db,
            role="PHARMACIST",
            title="New Patient Prescription",
            message=f"Prescription issued for patient {pat_name} ({pat_mrn}) by {doc_name}.",
            type="GENERAL",
            entity_id=appointment.id
        )

    # 6. Audit logging
    pat_mrn = appointment.patient.mrn if appointment.patient else "N/A"
    log_audit(
        db=db,
        user_id=completed_by_user_id,
        action="APPOINTMENT_COMPLETED",
        resource="APPOINTMENT",
        details={
            "appointmentId": appointment.id,
            "patientMrn": pat_mrn,
            "doctorName": doc_name,
            "consultationFee": consultation_fee,
            "testsOrderedCount": len(created_lab_tests)
        },
        ip_address=ip_address
    )

    db.commit()
    return {
        "appointment": appointment,
        "createdLabTests": created_lab_tests,
        "alreadyCompleted": False
    }
