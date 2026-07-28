variable "project_name" {
  description = "Name identifier prefix"
  type        = string
  default     = "hms-hospital"
}

variable "environment" {
  description = "Environment identifier"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "Target AWS Region"
  type        = string
  default     = "us-east-1"
}

variable "vpc_cidr" {
  description = "VPC CIDR Range"
  type        = string
  default     = "10.0.0.0/16"
}

variable "db_password" {
  description = "Master password for PostgreSQL RDS"
  type        = string
  sensitive   = true
  default     = "HMS_SuperSecretDBPass2026!"
}
