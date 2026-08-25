# Terraform Security Module

This module defines least-privilege security groups and IAM instance profiles.

## Security Architecture
- **Layered Security Groups**:
  - `ALB SG`: Accepts 80/443 from internet (`0.0.0.0/0`).
  - `App SG`: Restricts inbound port 5000/80 access **only** from `ALB SG`.
  - `DB SG`: Restricts PostgreSQL port 5432 **only** from `App SG`. Direct internet/outside VPC access is blocked.
- **IAM Instance Profile**: Includes AmazonSSMManagedInstanceCore (secure SSH replacement via AWS Systems Manager) and custom policy for S3 document storage access and CloudWatch log ingestion.
