# ==============================================================================
# Terraform Remote State Storage Infrastructure
# Creates S3 Bucket for State Storage & DynamoDB for State Locking
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# KMS Key for Terraform State Encryption
resource "aws_kms_key" "terraform_state_kms" {
  description             = "KMS Key for encrypting Terraform Remote State S3 bucket"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-state-kms"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# S3 Bucket for Storing Terraform State
resource "aws_s3_bucket" "terraform_state" {
  bucket        = "${var.project_name}-tf-state-${var.environment}"
  force_destroy = false

  lifecycle {
    prevent_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-tf-state"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Enable Versioning for Rollback & State History
resource "aws_s3_bucket_versioning" "terraform_state_versioning" {
  bucket = aws_s3_bucket.terraform_state.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Enable Server-Side Encryption using KMS Key
resource "aws_s3_bucket_server_side_encryption_configuration" "terraform_state_crypto" {
  bucket = aws_s3_bucket.terraform_state.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.terraform_state_kms.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

# Block Public Access to Terraform State
resource "aws_s3_bucket_public_access_block" "terraform_state_public_block" {
  bucket                  = aws_s3_bucket.terraform_state.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# DynamoDB Table for Terraform State Locking
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "${var.project_name}-tf-locks-${var.environment}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"

  attribute {
    name = "LockID"
    type = "S"
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = {
    Name        = "${var.project_name}-tf-locks"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

output "s3_bucket_name" {
  description = "S3 Bucket Name for Terraform Remote State"
  value       = aws_s3_bucket.terraform_state.id
}

output "dynamodb_table_name" {
  description = "DynamoDB Table Name for State Locking"
  value       = aws_dynamodb_table.terraform_locks.id
}

output "kms_key_arn" {
  description = "KMS Key ARN used for State Encryption"
  value       = aws_kms_key.terraform_state_kms.arn
}
