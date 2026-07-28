# Terraform Remote State Setup

This module provisions the bootstrap infrastructure required for storing Terraform state remotely and safely with concurrent execution locking.

## Resources Provisioned
- **Amazon S3 Bucket**: Versioned, KMS-encrypted bucket for `.tfstate` files.
- **AWS KMS Key**: Customer managed key with automatic rotation for state encryption.
- **Amazon DynamoDB Table**: Pay-per-request table storing `LockID` attributes to prevent state corruption during concurrent `terraform apply` executions.

## Usage
```bash
cd terraform/backend
terraform init
terraform apply
```
After creation, reference the S3 bucket name and DynamoDB table in the environment `backend.tf` or `providers.tf` block.
