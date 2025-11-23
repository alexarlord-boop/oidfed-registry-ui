"""
Generate RSA key pair for JWT signing
Run this script once to generate keys before starting the server
"""

from cryptography.hazmat.primitives.asymmetric import rsa
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.backends import default_backend
import os


def generate_keys():
    """Generate RSA-2048 key pair and save to PEM files"""
    
    # Ensure keys directory exists
    os.makedirs(os.path.dirname(__file__), exist_ok=True)
    
    # Generate private key
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
        backend=default_backend()
    )
    
    # Save private key
    private_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.NoEncryption()
    )
    
    private_key_path = os.path.join(os.path.dirname(__file__), "private_key.pem")
    with open(private_key_path, "wb") as f:
        f.write(private_pem)
    print(f"✅ Private key saved to {private_key_path}")
    
    # Extract and save public key
    public_key = private_key.public_key()
    public_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    )
    
    public_key_path = os.path.join(os.path.dirname(__file__), "public_key.pem")
    with open(public_key_path, "wb") as f:
        f.write(public_pem)
    print(f"✅ Public key saved to {public_key_path}")
    
    print("\n⚠️  IMPORTANT: Keep private_key.pem secret!")
    print("📤 Share public_key.pem with Admin API for JWT validation")


if __name__ == "__main__":
    generate_keys()
