import json
from typing import Optional, Any
from sqlalchemy.orm import Session
from app import models

def log_audit(
    db: Session,
    user_id: Optional[str] = None,
    action: str = "",
    resource: str = "",
    details: Optional[Any] = None,
    ip_address: Optional[str] = None
) -> Optional[models.AuditLog]:
    try:
        details_str = json.dumps(details) if isinstance(details, (dict, list)) else (str(details) if details is not None else None)
        log = models.AuditLog(
            userId=user_id,
            action=action,
            resource=resource,
            details=details_str,
            ipAddress=ip_address
        )
        db.add(log)
        db.flush()
        return log
    except Exception as err:
        print(f"[AUDIT_LOG_ERROR] Failed to record audit log for action: {action} - {err}")
        return None
