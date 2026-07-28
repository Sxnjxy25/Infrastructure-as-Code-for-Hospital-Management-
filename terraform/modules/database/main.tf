# ==============================================================================
# Database Module - Amazon RDS PostgreSQL
# Multi-AZ capable, encrypted, private subnet deployment
# ==============================================================================

# Custom RDS Parameter Group for PostgreSQL performance optimization
resource "aws_db_parameter_group" "main" {
  name   = "${var.project_name}-pg15-params-${var.environment}"
  family = "postgres15"

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  parameter {
    name  = "rds.force_ssl"
    value = "0"
  }

  tags = {
    Name        = "${var.project_name}-db-params"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# AWS Secret Manager Secret for Master Credentials
resource "aws_secretsmanager_secret" "db_credentials" {
  name                    = "${var.project_name}-db-credentials-${var.environment}"
  recovery_window_in_days = 0

  tags = {
    Name        = "${var.project_name}-db-secret"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

resource "aws_secretsmanager_secret_version" "db_credentials_val" {
  secret_id = aws_secretsmanager_secret.db_credentials.id
  secret_string = jsonencode({
    username = var.db_username
    password = var.db_password
    engine   = "postgres"
    host     = aws_db_instance.postgres.address
    port     = aws_db_instance.postgres.port
    dbname   = var.db_name
  })
}

# RDS PostgreSQL Instance
resource "aws_db_instance" "postgres" {
  identifier             = "${var.project_name}-db-${var.environment}"
  engine                 = "postgres"
  engine_version         = "15.7"
  instance_class         = var.instance_class
  allocated_storage      = var.allocated_storage
  max_allocated_storage  = 100
  storage_type           = "gp3"
  storage_encrypted      = true
  db_name                = var.db_name
  username               = var.db_username
  password               = var.db_password
  db_subnet_group_name   = var.db_subnet_group_name
  vpc_security_group_ids = [var.db_security_group_id]
  parameter_group_name   = aws_db_parameter_group.main.name
  publicly_accessible    = false
  multi_az               = var.multi_az
  skip_final_snapshot    = true
  deletion_protection    = false

  backup_retention_period   = 7
  backup_window             = "03:00-04:00"
  maintenance_window        = "Mon:04:30-Mon:05:30"
  auto_minor_version_upgrade = true

  tags = {
    Name        = "${var.project_name}-postgres-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}
