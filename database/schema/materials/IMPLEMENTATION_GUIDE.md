# Material Inventory System - Implementation Steps

## 📋 Deployment Checklist

### Phase 1: Database Schema (1-2 hours)

#### Step 1: Backup Current Database
```bash
# If using Supabase, use the dashboard to create a backup
# Or export current schema
pg_dump -h your-db-host -U postgres -s your_database > backup_schema.sql

# Specifically backup materials table if it exists
pg_dump -h your-db-host -U postgres -t materials your_database > backup_materials_data.sql
```

#### Step 2: Run Migration Script
```bash
# Navigate to migrations folder
cd database/migrations

# Run the deployment script
psql -h your-db-host -U postgres -d your_database -f 001_material_inventory_system.sql

# Or in Supabase SQL Editor:
# 1. Open Supabase Dashboard > SQL Editor
# 2. Copy contents of 001_material_inventory_system.sql
# 3. Click "Run" to execute
```

#### Step 3: Verify Tables Created
```sql
-- Check all tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN (
    'stores',
    'material_codes',
    'material_inventory',
    'material_receives',
    'material_receive_items',
    'material_receive_areas',
    'material_transactions'
  );

-- Should return 7 rows

-- Check default stores created
SELECT store_code, store_name, project_id, is_main_store 
FROM stores 
WHERE is_main_store = TRUE;
```

#### Step 4: Configure Row Level Security (RLS) Policies
```sql
-- Example RLS policies (adjust based on your auth setup)

-- Stores: Users can view stores in their projects
CREATE POLICY "Users can view stores in their projects"
  ON stores FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    )
  );

-- Material Codes: Users can manage codes in their projects
CREATE POLICY "Users can manage material codes in their projects"
  ON material_codes FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    )
  );

-- Material Inventory: Users can view inventory in their projects
CREATE POLICY "Users can view inventory in their projects"
  ON material_inventory FOR SELECT
  USING (
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    )
  );

-- Material Receives: Users can manage receives in their projects
CREATE POLICY "Users can manage receives in their projects"
  ON material_receives FOR ALL
  USING (
    project_id IN (
      SELECT project_id FROM user_projects WHERE user_id = auth.uid()
    )
  );

-- Add similar policies for other tables...
```

---

### Phase 2: Backend API Updates (2-3 days)

#### Step 1: Update Database Models/Types
```typescript
// types/database.ts

export interface Store {
  id: string;
  store_code: string;
  store_name: string;
  store_name_th?: string;
  project_id: string;
  company_id?: string;
  store_type: 'warehouse' | 'site_storage' | 'tool_room' | 'consumables_store';
  location_address?: string;
  is_main_store: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface MaterialCode {
  id: string;
  project_id: string;
  material_code: string;
  description?: string;
  is_active: boolean;
}

export interface MaterialInventory {
  id: string;
  inventory_code: string;
  material_template_id: number;
  material_code_id?: string;
  store_id: string;
  project_id: string;
  dimension_id?: number;
  material_description: string;
  material_description_th?: string;
  unit_of_measure: string;
  current_quantity: number;
  reserved_quantity: number;
  available_quantity: number; // computed
  average_cost: number;
  // ... other fields
}

export interface MaterialReceive {
  id: string;
  receive_number: string;
  store_id: string;
  project_id: string;
  receive_date: string;
  status: 'prepared' | 'received_all' | 'received_with_note' | 'rejected';
  
  // Step 5.1
  prepared_by?: string;
  prepared_at?: string;
  prepared_photos?: any[];
  
  // Step 5.2
  received_by?: string;
  received_at?: string;
  received_completed_at?: string; // Important for edit window
  received_photos?: any[];
  
  // Step 5.3
  acknowledged_by?: string;
  acknowledged_at?: string;
  acknowledged_photos?: any[];
  
  // Attachments
  delivery_order_attachments?: any[];
  purchase_order_attachments?: any[];
  other_attachments?: any[];
  
  is_locked: boolean;
}

export interface MaterialReceiveItem {
  id: string;
  material_receive_id: string;
  line_number: number;
  material_template_id: number;
  material_code_id?: string;
  dimension_id?: number;
  
  unit_of_measure: string;
  unit_of_measure_th?: string;
  
  prepared_quantity: number;
  received_quantity?: number;
  rejected_quantity: number;
  accepted_quantity: number; // computed
  
  unit_price?: number;
  total_price: number; // computed
  
  remark?: string;
  material_inventory_id?: string;
}
```

