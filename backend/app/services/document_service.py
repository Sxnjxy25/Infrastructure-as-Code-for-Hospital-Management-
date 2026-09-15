import hmac
import hashlib
import time
import re
from app.config import settings

ALLOWED_MIME_TYPES = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024 # 5 MB

def validate_document(mime_type: str, file_size: int, file_name: str) -> bool:
    if mime_type.lower() not in ALLOWED_MIME_TYPES:
        raise ValueError(f"Unsupported document type ({mime_type}). Allowed types: PDF, JPG, PNG.")

    if file_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(f"File size ({(file_size / (1024 * 1024)):.2f} MB) exceeds maximum 5 MB limit.")

    ext = file_name.split('.')[-1].lower() if '.' in file_name else ''
    if ext not in ['pdf', 'jpg', 'jpeg', 'png']:
        raise ValueError("Invalid file extension.")

    return True

def generate_s3_key(category: str, staff_profile_id: str, file_name: str) -> str:
    sanitized_name = re.sub(r'[^a-zA-Z0-9._-]', '_', file_name)
    cat = (category or 'general').lower()
    return f"staff/{cat}/{staff_profile_id}/{int(time.time() * 1000)}_{sanitized_name}"

def generate_signed_url(file_url: str, document_id: str, expires_in_seconds: int = 900) -> str:
    expires_at = int(time.time()) + expires_in_seconds
    secret = settings.JWT_SECRET.encode('utf-8')
    msg = f"{document_id}:{file_url}:{expires_at}".encode('utf-8')
    sig = hmac.new(secret, msg, hashlib.sha256).hexdigest()
    return f"/api/staff/documents/view/{document_id}?expires={expires_at}&sig={sig}"

def verify_signed_url(document_id: str, file_url: str, expires: str, signature: str) -> bool:
    now = int(time.time())
    if int(expires) < now:
        raise ValueError("Document signed URL has expired")

    secret = settings.JWT_SECRET.encode('utf-8')
    msg = f"{document_id}:{file_url}:{expires}".encode('utf-8')
    expected_sig = hmac.new(secret, msg, hashlib.sha256).hexdigest()

    if not hmac.compare_digest(signature, expected_sig):
        raise ValueError("Invalid document signature")

    return True
