from datetime import datetime, timedelta
from typing import Optional
from sqlalchemy.orm import Session
from app import models

def create_notification(
    db: Session,
    title: str,
    message: str,
    type: str,
    role: Optional[str] = None,
    user_id: Optional[str] = None,
    entity_id: Optional[str] = None
) -> Optional[models.Notification]:
    try:
        fifteen_mins_ago = datetime.utcnow() - timedelta(minutes=15)
        existing = db.query(models.Notification).filter(
            models.Notification.role == role,
            models.Notification.userId == user_id,
            models.Notification.type == type,
            models.Notification.entityId == entity_id,
            models.Notification.isRead == False,
            models.Notification.createdAt >= fifteen_mins_ago
        ).first()

        if existing:
            return existing

        notif = models.Notification(
            role=role,
            userId=user_id,
            title=title,
            message=message,
            type=type,
            entityId=entity_id
        )
        db.add(notif)
        db.flush()
        return notif
    except Exception as err:
        print(f"[NOTIFICATION_ERROR] Failed to dispatch notification: {title} - {err}")
        return None