#### Step 2: Create API Endpoints

**Stores API:**
```typescript
// api/stores.ts
export const storeAPI = {
  // GET /api/stores?project_id=xxx
  list: async (projectId: string) => { ... },
  
  // POST /api/stores
  create: async (data: CreateStoreDTO) => { ... },
  
  // PATCH /api/stores/:id
  update: async (id: string, data: UpdateStoreDTO) => { ... },
};
```

**Material Codes API:**
```typescript
// api/material-codes.ts
export const materialCodeAPI = {
  // GET /api/material-codes?project_id=xxx
  list: async (projectId: string) => { ... },
  
  // POST /api/material-codes
  create: async (data: CreateMaterialCodeDTO) => { ... },
  
  // Check if material exists in inventory (for auto-fill)
  // GET /api/material-codes/check-inventory?template_id=xxx&store_id=xxx&dimension_id=xxx
  checkInventory: async (params) => { ... },
};
```

**Material Receive API:**
```typescript
// api/material-receives.ts
export const materialReceiveAPI = {
  // Step 5.1: Create/Prepare
  // POST /api/material-receives
  create: async (data: CreateReceiveDTO) => { ... },
  
  // Update prepared receive
  // PATCH /api/material-receives/:id
  update: async (id: string, data: UpdateReceiveDTO) => { ... },
  
  // Step 5.2: Complete receive check (creates inventory)
  // POST /api/material-receives/:id/complete-receive
  completeReceive: async (id: string, data: CompleteReceiveDTO) => {
    // 1. Update receive header with received quantities
    // 2. Create/update material_inventory records
    // 3. Link receive items to inventory
    // 4. Create material_transactions
    // 5. Set received_completed_at timestamp
    // 6. Return updated receive
  },
  
  // Step 5.3: Acknowledge (lock document)
  // POST /api/material-receives/:id/acknowledge
  acknowledge: async (id: string, data: AcknowledgeDTO) => {
    // 1. Check if within edit window or if edit window expired
    // 2. Update acknowledged fields
    // 3. Set is_locked = true
    // 4. Return final receive
  },
  
  // Check if within edit window
  canEdit: async (id: string) => {
    // Check if received_completed_at is within 1 hour and not locked
  },
};
```

**Material Inventory API:**
```typescript
// api/material-inventory.ts
export const materialInventoryAPI = {
  // GET /api/material-inventory?store_id=xxx
  list: async (filters) => { ... },
  
  // GET /api/material-inventory/:id
  get: async (id: string) => { ... },
  
  // No create/update endpoints - only via receive process
};
```

#### Step 3: Implement Photo Upload Service
```typescript
// services/photo-upload.ts
export const uploadPhoto = async (file: File, category: string) => {
  // 1. Compress image if needed
  // 2. Upload to Supabase Storage
  // 3. Return URL
  // Format: { url, caption, timestamp, uploaded_by }
};

export const uploadAttachment = async (file: File, type: 'DO' | 'PO' | 'OTHER') => {
  // Similar to photo upload
  // Format: { url, filename, type: 'camera'|'gallery', timestamp }
};
```

---

### Phase 3: Frontend UI Implementation (3-5 days)

