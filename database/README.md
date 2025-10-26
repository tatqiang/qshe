# Database SQL Files Organization

This directory contains all SQL scripts and database-related files for the QSHE project, organized into logical categories for easy navigation and maintenance.

## Folder Structure

### 📋 01_schema
**Main schema definitions and table structures**
- Complete QSHE schema files
- Simplified schemas for testing
- Portal and application schemas
- Hierarchical and normalized area schemas
- Safety patrol schemas
- Member application schemas
- Multi-company RBAC system
- Schema table definitions (in `schema_tables/` subfolder)
- Storage bucket configurations

**Key Files:**
- `complete_qshe_schema.sql` - Full production schema
- `simplified_qshe_schema.sql` - Simplified version for testing
- `schema.sql` - Base schema definition

### 🔄 02_migrations
**Database migration scripts for schema updates**
- Column additions (approval, address, custom fields, etc.)
- Enum type updates and modifications
- Table structure changes
- Field type conversions
- Status and workflow updates
- Azure migration scripts
- Safety audit schema migrations (v2, v3)
- Consent form restructuring

**Naming Convention:**
- `add_*.sql` - Adding new columns/fields
- `update_*.sql` - Updating existing structures
- `migrate_*.sql` - Data migrations
- `step*.sql` - Sequential migration steps
- `migration_statistics.json` - Migration tracking data

### 🔧 03_fixes
**Bug fixes and corrections**
- RLS (Row Level Security) policy fixes
- Enum type fixes
- Index creation fixes
- Authentication fixes
- Company and member RLS fixes
- Safety audit RLS fixes
- Storage policy fixes
- Data cleanup scripts
- Field constraint fixes

**Categories:**
- RLS fixes: `fix_*_rls.sql`
- Enum fixes: `fix_*_enum*.sql`
- Cleanup: `cleanup_*.sql`, `manual_*.sql`

### 🌱 04_seeds
**Initial data and test data scripts**
- System admin user creation
- Test user insertion
- Sample project data
- Position and authority data
- Member application seed data
- Azure AD user creation

**Key Files:**
- `create_system_admin.sql` - Create system administrator
- `insert_sample_projects.sql` - Sample project data
- `add_test_users.sql` - Test user accounts
- `populate_position_titles.sql` - Job position data

### 🔐 05_rls_policies
**Row Level Security (RLS) policy definitions**
- Company-level security policies
- User access control policies
- Data isolation rules

### ⚙️ 06_functions
**Stored procedures and database functions**
- Safety patrol CRUD functions
- Password reset functionality
- Project form configuration initialization
- Utility functions

**Key Files:**
- `safety_patrol_crud_functions.sql` - Safety patrol operations
- `password_reset_function.sql` - User password management
- `init_project_form_configs.sql` - Form configuration setup

### 🧪 07_testing
**Test scripts and verification queries**
- Schema verification scripts
- RLS policy testing
- Feature testing (patrols, areas, corrective actions)
- User role and permission checks
- Storage bucket verification

**File Types:**
- `test_*.sql` - Feature tests
- `check_*.sql` - Status checks
- `verify_*.sql` - Verification scripts
- `quick_test.*` - Quick validation scripts

### 🚀 08_deployment
**Deployment and setup scripts**
- Schema deployment batch files
- Migration runners
- Setup automation scripts
- Complete schema deployment

**Key Files:**
- `deploy_qshe_schema.bat` - Deploy main schema
- `quick_setup.sql` - Quick database setup
- `run_complete_schema.js` - Automated schema deployment
- `run_migration.js` - Migration automation

### 📦 archive
**Deprecated and old files**
- Legacy scripts no longer in use
- Backup scripts
- Old enum updates
- Deprecated table creation scripts
- Historical migration tools

**Note:** Files in archive are kept for reference but should not be used in production.

## Usage Guidelines

### Running Migrations
1. Always backup your database before running migrations
2. Run migrations in sequence if they are numbered (`step1`, `step2`, etc.)
3. Check the migration statistics in `02_migrations/migration_statistics.json`

### Applying Schema Changes
1. Start with schema files in `01_schema/`
2. Apply necessary migrations from `02_migrations/`
3. Fix any issues using scripts from `03_fixes/`
4. Seed initial data from `04_seeds/`
5. Verify with tests from `07_testing/`

### Development Workflow
```bash
# 1. Create/update schema
database/01_schema/complete_qshe_schema.sql

# 2. Run migrations
database/02_migrations/add_*.sql

# 3. Apply fixes if needed
database/03_fixes/fix_*.sql

# 4. Seed test data
database/04_seeds/add_test_users.sql

# 5. Run tests
database/07_testing/verify_*.sql
```

### Best Practices
- Never modify files in `archive/` - they are for reference only
- Test all scripts in a development environment first
- Document any new migrations with clear comments
- Follow the naming conventions for new files
- Update this README when adding new categories

## File Naming Conventions

- **Schema files:** `*_schema.sql`
- **Migrations:** `add_*.sql`, `update_*.sql`, `migrate_*.sql`
- **Fixes:** `fix_*.sql`, `cleanup_*.sql`
- **Seeds:** `insert_*.sql`, `create_*.sql`, `populate_*.sql`
- **Tests:** `test_*.sql`, `check_*.sql`, `verify_*.sql`
- **Functions:** `*_function.sql`, `*_functions.sql`
- **Deployment:** `deploy_*.bat`, `run_*.js`, `setup_*.sql`

## Quick Reference

| Task | Location |
|------|----------|
| Create new database | `01_schema/complete_qshe_schema.sql` |
| Add new field | `02_migrations/add_*.sql` |
| Fix RLS issue | `03_fixes/fix_*_rls.sql` |
| Add test data | `04_seeds/` |
| Create admin user | `04_seeds/create_system_admin.sql` |
| Test feature | `07_testing/test_*.sql` |
| Deploy schema | `08_deployment/deploy_qshe_schema.bat` |

## Notes

- All SQL files use PostgreSQL/Supabase syntax
- RLS policies are critical for multi-tenant security
- Some files have JavaScript runners (`.js`) for automation
- Batch files (`.bat`) are for Windows deployment

## Maintenance

When adding new files:
1. Place them in the appropriate category folder
2. Follow the naming conventions
3. Add comments at the top of the file explaining its purpose
4. Update this README if creating new categories
5. Archive old/deprecated files instead of deleting them

---

**Last Updated:** October 25, 2025  
**Total SQL Files:** ~155 organized files  
**Database:** PostgreSQL/Supabase
