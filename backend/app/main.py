import os
import time
from datetime import datetime
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.seed import seed_database
from app.routers import (
    auth, departments, staff, patients, doctors, appointments,
    pharmacy, lab, billing, notifications, dashboard
)

start_time = time.time()

# Ensure database tables are created at startup
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Hospital Management System REST API",
    description="Enterprise Hospital Management System REST API in Python FastAPI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS configuration
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    settings.FRONTEND_URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if settings.NODE_ENV != "production" else origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(auth.router)
app.include_router(departments.router)
app.include_router(staff.router)
app.include_router(patients.router)
app.include_router(doctors.router)
app.include_router(appointments.router)
app.include_router(pharmacy.router)
app.include_router(lab.router)
app.include_router(billing.router)
app.include_router(notifications.router)
app.include_router(dashboard.router)

@app.get("/api/health")
def health_check():
    return {
        "status": "UP",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "Hospital Management System REST API (Python FastAPI)",
        "uptime": time.time() - start_time
    }

@app.get("/api/seed")
def trigger_seed():
    try:
        seed_database()
        return {
            "success": True,
            "message": "Database seeded successfully! You can log in with admin@hospital.com / password123"
        }
    except Exception as e:
        return JSONResponse(
            status_code=500,
            content={"success": False, "message": str(e)}
        )

# Frontend SPA Static Files & Fallback Routing
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "frontend", "dist"))
assets_dir = os.path.join(frontend_dist, "assets")

if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="static_assets")

@app.get("/{full_path:path}")
def serve_spa_frontend(full_path: str):
    # Do not intercept API or docs routes
    if (
        full_path.startswith("api/")
        or full_path == "api"
        or full_path.startswith("docs")
        or full_path.startswith("redoc")
        or full_path == "openapi.json"
    ):
        raise HTTPException(status_code=404, detail="API endpoint not found")

    if os.path.exists(frontend_dist):
        file_path = os.path.join(frontend_dist, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        index_file = os.path.join(frontend_dist, "index.html")
        if os.path.exists(index_file):
            return FileResponse(index_file)

    return JSONResponse(
        status_code=200,
        content={
            "status": "UP",
            "message": "Hospital Management System Python API is running. Build frontend with 'npm run build' or access http://localhost:3000.",
            "docs": "/docs"
        }
    )
