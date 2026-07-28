# ==============================================================================
# Compute Module - EC2 Launch Template & Auto Scaling Group
# Automated Docker Runtime Bootstrap & Application Deployment
# ==============================================================================

# Fetch Latest Amazon Linux 2023 AMI
data "aws_ami" "amazon_linux_2023" {
  most_recent = true
  owners      = ["amazon"]

  filter {
    name   = "name"
    values = ["al2023-ami-2023.*-x86_64"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# EC2 Launch Template
resource "aws_launch_template" "app" {
  name_prefix   = "${var.project_name}-template-${var.environment}-"
  image_id      = data.aws_ami.amazon_linux_2023.id
  instance_type = var.instance_type

  iam_instance_profile {
    name = var.instance_profile_name
  }

  network_interfaces {
    associate_public_ip_address = false
    security_groups             = [var.app_security_group_id]
  }

  # User Data Script to install Docker, Docker Compose, Git and start application
  user_data = base64encode(<<-EOF
              #!/bin/bash
              set -e
              exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

              echo "--- Initializing HMS Application Node ---"
              dnf update -y
              dnf install -y docker git amazon-cloudwatch-agent

              # Enable & Start Docker
              systemctl enable --now docker
              usermod -aG docker ec2-user

              # Install Docker Compose Plugin
              mkdir -p /usr/local/lib/docker/cli-plugins
              curl -SL https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-x86_64 -o /usr/local/lib/docker/cli-plugins/docker-compose
              chmod +x /usr/local/lib/docker/cli-plugins/docker-compose

              # Create app directory
              mkdir -p /opt/hms-app
              cat << 'DOCKERCOMPOSE' > /opt/hms-app/docker-compose.yml
              version: '3.8'
              services:
                backend:
                  image: node:18-alpine
                  container_name: hms_backend
                  restart: always
                  ports:
                    - "5000:5000"
                  environment:
                    - PORT=5000
                    - NODE_ENV=production
                    - DATABASE_URL=postgresql://${var.db_username}:${var.db_password}@${var.db_address}:5432/${var.db_name}?schema=public
                    - JWT_SECRET=hms_super_secret_jwt_key_2026_capstone
                    - S3_BUCKET_NAME=${var.s3_bucket_name}
                  command: sh -c "echo 'Backend Started Successfully'"
              DOCKERCOMPOSE

              cd /opt/hms-app
              docker compose up -d

              echo "--- Setup Completed Successfully ---"
              EOF
  )

  monitoring {
    enabled = true
  }

  tag_specifications {
    resource_type = "instance"
    tags = {
      Name        = "${var.project_name}-app-instance-${var.environment}"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Auto Scaling Group
resource "aws_autoscaling_group" "app" {
  name_prefix         = "${var.project_name}-asg-${var.environment}-"
  vpc_zone_identifier = var.private_app_subnet_ids
  target_group_arns   = [var.target_group_arn]

  min_size         = var.min_size
  max_size         = var.max_size
  desired_capacity = var.desired_capacity

  health_check_type         = "ELB"
  health_check_grace_period = 300
  force_delete              = true

  launch_template {
    id      = aws_launch_template.app.id
    version = "$Latest"
  }

  instance_refresh {
    strategy = "Rolling"
    preferences {
      min_healthy_percentage = 50
    }
  }

  tag {
    key                 = "Name"
    value               = "${var.project_name}-asg-instance-${var.environment}"
    propagate_at_launch = true
  }

  lifecycle {
    create_before_destroy = true
  }
}

# CPU Utilization Auto Scaling Policy (Scale Out)
resource "aws_autoscaling_policy" "scale_out" {
  name                   = "${var.project_name}-cpu-scale-out-${var.environment}"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.app.name
}

# Target Tracking Scaling Policy
resource "aws_autoscaling_policy" "target_tracking_cpu" {
  name                   = "${var.project_name}-target-tracking-cpu-${var.environment}"
  autoscaling_group_name = aws_autoscaling_group.app.name
  policy_type            = "TargetTrackingScaling"

  target_tracking_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ASGAverageCPUUtilization"
    }
    target_value = 70.0
  }
}
