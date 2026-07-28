output "alb_public_dns" {
  description = "Public URL/DNS of Application Load Balancer"
  value       = module.alb.alb_dns_name
}

output "rds_endpoint" {
  description = "Private Endpoint of PostgreSQL RDS Database"
  value       = module.database.db_endpoint
}

output "s3_medical_docs_bucket" {
  description = "S3 Bucket for Patient Medical Files"
  value       = module.storage.bucket_id
}

output "cloudwatch_dashboard" {
  description = "CloudWatch System Dashboard Name"
  value       = module.monitoring.dashboard_name
}
