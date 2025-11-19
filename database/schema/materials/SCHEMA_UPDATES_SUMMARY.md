# Schema Update Summary - Material Inventory System

## Date: 2025-11-14

## Changes Implemented

### 1. ✅ Table Rename: `materials` → `material_inventory`
**Reason:** Clearer naming - distinguishes actual inventory from material templates (master catalog)

**Files Updated:**
- `schema_materials` - Updated to use `material_inventory` table name
- Added deprecation notice for old `materials` name

### 2. ✅ Added REQUIRED `store_id` Field
**Change:** `material_inventory` now has `store_id uuid NOT NULL`

**Impact:**
- Every inventory item MUST belong to a specific store
- Supports multi-store operations per project
- Foreign key to `stores` table

**Related:**
- Created `schema_stores` - Physical storage locations table
- One project can have multiple stores
- Store types: warehouse, site_storage, tool_room, etc.

### 3. ✅ 3-Step Material Receive Workflow
**New Process Flow:**

#### Step 5.1: Prepare Material Receive
- User: Warehouse Admin/Purchaser
- Actions: Create receive, add items, attach documents
- Status: `prepared`
- Fields: `prepared_by`, `prepared_at`, `prepared_photos`

#### Step 5.2: Material Check
- User: Store Keeper
- Actions: Confirm quantities (received/rejected)
- Status: `received_all`, `received_with_note`, or `rejected`
- Fields: `received_by`, `received_at`, `received_photos`, `received_notes`

#### Step 5.3: Acknowledge
- User: Manager
- Actions: Final approval, create inventory, lock document
- Fields: `acknowledged_by`, `acknowledged_at`, `acknowledged_photos`, `acknowledged_notes`
- Result: `is_locked = TRUE`, inventory created, status locked

**Files Updated:**
- `schema_material_receives` - Added all 3-step workflow fields

### 4. ✅ Quantity Tracking in Receive Items

**New Fields in `material_receive_items`:**
- `prepared_quantity` (Step 5.1 - expected quantity)
- `received_quantity` (Step 5.2 - actual received, defaults to prepared_quantity)
- `rejected_quantity` (Step 5.2 - damaged/wrong, defaults to 0)
- `accepted_quantity` (AUTO-CALCULATED: received - rejected)

**Removed/Changed:**
- Old single `received_quantity` replaced with 3-tier system

### 5. ✅ Thai Language Support

**New Field:** `unit_of_measure_th` in `material_receive_items`

**Examples:**
- ตัว (items/pieces)
- เส้น (strands/wires)
- กระป๋อง (cans)
- แผ่น (sheets)
- ชิ้น (pieces)
- กล่อง (boxes)
- ถุง (bags)

### 6. ✅ Line Item Remarks

**New Field:** `remark` text field in `material_receive_items`

**Purpose:** Store-specific notes for each line item in the receive

### 7. ✅ Document Attachments with Camera/Gallery

**New Fields in `material_receives`:**
```json
delivery_order_attachments: [{url, filename, type: 'camera'|'gallery', timestamp}]
purchase_order_attachments: [{url, filename, type: 'camera'|'gallery', timestamp}]
other_attachments: [{url, filename, type: 'camera'|'gallery', caption, timestamp}]
```

**Features:**
- Multiple files per type
- Camera capture support
- Gallery/folder selection
- Filename and timestamp tracking
- Captions for "other" attachments

### 8. ✅ Photo Support at Each Workflow Step

**New Fields in `material_receives`:**
```json
prepared_photos: [{url, caption, timestamp, uploaded_by}]
received_photos: [{url, caption, timestamp, uploaded_by}]
acknowledged_photos: [{url, caption, timestamp, uploaded_by}]
```

**UI Implementation:**
- Photo card similar to patrol photos
- Camera and Gallery buttons
- Dashed border placeholder
- "No photos added" / "Tap Camera or Gallery to add photos"
- Preview thumbnails with captions

### 9. ✅ Document Locking

**New Field:** `is_locked boolean` in `material_receives`

**Behavior:**
- Set to `TRUE` after Step 5.3 acknowledgment
- Prevents further updates to status or quantities
- Ensures data integrity after approval

### 10. ✅ Status Enum Updated

**Old Status Values:**
- draft, received, inspected, accepted, rejected

**New Status Values:**
- `prepared` - Step 5.1 complete
- `received_all` - Step 5.2 complete, all items OK
- `received_with_note` - Step 5.2 complete, some discrepancies
- `rejected` - Entire shipment rejected
- (Status locked after Step 5.3)

---

## Files Created/Updated

### Created Files:
1. ✅ `schema_stores` - Store locations table
2. ✅ `schema_material_inventory` - Inventory table (separate file)
3. ✅ `schema_material_receives` - Receive headers with 3-step workflow
4. ✅ `schema_material_receive_items` - Receive line items
5. ✅ `schema_material_transactions` - Audit trail
6. ✅ `MIGRATION_GUIDE.sql` - Migration steps from old schema
7. ✅ `SCHEMA_ARCHITECTURE.md` - Complete architecture documentation
8. ✅ `RECEIVE_WORKFLOW_GUIDE.md` - Detailed 3-step workflow guide

### Updated Files:
1. ✅ `schema_materials` - Renamed to material_inventory with store_id

---

## Database Schema Summary

### Table Relationships:
```
projects (1) ----< (n) stores
stores (1) ----< (n) material_inventory
material_templates (1) ----< (n) material_inventory
dimensions (1) ----< (n) material_inventory

stores (1) ----< (n) material_receives
material_receives (1) ----< (n) material_receive_items
material_templates (1) ----< (n) material_receive_items

material_inventory (1) ----< (n) material_transactions
material_receive_items (n) ----> (1) material_inventory (link after acknowledge)
```

