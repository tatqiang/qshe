# Material Receive Areas - Feature Summary

## What Changed?

Added **multi-area location tracking** to Material Receive process, allowing users to specify multiple storage locations where received materials are stored.

## New Database Table

### `material_receive_areas`
- **Purpose**: Track multiple storage locations for each material receive document
- **Pattern**: Same hierarchical area structure as patrol records
- **Cardinality**: One material receive → Many storage areas

```sql
CREATE TABLE material_receive_areas (
  id UUID PRIMARY KEY,
  material_receive_id UUID NOT NULL,
  main_area_id UUID,           -- Required
  sub_area_1_id UUID,           -- Optional
  sub_area_2_id UUID,           -- Optional
  specific_location TEXT,       -- Optional free text
  display_order INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
);
```

## Area Hierarchy (Same as Patrol)

```
Main Area (Building A, Warehouse)
  └─ Sub Area 1 (Floor 2, Section A)
      └─ Sub Area 2 (Room 201, Aisle 3)
          └─ Specific Location (Shelf B3, Level 2)
```

## Use Cases

### Single Location
```
Material Receive: RCV-20251114-001
📍 Storage Location:
└─ Main Warehouse → Section A → Aisle 3 → Shelf B3, Level 2
```

### Multiple Locations
```
Material Receive: RCV-20251114-002
📍 Storage Locations (3):
├─ Main Warehouse → Section A → Rack 1
├─ Main Warehouse → Section B → Rack 5
└─ Site Storage → Near main gate
```

## UI Components

### Area Input Modal
- **Trigger**: "Add Area" button in Step 5.1 (Prepare)
- **Design**: Reuse patrol area input modal
- **Fields**:
  - Main Area (dropdown, required)
  - Sub Area 1 (dropdown, optional, cascading)
  - Sub Area 2 (dropdown, optional, cascading)
  - Specific Location (text field, optional)
- **Actions**: Save, Cancel, Delete (edit mode)

### Area List Display
Shows all areas with hierarchy:
```
📍 Storage Locations (3)
├─ Building A → Floor 2 → Room 201 → Shelf A1, Level 3
├─ Warehouse → Section B → Rack 10
└─ Site Storage → Near main gate
```

## Updated Files

### Schema Files
1. ✅ `database/schema/materials/schema_material_receive_areas` - New table definition
2. ✅ `database/migrations/001_material_inventory_system.sql` - Updated with Step 7
3. ✅ `database/schema/materials/MATERIAL_RECEIVE_AREAS_GUIDE.md` - Complete guide (new)

### Documentation Files
4. ✅ `database/schema/materials/RECEIVE_WORKFLOW_GUIDE.md` - Updated Step 5.1 with area input
5. ✅ `database/schema/materials/SCHEMA_ARCHITECTURE.md` - Added material_receive_areas section
6. ✅ `database/schema/materials/IMPLEMENTATION_GUIDE.md` - Updated with area testing checklist
7. ✅ `database/schema/materials/AREA_FEATURE_SUMMARY.md` - This document

## Integration Points

### Existing Tables Used
- `main_areas` - Main area lookup
- `sub_areas_1` - Sub area 1 lookup
- `sub_areas_2` - Sub area 2 lookup

### Foreign Keys
```sql
material_receive_areas.material_receive_id → material_receives.id (CASCADE)
material_receive_areas.main_area_id → main_areas.id (SET NULL)
material_receive_areas.sub_area_1_id → sub_areas_1.id (SET NULL)
material_receive_areas.sub_area_2_id → sub_areas_2.id (SET NULL)
```

### Cascade Behavior
- Delete receive → Areas deleted (CASCADE)
- Delete area lookup → FK set to NULL (SET NULL)

## API Endpoints Needed

```typescript
// Material Receive Areas API
GET    /api/material-receives/:id/areas          // List all areas
POST   /api/material-receives/:id/areas          // Add new area
PUT    /api/material-receives/:id/areas/:areaId  // Update area
DELETE /api/material-receives/:id/areas/:areaId  // Delete area
```

## Validation Rules

1. **Main Area**: REQUIRED for each area entry
2. **Hierarchical**: 
   - Sub Area 1 requires Main Area
   - Sub Area 2 requires Sub Area 1
3. **Cascading Clear**:
   - Change Main Area → Clear Sub Area 1 & 2
   - Change Sub Area 1 → Clear Sub Area 2
4. **Edit Lock**: Read-only when `material_receives.is_locked = TRUE`

## Example Queries

### Get Areas for Receive with Names
```sql
SELECT 
  mra.id,
  ma.main_area_name,
  sa1.sub_area_1_name,
  sa2.sub_area_2_name,
  mra.specific_location
FROM material_receive_areas mra
LEFT JOIN main_areas ma ON mra.main_area_id = ma.id
LEFT JOIN sub_areas_1 sa1 ON mra.sub_area_1_id = sa1.id
LEFT JOIN sub_areas_2 sa2 ON mra.sub_area_2_id = sa2.id
WHERE mra.material_receive_id = :receive_id
ORDER BY mra.display_order;
```

### Add New Area
```sql
INSERT INTO material_receive_areas (
  material_receive_id, main_area_id, sub_area_1_id,
  specific_location, display_order
) VALUES (
  :receive_id, :main_area_id, :sub_area_1_id,
  'Shelf A1, Level 3', 1
);
```

## Benefits

✅ **Precise Location Tracking**: Know exactly where materials are stored  
✅ **Multi-Location Support**: Handle materials split across multiple areas  
✅ **Consistent UX**: Same experience as patrol area inputs  
✅ **Flexible Detail**: Free text for specific locations (shelf, rack, bin)  
✅ **Scalable**: Support unlimited storage locations per receive  
✅ **Audit Trail**: Track who added/modified each location  

## Testing Checklist

- [ ] Create area with Main Area only
- [ ] Create area with Main → Sub1 → Sub2 → Specific
- [ ] Add multiple areas to one receive
- [ ] Edit existing area
- [ ] Delete area
- [ ] Hierarchical validation working (cascading dropdowns)
- [ ] Display order respected in list
- [ ] Areas deleted when receive deleted
- [ ] Read-only when receive locked
- [ ] Mobile responsive

## Migration Impact

**None** - This is a new table. No existing data migration needed.

---

**Feature Status**: ✅ Schema Complete  
**Deployment**: Ready (included in 001_material_inventory_system.sql)  
**Documentation**: Complete  
**Next Steps**: Frontend UI implementation  

**Created**: 2025-11-14  
**Author**: GitHub Copilot  
**Related PR/Issue**: Material Receive Multi-Area Support
