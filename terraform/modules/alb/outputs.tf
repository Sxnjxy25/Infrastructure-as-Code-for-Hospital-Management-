output "alb_dns_name" {
  description = "DNS Name of Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_arn" {
  description = "ARN of Application Load Balancer"
  value       = aws_lb.main.arn
}

output "target_group_arn" {
  description = "ARN of Application Target Group"
  value       = aws_lb_target_group.app.arn
}
