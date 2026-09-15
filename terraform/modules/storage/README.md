# Terraform Storage Module

Provisions secure, encrypted Amazon S3 storage for hospital medical records, lab PDFs, and billing receipts.

## Features
- **HIPAA-aligned Security**: AWS KMS SSE encryption and strict public access block.
- **Versioning**: Enabled for auditability and compliance.
- **Lifecycle Optimization**: Automated transitions from Standard -> Standard-IA -> Glacier to minimize storage charges.
