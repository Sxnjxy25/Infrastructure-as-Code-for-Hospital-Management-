# Dockerfile for Python FastAPI HMS Backend API
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update -y && apt-get install -y gcc && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

ENV NODE_ENV=production
ENV PORT=5000

EXPOSE 5000

CMD ["python", "run.py"]
