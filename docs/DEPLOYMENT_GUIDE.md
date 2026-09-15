# Step-by-Step Deployment & Operations Guide

This guide details step-by-step instructions for running the Hospital Management System locally via Docker Compose and provisioning the full AWS cloud infrastructure via Terraform.

---

## Prerequisites
- **AWS CLI** configured (`aws configure` with valid access keys).
- **Terraform CLI** v1.5.0+ installed.
- **Docker Engine** and **Docker Compose** installed.
- **Node.js** v18+ & npm installed.

---

## Option A: Local Full-Stack Development (Docker Compose)

### 1. Clone & Setup Environment
```bash
git clone https://github.com/your-username/hospital-management-iac.git
cd hospital-management-iac
```

### 2. Launch Local Environment
```bash
cd docker
docker compose up -d --build
```

### 3. Run Database Migrations & Seed Sample Data
```bash
cd ../backend
npx prisma migrate dev --name init
npm run seed
```

### 4. Access Local Services
- **React Web Portal**: [http://localhost:3000](http://localhost:3000) (Nginx container on port 80)
- **Node.js REST API**: [http://localhost:5000/api/health](http://localhost:5000/api/health)
- **Prometheus Monitoring**: [http://localhost:9090](http://localhost:9090)
- **Grafana Dashboard**: [http://localhost:3001](http://localhost:3001) (Credentials: `admin` / `admin`)

---

## Option B: Automated AWS Infrastructure Provisioning (Terraform)

### Step 1: Initialize Terraform Remote State (One-time Bootstrap)
```bash
cd terraform/backend
terraform init
terraform apply -auto-approve
```
*Outputs: S3 state bucket name and DynamoDB lock table name.*

### Step 2: Deploy Development Environment Infrastructure
```bash
cd ../environments/dev

# Copy example variables
cp terraform.tfvars.example terraform.tfvars

# Validate syntax
terraform fmt -check
terraform validate

# Review execution plan
terraform plan

# Provision AWS Cloud Resources
terraform apply -auto-approve
```

### Step 3: Verify Infrastructure Deployment
Check Terraform outputs for your Application Load Balancer DNS URL:
```bash
Apply complete! Resources: 28 added, 0 changed, 0 destroyed.

Outputs:
alb_public_dns = "hms-hospital-alb-dev-123456789.us-east-1.elb.amazonaws.com"
cloudwatch_dashboard = "hms-hospital-dashboard-dev"
rds_endpoint = "hms-hospital-db-dev.c123456.us-east-1.rds.amazonaws.com:5432"
s3_medical_docs_bucket = "hms-hospital-medical-docs-dev-a1b2c3d4"
```

### Step 4: Access Hospital Web Portal
Open your browser and navigate to the ALB DNS URL output by Terraform:
`http://hms-hospital-alb-dev-123456789.us-east-1.elb.amazonaws.com`

---

## Resource Teardown (Prevent AWS Charges)
When finished testing or presenting your project defense, destroy all AWS resources:
```bash
cd terraform/environments/dev
terraform destroy -auto-approve
```
