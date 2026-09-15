# Root Dockerfile for Python FastAPI HMS Full-Stack Deployment
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update -y && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

# Copy backend requirements & install
COPY backend/requirements.txt ./backend/
RUN pip install --no-cache-dir -r ./backend/requirements.txt

# Copy entire repository
COPY . .

# Initialize database seed
RUN python -m backend.app.seed || python backend/app/seed.py || true

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["python", "backend/run.py"]
