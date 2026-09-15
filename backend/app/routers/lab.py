import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user
from app.services.lab_service import complete_lab_test_transaction
from app.services.notification_service import create_notification
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/lab", tags=["lab"])

@router.get("/tests")
def get_lab_tests(
    status: Optional[str] = None,
    patientId: Optional[str] = None,
    category: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.LabTest)

    if status:
        query = query.filter(models.LabTest.status == status)
    if category:
        query = query.filter(models.LabTest.category == category)
    if patientId:
        query = query.filter(models.LabTest.patientId == patientId)

    if current_user.role == "DOCTOR":
        doc = db.query(models.Doctor).filter(models.Doctor.userId == current_user.id).first()
        if doc:
            patient_ids = [a.patientId for a in doc.appointments]
            query = query.filter(models.LabTest.patientId.in_(patient_ids))
    elif current_user.role == "PATIENT":
        pat = db.query(models.Patient).filter(models.Patient.userId == current_user.id).first()
        if pat:
            query = query.filter(models.LabTest.patientId == pat.id)

    total = query.count()
    skip = (page - 1) * limit
    tests = query.order_by(models.LabTest.createdAt.desc()).offset(skip).limit(limit).all()

    result = []
    for t in tests:
        result.append({
            "id": t.id,
            "patientId": t.patientId,
            "testName": t.testName,
            "category": t.category,
            "cost": t.cost,
            "status": t.status,
            "resultSummary": t.resultSummary,
            "reportUrl": t.reportUrl,
            "requestedBy": t.requestedBy,
            "createdAt": t.createdAt,
            "updatedAt": t.updatedAt,
            "patient": {
                "id": t.patient.id,
                "mrn": t.patient.mrn,
                "firstName": t.patient.firstName,
                "lastName": t.patient.lastName
            } if t.patient else None
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

@router.post("/tests")
def create_lab_test(
    req: schemas.LabTestCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not req.patientId or not req.testName:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Patient and Test Name are required"})

    test = models.LabTest(
        patientId=req.patientId,
        testName=req.testName.strip(),
        category=req.category or "General Pathology",
        cost=req.cost or 50.0,
        requestedBy=req.requestedBy or current_user.name,
        status="PENDING"
    )
    db.add(test)
    db.flush()

    pat = db.query(models.Patient).filter(models.Patient.id == req.patientId).first()
    pat_name = f"{pat.firstName} {pat.lastName}" if pat else "Patient"

    create_notification(
        db=db,
        role="LAB_TECHNICIAN",
        title="New Lab Request",
        message=f"{test.testName} ordered for {pat_name}.",
        type="LAB_REQUEST",
        entity_id=test.id
    )

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="ORDER_LAB_TEST",
        resource="LABORATORY",
        details={"testId": test.id, "testName": test.testName, "patientMrn": pat.mrn if pat else "N/A"},
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": test.id,
            "patientId": test.patientId,
            "testName": test.testName,
            "category": test.category,
            "cost": test.cost,
            "status": test.status,
            "requestedBy": test.requestedBy
        }
    }

@router.patch("/tests/{id}/status")
def update_lab_status(
    id: str,
    req: schemas.LabTestStatusUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    test = db.query(models.LabTest).filter(models.LabTest.id == id).first()
    if not test:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Lab test not found"})

    test.status = req.status
    db.commit()

    return {
        "success": True,
        "data": {
            "id": test.id,
            "status": test.status
        }
    }

@router.post("/tests/{id}/complete")
def complete_lab_result(
    id: str,
    req: schemas.CompleteLabResultRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if not req.resultSummary:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Result summary / diagnostic findings are required"})

    try:
        ip_address = request.client.host if request.client else None
        result = complete_lab_test_transaction(
            db=db,
            test_id=id,
            result_summary=req.resultSummary,
            report_url=req.reportUrl,
            completed_by_user_id=current_user.id,
            ip_address=ip_address
        )
        return {
            "success": True,
            "message": "Laboratory investigation completed and billing recorded",
            "data": {
                "id": result["test"].id,
                "status": result["test"].status,
                "resultSummary": result["test"].resultSummary
            }
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail={"success": False, "message": str(err)})
