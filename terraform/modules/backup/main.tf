# ==============================================================================
# Backup Module - AWS Backup Vault & Plan for Centralized Disaster Recovery
# ==============================================================================

# AWS Backup Vault
resource "aws_backup_vault" "main" {
  name        = "${var.project_name}-backup-vault-${var.environment}"
  kms_key_arn = "arn:aws:kms:us-east-1:123456789012:key/default" # Will use default AWS managed key if unspecified

  tags = {
    Name        = "${var.project_name}-backup-vault"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# AWS Backup Plan - Daily Snapshots with 30 Day Retention
resource "aws_backup_plan" "daily" {
  name = "${var.project_name}-daily-backup-plan-${var.environment}"

  rule {
    rule_name         = "daily-snapshot-rule"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 2 * * ? *)" # 02:00 AM UTC daily

    lifecycle {
      delete_after = 30
    }
  }

  tags = {
    Name        = "${var.project_name}-backup-plan"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
