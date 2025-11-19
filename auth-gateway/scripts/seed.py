"""Seed initial data for OIDFED Auth Gateway.

Creates:
- Initial admin user
- Test technical contact users
- Generates JWT keys if missing
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.config.settings import get_settings
from src.db.session import get_db
from src.services.password_service import PasswordService
from src.services.user_service import UserService
from src.schemas.user import UserCreate

# Import key generation
from src.config.keys.generate_keys import main as generate_keys


async def seed_data():
    """Seed initial data."""
    settings = get_settings()
    password_service = PasswordService()
    
    print("🌱 Seeding initial data...")
    
    # Generate JWT keys if they don't exist
    print("✓ Checking JWT keys...")
    try:
        generate_keys()
    except Exception as e:
        print(f"⚠️  Key generation: {e}")
    
    # Create database session
    async for db in get_db():
        user_service = UserService(db, password_service)
        
        # Create admin user
        admin_username = "admin"
        admin_user = await user_service.get_by_username(admin_username)
        
        if not admin_user:
            print(f"✓ Creating admin user '{admin_username}'...")
            admin_data = UserCreate(
                username=admin_username,
                email="admin@example.com",
                password="admin123",  # Change in production!
                roles=["admin", "technical_contact"]
            )
            admin_user = await user_service.create(admin_data, is_approved=True)
            print(f"  → Created admin user (ID: {admin_user.id})")
            print(f"  → Username: {admin_username}")
            print(f"  → Password: admin123")
            print(f"  → ⚠️  CHANGE PASSWORD IN PRODUCTION!")
        else:
            print(f"✓ Admin user '{admin_username}' already exists")
        
        # Create test technical contact users
        test_users = [
            {
                "username": "tc_alice",
                "email": "alice@university.edu",
                "password": "password123",
                "roles": ["technical_contact"]
            },
            {
                "username": "tc_bob",
                "email": "bob@research.org",
                "password": "password123",
                "roles": ["technical_contact"]
            },
        ]
        
        for user_data in test_users:
            existing = await user_service.get_by_username(user_data["username"])
            if not existing:
                print(f"✓ Creating test user '{user_data['username']}'...")
                user_create = UserCreate(**user_data)
                user = await user_service.create(user_create, is_approved=True)
                print(f"  → Created test user (ID: {user.id})")
            else:
                print(f"✓ Test user '{user_data['username']}' already exists")
        
        await db.commit()
        break  # Exit after first iteration
    
    print("")
    print("✅ Seeding complete!")
    print("")
    print("Test credentials:")
    print("  Admin:          admin / admin123")
    print("  Technical User: tc_alice / password123")
    print("  Technical User: tc_bob / password123")
    print("")
    print("⚠️  Change passwords in production!")


if __name__ == "__main__":
    asyncio.run(seed_data())
