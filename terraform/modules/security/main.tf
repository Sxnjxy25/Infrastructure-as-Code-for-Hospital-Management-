# ==============================================================================
# Security Module - IAM Roles, Security Groups & Least Privilege Rules
# ==============================================================================

# ALB Security Group (Internet facing)
resource "aws_security_group" "alb" {
  name        = "${var.project_name}-alb-sg-${var.environment}"
  description = "Security group for external ALB allowing HTTP/HTTPS traffic"
  vpc_id      = var.vpc_id

  ingress {
    description = "HTTP from anywhere"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-alb-sg-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# Application Compute Security Group (EC2 / ASG)
resource "aws_security_group" "app" {
  name        = "${var.project_name}-app-sg-${var.environment}"
  description = "Security group for Application EC2 instances in private subnets"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow traffic from ALB on App Port"
    from_port       = var.app_port
    to_port         = var.app_port
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Allow HTTP traffic from ALB"
    from_port       = 80
    to_port         = 80
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  egress {
    description = "Allow all outbound traffic to download updates and connect to AWS Services"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-app-sg-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# RDS Database Security Group
resource "aws_security_group" "db" {
  name        = "${var.project_name}-db-sg-${var.environment}"
  description = "Security group for PostgreSQL RDS Database in private DB subnets"
  vpc_id      = var.vpc_id

  ingress {
    description     = "Allow PostgreSQL access strictly from App SG"
    from_port       = var.db_port
    to_port         = var.db_port
    protocol        = "tcp"
    security_groups = [aws_security_group.app.id]
  }

  egress {
    description = "Allow DB outbound traffic within VPC"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "${var.project_name}-db-sg-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Role for EC2 Application Instances
resource "aws_iam_role" "ec2_app_role" {
  name = "${var.project_name}-ec2-app-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-ec2-app-role-${var.environment}"
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# IAM Policy for S3, CloudWatch Logs, and Secrets Manager Read Access
resource "aws_iam_policy" "ec2_app_policy" {
  name        = "${var.project_name}-ec2-app-policy-${var.environment}"
  description = "Least-privilege policy for EC2 HMS application instances"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.project_name}-medical-docs-*",
          "arn:aws:s3:::${var.project_name}-medical-docs-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "ssm:GetParameters",
          "ssm:GetParameter"
        ]
        Resource = "*"
      }
    ]
  })
}

# Attach IAM Policy to Role
resource "aws_iam_role_policy_attachment" "ec2_policy_attach" {
  role       = aws_iam_role.ec2_app_role.name
  policy_arn = aws_iam_policy.ec2_app_policy.arn
}

# Attach AWS SSM Managed Policy for Systems Manager Session Manager (SSH replacement)
resource "aws_iam_role_policy_attachment" "ssm_policy_attach" {
  role       = aws_iam_role.ec2_app_role.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

# IAM Instance Profile for EC2 Launch Template
resource "aws_iam_instance_profile" "ec2_profile" {
  name = "${var.project_name}-ec2-instance-profile-${var.environment}"
  role = aws_iam_role.ec2_app_role.name
}
