from datetime import datetime, timedelta
from app.database import engine, SessionLocal, Base
from app import models
from app.auth import hash_password

def seed_database():
    print("--- Starting Enterprise Hospital Management System Seeding (Python FastAPI) ---")
    
    # Create all database tables if they do not exist
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    try:
        hashed_password = hash_password("password123")

        # 1. Departments
        departments_data = [
            {"code": "ADM", "name": "Administration", "description": "Executive, hospital administration, and human resources"},
            {"code": "REC", "name": "Reception", "description": "Front desk, patient intake, scheduling, and admissions"},
            {"code": "DOC", "name": "Doctors", "description": "Medical specialists, outpatient consultations, and inpatient care"},
            {"code": "NUR", "name": "Nursing", "description": "Inpatient wards, emergency care, vitals, and assistance"},
            {"code": "PHM", "name": "Pharmacy", "description": "Dispensing, prescription fulfillment, and drug inventory"},
            {"code": "LAB", "name": "Laboratory", "description": "Diagnostic pathology, hematology, imaging, and bio-testing"},
            {"code": "TEC", "name": "Technical Services", "description": "Radiology operations, biomedical engineering, and IT systems"},
            {"code": "HSK", "name": "Housekeeping / Cleaners", "description": "Sanitation, room sterilization, and floor maintenance"},
            {"code": "ACC", "name": "Accounts", "description": "Hospital accounting, auditing, and financial records"},
            {"code": "BIL", "name": "Billing", "description": "Patient invoicing, cashiering, and insurance claims"}
        ]

        dept_map = {}
        for d_data in departments_data:
            dept = db.query(models.Department).filter(models.Department.code == d_data["code"]).first()
            if not dept:
                dept = models.Department(**d_data)
                db.add(dept)
                db.flush()
            else:
                dept.name = d_data["name"]
                dept.description = d_data["description"]
            dept_map[d_data["code"]] = dept

        print(f"[OK] Seeded {len(departments_data)} Departments")

        # 2. System Users
        users_data = [
            {"email": "admin@hospital.com", "name": "System Administrator", "role": "ADMIN", "phone": "+1-555-0101", "dept": "ADM", "desig": "Hospital Chief Administrator", "shift": "MORNING"},
            {"email": "dr.smith@hospital.com", "name": "Dr. Sarah Smith", "role": "DOCTOR", "phone": "+1-555-0102", "dept": "DOC", "desig": "Senior Cardiologist", "shift": "MORNING"},
            {"email": "dr.patel@hospital.com", "name": "Dr. Rajesh Patel", "role": "DOCTOR", "phone": "+1-555-0108", "dept": "DOC", "desig": "Consultant Neurologist", "shift": "EVENING"},
            {"email": "reception@hospital.com", "name": "Emma Watson", "role": "RECEPTIONIST", "phone": "+1-555-0103", "dept": "REC", "desig": "Lead Patient Coordinator", "shift": "MORNING"},
            {"email": "john.doe@patient.com", "name": "John Doe", "role": "PATIENT", "phone": "+1-555-0104", "dept": None, "desig": None, "shift": None},
            {"email": "pharmacy@hospital.com", "name": "Michael Chang", "role": "PHARMACIST", "phone": "+1-555-0105", "dept": "PHM", "desig": "Head Dispensing Pharmacist", "shift": "MORNING"},
            {"email": "lab@hospital.com", "name": "Alice Johnson", "role": "LAB_TECHNICIAN", "phone": "+1-555-0106", "dept": "LAB", "desig": "Chief Pathology Specialist", "shift": "ROTATIONAL"},
            {"email": "billing@hospital.com", "name": "Robert Davis", "role": "ACCOUNTANT", "phone": "+1-555-0107", "dept": "ACC", "desig": "Senior Financial Officer", "shift": "MORNING"}
        ]

        user_map = {}
        for u in users_data:
            user = db.query(models.User).filter(models.User.email == u["email"]).first()
            if not user:
                user = models.User(
                    email=u["email"],
                    password=hashed_password,
                    name=u["name"],
                    role=u["role"],
                    phone=u["phone"]
                )
                db.add(user)
                db.flush()
            else:
                user.password = hashed_password
                user.name = u["name"]
                user.role = u["role"]
                user.phone = u["phone"]
            user_map[u["email"]] = user

            if u["dept"]:
                sp = db.query(models.StaffProfile).filter(models.StaffProfile.userId == user.id).first()
                if not sp:
                    sp = models.StaffProfile(
                        userId=user.id,
                        departmentId=dept_map[u["dept"]].id,
                        name=u["name"],
                        category=u["role"],
                        designation=u["desig"],
                        shift=u["shift"],
                        availability="AVAILABLE",
                        phone=u["phone"],
                        email=u["email"],
                        isActive=True
                    )
                    db.add(sp)
                else:
                    sp.name = u["name"]
                    sp.category = u["role"]
                    sp.designation = u["desig"]
                    sp.shift = u["shift"]
                    sp.departmentId = dept_map[u["dept"]].id

        print(f"[OK] Seeded {len(users_data)} Users & Portal Staff Profiles")

        # 3. Doctors
        doc_smith = db.query(models.Doctor).filter(models.Doctor.userId == user_map["dr.smith@hospital.com"].id).first()
        if not doc_smith:
            doc_smith = models.Doctor(
                userId=user_map["dr.smith@hospital.com"].id,
                specialization="Cardiology",
                department="Cardiovascular Services",
                qualification="MD, FACC, Board Certified",
                consultationFee=150.00,
                availability="AVAILABLE",
                roomNumber="Suite 302"
            )
            db.add(doc_smith)
            db.flush()

        doc_patel = db.query(models.Doctor).filter(models.Doctor.userId == user_map["dr.patel@hospital.com"].id).first()
        if not doc_patel:
            doc_patel = models.Doctor(
                userId=user_map["dr.patel@hospital.com"].id,
                specialization="Neurology",
                department="Neurology & Brain Sciences",
                qualification="MBBS, MD Neurology",
                consultationFee=175.00,
                availability="AVAILABLE",
                roomNumber="Suite 410"
            )
            db.add(doc_patel)
            db.flush()

        # 4. Record-Only Staff (Nurses, Techs, Cleaners)
        record_only_staff = [
            {"name": "Clara Barton", "category": "NURSE", "designation": "Head ICU Nurse", "dept": "NUR", "shift": "MORNING", "availability": "AVAILABLE", "phone": "+1-555-0201", "email": "clara.barton@staff.hospital.com"},
            {"name": "James Wilson", "category": "NURSE", "designation": "General Ward Nurse", "dept": "NUR", "shift": "EVENING", "availability": "ON_DUTY", "phone": "+1-555-0202", "email": "james.wilson@staff.hospital.com"},
            {"name": "David Miller", "category": "TECHNICAL_STAFF", "designation": "Lead MRI & Radiology Tech", "dept": "TEC", "shift": "MORNING", "availability": "AVAILABLE", "phone": "+1-555-0301", "email": "david.miller@staff.hospital.com"},
            {"name": "Kevin Vance", "category": "TECHNICAL_STAFF", "designation": "Biomedical Systems Engineer", "dept": "TEC", "shift": "ROTATIONAL", "availability": "AVAILABLE", "phone": "+1-555-0302", "email": "kevin.vance@staff.hospital.com"},
            {"name": "Elena Rostova", "category": "CLEANER", "designation": "1st Floor Sanitation Lead", "dept": "HSK", "shift": "MORNING", "availability": "AVAILABLE", "phone": "+1-555-0401", "email": None},
            {"name": "Carlos Ortiz", "category": "CLEANER", "designation": "2nd Floor Room & Ward Sterilization", "dept": "HSK", "shift": "EVENING", "availability": "AVAILABLE", "phone": "+1-555-0402", "email": None},
            {"name": "Amina Yusuf", "category": "CLEANER", "designation": "Surgical Theatre Sanitation Specialist", "dept": "HSK", "shift": "NIGHT", "availability": "OFF_DUTY", "phone": "+1-555-0403", "email": None}
        ]

        for s in record_only_staff:
            sp = db.query(models.StaffProfile).filter(models.StaffProfile.name == s["name"], models.StaffProfile.category == s["category"]).first()
            if not sp:
                sp = models.StaffProfile(
                    name=s["name"],
                    category=s["category"],
                    designation=s["designation"],
                    departmentId=dept_map[s["dept"]].id,
                    shift=s["shift"],
                    availability=s["availability"],
                    phone=s["phone"],
                    email=s["email"],
                    isActive=True
                )
                db.add(sp)
                db.flush()

                doc = models.StaffDocument(
                    staffProfileId=sp.id,
                    documentType="CERTIFICATE",
                    title=f"{s['designation']} Board Certification",
                    fileUrl=f"staff/{s['category'].lower()}/{sp.id}/certification.pdf",
                    fileName=f"certification_{s['name'].lower().replace(' ', '_')}.pdf",
                    fileSize=1024 * 450,
                    mimeType="application/pdf"
                )
                db.add(doc)

        print(f"[OK] Seeded {len(record_only_staff)} Record-Only Staff (Nurses, Techs, Cleaners) with Documents")

        # 5. Patients
        patient1 = db.query(models.Patient).filter(models.Patient.mrn == "MRN-2026-001").first()
        if not patient1:
            patient1 = models.Patient(
                userId=user_map["john.doe@patient.com"].id,
                mrn="MRN-2026-001",
                firstName="John",
                lastName="Doe",
                dateOfBirth=datetime(1988, 5, 14),
                gender="Male",
                bloodGroup="O+",
                phone="+1-555-0104",
                address="123 Health Ave, Metro City",
                emergencyContact="Jane Doe (+1-555-0999)",
                medicalHistory="Hypertension, Seasonal Allergies"
            )
            db.add(patient1)
            db.flush()

        patient2 = db.query(models.Patient).filter(models.Patient.mrn == "MRN-2026-002").first()
        if not patient2:
            patient2 = models.Patient(
                mrn="MRN-2026-002",
                firstName="Eleanor",
                lastName="Vance",
                dateOfBirth=datetime(1994, 9, 22),
                gender="Female",
                bloodGroup="A+",
                phone="+1-555-0199",
                address="456 Elm Street, Metro City",
                emergencyContact="Mark Vance (+1-555-0888)",
                medicalHistory="Migraine with aura"
            )
            db.add(patient2)
            db.flush()

        print("[OK] Seeded Patients")

        # 6. Appointments
        app_count = db.query(models.Appointment).count()
        if app_count == 0:
            app1 = models.Appointment(
                patientId=patient1.id,
                doctorId=doc_smith.id,
                createdById=user_map["reception@hospital.com"].id,
                tokenNumber=101,
                appointmentDate=datetime.utcnow(),
                channel="OFFLINE",
                reason="Routine Cardiology Consultation & Blood Pressure Check",
                status="SCHEDULED"
            )
            db.add(app1)

            app2 = models.Appointment(
                patientId=patient2.id,
                doctorId=doc_patel.id,
                createdById=user_map["reception@hospital.com"].id,
                tokenNumber=102,
                appointmentDate=datetime.utcnow() + timedelta(hours=1),
                channel="ONLINE",
                reason="Persistent Migraines & Dizziness Consultation",
                status="SCHEDULED"
            )
            db.add(app2)

        # 7. Medicines
        medicines_data = [
            {"code": "MED-AMLO-5", "name": "Amlodipine 5mg", "category": "Cardiovascular", "quantity": 250, "unitPrice": 12.50, "reorderThreshold": 50, "expiryDate": datetime(2027, 12, 31), "supplier": "PharmaSupply Corp"},
            {"code": "MED-AMOX-500", "name": "Amoxicillin 500mg", "category": "Antibiotic", "quantity": 12, "unitPrice": 18.00, "reorderThreshold": 25, "expiryDate": datetime(2026, 11, 30), "supplier": "MediTech Supplies"},
            {"code": "MED-PARA-650", "name": "Paracetamol 650mg", "category": "Analgesic", "quantity": 0, "unitPrice": 5.00, "reorderThreshold": 40, "expiryDate": datetime(2027, 6, 30), "supplier": "CarePharm Ltd"},
            {"code": "MED-ATOR-10", "name": "Atorvastatin 10mg", "category": "Cardiovascular", "quantity": 180, "unitPrice": 22.00, "reorderThreshold": 30, "expiryDate": datetime(2028, 1, 15), "supplier": "PharmaSupply Corp"},
            {"code": "MED-METF-500", "name": "Metformin 500mg", "category": "Endocrine", "quantity": 300, "unitPrice": 8.50, "reorderThreshold": 50, "expiryDate": datetime(2027, 8, 20), "supplier": "CarePharm Ltd"},
            {"code": "MED-OMEP-20", "name": "Omeprazole 20mg", "category": "Gastrointestinal", "quantity": 15, "unitPrice": 14.00, "reorderThreshold": 20, "expiryDate": datetime(2026, 10, 31), "supplier": "MediTech Supplies"}
        ]

        for m_data in medicines_data:
            med = db.query(models.Medicine).filter(models.Medicine.code == m_data["code"]).first()
            if not med:
                med = models.Medicine(**m_data)
                db.add(med)
            else:
                med.quantity = m_data["quantity"]
                med.unitPrice = m_data["unitPrice"]
                med.reorderThreshold = m_data["reorderThreshold"]

        print(f"[OK] Seeded {len(medicines_data)} Medicines with Reorder Thresholds")

        # 8. Lab Tests
        lab_count = db.query(models.LabTest).count()
        if lab_count == 0:
            lab1 = models.LabTest(
                patientId=patient1.id,
                testName="Complete Blood Count (CBC)",
                category="Hematology",
                cost=45.00,
                status="COMPLETED",
                resultSummary="WBC: 6.5, RBC: 4.8, Hemoglobin: 14.2 g/dL. Normal range.",
                requestedBy="Dr. Sarah Smith"
            )
            db.add(lab1)

            lab2 = models.LabTest(
                patientId=patient2.id,
                testName="Brain MRI Screening",
                category="Radiology",
                cost=250.00,
                status="PENDING",
                requestedBy="Dr. Rajesh Patel"
            )
            db.add(lab2)

        # 9. Invoices
        inv_count = db.query(models.Invoice).count()
        if inv_count == 0:
            inv1 = models.Invoice(
                patientId=patient1.id,
                invoiceNumber="INV-2026-0001",
                billingType="RECEPTION",
                amount=150.00,
                discount=10.00,
                netAmount=140.00,
                paidAmount=140.00,
                status="PAID",
                paymentMethod="CARD",
                description="Outpatient Consultation"
            )
            db.add(inv1)
            db.flush()

            itm1 = models.InvoiceItem(
                invoiceId=inv1.id,
                sourceDepartment="CLINICAL",
                billingType="CONSULTATION",
                itemDescription="Cardiology Specialist Consultation - Dr. Sarah Smith",
                quantity=1,
                unitPrice=150.00,
                totalPrice=150.00,
                sourceEntity="APPOINTMENT",
                sourceId="SEED_APP_001"
            )
            db.add(itm1)

            pmt1 = models.Payment(
                invoiceId=inv1.id,
                receiptNumber="REC-2026-0001",
                amount=140.00,
                paymentMethod="CARD",
                status="COMPLETED",
                receivedById=user_map["billing@hospital.com"].id,
                notes="Card payment processed at reception cashier"
            )
            db.add(pmt1)

        # 10. Role-Based Notifications
        notif_count = db.query(models.Notification).count()
        if notif_count == 0:
            sample_notifications = [
                {"role": "PHARMACIST", "title": "Low Medicine Stock Alert", "message": "Amoxicillin 500mg (MED-AMOX-500) stock is down to 12 units (reorder threshold: 25).", "type": "LOW_STOCK"},
                {"role": "PHARMACIST", "title": "Out of Stock Critical Alert", "message": "Paracetamol 650mg (MED-PARA-650) is out of stock (0 units remaining).", "type": "OUT_OF_STOCK"},
                {"role": "ADMIN", "title": "Pharmacy Inventory Warning", "message": "2 medicines have breached minimum safety stock levels.", "type": "LOW_STOCK"},
                {"role": "LAB_TECHNICIAN", "title": "New Diagnostic Request", "message": "Brain MRI Screening ordered for patient Eleanor Vance (MRN-2026-002).", "type": "LAB_REQUEST"},
                {"role": "DOCTOR", "title": "New Appointment Booked", "message": "Patient John Doe booked for Routine Cardiology Consultation.", "type": "APPOINTMENT"}
            ]
            for n in sample_notifications:
                db.add(models.Notification(**n))

        db.commit()
        print("--- Database Seeding Completed Successfully (Python FastAPI) ---")
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
        raise e
    finally:
        db.close()

if __name__ == "__main__":
    seed_database()
