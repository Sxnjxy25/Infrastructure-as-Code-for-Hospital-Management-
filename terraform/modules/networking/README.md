# Terraform Networking Module

This module provisions a highly available multi-AZ network architecture on AWS.

## Architecture Highlights
- **VPC**: Isolated 10.0.0.0/16 virtual private cloud with DNS resolution.
- **Public Subnets**: Multi-AZ public subnets connected to an Internet Gateway for ALBs.
- **Private App Subnets**: Multi-AZ subnets routing outbound traffic through a NAT Gateway for EC2 workloads.
- **Private Database Subnets**: Multi-AZ isolated database subnets without direct internet routing.
- **RDS Subnet Group**: Pre-configured database subnet group referencing private database subnets.
