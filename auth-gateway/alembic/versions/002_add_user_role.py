"""add user role

Revision ID: 002
Revises: d2b4bb4282f9
Create Date: 2025-11-19 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '002'
down_revision = 'd2b4bb4282f9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    """Add role column to users table"""
    # Drop the type if it exists (from failed migration) and recreate it
    op.execute("DROP TYPE IF EXISTS userrole")
    op.execute("CREATE TYPE userrole AS ENUM ('admin', 'technical_contact', 'pending')")
    
    # Add role column with default value
    op.add_column('users', 
        sa.Column('role', sa.Enum('admin', 'technical_contact', 'pending', name='userrole'), 
                  nullable=False, server_default='pending')
    )
    
    # Update existing users based on their approval status and roles
    # Superusers become admins
    op.execute("""
        UPDATE users 
        SET role = 'admin' 
        WHERE is_superuser = true OR 
              (roles IS NOT NULL AND roles::text LIKE '%fedops-admin%')
    """)
    
    # Approved users without admin role become technical contacts
    op.execute("""
        UPDATE users 
        SET role = 'technical_contact' 
        WHERE is_approved = true 
          AND role = 'pending'
    """)
    
    # All others remain pending (already set by default)


def downgrade() -> None:
    """Remove role column from users table"""
    op.drop_column('users', 'role')
    
    # Drop enum type
    op.execute("DROP TYPE userrole")