### Unique Constraints:
- `material_inventory`: (material_template_id, store_id, dimension_id) = UNIQUE
  - One inventory record per template+store+dimension combination

---

## Business Rules

1. ✅ **Materials can ONLY be added via Material Receive 3-step process**
2. ✅ **store_id is REQUIRED** in material_inventory
3. ✅ **Step 5.1**: Prepared quantities set
4. ✅ **Step 5.2**: Store keeper confirms with received/rejected (defaults: received=prepared, rejected=0)
5. ✅ **Step 5.3**: Manager acknowledges, inventory created, document locked
6. ✅ **After Step 5.3**: No updates to status or quantities allowed (is_locked=TRUE)
7. ✅ **Photos can be taken at each step** (prepared, received, acknowledged)
8. ✅ **Attachments support Camera and Gallery** input (DO, PO, Others)
9. ✅ **accepted_quantity auto-calculated**: received_quantity - rejected_quantity
10. ✅ **Status locked after acknowledgment** - workflow complete

---

## UI Implementation Notes

### MaterialsView Changes:
- ❌ **REMOVE** "Add Materials" button
- ✅ Show inventory items (read-only)
- ✅ Add "Receive Materials" button → Opens Material Receive workflow
- ✅ Filter by store
- ✅ Show source receive documents

### New Material Receive View:
#### Step 5.1 Form:
- Store selection dropdown
- Line items grid (add from templates)
- Fields: prepared_quantity, unit, unit_th, price, remark
- Attachment cards: DO (camera/gallery), PO (camera/gallery), Others (camera/gallery + caption)
- Photo card: prepared_photos (camera/gallery)
- Save as `prepared` status

#### Step 5.2 Form:
- Show prepared items (read-only prepared_quantity)
- Edit: received_quantity (default=prepared), rejected_quantity (default=0)
- Show auto-calculated accepted_quantity
- Inspection status dropdown
- Photo card: received_photos
- Submit → Status: received_all/received_with_note/rejected

#### Step 5.3 Form:
- Show all data (read-only)
- Display all photos from Steps 5.1 and 5.2
- Photo card: acknowledged_photos
- Acknowledge button → Creates inventory, locks document (is_locked=TRUE)

### Photo Card Component:
- Reuse existing patrol photo card design
- Dashed border, placeholder image
- "No photos added" text
- "Tap Camera or Gallery to add photos"
- Camera + Gallery buttons
- Thumbnail preview with captions
- Delete/replace functionality

### Attachment Card Component:
- Card for each type: DO, PO, Others
- Camera + Gallery buttons
- Multiple file support
- Show filename, type icon
- Remove button for each file
- Caption input for "Others"

---

## Migration Steps

1. ✅ Create new tables (in order):
   - stores
   - material_inventory (updated from materials)
   - material_receives
   - material_receive_items
   - material_transactions

2. Create default main store for each project

3. Migrate existing `materials` data to `material_inventory`

4. Rename old `materials` table to `materials_deprecated_backup`

5. Update application code:
   - Change all references: materials → material_inventory
   - Remove "Add Materials" button
   - Implement 3-step receive workflow UI
   - Implement photo cards
   - Implement attachment cards

6. Test thoroughly

7. Drop deprecated backup table after verification

---

## Next Steps (Implementation)

### Backend:
1. Create/run migration SQL scripts
2. Update API endpoints:
   - `POST /api/material-receives` (Step 5.1)
   - `PATCH /api/material-receives/:id/check` (Step 5.2)
   - `POST /api/material-receives/:id/acknowledge` (Step 5.3)
3. Add photo upload endpoints (with compression)
4. Add attachment upload endpoints
5. Implement business logic for quantity calculations
6. Implement document locking logic
7. Implement inventory creation on acknowledge

### Frontend:
1. Update MaterialsView (remove Add button, add Receive button)
2. Create MaterialReceiveView with 3 steps
3. Create photo card component (reuse patrol photo code)
4. Create attachment card component
5. Add Thai unit input/selection
6. Add line item remark field
7. Implement workflow state management
8. Add validation for quantities
9. Add document locking UI
10. Test on mobile (camera/gallery)

### Testing:
1. Test complete 3-step workflow
2. Test photo upload from camera/gallery
3. Test attachment upload
4. Test quantity calculations
5. Test document locking
6. Test Thai language display
7. Test multi-store scenarios
8. Test mobile responsiveness

---

## Documentation Files

All documentation is in: `database/schema/materials/`

1. **SCHEMA_ARCHITECTURE.md** - Complete system overview
2. **RECEIVE_WORKFLOW_GUIDE.md** - Detailed 3-step workflow guide
3. **MIGRATION_GUIDE.sql** - Migration steps and SQL
4. **This file** - Summary of all changes

---

## Questions/Clarifications Needed

None - all requirements implemented as specified:
- ✅ Renamed materials → material_inventory
- ✅ Added store_id (required)
- ✅ 3-step workflow (prepare, receive check, acknowledge)
- ✅ Thai units support
- ✅ Line item remarks
- ✅ DO/PO/Other attachments with camera/gallery
- ✅ Photos at each step (like patrol photos)
- ✅ Quantity tracking (prepared/received/rejected/accepted)
- ✅ Document locking after acknowledgment
- ✅ Status no longer updates after acknowledgment

---

**Schema Update Complete! ✅**
