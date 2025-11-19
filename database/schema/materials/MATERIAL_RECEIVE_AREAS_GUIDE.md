# Material Receive Areas - Multi-Area Support Guide

## Overview
Material receives can now track **multiple area locations** where materials are stored, similar to patrol record area inputs. This allows you to specify precise locations for received materials using the same hierarchical area structure.

## Database Schema

### Table: `material_receive_areas`

```sql
CREATE TABLE public.material_receive_areas (
  id UUID PRIMARY KEY,
  material_receive_id UUID NOT NULL REFERENCES material_receives(id) ON DELETE CASCADE,
  
  -- Area Hierarchy
  main_area_id UUID REFERENCES main_areas(id),
  sub_area_1_id UUID REFERENCES sub_areas_1(id),
  sub_area_2_id UUID REFERENCES sub_areas_2(id),
  specific_location TEXT,
  
  -- Metadata
  display_order INTEGER DEFAULT 1,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

## Area Hierarchy (Same as Patrol Records)

### 1. Main Area (Required)
- **Example**: Building A, Warehouse, Yard 2, Office Block
- **Database**: `main_areas` table
- **Field**: `main_area_id`

### 2. Sub Area 1 (Optional - Requires Main Area)
- **Example**: Floor 2, Office Wing, Storage Section A
- **Database**: `sub_areas_1` table
- **Field**: `sub_area_1_id`
- **Dependency**: Must have Main Area selected first

### 3. Sub Area 2 (Optional - Requires Sub Area 1)
- **Example**: Room 201, Workstation A, Aisle 3
- **Database**: `sub_areas_2` table
- **Field**: `sub_area_2_id`
- **Dependency**: Must have Sub Area 1 selected first

### 4. Specific Location (Optional - Free Text)
- **Example**: "North wall, near column A1", "Shelf B3, Level 2"
- **Database**: Text field
- **Field**: `specific_location`

## Usage Examples

### Example 1: Simple Location
```json
{
  "material_receive_id": "uuid-123",
  "main_area_id": "uuid-building-a",
  "main_area_name": "Building A",
  "display_order": 1
}
```
**Display**: Building A

### Example 2: Floor Location
```json
{
  "material_receive_id": "uuid-123",
  "main_area_id": "uuid-building-a",
  "sub_area_1_id": "uuid-floor-2",
  "main_area_name": "Building A",
  "sub_area_1_name": "Floor 2",
  "display_order": 1
}
```
**Display**: Building A → Floor 2

### Example 3: Room Location with Specific Detail
```json
{
  "material_receive_id": "uuid-123",
  "main_area_id": "uuid-warehouse",
  "sub_area_1_id": "uuid-section-a",
  "sub_area_2_id": "uuid-aisle-3",
  "specific_location": "Shelf B3, Level 2",
  "main_area_name": "Main Warehouse",
  "sub_area_1_name": "Section A",
  "sub_area_2_name": "Aisle 3",
  "display_order": 1
}
```
**Display**: Main Warehouse → Section A → Aisle 3 → Shelf B3, Level 2

### Example 4: Multiple Storage Locations
A single material receive can have materials stored in multiple locations:

```json
[
  {
    "material_receive_id": "uuid-123",
    "main_area_id": "uuid-warehouse",
    "sub_area_1_id": "uuid-section-a",
    "specific_location": "Rack 1",
    "display_order": 1
  },
  {
    "material_receive_id": "uuid-123",
    "main_area_id": "uuid-warehouse",
    "sub_area_1_id": "uuid-section-b",
    "specific_location": "Rack 5",
    "display_order": 2
  },
  {
    "material_receive_id": "uuid-123",
    "main_area_id": "uuid-site-storage",
    "specific_location": "Near main gate",
    "display_order": 3
  }
]
```

## UI Implementation - Area Input Modal

### Modal Structure
The area input modal should mirror the patrol area input design with:

1. **Main Area Dropdown** (Required)
   - Searchable dropdown
   - Shows all active main areas for the project
   - Must be selected first

2. **Sub Area 1 Dropdown** (Optional)
   - Enabled only after Main Area selected
   - Filtered by selected Main Area
   - Shows placeholder "Select main area first" when disabled

3. **Sub Area 2 Dropdown** (Optional)
   - Enabled only after Sub Area 1 selected
   - Filtered by selected Sub Area 1
   - Shows placeholder "Select sub area 1 first" when disabled

4. **Specific Location Text Field** (Optional)
   - Free text input
   - Placeholder: "e.g., North wall, near column A1"
   - Maximum length: 255 characters

5. **Action Buttons**
   - Save
   - Cancel
   - Delete (for edit mode)

### Modal Behavior

#### Add New Area
1. User clicks "Add Area" button
2. Modal opens with empty fields
3. User selects Main Area → enables Sub Area 1
4. User selects Sub Area 1 (optional) → enables Sub Area 2
5. User selects Sub Area 2 (optional)
6. User enters Specific Location (optional)
7. User clicks Save
8. Area appears in the list

#### Edit Existing Area
1. User clicks on an area in the list
2. Modal opens with pre-filled values
3. User can modify any field (respecting hierarchy)
4. User clicks Save or Delete
5. Changes reflected in the list

#### Delete Area
1. User clicks "Edit" on an area
2. User clicks "Delete" button
3. Confirmation dialog appears
4. Area removed from list

### Area List Display

Show all areas for a material receive:

```
📍 Storage Locations (3)
├─ Building A → Floor 2 → Room 201 → Shelf A1, Level 3
├─ Warehouse → Section B → Rack 10
└─ Site Storage → Near main gate
```

### Data Validation Rules

1. **Main Area**: REQUIRED for each area entry
2. **Sub Area 1**: Can only be selected if Main Area is selected
3. **Sub Area 2**: Can only be selected if Sub Area 1 is selected
4. **Specific Location**: Always optional
5. **Hierarchical Integrity**: 
   - If Main Area changes → Clear Sub Area 1 and Sub Area 2
   - If Sub Area 1 changes → Clear Sub Area 2
6. **Display Order**: Auto-increment based on number of existing areas

## SQL Queries

### Get All Areas for a Material Receive
```sql
SELECT 
  mra.id,
  mra.specific_location,
  mra.display_order,
  ma.main_area_name,
  sa1.sub_area_1_name,
  sa2.sub_area_2_name
