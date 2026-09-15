from datetime import datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_dashboard_stats(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    user_role = current_user.role
    user_id = current_user.id

    now = datetime.utcnow()
    start_of_today = datetime(now.year, now.month, now.day)
    start_of_month = datetime(now.year, now.month, 1)

    patient_count = db.query(models.Patient).count()
    all_doctors = db.query(models.Doctor).all()
    all_staff = db.query(models.StaffProfile).all()
    all_medicines = db.query(models.Medicine).all()
    all_appointments = db.query(models.Appointment).order_by(models.Appointment.tokenNumber.asc(), models.Appointment.appointmentDate.asc()).all()
    all_lab_tests = db.query(models.LabTest).all()
    all_invoices = db.query(models.Invoice).all()
    all_payments = db.query(models.Payment).all()

    doctors_total = len([s for s in all_staff if s.category == "DOCTOR"]) or len(all_doctors)
    doctors_available = len([s for s in all_staff if s.category == "DOCTOR" and s.availability == "AVAILABLE"]) or len([d for d in all_doctors if d.availability == "AVAILABLE"])

    nurses_total = len([s for s in all_staff if s.category == "NURSE"])
    nurses_available = len([s for s in all_staff if s.category == "NURSE" and s.availability in ["AVAILABLE", "ON_DUTY"]])

    tech_staff_total = len([s for s in all_staff if s.category == "TECHNICAL_STAFF"])
    tech_staff_available = len([s for s in all_staff if s.category == "TECHNICAL_STAFF" and s.availability == "AVAILABLE"])

    cleaners_total = len([s for s in all_staff if s.category == "CLEANER"])
    cleaners_available = len([s for s in all_staff if s.category == "CLEANER" and s.availability == "AVAILABLE"])

    total_stock_units = sum(m.quantity for m in all_medicines)
    low_stock_medicines = [m for m in all_medicines if 0 < m.quantity <= m.reorderThreshold]
    out_of_stock_medicines = [m for m in all_medicines if m.quantity == 0]

    paid_invoices = [i for i in all_invoices if i.status in ["PAID", "PARTIALLY_PAID"]]
    pending_invoices = [i for i in all_invoices if i.status in ["PENDING", "PARTIALLY_PAID"]]

    total_revenue = sum(p.amount for p in all_payments)
    today_revenue = sum(p.amount for p in all_payments if p.createdAt and p.createdAt >= start_of_today)
    monthly_revenue = sum(p.amount for p in all_payments if p.createdAt and p.createdAt >= start_of_month)

    reception_revenue = 0.0
    pharmacy_revenue = 0.0
    lab_revenue = 0.0

    for inv in all_invoices:
        if inv.status in ["PAID", "PARTIALLY_PAID"]:
            for itm in inv.items:
                if itm.sourceDepartment == "PHARMACY":
                    pharmacy_revenue += itm.totalPrice
                elif itm.sourceDepartment == "LABORATORY":
                    lab_revenue += itm.totalPrice
                else:
                    reception_revenue += itm.totalPrice

    recent_appointments = []
    for a in all_appointments[:50]:
        recent_appointments.append({
            "id": a.id,
            "tokenNumber": a.tokenNumber,
            "appointmentDate": a.appointmentDate.isoformat() if a.appointmentDate else None,
            "channel": a.channel,
            "status": a.status,
            "reason": a.reason,
            "patient": {
                "id": a.patient.id,
                "firstName": a.patient.firstName,
                "lastName": a.patient.lastName,
                "mrn": a.patient.mrn,
                "phone": a.patient.phone
            } if a.patient else None,
            "doctor": {
                "id": a.doctor.id,
                "specialization": a.doctor.specialization,
                "roomNumber": a.doctor.roomNumber,
                "user": {
                    "name": a.doctor.user.name if a.doctor.user else "Doctor"
                } if a.doctor else None
            } if a.doctor else None
        })

    role_stats = {
        "userRole": user_role,
        "totalPatients": patient_count,
        "totalDoctors": doctors_total,
        "activeDoctors": doctors_available,
        "scheduledAppointments": len([a for a in all_appointments if a.status == "SCHEDULED"]),
        "pendingLabTests": len([t for t in all_lab_tests if t.status == "PENDING"]),
        "completedLabTests": len([t for t in all_lab_tests if t.status == "COMPLETED"]),
        "lowStockCount": len(low_stock_medicines),
        "outOfStockCount": len(out_of_stock_medicines),
        "totalRevenue": f"{total_revenue:.2f}",
        "todayRevenue": f"{today_revenue:.2f}",
        "monthlyRevenue": f"{monthly_revenue:.2f}",
        "staffBreakdown": {
            "doctors": {"total": doctors_total, "available": doctors_available},
            "nurses": {"total": nurses_total, "available": nurses_available},
            "technicalStaff": {"total": tech_staff_total, "available": tech_staff_available},
            "cleaners": {"total": cleaners_total, "available": cleaners_available}
        },
        "departmentRevenue": {
            "reception": f"{reception_revenue:.2f}",
            "pharmacy": f"{pharmacy_revenue:.2f}",
            "laboratory": f"{lab_revenue:.2f}",
            "total": f"{total_revenue:.2f}"
        },
        "pharmacy": {
            "totalItems": len(all_medicines),
            "totalStockUnits": total_stock_units,
            "lowStockItems": [
                {"id": m.id, "name": m.name, "code": m.code, "quantity": m.quantity, "reorderThreshold": m.reorderThreshold}
                for m in low_stock_medicines
            ],
            "outOfStockItems": [
                {"id": m.id, "name": m.name, "code": m.code, "quantity": m.quantity}
                for m in out_of_stock_medicines
            ],
            "todaySales": len([i for i in all_invoices if i.billingType == "PHARMACY" and i.createdAt and i.createdAt >= start_of_today]),
            "todayRevenue": f"{pharmacy_revenue:.2f}"
        },
        "laboratory": {
            "pending": len([t for t in all_lab_tests if t.status == "PENDING"]),
            "processing": len([t for t in all_lab_tests if t.status == "PROCESSING"]),
            "completed": len([t for t in all_lab_tests if t.status == "COMPLETED"]),
            "todayCompleted": len([t for t in all_lab_tests if t.status == "COMPLETED" and t.updatedAt and t.updatedAt >= start_of_today])
        },
        "billing": {
            "paidInvoicesCount": len(paid_invoices),
            "pendingInvoicesCount": len(pending_invoices),
            "totalPendingAmount": f"{sum((i.netAmount - (i.paidAmount or 0.0)) for i in pending_invoices):.2f}",
            "todayReceptionBills": len([i for i in all_invoices if i.billingType == "RECEPTION" and i.createdAt and i.createdAt >= start_of_today]),
            "todayPharmacyBills": len([i for i in all_invoices if i.billingType == "PHARMACY" and i.createdAt and i.createdAt >= start_of_today])
        }
    }

    if user_role == "DOCTOR":
        my_doc = next((d for d in all_doctors if d.userId == user_id), None)
        my_doc_id = my_doc.id if my_doc else None
        my_appointments = [a for a in all_appointments if a.doctorId == my_doc_id]

        role_stats["doctorQueue"] = {
            "doctorId": my_doc_id,
            "doctorAvailability": my_doc.availability if my_doc else "AVAILABLE",
            "waitingCount": len([a for a in my_appointments if a.status == "SCHEDULED"]),
            "inProgressCount": len([a for a in my_appointments if a.status == "IN_PROGRESS"]),
            "completedToday": len([a for a in my_appointments if a.status == "COMPLETED" and a.updatedAt and a.updatedAt >= start_of_today]),
            "onlineCount": len([a for a in my_appointments if a.channel == "ONLINE"]),
            "offlineCount": len([a for a in my_appointments if a.channel == "OFFLINE"]),
            "pendingLabResults": len([t for t in all_lab_tests if t.status == "PENDING"])
        }

    return {
        "success": True,
        "stats": role_stats,
        "recentAppointments": recent_appointments
    }
