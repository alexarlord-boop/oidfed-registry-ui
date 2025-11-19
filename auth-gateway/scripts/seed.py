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
try:
    from src.config.keys import generate_keys
except ImportError:
    generate_keys = None


async def seed_data():
    """Seed initial data."""
    settings = get_settings()
    
    print("🌱 Seeding initial data...")
    
    # Generate JWT keys if they don't exist
    print("✓ Checking JWT keys...")
    if generate_keys:
        try:
            generate_keys.main()
        except Exception as e:
            print(f"⚠️  Key generation: {e}")
    
    # Create database session
    async for db in get_db():
        # Create admin user
        admin_username = "admin"
        admin_user = await UserService.get_user_by_username(db, admin_username)
        
        if not admin_user:
            print(f"✓ Creating admin user '{admin_username}'...")
            admin_data = UserCreate(
                username=admin_username,
                email="admin@example.com",
                password="admin123",  # Change in production!
                roles=["admin", "technical_contact"],
                is_active=True,
                is_approved=True
            )
            admin_user = await UserService.create_user(db, admin_data)
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
                "roles": ["technical_contact"],
                "is_active": True,
                "is_approved": True
            },
            {
                "username": "tc_bob",
                "email": "bob@research.org",
                "password": "password123",
                "roles": ["technical_contact"],
                "is_active": True,
                "is_approved": True
            },
        ]
        
        for user_data in test_users:
            existing = await UserService.get_user_by_username(db, user_data["username"])
            if not existing:
                print(f"✓ Creating test user '{user_data['username']}'...")
                user_create = UserCreate(**user_data)
                user = await UserService.create_user(db, user_create)
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
