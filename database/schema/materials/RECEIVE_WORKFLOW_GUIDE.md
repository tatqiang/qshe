# Material Receive Workflow - 3-Step Process

## Overview
Material Receive is the **ONLY** way to add materials to inventory. This document describes the complete 3-step workflow with photo support at each stage.

## 🔄 Workflow Stages

### Step 5.1: Prepare Material Receive
**Role:** Warehouse Admin / Purchaser  
**Status:** `prepared`

#### Actions:
1. Create new Material Receive document
2. Select target **Store** (warehouse, site storage, etc.)
3. **Add Storage Location(s)** (Optional):
   - Click "Add Area" to add storage locations
   - Can add multiple areas where materials will be stored
   - Use hierarchical area selector (Main Area → Sub Area 1 → Sub Area 2 → Specific Location)
   - See MATERIAL_RECEIVE_AREAS_GUIDE.md for details
4. Add line items from Material Templates
5. For each item:
   - Select material template
   - Select dimension variant (if applicable)
   - **Select/Create Material Code**:
     - If item exists in current inventory → **Auto-display** saved material code
     - If new item from template → **User selects** from material_codes or creates new code
   - **Enter Specific Detail** (Optional):
     - Custom detail for this variant (e.g., "Hot dip", "Galvanized", "Painted red")
     - Allows multiple variants of same template with different details
   - Enter **prepared_quantity** (expected quantity)
   - Enter **unit_of_measure** (PCS, KG, M, etc.)
   - Enter **unit_of_measure_th** (ตัว, เส้น, กระป๋อง, แผ่น, ชิ้น, กล่อง, ถุง, etc.)
   - Enter unit price (optional)
   - Enter lot number, serial numbers (if required)
   - Add **remark** for this item
6. **Attach Documents** (with Camera/Gallery support):
   - **Delivery Order (DO)** - multiple files supported
   - **Purchase Order (PO)** - multiple files supported
   - **Other documents** - with captions
7. **Take Photos** (prepared_photos) - like patrol photo card
8. Add general remarks
9. Save as `prepared` status

#### Database Updates:
```sql
INSERT INTO material_receives (
  receive_number, store_id, project_id,
  status, prepared_by, prepared_at,
  prepared_photos,
  delivery_order_attachments,
  purchase_order_attachments,
  other_attachments,
  remarks
) VALUES (...);

INSERT INTO material_receive_items (
  material_receive_id, line_number,
  material_template_id, material_code_id, dimension_id,
  specific_detail,
  prepared_quantity, 
  unit_of_measure, unit_of_measure_th,
  unit_price, remark
) VALUES (...);

-- Insert storage location(s)
INSERT INTO material_receive_areas (
  material_receive_id,
  main_area_id, sub_area_1_id, sub_area_2_id,
  specific_location, display_order
) VALUES (...);
```

---

### Step 5.2: Material Check (Store Keeper Confirmation)
**Role:** Store Keeper  
**Status:** `received_all`, `received_with_note`, or `rejected`  
**⚠️ IMPORTANT:** Inventory is **created/updated immediately** when this step completes

#### Actions:
1. Open prepared Material Receive
2. For each line item:
   - Review **prepared_quantity** (default shown)
   - Enter **received_quantity** (actual received) - defaults to prepared_quantity
   - Enter **rejected_quantity** (damaged/wrong/missing) - defaults to 0
   - System auto-calculates: **accepted_quantity** = received_quantity - rejected_quantity
   - Update inspection_status: pending/passed/failed
   - Add inspection_notes if needed
   - Update remark if needed
3. **Take Photos** (received_photos) during physical check
4. Add received_notes (overall comments)
5. Determine final status:
   - `received_all` - all items received as expected
   - `received_with_note` - some items rejected or quantity discrepancies
   - `rejected` - entire shipment rejected
6. **Complete Step 5.2** → System immediately:
   - Creates/updates **Material Inventory** records
   - Links material_code_id to inventory
   - Creates **Material Transaction** audit records
   - Sets `received_completed_at` timestamp
   - **1-hour edit window starts** (can edit before Step 5.3)
