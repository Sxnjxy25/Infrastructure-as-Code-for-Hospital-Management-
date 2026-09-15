# Disaster Recovery & Backup Strategy

## Disaster Recovery Objectives
- **Recovery Point Objective (RPO)**: <= 1 Hour (Maximum acceptable data loss window).
- **Recovery Time Objective (RTO)**: <= 2 Hours (Maximum acceptable service restoration window).

---

## Backup Architecture

### 1. Database Automated Snapshots (RDS)
- **Daily Automated Snapshots**: Executed at 03:00 AM UTC with 7-day retention period.
- **Point-In-Time Restore (PITR)**: Transaction logs (WAL) continuously streamed to S3, enabling restoration to any second within the retention window.

### 2. AWS Backup Centralized Policy (`terraform/modules/backup`)
- Automated backup rule scheduled daily via AWS Backup Vault.
- Enforces cross-region snapshot copy capability for regional disaster scenarios.

### 3. S3 Bucket Object Versioning
- S3 medical documents bucket has **Versioning Enabled**. Deleted or overwritten documents can be instantly recovered by restoring previous object versions.

---

## Recovery Procedure

### Scenario 1: RDS Primary Database Corruption
1. Restore database from latest point-in-time snapshot:
   ```bash
   aws rds restore-db-instance-to-point-in-time \
     --source-db-instance-identifier hms-hospital-db-dev \
     --target-db-instance-identifier hms-hospital-db-dev-restored \
     --restore-time 2026-07-28T10:00:00.000Z
   ```
2. Update Terraform variable or AWS Secrets Manager DB Host address to point to the restored DB endpoint.
3. Restart backend container instances via Auto Scaling instance refresh.

### Scenario 2: Region Outage / Complete Environment Reconstruction
1. Target alternate AWS Region (e.g. `us-west-2`) in `terraform/environments/dev/variables.tf`.
2. Re-run `terraform apply` to provision duplicate network, compute, database, and load balancer infrastructure in under 15 minutes.
