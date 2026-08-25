variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID where Security Groups will be created"
  type        = string
}

variable "app_port" {
  description = "Application listening port"
  type        = number
  default     = 5000
}

variable "db_port" {
  description = "Database port (PostgreSQL=5432)"
  type        = number
  default     = 5432
}
