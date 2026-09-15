from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db
from app import models, schemas
from app.auth import get_current_user, require_roles
from app.services.audit_service import log_audit

router = APIRouter(prefix="/api/departments", tags=["departments"])

@router.get("")
def get_all_departments(includeInactive: Optional[str] = "false", db: Session = Depends(get_db)):
    query = db.query(models.Department)
    if includeInactive != "true":
        query = query.filter(models.Department.isActive == True)
    
    depts = query.order_by(models.Department.name.asc()).all()
    
    result = []
    for d in depts:
        result.append({
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "description": d.description,
            "isActive": d.isActive,
            "createdAt": d.createdAt,
            "updatedAt": d.updatedAt,
            "_count": {
                "staff": len(d.staff) if d.staff else 0
            }
        })
    return {"success": True, "data": result}

@router.post("")
def create_department(
    req: schemas.DepartmentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN"))
):
    code = req.code.strip().upper()
    name = req.name.strip()

    if not code or not name:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Department code and name are required"}
        )

    existing = db.query(models.Department).filter((models.Department.code == code) | (models.Department.name == name)).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"success": False, "message": "Department code or name already exists"}
        )

    dept = models.Department(
        code=code,
        name=name,
        description=req.description.strip() if req.description else None
    )
    db.add(dept)
    db.flush()

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="CREATE_DEPARTMENT",
        resource="DEPARTMENT",
        details={"code": dept.code, "name": dept.name},
        ip_address=ip_address
    )
    db.commit()

    return {"success": True, "data": {
        "id": dept.id,
        "code": dept.code,
        "name": dept.name,
        "description": dept.description,
        "isActive": dept.isActive,
        "createdAt": dept.createdAt,
        "updatedAt": dept.updatedAt
    }}

@router.put("/{id}")
def update_department(
    id: str,
    req: schemas.DepartmentUpdate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(require_roles("ADMIN"))
):
    dept = db.query(models.Department).filter(models.Department.id == id).first()
    if not dept:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Department not found"})

    if req.name is not None:
        dept.name = req.name.strip()
    if req.description is not None:
        dept.description = req.description.strip()
    if req.isActive is not None:
        dept.isActive = req.isActive

    ip_address = request.client.host if request.client else None
    log_audit(
        db=db,
        user_id=current_user.id,
        action="UPDATE_DEPARTMENT",
        resource="DEPARTMENT",
        details={"id": id, "name": dept.name, "isActive": dept.isActive},
        ip_address=ip_address
    )
    db.commit()

    return {"success": True, "data": {
        "id": dept.id,
        "code": dept.code,
        "name": dept.name,
        "description": dept.description,
        "isActive": dept.isActive,
        "createdAt": dept.createdAt,
        "updatedAt": dept.updatedAt
    }}
