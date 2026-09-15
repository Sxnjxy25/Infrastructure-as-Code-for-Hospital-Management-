import math
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Request, Response, status
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_roles
from app.services.audit_service import log_audit
from app.services.document_service import (
    validate_document, generate_s3_key, generate_signed_url, verify_signed_url
)

router = APIRouter(prefix="/api/staff", tags=["staff"])

@router.get("")
def get_all_staff(
    category: Optional[str] = None,
    availability: Optional[str] = None,
    departmentId: Optional[str] = None,
    search: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.StaffProfile)

    if category:
        query = query.filter(models.StaffProfile.category == category)
    if availability:
        query = query.filter(models.StaffProfile.availability == availability)
    if departmentId:
        query = query.filter(models.StaffProfile.departmentId == departmentId)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(
            (models.StaffProfile.name.ilike(s)) |
            (models.StaffProfile.designation.ilike(s)) |
            (models.StaffProfile.phone.ilike(s)) |
            (models.StaffProfile.email.ilike(s))
        )

    total = query.count()
    skip = (page - 1) * limit
    staff_list = query.order_by(models.StaffProfile.category.asc(), models.StaffProfile.name.asc()).offset(skip).limit(limit).all()

    result = []
    for stf in staff_list:
        result.append({
            "id": stf.id,
            "userId": stf.userId,
            "departmentId": stf.departmentId,
            "name": stf.name,
            "category": stf.category,
            "designation": stf.designation,
            "shift": stf.shift,
            "availability": stf.availability,
            "phone": stf.phone,
            "email": stf.email,
            "profilePictureUrl": stf.profilePictureUrl,
            "isActive": stf.isActive,
            "createdAt": stf.createdAt,
            "updatedAt": stf.updatedAt,
            "department": {
                "id": stf.department.id,
                "name": stf.department.name,
                "code": stf.department.code
            } if stf.department else None,
            "user": {
                "id": stf.user.id,
                "email": stf.user.email,
                "role": stf.user.role
            } if stf.user else None,
            "_count": {
                "documents": len(stf.documents) if stf.documents else 0
            }
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
def get_staff_by_id(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    stf = db.query(models.StaffProfile).filter(models.StaffProfile.id == id).first()
    if not stf:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Staff member not found"})

    return {
        "success": True,
        "data": {
            "id": stf.id,
            "userId": stf.userId,
            "departmentId": stf.departmentId,
            "name": stf.name,
            "category": stf.category,
            "designation": stf.designation,
            "shift": stf.shift,
            "availability": stf.availability,
            "phone": stf.phone,
            "email": stf.email,
            "profilePictureUrl": stf.profilePictureUrl,
            "isActive": stf.isActive,
            "createdAt": stf.createdAt,
            "department": {
                "id": stf.department.id,
                "name": stf.department.name,
                "code": stf.department.code
            } if stf.department else None,
            "user": {
                "id": stf.user.id,
                "email": stf.user.email,
                "name": stf.user.name,
                "role": stf.user.role,
                "phone": stf.user.phone
            } if stf.user else None,
            "documents": [
                {
                    "id": d.id,
                    "documentType": d.documentType,
                    "title": d.title,
                    "fileName": d.fileName,
                    "fileSize": d.fileSize,
                    "mimeType": d.mimeType,
                    "createdAt": d.createdAt
                } for d in stf.documents
            ]
        }
    }

@router.post("")
def create_staff(
    req: schemas.StaffCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN"))
):
    if not req.name or not req.category or not req.designation:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Name, category, and designation are required"})

    stf = models.StaffProfile(
        name=req.name.strip(),
        category=req.category,
        designation=req.designation.strip(),
        departmentId=req.departmentId,
        shift=req.shift or "MORNING",
        availability=req.availability or "AVAILABLE",
        phone=req.phone.strip() if req.phone else None,
        email=req.email.strip() if req.email else None,
        userId=req.userId,
        isActive=True
    )
    db.add(stf)
    db.flush()

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="CREATE_STAFF",
        resource="STAFF",
        details={"staffId": stf.id, "name": stf.name, "category": stf.category, "designation": stf.designation},
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": stf.id,
            "name": stf.name,
            "category": stf.category,
            "designation": stf.designation,
            "shift": stf.shift,
            "availability": stf.availability
        }
    }

@router.put("/{id}")
def update_staff(
    id: str,
    req: schemas.StaffUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN"))
):
    stf = db.query(models.StaffProfile).filter(models.StaffProfile.id == id).first()
    if not stf:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Staff member not found"})

    if req.name is not None:
        stf.name = req.name.strip()
    if req.category is not None:
        stf.category = req.category
    if req.designation is not None:
        stf.designation = req.designation.strip()
    if req.departmentId is not None:
        stf.departmentId = req.departmentId
    if req.shift is not None:
        stf.shift = req.shift
    if req.availability is not None:
        stf.availability = req.availability
    if req.phone is not None:
        stf.phone = req.phone.strip() if req.phone else None
    if req.email is not None:
        stf.email = req.email.strip() if req.email else None
    if req.isActive is not None:
        stf.isActive = req.isActive

    if stf.userId and stf.category == "DOCTOR" and req.availability:
        db.query(models.Doctor).filter(models.Doctor.userId == stf.userId).update({"availability": req.availability})

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE_STAFF",
        resource="STAFF",
        details={"staffId": id, "name": stf.name, "category": stf.category},
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "id": stf.id,
            "name": stf.name,
            "category": stf.category,
            "designation": stf.designation,
            "availability": stf.availability,
            "isActive": stf.isActive
        }
    }