#### Step 1: Update MaterialsView Component
```vue
<!-- views/MaterialsView.vue -->
<template>
  <div class="materials-view">
    <header>
      <h1>Materials Inventory</h1>
      <!-- REMOVE: Add Materials button -->
      <!-- ADD: Receive Materials button -->
      <button @click="openReceiveDialog" class="btn-primary">
        📦 Receive Materials
      </button>
    </header>
    
    <!-- Store filter -->
    <select v-model="selectedStore">
      <option value="">All Stores</option>
      <option v-for="store in stores" :key="store.id" :value="store.id">
        {{ store.store_name }}
      </option>
    </select>
    
    <!-- Inventory list (read-only) -->
    <table>
      <thead>
        <tr>
          <th>Material Code</th>
          <th>Description</th>
          <th>Store</th>
          <th>Available Qty</th>
          <th>Unit</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in inventory" :key="item.id">
          <td>{{ item.material_code }}</td>
          <td>{{ item.material_description }}</td>
          <td>{{ item.store_name }}</td>
          <td>{{ item.available_quantity }}</td>
          <td>{{ item.unit_of_measure }}</td>
          <td>
            <button @click="viewDetails(item)">View</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
```

#### Step 2: Create MaterialReceiveView Component (3-Step Wizard)
```vue
<!-- views/MaterialReceiveView.vue -->
<template>
  <div class="material-receive-wizard">
    <!-- Step Indicator -->
    <div class="steps">
      <div class="step" :class="{ active: currentStep === 1, completed: currentStep > 1 }">
        1. Prepare
      </div>
      <div class="step" :class="{ active: currentStep === 2, completed: currentStep > 2 }">
        2. Receive Check
      </div>
      <div class="step" :class="{ active: currentStep === 3 }">
        3. Acknowledge
      </div>
    </div>
    
    <!-- Step 5.1: Prepare -->
    <Step1Prepare v-if="currentStep === 1" 
      v-model="receiveData"
      @next="goToStep2" />
    
    <!-- Step 5.2: Receive Check -->
    <Step2ReceiveCheck v-if="currentStep === 2"
      v-model="receiveData"
      @next="completeReceive"
      @back="currentStep = 1" />
    
    <!-- Step 5.3: Acknowledge -->
    <Step3Acknowledge v-if="currentStep === 3"
      v-model="receiveData"
      @acknowledge="acknowledgeReceive" />
  </div>
</template>
```

#### Step 3: Create Step Components

**Step1Prepare.vue:**
- Store selection
- **Area input modal** (add/edit multiple storage locations)
  - Same as patrol area inputs
  - Main Area → Sub Area 1 → Sub Area 2 → Specific Location
  - See MATERIAL_RECEIVE_AREAS_GUIDE.md
- Line items grid with material code selection
- Attachment upload (DO, PO, Others)
- Photo card for prepared_photos
- Save as draft or continue

**Step2ReceiveCheck.vue:**
- Display prepared items
- Editable received_quantity (default = prepared_quantity)
- Editable rejected_quantity (default = 0)
- Show auto-calculated accepted_quantity
- Photo card for received_photos
- Complete button (creates inventory)

**Step3Acknowledge.vue:**
- Read-only review
- Show all photos from Steps 1 & 2
- Show created inventory records
- Edit window timer (if within 1 hour)
- Photo card for acknowledged_photos
- Acknowledge button (locks document)

#### Step 4: Create Reusable Components

**MaterialCodeSelector.vue:**
```vue
<template>
  <div class="material-code-selector">
    <label>Material Code</label>
    <select v-if="!autoFilled" v-model="selectedCodeId" @change="onSelect">
      <option value="">-- Select Material Code --</option>
      <option v-for="code in availableCodes" :key="code.id" :value="code.id">
        {{ code.material_code }} - {{ code.description }}
      </option>
      <option value="__create__">+ Create New Code</option>
    </select>
    
    <input v-else :value="displayCode" readonly class="auto-filled" />
    
    <!-- Create New Dialog -->
    <Dialog v-if="showCreateDialog" @close="showCreateDialog = false">
      <CreateMaterialCodeForm @created="onCodeCreated" />
    </Dialog>
  </div>
</template>
```

**PhotoCard.vue:** (Reuse from patrol photos)
- Camera button
- Gallery button
- Photo preview grid
- Delete/caption functionality

**AttachmentCard.vue:**
- Camera/Gallery buttons for document capture
- File list with preview
- Remove button
- Support for DO, PO, Others

