# Safety Patrol Database Setup Guide

## Overview
This guide will help you set up the complete safety patrol database schema in Supabase to enable real patrol recording.

## Steps to Set Up the Database

### 1. Access Supabase SQL Editor
1. Go to your Supabase project dashboard
2. Navigate to the "SQL Editor" in the left sidebar
3. Click "New query" to create a new SQL script

### 2. Run the Schema Creation Script
1. Copy the entire content from `database/safety_patrol_schema.sql`
2. Paste it into the SQL Editor
3. Click "Run" to execute the script

This will create:
- All necessary tables (`safety_patrols`, `patrol_photos`, `patrol_risk_categories`, etc.)
- Proper foreign key relationships
- Automatic triggers for risk calculation
- Sample risk categories and items
- Indexes for performance

### 3. Verify the Schema
After running the schema, verify tables were created by running:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND (table_name LIKE '%patrol%' OR table_name LIKE '%risk%')
ORDER BY table_name;
```

You should see these tables:
- `corrective_actions`
- `patrol_photos`
- `patrol_risk_categories`
- `patrol_risk_items`
- `patrol_witnesses`
- `progress_updates`
- `risk_categories`
- `risk_items`
- `safety_patrols`

### 4. Test the Schema
Run this test to verify everything works:

```sql
-- Test creating a patrol
INSERT INTO public.safety_patrols (
  title,
  description,
  patrol_type,
  main_area,
  sub_area1,
  specific_location,
  likelihood,
  severity,
  immediate_hazard,
  work_stopped,
  legal_requirement
) VALUES (
  'Test Safety Patrol',
  'Testing the new database schema',
  'scheduled',
  'Building A',
  'Floor 1',
  'Main entrance area',
  2,
  3,
  false,
  false,
  false
);

-- Verify it was created with auto-calculated risk level
SELECT 
  id,
  patrol_number,
  title,
  likelihood,
  severity,
  risk_level,
  recommended_action,
  created_at
FROM public.safety_patrols
ORDER BY created_at DESC
LIMIT 1;
```

### 5. Update Application Configuration
The application has been updated to use the real `SafetyPatrolService` instead of the demo service. This means:

- Patrols will be saved to the Supabase database
- Photos will be stored in the database (base64 for now)
- Risk calculations happen automatically via database triggers
- All form fields are properly mapped to database columns

### 6. Required Data
The schema includes sample data for:

**Risk Categories:**
- High Work
- Electricity  
- Crane Operations
- LOTO (Lock Out Tag Out)
- Hot Work
- Confined Space

**Risk Items:**
- Welding Machine
- Welder Certification
- Grinder
- Drill
- PTW Hot Work
- PPE Check
- Ventilation
- Fire Watch

## Database Schema Features

### Automatic Risk Calculation
The database automatically calculates:
- **Risk Level**: Based on likelihood × severity matrix
- **Recommended Action**: Monitor, Control, Mitigate, or Stop Work
- **Patrol Numbers**: Auto-generated in format `SP-YYYYMMDD-001`

### Photo Storage
Photos are stored as base64 data URLs in the `patrol_photos` table during development. This can be enhanced later with proper file storage.

### Hierarchical Areas
The schema supports both:
- **Legacy fields**: `main_area`, `sub_area1`, `sub_area2`, `specific_location`
- **Normalized structure**: `main_area_id`, `sub_area1_id`, `sub_area2_id`
- **Complex data**: `area_info` JSON field for rich area objects

### Risk Assessment
Full 4×4 risk matrix support with:
- Likelihood (1-4) and Severity (1-4) scales
- Automatic risk level calculation
- Risk categories and items junction tables
- Witness tracking

## Troubleshooting

### Common Issues

**1. Permission Errors**
If you get permission errors, ensure:
- You're running the script as a project owner/admin
- RLS policies are correctly configured
- Auth is properly set up

**2. Missing Tables**
If tables don't appear:
- Check for SQL errors in the console
- Verify the script ran completely
- Look for foreign key constraint errors

**3. Data Not Saving**
If patrols don't save:
- Check browser console for errors
- Verify Supabase connection in the app
- Check if user authentication is working

### Getting Help
If you encounter issues:
1. Check the browser console for error messages
2. Check the Supabase logs in the dashboard
3. Verify the database schema matches the TypeScript interfaces
4. Test with simple SQL queries first

## Next Steps
Once the database is set up:
1. Test creating a patrol through the UI
2. Verify data appears in the database
3. Test photo upload functionality
4. Configure proper file storage for photos (R2/S3)
5. Set up proper user authentication and permissions
