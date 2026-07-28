# ==============================================================================
# Storage Module - Amazon S3 for Medical & Patient Documents
# Versioned, encrypted, lifecycle managed, private access
# ==============================================================================

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# KMS Key for Medical Document Encryption
resource "aws_kms_key" "s3_kms" {
  description             = "KMS key for encrypting medical documents in S3"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-s3-kms-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# S3 Bucket for Storing Medical Reports, Lab Results, Invoices
resource "aws_s3_bucket" "medical_docs" {
  bucket        = "${var.project_name}-medical-docs-${var.environment}-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name        = "${var.project_name}-medical-docs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Enable Object Versioning for Audit Trail & Recovery
resource "aws_s3_bucket_versioning" "versioning" {
  bucket = aws_s3_bucket.medical_docs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable Server-Side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "crypto" {
  bucket = aws_s3_bucket.medical_docs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_kms.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block All Public Access to Prevent Data Leakage
resource "aws_s3_bucket_public_access_block" "public_block" {
  bucket                  = aws_s3_bucket.medical_docs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle Policy: Transition older versions to Glacier / Standard-IA to save costs
resource "aws_s3_bucket_lifecycle_configuration" "lifecycle" {
  bucket = aws_s3_bucket.medical_docs.id

  rule {
    id     = "archive-old-reports"
    status = "Enabled"

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}
