# Material Inventory System - Multi-Store Architecture

## Overview
Complete restructure of material management to support multiple stores per project with proper inventory control through a **3-step Material Receive workflow**.

## Schema Architecture

### 1. **Master Catalog Layer**
- `material_groups` - Categorization of materials
- `material_templates` - **Master catalog** of what CAN be ordered/used (5-column flexible classification)
- `dimension_groups` - Grouping of dimension variants
- `dimensions` - Size/specification variants

### 2. **Store Management Layer**
- `stores` - Physical storage locations within projects
  - One project → Multiple stores (main warehouse, site stores, tool rooms, etc.)
  - Each store linked to a project
  - Supports store types: warehouse, site_storage, tool_room, consumables_store

### 3. **Inventory Layer**
- `material_inventory` - **Actual physical materials** in stores (renamed from `materials`)
  - Links: template + store + dimension = unique inventory item
  - **store_id is REQUIRED** (NOT NULL)
  - Tracks: current quantity, reserved quantity, available quantity (auto-calculated)
  - Cost tracking: average cost, last purchase cost
  - Location: bin/rack within store
  - **Can ONLY be created/updated via Material Receive process**

### 4. **Receive Process Layer (3-Step Workflow)**
- `material_receives` - Receive transaction headers
  - **Step 5.1**: Prepare (prepared_by, prepared_at, prepared_photos)
  - **Step 5.2**: Material Check by Store Keeper (received_by, received_at, received_photos)
  - **Step 5.3**: Acknowledge/Approve (acknowledged_by, acknowledged_at, acknowledged_photos)
  - Status: prepared → received_all/received_with_note/rejected → LOCKED after acknowledge
  - **Attachments with Camera/Gallery support**:
    - delivery_order_attachments (DO)
    - purchase_order_attachments (PO)
    - other_attachments
  - **Gateway for adding materials to inventory**
  - Document locked after Step 5.3 (is_locked = TRUE)

- `material_receive_items` - Line items for each receive
  - **3 quantity stages**:
    - prepared_quantity (Step 5.1 - expected)
    - received_quantity (Step 5.2 - actual received, defaults to prepared_quantity)
    - rejected_quantity (Step 5.2 - damaged/wrong, defaults to 0)
    - accepted_quantity (auto-calculated: received - rejected)
  - **Thai unit support**: unit_of_measure_th (ตัว, เส้น, กระป๋อง, แผ่น, ชิ้น, etc.)
  - **Line item remark** field
  - Lot/serial/expiry tracking
  - Quality inspection
  - Creates/updates `material_inventory` records

- `material_receive_areas` - **Multi-area location tracking** (like patrol records)
  - Supports multiple storage areas per receive
  - Hierarchical area structure:
    - main_area_id (required) → Main Area (e.g., Building A, Warehouse)
    - sub_area_1_id (optional) → Sub Area 1 (e.g., Floor 2, Section A)
    - sub_area_2_id (optional) → Sub Area 2 (e.g., Room 201, Aisle 3)
    - specific_location (optional) → Free text (e.g., "Shelf B3, Level 2")
  - Display order for multiple areas
  - Area input modal (same as patrol area inputs)
  - See MATERIAL_RECEIVE_AREAS_GUIDE.md

### 5. **Transaction Audit Layer**
- `material_transactions` - Complete audit trail
  - Types: receive, issue, transfer, adjustment, return
  - Tracks: quantity changes, costs, before/after quantities
  - References: source documents
  - Transfer tracking: from_store → to_store

## Data Flow

```
Material Template (Master Catalog)
         ↓
Material Receive - Step 5.1: Prepare
  (prepared_by, prepared_photos, DO/PO attachments)
         ↓
Material Receive - Step 5.2: Material Check
  (received_by, received_photos, confirm quantities)
         ↓
Material Receive - Step 5.3: Acknowledge
  (acknowledged_by, acknowledged_photos, LOCK document)
         ↓
  Material Inventory (in Store)
         ↓
Material Transactions (Audit Trail)
```

## Key Features

### ✅ Enforced Inventory Control
- Materials can **ONLY** be added via 3-step Material Receive process
- No direct "Add Material" from Materials View
- Proper receiving workflow with store keeper confirmation

### ✅ 3-Step Workflow with Photos
- **Step 5.1 - Prepare**: Create receive, add items, attach DO/PO, take photos
- **Step 5.2 - Material Check**: Store keeper confirms quantities (received/rejected), take photos
- **Step 5.3 - Acknowledge**: Final approval, create inventory, take photos, LOCK document

