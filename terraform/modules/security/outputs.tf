output "alb_security_group_id" {
  description = "ID of ALB Security Group"
  value       = aws_security_group.alb.id
}

output "app_security_group_id" {
  description = "ID of Application EC2 Security Group"
  value       = aws_security_group.app.id
}

output "db_security_group_id" {
  description = "ID of Database RDS Security Group"
  value       = aws_security_group.db.id
}

output "ec2_iam_role_arn" {
  description = "ARN of IAM Role attached to EC2"
  value       = aws_iam_role.ec2_app_role.arn
}

output "ec2_instance_profile_name" {
  description = "Name of EC2 Instance Profile"
  value       = aws_iam_instance_profile.ec2_profile.name
}
