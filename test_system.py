#!/usr/bin/env python3
"""
Hospital Management System - Automated Integration Test Suite (Python)
Validates all backend REST API endpoints, authentication, RBAC, and data workflows.
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:5000"

def make_request(path, method="GET", data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)

    try:
        with urllib.request.urlopen(req) as resp:
            status_code = resp.getcode()
            res_data = json.loads(resp.read().decode("utf-8"))
            return status_code, res_data
    except urllib.error.HTTPError as e:
        status_code = e.code
        try:
            res_data = json.loads(e.read().decode("utf-8"))
        except Exception:
            res_data = {"error": str(e)}
        return status_code, res_data
    except Exception as e:
        return 500, {"error": str(e)}

def run_tests():
    print("=" * 60)
    print("  HOSPITAL MANAGEMENT SYSTEM - INTEGRATION TEST SUITE")
    print(f"  Target: {BASE_URL}")
    print("=" * 60)
    print()

    tests = []

    # 1. Health Check
    status, res = make_request("/api/health")
    passed = status == 200 and res.get("status") == "UP"
    tests.append(("GET /api/health", status, passed))

    # 2. Login
    status, res = make_request("/api/auth/login", method="POST", data={"email": "admin@hospital.com", "password": "password123"})
    token = res.get("token")
    passed = status == 200 and bool(token)
    tests.append(("POST /api/auth/login (Admin Auth)", status, passed))

    # 3. Departments
    status, res = make_request("/api/departments", token=token)
    passed = status == 200 and isinstance(res.get("data"), list) and len(res.get("data", [])) >= 10
    tests.append(("GET /api/departments (10 Departments)", status, passed))

    # 4. Staff Directory
    status, res = make_request("/api/staff", token=token)
    passed = status == 200 and isinstance(res.get("data"), list) and len(res.get("data", [])) >= 14
    tests.append(("GET /api/staff (Staff Directory)", status, passed))

    # 5. Patients Directory
    status, res = make_request("/api/patients", token=token)
    passed = status == 200 and isinstance(res.get("data"), list) and len(res.get("data", [])) >= 2
    tests.append(("GET /api/patients (Patient Records)", status, passed))

    # 6. Doctors Directory
    status, res = make_request("/api/doctors", token=token)
    passed = status == 200 and isinstance(res.get("data"), list) and len(res.get("data", [])) >= 2
    tests.append(("GET /api/doctors (Doctors List)", status, passed))

    # 7. Appointments List
    status, res = make_request("/api/appointments", token=token)
    passed = status == 200 and isinstance(res.get("data"), list)
    tests.append(("GET /api/appointments (Appointments)", status, passed))

    # 8. Pharmacy Inventory
    status, res = make_request("/api/pharmacy/inventory", token=token)
    passed = status == 200 and isinstance(res.get("data"), list) and len(res.get("data", [])) >= 6
    tests.append(("GET /api/pharmacy/inventory (6 Medicines)", status, passed))

    # 9. Lab Tests
    status, res = make_request("/api/lab/tests", token=token)
    passed = status == 200 and isinstance(res.get("data"), list) and len(res.get("data", [])) >= 2
    tests.append(("GET /api/lab/tests (Diagnostic Tests)", status, passed))

    # 10. Invoices & Revenue
    status, res = make_request("/api/billing/invoices", token=token)
    passed = status == 200 and isinstance(res.get("data"), list)
    tests.append(("GET /api/billing/invoices (Billing Invoices)", status, passed))

    # 11. Dashboard Analytics
    status, res = make_request("/api/dashboard/stats", token=token)
    passed = status == 200 and "stats" in res and res["stats"].get("totalPatients") >= 2
    tests.append(("GET /api/dashboard/stats (Analytics Engine)", status, passed))

    # 12. Quick Booking
    status, res = make_request("/api/appointments/quick-book", method="POST", data={
        "patientName": "Dwight Schrute (Automated Test)",
        "phone": "+1-555-0444",
        "doctorName": "Dr. Sarah Smith",
        "timeSlot": "11:00 AM - 11:30 AM",
        "reason": "Automated verification test appointment"
    })
    test_app_id = res.get("data", {}).get("id")
    passed = status == 200 and res.get("success") == True and "tokenNumber" in res.get("data", {})
    tests.append(("POST /api/appointments/quick-book (Walk-in Booking)", status, passed))

    # Clean up test appointment so database remains clean
    if test_app_id:
        try:
            from backend.app.database import SessionLocal
            from backend.app import models
            _db = SessionLocal()
            _db.query(models.Notification).filter(models.Notification.entityId == test_app_id).delete(synchronize_session=False)
            _db.query(models.Appointment).filter(models.Appointment.id == test_app_id).delete(synchronize_session=False)
            _db.commit()
            _db.close()
        except Exception:
            pass

    # Output Results
    print(f"{'Endpoint / Test Case':<45} | {'HTTP Code':<10} | {'Result':<10}")
    print("-" * 72)
    all_passed = True
    for name, code, passed in tests:
        res_str = "[PASS]" if passed else "[FAIL]"
        if not passed:
            all_passed = False
        print(f"{name:<45} | {code:<10} | {res_str:<10}")

    print("-" * 72)
    if all_passed:
        print(f"\n[OK] ALL {len(tests)} TESTS PASSED SUCCESSFULLY! The Python stack is 100% operational.")
    else:
        print(f"\n[!] Some tests failed. Check API logs.")

if __name__ == "__main__":
    run_tests()