FROM material_receive_areas mra
LEFT JOIN main_areas ma ON mra.main_area_id = ma.id
LEFT JOIN sub_areas_1 sa1 ON mra.sub_area_1_id = sa1.id
LEFT JOIN sub_areas_2 sa2 ON mra.sub_area_2_id = sa2.id
WHERE mra.material_receive_id = 'uuid-here'
ORDER BY mra.display_order;
```

### Insert New Area
```sql
INSERT INTO material_receive_areas (
  material_receive_id,
  main_area_id,
  sub_area_1_id,
  sub_area_2_id,
  specific_location,
  display_order,
  created_by
) VALUES (
  'uuid-receive',
  'uuid-main-area',
  'uuid-sub-area-1',  -- Can be NULL
  'uuid-sub-area-2',  -- Can be NULL
  'Shelf A1, Level 3',
  1,
  'uuid-user'
);
```

### Update Area
```sql
UPDATE material_receive_areas
SET 
  main_area_id = 'uuid-new-main',
  sub_area_1_id = 'uuid-new-sub1',
  sub_area_2_id = NULL,
  specific_location = 'Updated location',
  updated_at = NOW()
WHERE id = 'uuid-area';
```

### Delete Area
```sql
DELETE FROM material_receive_areas
WHERE id = 'uuid-area';
```

## Frontend Component Example (Vue)

```vue
<template>
  <div class="area-input-modal">
    <h3>{{ isEdit ? 'Edit' : 'Add' }} Storage Location</h3>
    
    <!-- Main Area -->
    <div class="form-field">
      <label>Main Area *</label>
      <select v-model="form.main_area_id" @change="onMainAreaChange">
        <option value="">Select main area...</option>
        <option v-for="area in mainAreas" :key="area.id" :value="area.id">
          {{ area.main_area_name }}
        </option>
      </select>
    </div>
    
    <!-- Sub Area 1 -->
    <div class="form-field">
      <label>Sub Area 1</label>
      <select 
        v-model="form.sub_area_1_id" 
        :disabled="!form.main_area_id"
        @change="onSubArea1Change"
      >
        <option value="">
          {{ form.main_area_id ? 'Select sub area 1...' : 'Select main area first' }}
        </option>
        <option v-for="area in filteredSubAreas1" :key="area.id" :value="area.id">
          {{ area.sub_area_1_name }}
        </option>
      </select>
    </div>
    
    <!-- Sub Area 2 -->
    <div class="form-field">
      <label>Sub Area 2</label>
      <select 
        v-model="form.sub_area_2_id"
        :disabled="!form.sub_area_1_id"
      >
        <option value="">
          {{ form.sub_area_1_id ? 'Select sub area 2...' : 'Select sub area 1 first' }}
        </option>
        <option v-for="area in filteredSubAreas2" :key="area.id" :value="area.id">
          {{ area.sub_area_2_name }}
        </option>
      </select>
    </div>
    
    <!-- Specific Location -->
    <div class="form-field">
      <label>Specific Location</label>
      <input 
        v-model="form.specific_location"
        type="text"
        placeholder="e.g., North wall, near column A1"
        maxlength="255"
      />
    </div>
    
    <!-- Actions -->
    <div class="modal-actions">
      <button @click="save" :disabled="!form.main_area_id">Save</button>
      <button @click="cancel">Cancel</button>
      <button v-if="isEdit" @click="deleteArea" class="danger">Delete</button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      form: {
        main_area_id: null,
        sub_area_1_id: null,
        sub_area_2_id: null,
        specific_location: ''
      }
    }
  },
  computed: {
    filteredSubAreas1() {
      if (!this.form.main_area_id) return [];
      return this.subAreas1.filter(a => a.main_area_id === this.form.main_area_id);
    },
    filteredSubAreas2() {
      if (!this.form.sub_area_1_id) return [];
      return this.subAreas2.filter(a => a.sub_area_1_id === this.form.sub_area_1_id);
    }
  },
  methods: {
    onMainAreaChange() {
      // Clear dependent fields when main area changes
      this.form.sub_area_1_id = null;
      this.form.sub_area_2_id = null;
    },
    onSubArea1Change() {
      // Clear dependent field when sub area 1 changes
      this.form.sub_area_2_id = null;
    }
  }
}
</script>
```

## Integration with Material Receive Workflow

### When to Add Areas
Areas can be added/edited during any workflow step:

- **Step 5.1 (Prepare)**: Initial area entry when preparing the receive
- **Step 5.2 (Receive Check)**: Update areas based on actual storage location
- **Step 5.3 (Acknowledge)**: Final verification of storage locations

### Locked State
When `material_receives.is_locked = TRUE` (after Step 5.3), areas should be read-only.

### Display in Receive Document
Show areas in the material receive header:

```
Material Receive: RCV-20251114-001
Status: Received All
Store: Main Warehouse

📍 Storage Locations:
├─ Building A → Floor 2 → Room 201 → Shelf A1, Level 3
├─ Warehouse → Section B → Rack 10
└─ Site Storage → Near main gate

Items: [...]
```

## Benefits

1. **Precise Location Tracking**: Know exactly where materials are stored
2. **Multi-Location Support**: Materials can be split across multiple storage areas
3. **Consistent UX**: Same area input experience as patrol records
4. **Hierarchical Organization**: Logical structure from building → floor → room → specific spot
5. **Audit Trail**: Track who added/modified storage locations
6. **Easy Retrieval**: Find materials quickly using area filters

## Migration Considerations

This is a **new table** - no existing data migration needed. The table starts empty and users will add areas as they create new material receives.

---

**Created**: 2025-11-14
**Schema Version**: 1.0
**Related Tables**: `material_receives`, `main_areas`, `sub_areas_1`, `sub_areas_2`
