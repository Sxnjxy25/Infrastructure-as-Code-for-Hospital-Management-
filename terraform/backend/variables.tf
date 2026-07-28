variable "project_name" {
  description = "Project name tag and identifier prefix"
  type        = string
  default     = "hms-hospital"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}
