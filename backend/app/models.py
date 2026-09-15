import uuid
from datetime import datetime
from sqlalchemy import (
    Column, String, Boolean, Integer, Float, DateTime, ForeignKey, Text, UniqueConstraint
)
from sqlalchemy.orm import relationship
from app.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Department(Base):
    __tablename__ = "Department"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, unique=True, nullable=False)
    description = Column(Text, nullable=True)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staff = relationship("StaffProfile", back_populates="department")

class User(Base):
    __tablename__ = "User"

    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, nullable=False, index=True)
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    role = Column(String, default="PATIENT")
    phone = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    doctor = relationship("Doctor", back_populates="user", uselist=False)
    patient = relationship("Patient", back_populates="user", uselist=False)
    staffProfile = relationship("StaffProfile", back_populates="user", uselist=False)
    createdAppointments = relationship("Appointment", back_populates="createdBy", foreign_keys="Appointment.createdById")
    receivedPayments = relationship("Payment", back_populates="receivedBy", foreign_keys="Payment.receivedById")
    notifications = relationship("Notification", back_populates="user")
    auditLogs = relationship("AuditLog", back_populates="user")

class StaffProfile(Base):
    __tablename__ = "StaffProfile"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id", ondelete="SET NULL"), unique=True, nullable=True)
    departmentId = Column(String, ForeignKey("Department.id", ondelete="SET NULL"), nullable=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False) # DOCTOR, PHARMACIST, LAB_TECHNICIAN, ACCOUNTANT, NURSE, TECHNICAL_STAFF, CLEANER
    designation = Column(String, nullable=False)
    shift = Column(String, default="MORNING") # MORNING, EVENING, NIGHT, ROTATIONAL
    availability = Column(String, default="AVAILABLE") # AVAILABLE, ON_DUTY, BUSY, OFF_DUTY, ON_LEAVE
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    profilePictureUrl = Column(String, nullable=True)
    isActive = Column(Boolean, default=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="staffProfile")
    department = relationship("Department", back_populates="staff")
    documents = relationship("StaffDocument", back_populates="staffProfile", cascade="all, delete-orphan")

class StaffDocument(Base):
    __tablename__ = "StaffDocument"

    id = Column(String, primary_key=True, default=generate_uuid)
    staffProfileId = Column(String, ForeignKey("StaffProfile.id", ondelete="CASCADE"), nullable=False)
    documentType = Column(String, default="CERTIFICATE") # CERTIFICATE, IDENTITY, CONTRACT, OTHER
    title = Column(String, nullable=False)
    fileUrl = Column(String, nullable=False)
    fileName = Column(String, nullable=False)
    fileSize = Column(Integer, nullable=False)
    mimeType = Column(String, nullable=False)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    staffProfile = relationship("StaffProfile", back_populates="documents")

class Patient(Base):
    __tablename__ = "Patient"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id"), unique=True, nullable=True)
    mrn = Column(String, unique=True, nullable=False, index=True)
    firstName = Column(String, nullable=False)
    lastName = Column(String, nullable=False)
    dateOfBirth = Column(DateTime, nullable=False)
    gender = Column(String, nullable=False)
    bloodGroup = Column(String, nullable=True)
    phone = Column(String, nullable=False)
    address = Column(Text, nullable=True)
    emergencyContact = Column(String, nullable=True)
    medicalHistory = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="patient")
    appointments = relationship("Appointment", back_populates="patient")
    labTests = relationship("LabTest", back_populates="patient")
    invoices = relationship("Invoice", back_populates="patient")

class Doctor(Base):
    __tablename__ = "Doctor"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id"), unique=True, nullable=False)
    specialization = Column(String, nullable=False)
    department = Column(String, nullable=False)
    qualification = Column(String, nullable=False)
    consultationFee = Column(Float, nullable=False)
    availability = Column(String, default="AVAILABLE")
    roomNumber = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="doctor")
    appointments = relationship("Appointment", back_populates="doctor")

class Appointment(Base):
    __tablename__ = "Appointment"

    id = Column(String, primary_key=True, default=generate_uuid)
    patientId = Column(String, ForeignKey("Patient.id"), nullable=False)
    doctorId = Column(String, ForeignKey("Doctor.id"), nullable=False)
    createdById = Column(String, ForeignKey("User.id", ondelete="SET NULL"), nullable=True)
    tokenNumber = Column(Integer, nullable=False)
    appointmentDate = Column(DateTime, nullable=False)
    channel = Column(String, default="OFFLINE") # OFFLINE, ONLINE
    reason = Column(Text, nullable=True)
    status = Column(String, default="SCHEDULED") # SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
    diagnosis = Column(Text, nullable=True)
    prescription = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="appointments")
    doctor = relationship("Doctor", back_populates="appointments")
    createdBy = relationship("User", back_populates="createdAppointments", foreign_keys=[createdById])

