output "backup_vault_name" {
  description = "Name of AWS Backup Vault"
  value       = aws_backup_vault.main.name
}

output "backup_plan_id" {
  description = "ID of AWS Backup Plan"
  value       = aws_backup_plan.daily.id
}
