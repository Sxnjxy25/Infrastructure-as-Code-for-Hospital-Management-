from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/notifications", tags=["notifications"])

@router.get("")
def get_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    role = current_user.role
    user_id = current_user.id

    notifications = db.query(models.Notification).filter(
        or_(models.Notification.role == role, models.Notification.userId == user_id)
    ).order_by(models.Notification.createdAt.desc()).limit(20).all()

    unread_count = db.query(models.Notification).filter(
        or_(models.Notification.role == role, models.Notification.userId == user_id),
        models.Notification.isRead == False
    ).count()

    result = []
    for n in notifications:
        result.append({
            "id": n.id,
            "role": n.role,
            "userId": n.userId,
            "title": n.title,
            "message": n.message,
            "type": n.type,
            "entityId": n.entityId,
            "isRead": n.isRead,
            "createdAt": n.createdAt
        })

    return {
        "success": True,
        "unreadCount": unread_count,
        "data": result
    }

@router.patch("/{id}/read")
def mark_notification_read(id: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notif = db.query(models.Notification).filter(models.Notification.id == id).first()
    if not notif:
        raise HTTPException(status_code=404, detail={"success": False, "message": "Notification not found"})

    notif.isRead = True
    db.commit()

    return {
        "success": True,
        "data": {
            "id": notif.id,
            "isRead": notif.isRead
        }
    }

@router.patch("/read-all")
def mark_all_read(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    role = current_user.role
    user_id = current_user.id

    db.query(models.Notification).filter(
        or_(models.Notification.role == role, models.Notification.userId == user_id),
        models.Notification.isRead == False
    ).update({"isRead": True}, synchronize_session=False)
    db.commit()

    return {"success": True, "message": "All notifications marked as read"}
