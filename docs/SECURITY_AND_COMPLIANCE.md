# Security Architecture & HIPAA Compliance Standards

## Overview
Healthcare infrastructure requires strict security measures to protect Protected Health Information (PHI). This project implements security controls inspired by HIPAA guidelines and OWASP Web Security Standards.

---

## Technical Security Controls

### 1. Data Encryption Standards
- **Data at Rest (RDS)**: Storage volume encrypted using AES-256 via AWS KMS.
- **Data at Rest (S3 Bucket)**: Medical report files encrypted with SSE-KMS customer-managed keys.
- **Data in Transit**: All network traffic between ALB and web browsers forced over TLS 1.3 / HTTPS.

### 2. Network Security & Perimeter Isolation
- **Private Subnet Isolation**: RDS database and application compute workloads run strictly inside isolated private subnets.
- **Strict Security Group Ingress Rules**: Database accepts traffic strictly on port 5432 from Application EC2 Security Group ID. No public IP or gateway exists for the database.
- **SSM Session Manager**: SSH port 22 is disabled on EC2 instances. Administrative command line access is audited through AWS Systems Manager (SSM) Session Manager.

### 3. Identity & Access Management (IAM)
- **Least Privilege Principle**: EC2 instances are assigned explicit roles allowing access only to specific S3 buckets (`hms-medical-docs-*`) and CloudWatch log groups.
- **Role-Based Access Control (RBAC)**: REST API enforces 7 explicit user roles (`ADMIN`, `DOCTOR`, `RECEPTIONIST`, `PATIENT`, `PHARMACIST`, `LAB_TECHNICIAN`, `ACCOUNTANT`).

### 4. Application Security Controls
- **JWT Authentication**: Short-lived JSON Web Tokens signed with secret keys.
- **Password Protection**: Passwords hashed using `bcrypt` with salt rounds = 10.
- **Rate Limiting**: Express middleware prevents brute force login attempts (max 10 logins/hr) and limits API DDoS attacks (100 requests/15 mins).
- **HTTP Hardening**: `helmet` middleware sets Security Headers (`X-Content-Type-Options`, `X-Frame-Options`, `Strict-Transport-Security`).

### 5. Audit Logging & Non-Repudiation
- All administrative and medical actions (e.g. creating patient record, updating lab result, user login) generate immutable `AuditLog` records containing:
  - User ID & Role
  - Action Executed
  - Target Resource
  - Client IP Address
  - Timestamp
