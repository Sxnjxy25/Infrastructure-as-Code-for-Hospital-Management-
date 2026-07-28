# System Architecture Guide - Hospital Management System (HMS)

## Architecture Overview
The Hospital Management System is architected as an enterprise-grade, cloud-native 3-tier system built with AWS Infrastructure as Code (IaC) via Terraform.

```mermaid
graph TD
    User([End Users / Web Clients]) --> |HTTP 80 / HTTPS 443| ALB[Application Load Balancer]

    subgraph AWS Cloud - Virtual Private Cloud 10.0.0.0/16
        subgraph Public Subnets - AZ1 & AZ2
            ALB
            NAT[NAT Gateway]
        </div>

        subgraph Private App Subnets - AZ1 & AZ2
            ASG[EC2 Auto Scaling Group]
            subgraph Docker Runtime Instance
                BackendAPI[Node.js REST API :5000]
                FrontendUI[Nginx React SPA :80]
            end
        end

        subgraph Private Database Subnets - AZ1 & AZ2
            RDS[(Amazon RDS PostgreSQL :5432)]
        end

        subgraph Storage & Managed Services
            S3[(Amazon S3 Medical Documents Bucket)]
            CW[CloudWatch Logs & Metrics]
            SM[Secrets Manager / SSM]
            BK[AWS Backup Vault]
        end
    end

    ALB --> |Port 5000| ASG
    ASG --> |PostgreSQL Protocol| RDS
    ASG --> |KMS Encrypted Upload| S3
    ASG --> |Log Streaming| CW
    ASG --> |Fetch Secret Credentials| SM
    BK --> |Automated Daily Snapshots| RDS
```

## Modular Infrastructure Breakdown

### 1. Networking Layer (`terraform/modules/networking`)
- **VPC Scope**: `10.0.0.0/16` CIDR.
- **Subnet Allocation**:
  - `Public Subnets`: `10.0.1.0/24` (AZ1), `10.0.2.0/24` (AZ2) for Internet Load Balancing.
  - `Private App Subnets`: `10.0.11.0/24` (AZ1), `10.0.12.0/24` (AZ2) for EC2 application runtime.
  - `Private Database Subnets`: `10.0.21.0/24` (AZ1), `10.0.22.0/24` (AZ2) for RDS database instances.
- **Gateway Topology**: Internet Gateway (IGW) for public routing; NAT Gateway with Elastic IP for private subnet outbound updates.

### 2. Security & Identity Layer (`terraform/modules/security`)
- **Defense in Depth**:
  - **ALB Security Group**: Ingress 80/443 from `0.0.0.0/0`.
  - **App Security Group**: Ingress 5000 strictly restricted to traffic originating from **ALB Security Group ID**.
  - **Database Security Group**: Ingress 5432 strictly restricted to traffic originating from **App Security Group ID**. Direct external access is completely blocked.
- **IAM Instance Profile**: Grants EC2 instances least-privilege permission to access S3 medical storage buckets and ingest CloudWatch metrics without static AWS API keys.

### 3. Compute Layer (`terraform/modules/compute`)
- **Amazon EC2 Launch Template**: Uses Amazon Linux 2023 AMI with cloud-init user data script that automatically bootstraps Docker Engine, Docker Compose, and starts container workloads.
- **Auto Scaling Group**: Maintains desired 2 instances across Availability Zones, dynamically expanding up to 3 during CPU spikes (>70% average load).

### 4. Storage & Database Layer (`terraform/modules/storage`, `database`)
- **Database**: Managed Amazon RDS PostgreSQL 15 instance with automated failover capability, Parameter Group optimization, and encrypted storage.
- **Object Storage**: S3 bucket with server-side encryption (AWS KMS), bucket versioning, public access blocks, and lifecycle transitions (Standard -> Standard-IA -> Glacier).

---

## AWS Cost Estimation Matrix (Free Tier vs. Production)

| AWS Resource | Standard Free Tier Provisioning | Estimated Monthly Cost (Free Tier) | Enterprise Production Cost |
| :--- | :--- | :--- | :--- |
| **EC2 Instances** | 2x `t3.micro` / `t2.micro` | **$0.00** (750 hrs/mo free) | ~$30.00 / mo |
| **RDS PostgreSQL** | `db.t3.micro` (20 GB GP3) | **$0.00** (750 hrs/mo free) | ~$45.00 / mo |
| **S3 Storage** | Standard S3 (5 GB Free) | **$0.00** | ~$2.50 / mo |
| **Application Load Balancer** | 1x ALB + 15 LCU | ~$15.00 / mo (if beyond initial test) | ~$22.00 / mo |
| **NAT Gateway** | 1x Single NAT GW (Optional) | ~$30.00 / mo (billed per hour) | ~$65.00 / mo |
| **Total Estimated Cost** | **Demo / Free-Tier Friendly** | **$0 - $15 / month** | **~$165.00 / month** |

> [!TIP]
> To maintain $0 charges during college project demonstrations, tear down infrastructure after testing with `terraform destroy`.
