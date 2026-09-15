variable "project_name" {
  description = "Project name prefix"
  type        = string
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
}

variable "db_subnet_group_name" {
  description = "Database subnet group name"
  type        = string
}

variable "db_security_group_id" {
  description = "ID of database security group"
  type        = string
}

variable "db_name" {
  description = "Database name"
  type        = string
  default     = "hospital_db"
}

variable "db_username" {
  description = "Database master username"
  type        = string
  default     = "hms_admin"
}

variable "db_password" {
  description = "Database master password"
  type        = string
  sensitive   = true
}

variable "allocated_storage" {
  description = "Allocated storage in GB (Free tier: 20GB)"
  type        = number
  default     = 20
}

variable "instance_class" {
  description = "RDS DB instance class (Free tier: db.t3.micro)"
  type        = string
  default     = "db.t3.micro"
}

variable "multi_az" {
  description = "Enable Multi-AZ deployment"
  type        = bool
  default     = false
}
