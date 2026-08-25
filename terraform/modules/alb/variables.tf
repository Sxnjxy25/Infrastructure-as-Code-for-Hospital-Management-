variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "public_subnet_ids" {
  description = "IDs of public subnets for ALB"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "ID of ALB Security Group"
  type        = string
}

variable "app_port" {
  description = "Application port"
  type        = number
  default     = 5000
}

variable "health_check_path" {
  description = "Health check path for target group"
  type        = string
  default     = "/api/health"
}
