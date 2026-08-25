# Terraform Database Module

Provisions an Amazon RDS PostgreSQL database instance inside isolated private subnets.

## Features
- **Engine**: PostgreSQL 15.x
- **Free Tier Configuration**: Default `db.t3.micro` with 20GB GP3 storage.
- **Security**: Private subnet access only, storage encryption enabled, password stored dynamically in AWS Secrets Manager.
- **Automated Backups**: 7-day retention period with configured maintenance windows.