7. Save/Submit for acknowledgment

#### Database Updates:
```sql
-- 1. Update receive header
UPDATE material_receives SET
  status = 'received_all', -- or received_with_note/rejected
  received_by = :user_id,
  received_at = NOW(),
  received_completed_at = NOW(), -- Start 1-hour edit window
  received_photos = :photos_array,
  received_notes = :notes
WHERE id = :receive_id;

-- 2. Update line items
UPDATE material_receive_items SET
  received_quantity = :actual_qty,  -- default from prepared_quantity
  rejected_quantity = :rejected_qty, -- default 0
  inspection_status = 'passed', -- or failed
  inspection_notes = :notes
WHERE material_receive_id = :receive_id;
-- accepted_quantity auto-calculated by database

-- 3. CREATE/UPDATE INVENTORY IMMEDIATELY (Step 5.2)
INSERT INTO material_inventory (
  material_template_id, material_code_id, store_id, dimension_id,
  project_id, company_id,
  material_description, unit_of_measure,
  current_quantity, average_cost, ...
)
VALUES (...)
ON CONFLICT (material_template_id, store_id, dimension_id)
DO UPDATE SET
  current_quantity = material_inventory.current_quantity + EXCLUDED.current_quantity,
  material_code_id = EXCLUDED.material_code_id, -- Update code if changed
  average_cost = calculate_weighted_avg(...);

-- 4. Link receive items to inventory
UPDATE material_receive_items SET
  material_inventory_id = :inventory_id
WHERE material_receive_id = :receive_id;

-- 5. Create transaction records
INSERT INTO material_transactions (
  material_inventory_id, store_id, project_id,
  transaction_type, transaction_date,
  quantity_change, quantity_before, quantity_after,
  unit_cost, reference_type, reference_id,
  performed_by
) VALUES (
  :inventory_id, :store_id, :project_id,
  'receive', NOW(),
  :accepted_quantity, :qty_before, :qty_after,
  :unit_price, 'receive', :receive_id,
  :received_by
);
```

---

### Step 5.3: Acknowledge (Final Approval & Lock)
**Role:** Warehouse Manager / Project Manager  
**Status:** Remains same as Step 5.2 (status locked after this step)  
**Note:** Inventory already created in Step 5.2; this step **locks** the document

#### Edit Window:
- **Within 1 hour** of Step 5.2 completion: Can still edit quantities/data
- **After 1 hour** OR **After Step 5.3**: Document fully locked, no edits allowed

#### Actions:
1. Review Material Receive document
2. Review all line items with quantities
3. Review all photos from previous steps
4. **Within 1 hour of Step 5.2**: Can still make corrections if needed
5. **Take Photos** (acknowledged_photos) if needed
6. Add acknowledged_notes (approval comments)
7. **Acknowledge/Approve** the receive
8. System **LOCKS** the document permanently
9. No further changes allowed

#### Database Updates:
```sql
-- Lock the receive document (inventory already created in Step 5.2)
UPDATE material_receives SET
  acknowledged_by = :user_id,
  acknowledged_at = NOW(),
  acknowledged_photos = :photos_array,
  acknowledged_notes = :notes,
  is_locked = TRUE  -- No more changes allowed
WHERE id = :receive_id;

-- Inventory and transactions already created in Step 5.2
-- This step only locks the document for final approval
```

---

## 📷 Photo Support (Similar to Patrol Photos)

### Photo Card Structure
Each workflow step has its own photo array stored as JSONB:

```json
{
  "prepared_photos": [
    {
      "url": "https://storage.../photo1.jpg",
      "caption": "Delivery truck arrival",
      "timestamp": "2025-11-14T10:30:00Z",
      "uploaded_by": "user_id"
    }
  ],
  "received_photos": [
    {
      "url": "https://storage.../photo2.jpg",
      "caption": "Material inspection",
      "timestamp": "2025-11-14T11:00:00Z",
      "uploaded_by": "user_id"
    }
  ],
  "acknowledged_photos": [
    {
      "url": "https://storage.../photo3.jpg",
      "caption": "Final storage location",
      "timestamp": "2025-11-14T11:30:00Z",
      "uploaded_by": "user_id"
    }
  ]
}
```

