output "db_endpoint" {
  description = "Database Connection Endpoint"
  value       = aws_db_instance.postgres.endpoint
}

output "db_address" {
  description = "Database Host Address"
  value       = aws_db_instance.postgres.address
}

output "db_port" {
  description = "Database Listener Port"
  value       = aws_db_instance.postgres.port
}

output "db_name" {
  description = "Database Name"
  value       = aws_db_instance.postgres.db_name
}

output "secret_arn" {
  description = "ARN of Secrets Manager Secret holding DB credentials"
  value       = aws_secretsmanager_secret.db_credentials.arn
}
