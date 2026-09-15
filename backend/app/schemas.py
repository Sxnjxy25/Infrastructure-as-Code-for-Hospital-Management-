from pydantic import BaseModel, Field
from typing import Optional, List, Any
from datetime import datetime

class LoginRequest(BaseModel):
    email: str
    password: str

class DepartmentCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = None

class DepartmentUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    isActive: Optional[bool] = None

class PatientCreate(BaseModel):
    firstName: str
    lastName: str
    dateOfBirth: str
    gender: str
    bloodGroup: Optional[str] = None
    phone: str
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    medicalHistory: Optional[str] = None

class PatientUpdate(BaseModel):
    firstName: Optional[str] = None
    lastName: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    emergencyContact: Optional[str] = None
    medicalHistory: Optional[str] = None

class DoctorAvailabilityUpdate(BaseModel):
    availability: str

class AppointmentCreate(BaseModel):
    patientId: str
    doctorId: str
    appointmentDate: str
    reason: Optional[str] = None
    channel: Optional[str] = "OFFLINE"

class QuickBookRequest(BaseModel):
    doctorName: Optional[str] = None
    doctorId: Optional[str] = None
    patientName: str
    phone: str
    appointmentDate: Optional[str] = None
    timeSlot: Optional[str] = None
    reason: Optional[str] = None
    channel: Optional[str] = "OFFLINE"

class OrderedTestItem(BaseModel):
    testName: str
    category: Optional[str] = "Diagnostics"
    cost: Optional[float] = 50.0

class CompleteAppointmentRequest(BaseModel):
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None
    orderedTests: Optional[List[OrderedTestItem]] = None

class AppointmentStatusUpdate(BaseModel):
    status: Optional[str] = None
    diagnosis: Optional[str] = None
    prescription: Optional[str] = None

class MedicineCreate(BaseModel):
    code: str
    name: str
    category: Optional[str] = "General"
    quantity: int
    unitPrice: float
    reorderThreshold: Optional[int] = 20
    expiryDate: Optional[str] = None
    supplier: Optional[str] = None

class StockUpdate(BaseModel):
    quantity: Optional[int] = None
    reorderThreshold: Optional[int] = None
    unitPrice: Optional[float] = None

class DispenseItem(BaseModel):
    medicineId: str
    quantity: int

class DispenseRequest(BaseModel):
    patientId: str
    items: List[DispenseItem]

class LabTestCreate(BaseModel):
    patientId: str
    testName: str
    category: Optional[str] = "General Pathology"
    cost: Optional[float] = 50.0
    requestedBy: Optional[str] = None

class LabTestStatusUpdate(BaseModel):
    status: str

class CompleteLabResultRequest(BaseModel):
    resultSummary: str
    reportUrl: Optional[str] = None

class StaffCreate(BaseModel):
    name: str
    category: str
    designation: str
    departmentId: Optional[str] = None
    shift: Optional[str] = "MORNING"
    availability: Optional[str] = "AVAILABLE"
    phone: Optional[str] = None
    email: Optional[str] = None
    userId: Optional[str] = None

class StaffUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    designation: Optional[str] = None
    departmentId: Optional[str] = None
    shift: Optional[str] = None
    availability: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    isActive: Optional[bool] = None

class StaffAvailabilityUpdate(BaseModel):
    availability: str

class DocumentUploadRequest(BaseModel):
    documentType: Optional[str] = "CERTIFICATE"
    title: Optional[str] = None
    fileName: str
    fileSize: int
    mimeType: str

class InvoiceItemCreate(BaseModel):
    sourceDepartment: Optional[str] = "RECEPTION"
    billingType: Optional[str] = "SERVICE"
    itemDescription: str
    quantity: Optional[int] = 1
    unitPrice: float
    medicineId: Optional[str] = None
    sourceEntity: Optional[str] = None
    sourceId: Optional[str] = None

class InvoiceCreate(BaseModel):
    patientId: str
    billingType: Optional[str] = "RECEPTION"
    items: List[InvoiceItemCreate]
    discount: Optional[float] = 0.0
    description: Optional[str] = None

class PaymentRecordRequest(BaseModel):
    amount: float
    paymentMethod: Optional[str] = "CARD"
    transactionId: Optional[str] = None
    notes: Optional[str] = None