### UI Components
- **Camera Button** - Take photo using device camera
- **Gallery Button** - Select from device gallery
- **Photo Preview** - Show thumbnails with captions
- **Photo Card** - Dashed border, "No photos added" placeholder
- **Tap to add** - "Tap Camera or Gallery to add photos"

---

## 📎 Attachment Support (DO, PO, Others)

### Attachment Types

#### 1. Delivery Order (DO) Attachments
```json
{
  "delivery_order_attachments": [
    {
      "url": "https://storage.../do_001.pdf",
      "filename": "DO-2025-001.pdf",
      "type": "camera",  // or "gallery"
      "timestamp": "2025-11-14T10:00:00Z",
      "uploaded_by": "user_id"
    }
  ]
}
```

#### 2. Purchase Order (PO) Attachments
```json
{
  "purchase_order_attachments": [
    {
      "url": "https://storage.../po_001.pdf",
      "filename": "PO-2025-001.pdf",
      "type": "gallery",
      "timestamp": "2025-11-14T10:05:00Z",
      "uploaded_by": "user_id"
    }
  ]
}
```

#### 3. Other Attachments
```json
{
  "other_attachments": [
    {
      "url": "https://storage.../cert_001.jpg",
      "filename": "Material_Certificate.jpg",
      "caption": "Quality certificate from supplier",
      "type": "camera",
      "timestamp": "2025-11-14T10:10:00Z",
      "uploaded_by": "user_id"
    }
  ]
}
```

### UI Components for Attachments
- **Card for each type**: DO, PO, Others
- **Camera/Gallery buttons** in each card
- **Multiple file support** - can attach multiple documents per type
- **File preview** - show filename, type icon, remove button
- **Caption input** for "Others" type

---

## 📊 Status Flow

```
prepared 
   ↓
   ├─→ received_all (all items OK)
   ├─→ received_with_note (some rejected/discrepancy)
   └─→ rejected (entire shipment rejected)
   ↓
acknowledged (LOCKED - no more updates)
```

### Status Rules
1. **prepared**: Can edit everything, add/remove items
2. **received_all/received_with_note/rejected**: 
   - Inventory **created immediately** when Step 5.2 completes
   - Can edit for **1 hour** after `received_completed_at`
   - After 1 hour: can only acknowledge (Step 5.3)
3. **After acknowledged** (Step 5.3): 
   - `is_locked = TRUE`
   - No updates allowed to status or quantities
   - Document permanently locked
   - Inventory already created in Step 5.2

---

## 📝 Data Examples

### Thai Units (unit_of_measure_th)
Common Thai unit names:
- **ตัว** - items/pieces (for items like pipes, rods)
- **เส้น** - strands/wires/cables
- **กระป๋อง** - cans
- **แผ่น** - sheets
- **ชิ้น** - pieces
- **กล่อง** - boxes
- **ถุง** - bags
- **ถัง** - drums/tanks
- **ม้วน** - rolls
- **ชุด** - sets

### Complete Example

**Step 5.1 - Prepare:**
```
Material Template: Black Steel ERW Sch 40 Grade A | Pipe | 1/2 inch / 15 mm
Material Code: STEEL-PIPE-001 (auto-filled if exists in inventory, or selected/created)
Specific Detail: Hot dip galvanized (Optional - for this specific variant)
Prepared Quantity: 100
Unit: PCS
Unit (Thai): ตัว
Unit Price: 85.50 THB
Remark: For building A foundation
Photos: [truck_arrival.jpg, packing_list.jpg]
DO Attachments: [DO-001.pdf]
PO Attachments: [PO-2025-001.pdf]
```