@router.patch("/{id}/availability")
def update_staff_availability(
    id: str,
    req: schemas.StaffAvailabilityUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if req.availability not in ["AVAILABLE", "ON_DUTY", "BUSY", "OFF_DUTY", "ON_LEAVE"]:
        raise HTTPException(status_code=400, detail={"success": False, "message": "Invalid availability state"})

    stf = db.query(models.StaffProfile).filter(models.StaffProfile.id == id).first()
    if not stf:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Staff member not found"})

    stf.availability = req.availability
    if stf.userId and stf.category == "DOCTOR":
        db.query(models.Doctor).filter(models.Doctor.userId == stf.userId).update({"availability": req.availability})

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE_STAFF_AVAILABILITY",
        resource="STAFF",
        details={"staffId": id, "availability": req.availability},
        ip_address=ip_address
    )
    db.commit()

    return {"success": True, "data": {"id": stf.id, "availability": stf.availability}}

@router.post("/{id}/documents")
def upload_staff_document(
    id: str,
    req: schemas.DocumentUploadRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    stf = db.query(models.StaffProfile).filter(models.StaffProfile.id == id).first()
    if not stf:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Staff profile not found"})

    try:
        validate_document(mime_type=req.mimeType, file_size=req.fileSize, file_name=req.fileName)
        s3_key = generate_s3_key(category=stf.category, staff_profile_id=stf.id, file_name=req.fileName)

        doc = models.StaffDocument(
            staffProfileId=stf.id,
            documentType=req.documentType or "CERTIFICATE",
            title=req.title or req.fileName,
            fileUrl=s3_key,
            fileName=req.fileName,
            fileSize=req.fileSize,
            mimeType=req.mimeType
        )
        db.add(doc)
        db.flush()

        ip_address = request.client.host if request.client else None
        log_audit(
            db=db,
            user_id=current_user.id,
            action="UPLOAD_STAFF_DOCUMENT",
            resource="STAFF_DOCUMENT",
            details={"staffId": stf.id, "documentId": doc.id, "title": doc.title, "documentType": doc.documentType},
            ip_address=ip_address
        )
        db.commit()

        return {
            "success": True,
            "data": {
                "id": doc.id,
                "staffProfileId": doc.staffProfileId,
                "documentType": doc.documentType,
                "title": doc.title,
                "fileName": doc.fileName,
                "fileSize": doc.fileSize,
                "mimeType": doc.mimeType
            }
        }
    except Exception as err:
        raise HTTPException(status_code=400, detail={"success": False, "message": str(err)})

@router.get("/{id}/documents/{doc_id}/signed-url")
def get_signed_document_url(
    id: str,
    doc_id: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    doc = db.query(models.StaffDocument).filter(
        models.StaffDocument.id == doc_id,
        models.StaffDocument.staffProfileId == id
    ).first()
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Document record not found"})

    signed_url = generate_signed_url(file_url=doc.fileUrl, document_id=doc.id, expires_in_seconds=900)

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="DOCUMENT_URL_REQUESTED",
        resource="STAFF_DOCUMENT",
        details={"documentId": doc.id, "title": doc.title, "staffName": doc.staffProfile.name if doc.staffProfile else ""},
        ip_address=ip_address
    )
    db.commit()

    return {
        "success": True,
        "data": {
            "documentId": doc.id,
            "title": doc.title,
            "fileName": doc.fileName,
            "mimeType": doc.mimeType,
            "fileSize": doc.fileSize,
            "signedUrl": signed_url,
            "expiresInSeconds": 900
        }
    }

@router.get("/documents/view/{doc_id}")
def view_document_content(
    doc_id: str,
    expires: str,
    sig: str,
    request: Request,
    db: Session = Depends(get_db)
):
    doc = db.query(models.StaffDocument).filter(models.StaffDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Document not found"})

    try:
        verify_signed_url(document_id=doc.id, file_url=doc.fileUrl, expires=expires, signature=sig)
    except Exception as err:
        raise HTTPException(status_code=403, detail={"success": False, "message": str(err)})

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=None,
        action="DOCUMENT_VIEWED",
        resource="STAFF_DOCUMENT",
        details={"documentId": doc.id, "title": doc.title},
        ip_address=ip_address
    )
    db.commit()

    content = f"%PDF-1.4\n1 0 obj\n<< /Title ({doc.title}) >>\nendobj\n%%EOF\n[Authenticated Document View: {doc.title} - Verified]"
    return Response(content=content, media_type=doc.mimeType or "application/pdf")
