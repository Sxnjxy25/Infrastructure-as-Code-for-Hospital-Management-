variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "private_app_subnet_ids" {
  description = "IDs of private application subnets"
  type        = list(string)
}

variable "app_security_group_id" {
  description = "ID of Application EC2 Security Group"
  type        = string
}

variable "instance_profile_name" {
  description = "IAM Instance Profile Name for EC2"
  type        = string
}

variable "target_group_arn" {
  description = "ARN of ALB Target Group"
  type        = string
}

variable "instance_type" {
  description = "EC2 Instance Type (Free tier: t2.micro or t3.micro)"
  type        = string
  default     = "t3.micro"
}

variable "min_size" {
  description = "Minimum size of Auto Scaling Group"
  type        = number
  default     = 1
}

variable "max_size" {
  description = "Maximum size of Auto Scaling Group"
  type        = number
  default     = 3
}

variable "desired_capacity" {
  description = "Desired capacity of Auto Scaling Group"
  type        = number
  default     = 2
}

variable "db_address" {
  description = "PostgreSQL RDS Host Address"
  type        = string
  default     = ""
}

variable "db_name" {
  description = "PostgreSQL Database Name"
  type        = string
  default     = "hospital_db"
}

variable "db_username" {
  description = "PostgreSQL DB Username"
  type        = string
  default     = "hms_admin"
}

variable "db_password" {
  description = "PostgreSQL DB Password"
  type        = string
  sensitive   = true
  default     = ""
}

variable "s3_bucket_name" {
  description = "Medical Documents S3 Bucket Name"
  type        = string
  default     = ""
}
