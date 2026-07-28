# Enterprise Infrastructure as Code (IaC) Hospital Management System (HMS)

[![Terraform](https://img.shields.io/badge/Terraform-1.5.0+-purple.svg)](https://www.terraform.io/)
[![AWS](https://img.shields.io/badge/AWS-Cloud-orange.svg)](https://aws.amazon.com/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green.svg)](https://nodejs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.10-darkblue.svg)](https://www.prisma.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-blue.svg)](https://www.docker.com/)

A complete, production-grade **Hospital Management System** designed and built using **Terraform Infrastructure as Code (IaC)** on **AWS**, containerized with **Docker**, and powered by a full-stack **React + Node.js/Express + PostgreSQL** architecture.

This project follows enterprise cloud security best practices, HIPAA-inspired compliance standards, and AWS Free Tier optimization for college capstone presentations and technical viva defenses.

---

## Key System Features

### Cloud Infrastructure (AWS + Terraform)
- **Multi-AZ VPC Architecture**: Isolated Public, Private Application, and Private Database subnets across multiple Availability Zones.
- **State Storage & Locking**: Remote S3 state backend with DynamoDB locking mechanism.
- **Compute & Auto Scaling**: EC2 Auto Scaling Group (ASG) with target-tracking CPU scaling policies behind an Application Load Balancer (ALB).
- **Secure Database**: Amazon RDS PostgreSQL in private subnets with automated snapshots, storage encryption, and parameter group tuning.
- **Encrypted Document Storage**: Amazon S3 bucket for patient medical records with SSE-KMS encryption, versioning, and lifecycle transition rules.
- **Monitoring & Logging**: CloudWatch dashboards, metric alarms, SNS notifications, and Prometheus/Grafana stack.

### Hospital Application (Full-Stack REST & React)
- **7 Role-Based Dashboards**: Customized views for `ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`, `PHARMACIST`, `LAB_TECHNICIAN`, and `ACCOUNTANT`.
- **Core Modules**:
  - **Patient Management**: Registration, Medical Record Numbers (MRN), history, vitals.
  - **Doctor Scheduling**: Specialist profiles, consultation fees, room allocations.
  - **Appointment Queue**: Token generation, date/slot booking, status tracking.
  - **Pharmacy Inventory**: Medicine stock levels, unit pricing, expiry warnings.
  - **Diagnostic Laboratory**: Test ordering, sample tracking, report summaries.
  - **Billing & Invoicing**: Line-item invoices, discounts, payment status tracking.

---

## Directory Structure

```
Infrastructure as Code for Hospital Management/
├── terraform/                # Modular Infrastructure as Code
│   ├── backend/              # S3 & DynamoDB Remote State Bootstrap
│   ├── modules/              # Reusable Terraform Modules
│   │   ├── networking/       # VPC, Subnets, IGW, NAT Gateway, Route Tables
│   │   ├── security/         # IAM Roles, Security Groups (ALB -> App -> DB)
│   │   ├── database/         # RDS PostgreSQL Instance & Secrets
│   │   ├── storage/          # Encrypted S3 Bucket & Versioning
│   │   ├── alb/              # Application Load Balancer & Target Groups
│   │   ├── compute/          # EC2 Launch Template & Auto Scaling Group
│   │   ├── monitoring/       # CloudWatch Alarms & Dashboards
│   │   └── backup/           # AWS Backup Vault & Plan
│   └── environments/dev/     # Development Environment Composition
├── backend/                  # Node.js + Express REST API
│   ├── prisma/               # Database Schema & Seed Data Script
│   └── src/                  # Controllers, Routes, Middleware, Auth & RBAC
├── frontend/                 # React.js + Vite Web Interface
│   └── src/                  # Custom CSS Design System, Pages, Role Dashboards
├── docker/                   # Docker Compose & Prometheus/Grafana Configs
├── .github/workflows/        # CI/CD GitHub Actions Pipeline
└── docs/                     # Comprehensive Architecture & Viva Documentation
```

---

## Quick Start (Local Docker Compose)

```bash
# 1. Clone repository
git clone https://github.com/your-username/hospital-management-iac.git
cd hospital-management-iac

# 2. Launch container stack
cd docker
docker compose up -d --build

# 3. Seed sample data
cd ../backend
npx prisma migrate dev --name init
npm run seed
```

Access Web Portal: `http://localhost:3000` (Demo Login: `admin@hospital.com` / `password123`).

---

## Cloud Deployment (Terraform AWS)

```bash
# 1. Provision Terraform Remote State Backend
cd terraform/backend
terraform init && terraform apply -auto-approve

# 2. Deploy AWS Infrastructure Environment
cd ../environments/dev
cp terraform.tfvars.example terraform.tfvars
terraform init
terraform apply -auto-approve
```

---

## Comprehensive Project Documentation
- [System Architecture Guide](file:///c:/Users/Student/Infrastructure%20as%20Code%20for%20Hospital%20Management/docs/ARCHITECTURE.md)
- [Step-by-Step Deployment Guide](file:///c:/Users/Student/Infrastructure%20as%20Code%20for%20Hospital%20Management/docs/DEPLOYMENT_GUIDE.md)
- [Security & HIPAA Compliance](file:///c:/Users/Student/Infrastructure%20as%20Code%20for%20Hospital%20Management/docs/SECURITY_AND_COMPLIANCE.md)
- [Disaster Recovery & Backup Plan](file:///c:/Users/Student/Infrastructure%20as%20Code%20for%20Hospital%20Management/docs/DISASTER_RECOVERY.md)
- [College Viva Defense FAQ](file:///c:/Users/Student/Infrastructure%20as%20Code%20for%20Hospital%20Management/docs/VIVA_AND_INTERVIEW_FAQ.md)

---

## License
MIT License - Open Source for Academic & Demonstration Purposes.
