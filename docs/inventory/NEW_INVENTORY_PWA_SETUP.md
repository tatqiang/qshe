# INVENTORY PWA - SETUP GUIDE FROM QSHE COPY

## 📋 STEP-BY-STEP SETUP PROCESS

### PHASE 1: COPY & PREPARE (YOU DO THIS)

#### Step 1: Copy the Folder
```cmd
cd c:\pwa\qshe10
xcopy qshe inventory /E /H /I
```

**Result:**
```
c:\pwa\qshe10\
  ├── qshe\          ← Original QSHE PWA (keep unchanged)
  └── inventory\     ← New Inventory PWA (we'll clean this up)
```

#### Step 2: Verify the Copy
```cmd
cd c:\pwa\qshe10\inventory
dir
```

You should see all files copied.

---

### PHASE 2: CLEANUP (I WILL DO THIS)

Once you've copied the folder, I will clean up and keep only:

#### ✅ KEEP (Core Infrastructure):

**1. React + Vite Setup**
- `vite.config.ts`
- `tsconfig.json`
- `package.json` (cleaned up)
- `index.html`

**2. Tailwind CSS**
- `tailwind.config.js`
- `postcss.config.js`

**3. Essential UI Components**
- `src/components/Navbar.tsx` (top navigation)
- `src/components/BottomBar.tsx` (bottom navigation)
- `src/components/Layout.tsx` (page wrapper)

**4. Authentication**
- `src/lib/supabase.ts` (or auth setup)
- `src/contexts/AuthContext.tsx`
- `src/pages/Login.tsx`
- `src/hooks/useAuth.ts`

**5. Routing**
- `src/App.tsx` (main router)
- `src/routes/` (route definitions)

**6. Basic Structure**
```
src/
  ├── components/
  │   ├── Navbar.tsx
  │   ├── BottomBar.tsx
  │   └── Layout.tsx
  ├── contexts/
  │   └── AuthContext.tsx
  ├── hooks/
  │   └── useAuth.ts
  ├── lib/
  │   └── supabase.ts
  ├── pages/
  │   ├── Login.tsx
  │   └── Dashboard.tsx
  ├── types/
  │   └── index.ts
  ├── App.tsx
  └── main.tsx
```

---

#### ❌ REMOVE (QSHE-Specific Files):

**1. Database Files**
- Delete `database/` folder entirely
- We'll create new inventory schema later

**2. QSHE-Specific Components**
- `src/pages/SafetyPatrol/`
- `src/pages/SafetyAudit/`
- `src/pages/CorrectiveAction/`
- `src/components/PatrolForm/`
- `src/components/AuditForm/`
- All safety-related components

**3. QSHE-Specific Services**
- `src/services/patrol*.ts`
- `src/services/audit*.ts`
- `src/services/observation*.ts`

**4. QSHE Types**
- `src/types/patrol.ts`
- `src/types/audit.ts`
- `src/types/observation.ts`

**5. Old Documentation**
- `docs/` folder (except inventory/)
- Keep only `docs/inventory/`

**6. Test Data**
- `data_from_server/`
- `backup_safety_audit/`

**7. Scripts**
- All `.bat`, `.cmd`, `.sh` files related to QSHE
- Migration scripts
- Database setup scripts

---

### PHASE 3: RECONFIGURE (I WILL DO THIS)

#### Update `package.json`
```json
{
  "name": "inventory-pwa",
  "version": "1.0.0",
  "description": "MEP Inventory Management System",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@supabase/supabase-js": "^2.38.0",
    "tailwindcss": "^3.3.0"
  }
}
```

#### Update `.env` file
```env
# Change from QSHE to Inventory
VITE_SUPABASE_URL=your_inventory_supabase_url
VITE_SUPABASE_ANON_KEY=your_inventory_supabase_key
VITE_APP_NAME=Inventory Management
```

#### Update Navigation
```tsx
// src/components/Navbar.tsx - Update menu items
const menuItems = [
  { label: 'Dashboard', path: '/dashboard', icon: '📊' },
  { label: 'Materials', path: '/materials', icon: '📦' },
  { label: 'Stock', path: '/stock', icon: '📈' },
  { label: 'Suppliers', path: '/suppliers', icon: '🏢' },
];
```

---

### PHASE 4: CREATE INVENTORY STRUCTURE (I WILL DO THIS)

#### New Folders to Create
```
src/
  ├── features/
  │   └── inventory/
  │       ├── components/
  │       ├── services/
  │       ├── types/
  │       └── hooks/
  ├── pages/
  │   ├── Login.tsx
  │   ├── Dashboard.tsx
  │   ├── Materials.tsx
  │   ├── Stock.tsx
  │   └── Suppliers.tsx
```

#### New Pages to Create
1. **Dashboard** - Inventory overview
2. **Materials** - Material catalog
3. **Stock** - Stock levels
4. **Suppliers** - Supplier management

---

## 🎯 WHAT YOU'LL HAVE AFTER CLEANUP

### Clean Inventory PWA with:
✅ React 18 + TypeScript
✅ Vite build tool
✅ Tailwind CSS styling
✅ Supabase authentication
✅ Top navbar component
✅ Bottom bar component
✅ Layout wrapper
✅ Login functionality
✅ Protected routes
✅ Responsive design

### Ready to Add:
- Material catalog
- Inventory tracking
- Supplier management
- Stock transactions

---

## 📝 STEP-BY-STEP INSTRUCTIONS

### FOR YOU:

**Step 1:** Copy the folder
```cmd
cd c:\pwa\qshe10
xcopy qshe inventory /E /H /I
```

**Step 2:** Tell me when done
Just say: "Folder copied, ready for cleanup"

### FOR ME:

**Step 3:** I will execute cleanup
- Delete QSHE-specific files
- Update package.json
- Update navigation
- Create basic inventory structure

**Step 4:** You test the cleaned setup
```cmd
cd c:\pwa\qshe10\inventory
npm install
npm run dev
```

---

## 🔍 FILES TO REVIEW BEFORE CLEANUP

Before I delete everything, let me know if you want to keep any specific:

1. **Custom components** you created?
2. **Utility functions** that might be useful?
3. **Styling patterns** or theme colors?
4. **Layout patterns** you like?

---

## ⚠️ IMPORTANT NOTES

1. **Don't modify QSHE folder** - keep it as-is for production
2. **Backup before cleanup** - just in case (but you have the copy!)
3. **Database will be separate** - new Supabase project or new schema
4. **Authentication can be shared** - same Azure AD/Supabase tenant

---

## 🚀 AFTER CLEANUP, WE'LL CREATE:

### Week 1: Basic Inventory
- Material categories (3 levels)
- Material master data
- Simple material list/search

### Week 2: Stock Management
- Stock locations
- Stock levels
- Receive materials
- Issue materials

### Week 3: Suppliers
- Supplier master
- Material-supplier relationships
- Pricing

### Week 4: Transactions
- Transaction history
- Stock movements
- Reports

---

## ✅ READY TO START?

**Your action:**
1. Copy the folder: `xcopy qshe inventory /E /H /I`
2. Reply with: "Folder copied at c:\pwa\qshe10\inventory"

**My action:**
3. Cleanup all QSHE-specific code
4. Keep only React + Tailwind + Navbar + BottomBar + Login
5. Create basic Inventory structure

---

**Let me know when you're ready!** 🎯
