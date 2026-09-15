import os
import uvicorn
from dotenv import load_dotenv

load_dotenv()

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    print("====================================================")
    print(" Hospital Management System API Server Running (Python FastAPI)")
    print(f" Port: {port} | Environment: {os.getenv('NODE_ENV', 'development')}")
    print(f" Health Check: http://localhost:{port}/api/health")
    print(f" Interactive Swagger Docs: http://localhost:{port}/docs")
    print("====================================================")
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=False)
