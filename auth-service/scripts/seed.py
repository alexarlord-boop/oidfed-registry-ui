"""Seed initial data for OIDFED Auth Service.

Creates:
- Initial admin user
- Test technical contact users
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.core.database import db_manager
from src.services.user_service import UserService
from src.schemas.user import UserCreate
from src.models.user import UserRole


async def seed_data():
    """Seed initial data."""
    
    print("🌱 Seeding initial data...")
    
    # Initialize database
    await db_manager.initialize()
    await db_manager.create_tables()
    
    # Create database session
    async with db_manager.get_session() as db:
        # Create admin user
        admin_username = "admin"
        admin_user = await UserService.get_user_by_username(db, admin_username)
        
        if not admin_user:
            print(f"✓ Creating admin user '{admin_username}'...")
            admin_data = UserCreate(
                username=admin_username,
                email="admin@example.com",
                password="admin123",  # Change in production!
                full_name="System Administrator",
                organization="FedOps",
                role=UserRole.ADMIN,
                is_active=True,
                is_approved=True
            )
            admin_user = await UserService.create_user(db, admin_data)
            await db.commit()
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
                "full_name": "Alice Smith",
                "organization": "University Research",
                "role": UserRole.TECHNICAL_CONTACT,
                "is_active": True,
                "is_approved": True
            },
            {
                "username": "tc_bob",
                "email": "bob@research.org",
                "password": "password123",
                "full_name": "Bob Johnson",
                "organization": "Research Organization",
                "role": UserRole.TECHNICAL_CONTACT,
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
                await db.commit()
                print(f"  → Created test user (ID: {user.id})")
            else:
                print(f"✓ Test user '{user_data['username']}' already exists")
    
    # Close database
    await db_manager.close()
    
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
