variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "asg_name" {
  description = "Name of Auto Scaling Group to monitor"
  type        = string
  default     = ""
}

variable "alb_arn_suffix" {
  description = "ALB ARN Suffix for CloudWatch metrics"
  type        = string
  default     = ""
}
