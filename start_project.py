#!/usr/bin/env python3
"""
Hospital Management System - Universal Python Startup Script
Runs backend, seeds database, and provides unified single localhost interface.
"""

import os
import sys
import subprocess
import time
import webbrowser
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"
FRONTEND_DIR = ROOT_DIR / "frontend"

def print_banner():
    print("=" * 60)
    print("   HOSPITAL MANAGEMENT SYSTEM - PYTHON FULL STACK")
    print("=" * 60)
    print()

def step(msg):
    print(f"[*] {msg}")

def success(msg):
    print(f"[OK] {msg}")

def main():
    print_banner()

    # 1. Install Backend Dependencies
    step("Installing / Verifying Python Backend Dependencies...")
    req_file = BACKEND_DIR / "requirements.txt"
    subprocess.run([sys.executable, "-m", "pip", "install", "-r", str(req_file)], cwd=str(BACKEND_DIR), check=True)
    success("Python dependencies verified.")
    print()

    # 2. Database Initialization & Seeding
    step("Initializing & Seeding SQLite Database with Default Hospital Portals...")
    subprocess.run([sys.executable, "-m", "app.seed"], cwd=str(BACKEND_DIR), check=True)
    success("Database seeded with departments, users, doctors, staff, medicines, and records.")
    print()

    # 3. Optional Frontend Dev Server (if node/npm is available)
    try:
        step("Checking Frontend Dependencies & Building UI Bundle...")
        subprocess.run(["npm", "run", "build"], cwd=str(FRONTEND_DIR), shell=True, check=True)
        success("Frontend UI build completed. FastAPI backend will serve full UI directly!")
    except Exception:
        print("[!] Note: Node/npm not available or build skipped. Python FastAPI will serve API & prebuilt assets.")
    print()

    # 4. Display Access Details
    print("=" * 60)
    print("  HOSPITAL MANAGEMENT SYSTEM RUNNING!")
    print("=" * 60)
    print("  🌐 Unified Web UI & API   : http://localhost:5000")
    print("  📖 Interactive Swagger Docs : http://localhost:5000/docs")
    print("  ⚙️  Backend Health Check    : http://localhost:5000/api/health")
    print("  💻 Vite Dev Hot-Reload (Dev): http://localhost:3000")
    print("=" * 60)
    print()
    print("  Demo Logins (Password: password123):")
    print("   - Admin        : admin@hospital.com")
    print("   - Doctor       : dr.smith@hospital.com")
    print("   - Receptionist : reception@hospital.com")
    print("   - Pharmacist   : pharmacy@hospital.com")
    print("   - Lab Tech     : lab@hospital.com")
    print("   - Billing      : billing@hospital.com")
    print("   - Patient      : john.doe@patient.com")
    print("=" * 60)
    print()

    # 5. Launch FastAPI Backend
    step("Starting Python FastAPI Uvicorn Server on Port 5000...")
    sys.path.insert(0, str(BACKEND_DIR))
    subprocess.run([sys.executable, "run.py"], cwd=str(BACKEND_DIR))

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n[!] Server stopped by user.")