**AreaInputModal.vue:** (Reuse from patrol area inputs)
- Main Area dropdown (required)
- Sub Area 1 dropdown (optional, enabled after Main Area)
- Sub Area 2 dropdown (optional, enabled after Sub Area 1)
- Specific Location text field (optional)
- Save/Delete actions
- Display order management for multiple areas

---

### Phase 4: Testing (1-2 days)

#### Test Checklist

**Database Tests:**
- [ ] All tables created successfully
- [ ] Foreign keys working
- [ ] Unique constraints enforced
- [ ] Computed columns calculating correctly
- [ ] RLS policies working

**API Tests:**
- [ ] Create store
- [ ] Create material code
- [ ] Create receive (Step 5.1)
- [ ] Complete receive (Step 5.2) - inventory created
- [ ] Acknowledge receive (Step 5.3) - document locked
- [ ] Edit window logic working
- [ ] Photo upload working
- [ ] Attachment upload working

**UI Tests:**
- [ ] Material code auto-fill working
- [ ] Material code selection working
- [ ] Create new material code working
- [ ] Area input modal working (add/edit/delete areas)
- [ ] Multiple areas display correctly
- [ ] Area hierarchy validation (Main → Sub1 → Sub2)
- [ ] 3-step wizard navigation
- [ ] Photo capture (camera)
- [ ] Photo selection (gallery)
- [ ] Attachment upload (DO, PO, Others)
- [ ] Quantity calculations correct
- [ ] Edit window timer display
- [ ] Document locking working

**Mobile Tests:**
- [ ] Camera access working
- [ ] Gallery access working
- [ ] Photo compression working
- [ ] Forms responsive
- [ ] Touch interactions smooth

---

### Phase 5: Deployment (1 day)

#### Step 1: Database Migration (Production)
```bash
# 1. Backup production database
# 2. Run migration script during low-traffic window
# 3. Verify all tables created
# 4. Monitor for errors
```

#### Step 2: Deploy Backend
```bash
# 1. Deploy API changes
# 2. Monitor logs
# 3. Test endpoints
```

#### Step 3: Deploy Frontend
```bash
# 1. Build production bundle
npm run build

# 2. Deploy to hosting (Netlify/Vercel)
npm run deploy

# 3. Test in production
# 4. Monitor error logs
```

#### Step 4: User Training
- [ ] Create user guide document
- [ ] Record training video
- [ ] Conduct training session
- [ ] Provide support for first week

---

## 🚀 Quick Start (For Development)

```bash
# 1. Run migration
psql -d your_database -f database/migrations/001_material_inventory_system.sql

# 2. Install dependencies (if needed)
npm install

# 3. Update environment variables
# Add any new API endpoints, storage buckets, etc.

# 4. Run development server
npm run dev

# 5. Test the workflow
# - Create a store
# - Create material codes
# - Test complete receive process (3 steps)
```

---

## 📊 Post-Deployment Monitoring

### Week 1:
- Monitor database performance
- Check for any RLS policy issues
- Gather user feedback
- Fix any UI/UX issues

### Week 2-4:
- Optimize queries if needed
- Add any requested features
- Create reports/dashboards
- Document lessons learned

---

## 🔄 Rollback Plan (If Needed)

```sql
-- 1. Drop new tables
DROP TABLE IF EXISTS material_transactions CASCADE;
DROP TABLE IF EXISTS material_receive_items CASCADE;
DROP TABLE IF EXISTS material_receives CASCADE;
DROP TABLE IF EXISTS material_inventory CASCADE;
DROP TABLE IF EXISTS material_codes CASCADE;
DROP TABLE IF EXISTS stores CASCADE;

-- 2. Restore old materials table
ALTER TABLE materials_backup_20251114 RENAME TO materials;

-- 3. Restore old application code
git revert <commit-hash>
```

---

## 📞 Support Contacts

- Database Issues: [DBA contact]
- API Issues: [Backend team]
- UI Issues: [Frontend team]
- User Training: [Training team]

---

**Estimated Total Implementation Time: 7-12 days**
- Database: 1-2 days
- Backend: 2-3 days
- Frontend: 3-5 days
- Testing: 1-2 days
- Deployment: 1 day
