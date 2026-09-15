# College Project Defense & Viva Interview FAQ

This document prepares you for technical viva questions and architectural defense during your final capstone evaluation.

---

### Q1: Why did you choose Terraform over AWS CloudFormation or AWS CDK?
**Answer**: Terraform is provider-agnostic and written in HCL (HashiCorp Configuration Language), allowing us to manage multi-cloud resources or third-party providers (e.g. Datadog, GitHub) within a single workflow. It uses state files to track deployed infrastructure state deterministically and supports modular code reuse.

---

### Q2: How is state locking handled in Terraform, and why is it important?
**Answer**: State locking prevents concurrent `terraform apply` operations from corrupting the state file. We configured an S3 bucket for remote state storage combined with a DynamoDB table storing `LockID` keys. When an engineer runs `terraform apply`, Terraform acquires a lock in DynamoDB, releasing it only after completion.

---

### Q3: Why is the database placed in a private subnet without a public IP?
**Answer**: Placing Amazon RDS in a private database subnet enforces zero trust perimeter security. The database cannot be reached directly from the internet. Ingress is restricted via Security Groups strictly to port 5432 from application EC2 instances running inside the private application subnets.

---

### Q4: How does the application handle high traffic spikes?
**Answer**: We implement multi-tier scalability:
1. **Application Load Balancer (ALB)** distributes incoming web requests across Availability Zones.
2. **Auto Scaling Group (ASG)** dynamically scales EC2 instances out (min: 1, max: 3) based on CPU target-tracking policy when average CPU utilization exceeds 70%.

---

### Q5: How are secrets and credentials managed securely in this project?
**Answer**: Hardcoding credentials in source code or Terraform files is prohibited. Database passwords and JWT secrets are stored in **AWS Secrets Manager** and **AWS SSM Parameter Store**, fetched dynamically at runtime by application containers using IAM instance profiles.

---

### Q6: How do you enforce Role-Based Access Control (RBAC) across 7 hospital roles?
**Answer**: In the Node.js backend, custom Express middleware checks the user's JWT payload and verifies their assigned `Role` enum against permitted route permissions before invoking controller logic. On the frontend, React Router wraps sensitive views with a `ProtectedRoute` component that hides unauthorized UI sections.

---

### Q7: Explain the database relationship design for Appointments and Patients.
**Answer**: In `schema.prisma`, `Patient` and `Doctor` entities have 1-to-Many relationships with `Appointment`. Each appointment references a `patientId` (FK) and `doctorId` (FK), assigning a unique daily token number for queue management.

---

### Q8: What disaster recovery measures are implemented?
**Answer**: We enforce an RPO <= 1 hr and RTO <= 2 hrs using daily automated Amazon RDS snapshots (7-day retention), S3 bucket object versioning, and AWS Backup Vault rules.
