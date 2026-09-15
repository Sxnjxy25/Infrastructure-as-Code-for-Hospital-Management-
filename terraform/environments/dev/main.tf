# ==============================================================================
# Development Environment Infrastructure Composition
# Integrates Networking, Security, Storage, Database, ALB, Compute & Monitoring
# ==============================================================================

# 1. Networking Module
module "networking" {
  source = "../../modules/networking"

  project_name              = var.project_name
  environment               = var.environment
  vpc_cidr                  = var.vpc_cidr
  availability_zones        = ["us-east-1a", "us-east-1b"]
  public_subnet_cidrs       = ["10.0.1.0/24", "10.0.2.0/24"]
  private_app_subnet_cidrs   = ["10.0.11.0/24", "10.0.12.0/24"]
  private_db_subnet_cidrs    = ["10.0.21.0/24", "10.0.22.0/24"]
  enable_single_nat_gateway = true
}

# 2. Security Module
module "security" {
  source = "../../modules/security"

  project_name = var.project_name
  environment  = var.environment
  vpc_id       = module.networking.vpc_id
  app_port     = 5000
  db_port      = 5432
}

# 3. Storage Module
module "storage" {
  source = "../../modules/storage"

  project_name = var.project_name
  environment  = var.environment
}

# 4. Database Module
module "database" {
  source = "../../modules/database"

  project_name         = var.project_name
  environment          = var.environment
  db_subnet_group_name = module.networking.db_subnet_group_name
  db_security_group_id = module.security.db_security_group_id
  db_name              = "hospital_db"
  db_username          = "hms_admin"
  db_password          = var.db_password
  allocated_storage    = 20
  instance_class       = "db.t3.micro"
  multi_az             = false
}

# 5. ALB Module
module "alb" {
  source = "../../modules/alb"

  project_name          = var.project_name
  environment           = var.environment
  vpc_id                = module.networking.vpc_id
  public_subnet_ids     = module.networking.public_subnet_ids
  alb_security_group_id = module.security.alb_security_group_id
  app_port              = 5000
  health_check_path     = "/api/health"
}

# 6. Compute Module (EC2 + ASG)
module "compute" {
  source = "../../modules/compute"

  project_name           = var.project_name
  environment            = var.environment
  private_app_subnet_ids = module.networking.private_app_subnet_ids
  app_security_group_id  = module.security.app_security_group_id
  instance_profile_name  = module.security.ec2_instance_profile_name
  target_group_arn       = module.alb.target_group_arn
  instance_type          = "t3.micro"
  min_size               = 1
  max_size               = 3
  desired_capacity       = 2

  db_address     = module.database.db_address
  db_name        = module.database.db_name
  db_username    = "hms_admin"
  db_password    = var.db_password
  s3_bucket_name = module.storage.bucket_id
}

# 7. Monitoring Module
module "monitoring" {
  source = "../../modules/monitoring"

  project_name = var.project_name
  environment  = var.environment
  asg_name     = module.compute.asg_name
}

# 8. Backup Module
module "backup" {
  source = "../../modules/backup"

  project_name = var.project_name
  environment  = var.environment
}
