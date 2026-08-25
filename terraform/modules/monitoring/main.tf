# ==============================================================================
# Monitoring Module - CloudWatch Log Groups, Alarms & Dashboards
# ==============================================================================

# CloudWatch Log Group for Application Container Logs
resource "aws_cloudwatch_log_group" "app_logs" {
  name              = "/aws/hms/${var.project_name}-app-${var.environment}"
  retention_in_days = 30

  tags = {
    Name        = "${var.project_name}-app-logs"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# SNS Topic for System Alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-system-alerts-${var.environment}"

  tags = {
    Name        = "${var.project_name}-alerts-sns"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# High CPU Alarm for Auto Scaling Group
resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${var.project_name}-high-cpu-alarm-${var.environment}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 120
  statistic           = "Average"
  threshold           = 80
  alarm_description   = "Triggered when average ASG CPU exceeds 80% for 4 minutes"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    AutoScalingGroupName = var.asg_name
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard-${var.environment}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", var.asg_name]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Application ASG Average CPU Utilization (%)"
        }
      },
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        properties = {
          metrics = [
            ["AWS/RDS", "CPUUtilization", "DBInstanceIdentifier", "${var.project_name}-db-${var.environment}"],
            [".", "FreeableMemory", ".", "."]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "RDS Database Metrics"
        }
      }
    ]
  })
}
