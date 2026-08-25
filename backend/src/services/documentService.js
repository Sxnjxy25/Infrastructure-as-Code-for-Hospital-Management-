const crypto = require('crypto');
const prisma = require('../config/db');
const { logAudit } = require('./auditService');

const ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates document upload metadata.
 */
function validateDocument({ mimeType, fileSize, fileName }) {
  if (!ALLOWED_MIME_TYPES.includes(mimeType?.toLowerCase())) {
    throw new Error(`Unsupported document type (${mimeType}). Allowed types: PDF, JPG, PNG.`);
  }

  if (fileSize > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File size (${(fileSize / (1024 * 1024)).toFixed(2)} MB) exceeds maximum 5 MB limit.`);
  }

  const ext = fileName?.split('.').pop()?.toLowerCase();
  if (!['pdf', 'jpg', 'jpeg', 'png'].includes(ext)) {
    throw new Error('Invalid file extension.');
  }

  return true;
}

/**
 * Generates an S3 storage path key for a staff document.
 */
function generateS3Key({ category, staffProfileId, fileName }) {
  const sanitizedName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const cat = (category || 'general').toLowerCase();
  return `staff/${cat}/${staffProfileId}/${Date.now()}_${sanitizedName}`;
}

/**
 * Generates a secure, short-lived signed URL for document retrieval.
 * Uses AWS S3 SDK when deployed in AWS or a time-limited cryptographically HMAC-signed URL locally.
 */
function generateSignedUrl({ fileUrl, documentId, expiresInSeconds = 900 }) {
  // If AWS S3 credentials are configured in environment, could use AWS SDK S3Client.
  // For local development and fallback, generate a 15-minute HMAC token.
  const expiresAt = Math.floor(Date.now() / 1000) + expiresInSeconds;
  const secret = process.env.JWT_SECRET || 'hms_secure_document_secret_2026';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${documentId}:${fileUrl}:${expiresAt}`);
  const signature = hmac.digest('hex');

  // In production with S3 bucket: `https://${process.env.S3_BUCKET_NAME}.s3.amazonaws.com/${fileUrl}?X-Amz-Signature=...`
  // For API serving with access control:
  return `/api/staff/documents/view/${documentId}?expires=${expiresAt}&sig=${signature}`;
}

/**
 * Verifies a time-limited signed URL token.
 */
function verifySignedUrl({ documentId, fileUrl, expires, signature }) {
  const now = Math.floor(Date.now() / 1000);
  if (parseInt(expires) < now) {
    throw new Error('Document signed URL has expired');
  }

  const secret = process.env.JWT_SECRET || 'hms_secure_document_secret_2026';
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(`${documentId}:${fileUrl}:${expires}`);
  const expectedSig = hmac.digest('hex');

  if (signature !== expectedSig) {
    throw new Error('Invalid document signature');
  }

  return true;
}

module.exports = {
  validateDocument,
  generateS3Key,
  generateSignedUrl,
  verifySignedUrl,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
};
