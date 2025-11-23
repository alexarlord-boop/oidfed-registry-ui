"""
Password Service
Password hashing and verification using bcrypt
"""

import bcrypt


class PasswordService:
    """Service for password operations"""
    
    @staticmethod
    def hash_password(password: str) -> str:
        """Hash a password (bcrypt has 72 byte limit)"""
        # Bcrypt can only handle passwords up to 72 bytes
        # Truncate if longer to avoid errors
        password_bytes = password.encode('utf-8')[:72]
        hashed = bcrypt.hashpw(password_bytes, bcrypt.gensalt())
        return hashed.decode('utf-8')
    
    @staticmethod
    def verify_password(plain_password: str, hashed_password: str) -> bool:
        """Verify a password against a hash"""
        # Apply same truncation for verification
        password_bytes = plain_password.encode('utf-8')[:72]
        hashed_bytes = hashed_password.encode('utf-8')
        return bcrypt.checkpw(password_bytes, hashed_bytes)


# Global service instance
password_service = PasswordService()
