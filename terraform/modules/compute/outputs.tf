output "asg_id" {
  description = "ID of Auto Scaling Group"
  value       = aws_autoscaling_group.app.id
}

output "asg_name" {
  description = "Name of Auto Scaling Group"
  value       = aws_autoscaling_group.app.name
}

output "launch_template_id" {
  description = "ID of EC2 Launch Template"
  value       = aws_launch_template.app.id
}