class Medicine(Base):
    __tablename__ = "Medicine"

    id = Column(String, primary_key=True, default=generate_uuid)
    code = Column(String, unique=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    unitPrice = Column(Float, nullable=False)
    reorderThreshold = Column(Integer, default=20)
    expiryDate = Column(DateTime, nullable=False)
    supplier = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    dispensedItems = relationship("InvoiceItem", back_populates="medicine")

class LabTest(Base):
    __tablename__ = "LabTest"

    id = Column(String, primary_key=True, default=generate_uuid)
    patientId = Column(String, ForeignKey("Patient.id"), nullable=False)
    testName = Column(String, nullable=False)
    category = Column(String, nullable=False)
    cost = Column(Float, default=50.00)
    status = Column(String, default="PENDING") # PENDING, PROCESSING, COMPLETED, CANCELLED
    resultSummary = Column(Text, nullable=True)
    reportUrl = Column(String, nullable=True)
    requestedBy = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="labTests")

class Invoice(Base):
    __tablename__ = "Invoice"

    id = Column(String, primary_key=True, default=generate_uuid)
    patientId = Column(String, ForeignKey("Patient.id"), nullable=False)
    invoiceNumber = Column(String, unique=True, nullable=False)
    billingType = Column(String, default="RECEPTION") # RECEPTION, PHARMACY, COMBINED
    amount = Column(Float, nullable=False)
    discount = Column(Float, default=0.00)
    netAmount = Column(Float, nullable=False)
    paidAmount = Column(Float, default=0.00)
    status = Column(String, default="PENDING") # PENDING, PARTIALLY_PAID, PAID, CANCELLED, REFUNDED
    paymentMethod = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    patient = relationship("Patient", back_populates="invoices")
    items = relationship("InvoiceItem", back_populates="invoice", cascade="all, delete-orphan")
    payments = relationship("Payment", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceItem(Base):
    __tablename__ = "InvoiceItem"

    id = Column(String, primary_key=True, default=generate_uuid)
    invoiceId = Column(String, ForeignKey("Invoice.id", ondelete="CASCADE"), nullable=False)
    sourceDepartment = Column(String, nullable=False) # RECEPTION, PHARMACY, LABORATORY, CLINICAL
    billingType = Column(String, nullable=False) # CONSULTATION, MEDICINE, LAB_TEST, ADMISSION, SERVICE
    itemDescription = Column(String, nullable=False)
    quantity = Column(Integer, default=1)
    unitPrice = Column(Float, nullable=False)
    totalPrice = Column(Float, nullable=False)
    medicineId = Column(String, ForeignKey("Medicine.id", ondelete="SET NULL"), nullable=True)
    sourceEntity = Column(String, nullable=True) # APPOINTMENT, LAB_TEST, PHARMACY_SALE
    sourceId = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)
    updatedAt = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="items")
    medicine = relationship("Medicine", back_populates="dispensedItems")

    __table_args__ = (
        UniqueConstraint('sourceEntity', 'sourceId', name='source_item_unique'),
    )

class Payment(Base):
    __tablename__ = "Payment"

    id = Column(String, primary_key=True, default=generate_uuid)
    invoiceId = Column(String, ForeignKey("Invoice.id", ondelete="CASCADE"), nullable=False)
    receiptNumber = Column(String, unique=True, nullable=False)
    amount = Column(Float, nullable=False)
    paymentMethod = Column(String, nullable=False) # CASH, UPI, CARD, ONLINE_PAYMENT
    transactionId = Column(String, nullable=True)
    status = Column(String, default="COMPLETED")
    notes = Column(Text, nullable=True)
    receivedById = Column(String, ForeignKey("User.id", ondelete="SET NULL"), nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    invoice = relationship("Invoice", back_populates="payments")
    receivedBy = relationship("User", back_populates="receivedPayments", foreign_keys=[receivedById])

class Notification(Base):
    __tablename__ = "Notification"

    id = Column(String, primary_key=True, default=generate_uuid)
    role = Column(String, nullable=True)
    userId = Column(String, ForeignKey("User.id", ondelete="CASCADE"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String, nullable=False) # LOW_STOCK, OUT_OF_STOCK, LAB_REQUEST, LAB_RESULT, APPOINTMENT, PAYMENT, GENERAL
    entityId = Column(String, nullable=True)
    isRead = Column(Boolean, default=False)
    createdAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="notifications")

class AuditLog(Base):
    __tablename__ = "AuditLog"

    id = Column(String, primary_key=True, default=generate_uuid)
    userId = Column(String, ForeignKey("User.id"), nullable=True)
    action = Column(String, nullable=False)
    resource = Column(String, nullable=False)
    details = Column(Text, nullable=True)
    ipAddress = Column(String, nullable=True)
    createdAt = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="auditLogs")
