output "log_group_name" {
  description = "Name of CloudWatch Log Group"
  value       = aws_cloudwatch_log_group.app_logs.name
}

output "sns_topic_arn" {
  description = "ARN of SNS Alert Topic"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_name" {
  description = "Name of CloudWatch Dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}
