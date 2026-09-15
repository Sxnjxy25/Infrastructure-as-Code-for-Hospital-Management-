# CarePulse — Enterprise Hospital Management System (HMS)

A modern, role-based Enterprise Hospital Management System built for hospitals, clinics, diagnostic centers, and healthcare providers.

---

## 🏥 Modules & Features

- **Dashboard**: High-level clinical and operational metrics, emergency bed capacity, revenue telemetry, OPD queues, and specialist rosters.
- **Departments & Divisions**: Management of clinical specialties, wards, ICU, and departmental staffing.
- **Staff Directory**: Physician credentials, nursing rosters, lab technicians, and shift assignments.
- **Patient Intake & Records**: Outpatient registration, inpatient admissions, electronic medical history (EMR), and diagnostic logs.
- **Doctor Roster**: Physician availability, consultation room allocations, and fee schedules.
- **Appointments & OPD Queue**: Real-time slot booking, status updates (Scheduled, Completed, Cancelled), and printable OPD token passes.
- **Central Pharmacy**: Medicine inventory, batch tracking, low-stock reorder thresholds, and prescription dispensing.
- **Diagnostic Laboratory**: Pathology and lab test requisitions, normal value reference ranges, and verified lab test reports.
- **Billing & Patient Accounts**: Invoicing, consultation charges, lab/pharmacy itemization, and payment telemetry.
- **⚙️ Settings & Institutional Configuration** *(Newly Updated)*:
  - **Hospital Profile**: Institutional name, licensing/registration, emergency hotlines, timezone, and currency.
  - **Account & Security**: User profile updates, password change, and staff credentials.
  - **Alerts & Notifications**: Real-time SMS and email triage alerts for critical vitals, patient reminders, and lab result alerts.
  - **Security & RBAC**: Inactivity session timeout thresholds, password complexity policy, 2FA toggle, and audit logging.
  - **System & Backup Tools**: Live database telemetry, JSON data export snapshot, backup file restore, cache flush, and factory reset.

---

## 🚀 Getting Started

### 1. Launch the Local Server
Run the Windows batch launcher:
```cmd
start-server.bat
```
Or run directly via Python 3.14:
```powershell
python serve.py
```

### 2. Access the Application
Open your web browser and navigate to:
- **Homepage / Portal**: [http://localhost:3000/](http://localhost:3000/)
- **Direct Settings View**: [http://localhost:3000/settings](http://localhost:3000/settings)

---

## 🔑 Demo Access Credentials
You can log in directly using one of the demo role credentials or quick-switch buttons:
- **Administrator**: `admin@hospital.com`
- **Doctor**: `dr.smith@hospital.com`
- **Receptionist**: `reception@hospital.com`
- **Pharmacist**: `pharmacy@hospital.com`
- **Lab Technician**: `lab@hospital.com`
- **Accountant**: `billing@hospital.com`

---

## 📁 File Structure
```
c:\Users\Student\hospital\
├── index.html                  # Main application HTML entry point
├── favicon.svg                 # CarePulse institutional icon
├── serve.py                    # Python SPA HTTP server with client-side route fallback
├── start-server.bat            # Windows batch script to launch the local server
├── push-to-github.bat          # Windows batch script to push repository to GitHub
├── README.md                   # System documentation and guide
└── assets\
    ├── index-MR-jAyec.js       # Production application bundle with streamlined Settings
    └── index-DFdcLalt.css      # Editorial design system styling and theme tokens
```
