from typing import Optional, Dict, Any
from sqlalchemy.orm import Session
from app import models
from app.services.billing_service import add_invoice_line_item
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit

def complete_lab_test_transaction(
    db: Session,
    test_id: str,
    result_summary: str,
    report_url: Optional[str] = None,
    completed_by_user_id: Optional[str] = None,
    ip_address: Optional[str] = None
) -> Dict[str, Any]:
    test = db.query(models.LabTest).filter(models.LabTest.id == test_id).first()
    if not test:
        raise ValueError(f"LabTest {test_id} not found")

    if test.status == "COMPLETED":
        return {"test": test, "alreadyCompleted": True}

    test.status = "COMPLETED"
    test.resultSummary = result_summary
    if report_url:
        test.reportUrl = report_url
    db.flush()

    test_cost = test.cost if test.cost is not None else 50.00
    add_invoice_line_item(
        db=db,
        patient_id=test.patientId,
        billing_type="RECEPTION",
        source_department="LABORATORY",
        item_billing_type="LAB_TEST",
        item_description=f"Laboratory Investigation: {test.testName} ({test.category})",
        quantity=1,
        unit_price=test_cost,
        source_entity="LAB_TEST",
        source_id=test.id
    )

    pat_name = f"{test.patient.firstName} {test.patient.lastName}" if test.patient else "Patient"
    create_notification(
        db=db,
        role="DOCTOR",
        title="Lab Report Ready",
        message=f"Diagnostic results ready for patient {pat_name} ({test.testName}).",
        type="LAB_RESULT",
        entity_id=test.id
    )

    pat_mrn = test.patient.mrn if test.patient else "N/A"
    log_audit(
        db=db,
        user_id=completed_by_user_id,
        action="LAB_TEST_COMPLETED",
        resource="LABORATORY",
        details={
            "testId": test.id,
            "testName": test.testName,
            "patientMrn": pat_mrn,
            "cost": test_cost
        },
        ip_address=ip_address
    )

    db.commit()
    return {"test": test, "alreadyCompleted": False}