### ✅ Multi-Store Support
- Project can have multiple stores
- **store_id is REQUIRED** in material_inventory
- Each inventory item tracked per store
- Inter-store transfers supported

### ✅ Proper Separation of Concerns
- **Templates** = What exists in the catalog
- **Inventory** = What physically exists in stores (renamed from materials)
- **Receives** = How materials enter the system (3-step workflow)

### ✅ Photo & Attachment Support
- **Photos at each step**: prepared_photos, received_photos, acknowledged_photos
- **Attachments with Camera/Gallery**: 
  - DO attachments (delivery_order_attachments)
  - PO attachments (purchase_order_attachments)
  - Other attachments with captions
- Similar to patrol photo card implementation

### ✅ Thai Language Support
- unit_of_measure_th: ตัว, เส้น, กระป๋อง, แผ่น, ชิ้น, กล่อง, ถุง, etc.
- Thai descriptions supported
- Bilingual templates

### ✅ Complete Audit Trail
- Every quantity change recorded
- Track lot/serial numbers
- Cost tracking per transaction
- Before/after quantities
- User tracking for each workflow step

### ✅ Quantity Control
- **prepared_quantity**: Expected (Step 5.1)
- **received_quantity**: Actual (Step 5.2, defaults to prepared_quantity)
- **rejected_quantity**: Damaged/wrong (Step 5.2, defaults to 0)
- **accepted_quantity**: Auto-calculated (received - rejected)
- Min/max levels per inventory item
- Reserved vs available quantities
- Average cost calculation

## Migration from Old Schema

See `MIGRATION_GUIDE.sql` for detailed steps.

**Old:** `materials` table (mixed master catalog + inventory)  
**New:** 
- Renamed to `material_inventory` (clearer naming)
- Added **store_id NOT NULL** (required field)
- Separate tables for templates → stores → inventory → receives → transactions
- 3-step workflow with photos and attachments

## UI Changes Required

1. **MaterialsView** 
   - ❌ Remove "Add Materials" button (no direct adding)
   - ✅ Show only inventory items (read-only reference)
   - ✅ Link to "Receive Materials" process
   - ✅ Filter by store

2. **New: Material Receive View (3-Step Process)**
   - **Step 5.1**: Create receive, add items, attach DO/PO/others, take photos
   - **Step 5.2**: Store keeper confirms received/rejected quantities, take photos
   - **Step 5.3**: Manager acknowledges, creates inventory, locks document
   - Photo cards similar to patrol photos (Camera/Gallery buttons)
   - Attachment cards for DO, PO, Others

3. **MaterialConfigView**
   - Keep as-is (manages master catalog templates)
   - No changes needed

## Example Workflow

1. Admin configures **Material Templates** (master catalog) - MaterialConfigView
2. Project creates **Stores** (warehouses, site storage)
3. **Step 5.1**: User prepares Material Receive
   - Select store, add items from templates
   - Attach DO, PO documents (camera/gallery)
   - Take prepared_photos
   - Status: `prepared`
4. **Step 5.2**: Store Keeper checks materials
   - Confirm received_quantity (defaults to prepared_quantity)
   - Enter rejected_quantity (defaults to 0)
   - Take received_photos
   - Status: `received_all` or `received_with_note` or `rejected`
5. **Step 5.3**: Manager acknowledges
   - Review all data and photos
   - Take acknowledged_photos
   - Approve → **Material Inventory** created/updated
   - **Transactions** auto-generated
   - Document **LOCKED** (is_locked = TRUE)
6. Users view **Material Inventory** to see available stock
7. Materials issued/transferred → New transactions created

## Benefits

- ✅ Proper inventory control with 3-step verification
- ✅ Multi-location tracking (store_id required)
- ✅ Complete audit trail with user tracking
- ✅ Prevents unauthorized material additions
- ✅ Better cost tracking
- ✅ Lot/serial/expiry tracking
- ✅ Quality control integration with store keeper confirmation
- ✅ Realistic warehouse operations workflow
- ✅ Photo documentation at each step (like patrol photos)
- ✅ Document attachment with camera/gallery support
- ✅ Thai language support for units and descriptions
- ✅ Clear naming: material_inventory (not materials)
- ✅ Document locking after final approval
- ✅ Default quantity handling (received defaults to prepared, rejected defaults to 0)
- ✅ Auto-calculated accepted quantity

