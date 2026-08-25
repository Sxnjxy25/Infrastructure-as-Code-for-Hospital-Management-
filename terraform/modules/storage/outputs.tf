output "bucket_id" {
  description = "Name of S3 Bucket"
  value       = aws_s3_bucket.medical_docs.id
}

output "bucket_arn" {
  description = "ARN of S3 Bucket"
  value       = aws_s3_bucket.medical_docs.arn
}

output "kms_key_arn" {
  description = "ARN of KMS Key for S3 Encryption"
  value       = aws_kms_key.s3_kms.arn
}