**Step 5.2 - Receive Check:**
```
Received Quantity: 98 (2 missing)
Rejected Quantity: 5 (damaged during transport)
Accepted Quantity: 93 (auto-calculated)
Inspection: passed (for accepted items)
Inspection Notes: "2 pieces missing from shipment, 5 pieces with visible dents"
Photos: [inspection1.jpg, damaged_items.jpg]
Status: received_with_note
→ **Inventory Created**: 93 pieces added to store inventory with material_code STEEL-PIPE-001
→ **Transaction Created**: Receive transaction recorded
→ **Edit Window**: 1 hour from now to make corrections
```

**Step 5.3 - Acknowledge:**
```
Review: All data and photos from Step 5.1 and 5.2
Review Inventory: 93 pieces already in inventory (created in Step 5.2)
Edit Window: Expired (or within 1 hour if needed)
Acknowledged by: Manager
Acknowledged Notes: "Approved. Will claim missing/damaged from supplier."
Photos: [final_storage.jpg]
Result: 
  - Document LOCKED permanently
  - No further changes allowed
  - Inventory already created in Step 5.2
  - Variant tracked: STEEL-PIPE-001 | Hot dip galvanized | 93 PCS
```

---

## 🚫 Important Business Rules

1. ✅ Materials can **ONLY** be added via Material Receive 3-step process
2. ✅ Each receive must go through all 3 steps
3. ✅ **Material Code Selection** (Step 5.1):
   - If material exists in inventory → Auto-display saved material_code
   - If new material from template → User selects/creates material_code
4. ✅ Store Keeper (Step 5.2) must confirm quantities
5. ✅ Default received_quantity = prepared_quantity
6. ✅ Default rejected_quantity = 0
7. ✅ Accepted quantity auto-calculated
8. ✅ Photos can be taken at each step
9. ✅ **Inventory created immediately when Step 5.2 completes**
10. ✅ **1-hour edit window** after Step 5.2 before final lock
11. ✅ After acknowledgment (Step 5.3):
   - Document is locked permanently
   - No updates allowed
   - Status locked
12. ✅ One inventory record per (template + store + dimension)
13. ✅ All attachments support Camera + Gallery input
14. ✅ Material codes are project-specific (unique per project)

---

## 🎯 UI Views Required

### 1. Material Receive List
- Filter by status, date, store
- Show receive number, date, store, status
- Show edit window status (if within 1 hour of Step 5.2)
- Action buttons based on status

### 2. Material Receive Form (Step 5.1)
- Store selection
- Line items grid
- **Material Code Selection**:
  - Search existing inventory → auto-fill material_code
  - New item → dropdown from material_codes table or create new
  - Display: code + description
- Attachment cards (DO, PO, Others) with Camera/Gallery
- Photo card for prepared_photos
- Save as prepared

### 3. Material Check Form (Step 5.2)
- Read-only prepared info
- Editable received/rejected quantities per item
- Photo card for received_photos
- **Complete Step 5.2** button:
  - Creates inventory immediately
  - Starts 1-hour edit window
  - Sets received_completed_at timestamp

### 4. Acknowledge Form (Step 5.3)
- Read-only review of all data
- Show all photos from previous steps
- Show inventory creation status (already created in Step 5.2)
- **Show edit window timer** if within 1 hour
- Photo card for acknowledged_photos
- Acknowledge button (final lock)
- No inventory creation (already done in Step 5.2)

### 5. Material Inventory View (Read-Only)
- ❌ Remove "Add Materials" button
- ✅ Show inventory by store
- ✅ Display **material_code** for each item
- ✅ Link to "Receive Materials" process
- ✅ Display source receives

---

## 📱 Mobile Support

All photo features must work on mobile:
- ✅ Native camera access
- ✅ Photo gallery/file picker
- ✅ Image compression/resize before upload
- ✅ Preview thumbnails
- ✅ Captions
- ✅ Delete/replace photos

Similar to existing patrol photo implementation.
