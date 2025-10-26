# Company Multi-Select Integration - Safety Audit Form

**Date:** October 16, 2025  
**Feature:** Dynamic Company Selection with Real Database  
**Status:** ✅ **COMPLETE**

---

## 📋 Overview

Replaced static company checkboxes in the Safety Audit form with a dynamic, searchable multi-select dropdown component that fetches real data from the Supabase `companies` table and allows users to add new companies on-the-fly.

---

## 🎯 What Was Changed

### 1. **Created New Component: `CompanyMultiSelect.tsx`**

**Location:** `src/components/common/CompanyMultiSelect.tsx`

**Features:**
- ✅ Fetches companies from Supabase `companies` table
- ✅ Real-time search and filtering (searches both `name` and `name_th`)
- ✅ Multi-select with tag/chip UI
- ✅ Add new company functionality with confirmation modal
- ✅ RLS error handling with user-friendly messages
- ✅ Click-outside-to-close behavior
- ✅ Loading states and animations
- ✅ Accessibility features (keyboard navigation ready)

**Props:**
```typescript
interface CompanyMultiSelectProps {
  selectedCompanyIds: string[];
  onSelectionChange: (companyIds: string[]) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}
```

**Usage Example:**
```tsx
<CompanyMultiSelect
  selectedCompanyIds={selectedCompanies}
  onSelectionChange={setSelectedCompanies}
  placeholder="Search or add companies..."
  label="Companies"
  required={false}
/>
```

---

### 2. **Updated SafetyAuditFormV3.tsx**

**Changes Made:**

**Before (Lines 666-696):**
```tsx
{/* Companies */}
<div className="md:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-2">
    Companies
  </label>
  <div className="flex flex-wrap gap-2">
    {companies.map((company) => (
      <label key={company.id} className="inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={selectedCompanies.includes(company.id)}
          onChange={(e) => { /* ... */ }}
          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
        />
        <span className="text-sm text-gray-700">
          {company.name_th || company.name}
        </span>
      </label>
    ))}
  </div>
</div>
```

**After (Lines 666-673):**
```tsx
{/* Companies */}
<div className="md:col-span-2">
  <CompanyMultiSelect
    selectedCompanyIds={selectedCompanies}
    onSelectionChange={setSelectedCompanies}
    placeholder="Search or add companies..."
    label="Companies"
    required={false}
  />
</div>
```

**Import Added:**
```tsx
import { CompanyMultiSelect } from '../../common/CompanyMultiSelect';
```

---

## 🔧 Technical Implementation

### Database Integration

**Supabase Query:**
```typescript
const { data, error } = await supabase
  .from('companies')
  .select('id, name, name_th')
  .eq('status', 'active')
  .order('name', { ascending: true });
```

**Companies Table Schema:**
```sql
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  name_th TEXT,
  address TEXT,
  contact_person VARCHAR,
  contact_email VARCHAR,
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

---

### Search Algorithm

**Filters companies by:**
1. English name (`name`)
2. Thai name (`name_th`)
3. Case-insensitive matching

```typescript
const filteredCompanies = companies.filter((company) =>
  company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
  (company.name_th && company.name_th.toLowerCase().includes(searchTerm.toLowerCase()))
);
```

**Exact Match Detection:**
```typescript
const exactMatch = companies.some(
  (company) =>
    company.name.toLowerCase() === searchTerm.toLowerCase() ||
    (company.name_th && company.name_th.toLowerCase() === searchTerm.toLowerCase())
);
```

---

### Creating New Companies

**Flow:**
1. User types a company name that doesn't exist
2. "Add new company" button appears in dropdown
3. Confirmation modal opens with company name
4. User confirms → Inserts to database
5. New company added to local state
6. New company auto-selected
7. Dropdown stays open for more selections

**Database Insert:**
```typescript
const { data: newCompany, error } = await supabase
  .from('companies')
  .insert([
    {
      name: pendingCompanyName,
      status: 'active',
    },
  ])
  .select()
  .single();
```

**RLS Error Handling:**
```typescript
if (error?.code === '42501') {
  alert('Unable to create company due to database permissions. Please contact your administrator.');
}
```

---

## 🎨 UI/UX Features

### Selected Companies Display

**Visual Style:**
- Blue rounded chips/tags
- Company name (Thai name preferred)
- X button to remove
- Responsive layout

```tsx
<div className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
  <span>{company.name_th || company.name}</span>
  <button onClick={() => handleRemoveCompany(company.id)}>
    <XMarkIcon className="w-4 h-4" />
  </button>
</div>
```

### Dropdown Behavior

**States:**
- ✅ Show on input focus
- ✅ Show on typing
- ✅ Hide on click outside
- ✅ Hide after selection (single-select mode)
- ✅ Stay open after selection (multi-select mode)

**Visual Indicators:**
- Selected companies show "✓ Selected" badge
- Selected companies are disabled (can't select twice)
- Grayed out appearance for already selected items
- Loading spinner while fetching

---

## 🔒 Security & Permissions

### RLS Policies Required

**For Reading Companies:**
```sql
-- Allow all authenticated users to read active companies
CREATE POLICY "Users can view active companies"
ON public.companies
FOR SELECT
USING (status = 'active');
```

**For Creating Companies:**
```sql
-- Allow authenticated users to create companies
CREATE POLICY "Users can create companies"
ON public.companies
FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);
```

**Error Handling:**
- Policy error (42501) → User-friendly message
- Network error → Console log + alert
- No data → Shows "No companies found"

---

## 📊 Data Flow

### Form Submission

**Selected Companies State:**
```typescript
const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);
```

**Form Data Structure:**
```typescript
interface SafetyAuditFormData {
  audit_date: string;
  project_id: string;
  activity: string | null;
  number_of_personnel: number;
  company_ids: string[]; // ← Array of selected company UUIDs
  // ... other fields
}
```

**Submission Handler:**
```typescript
const handleFormSubmit = (data: SafetyAuditFormData) => {
  const enrichedData = {
    ...data,
    company_ids: selectedCompanies, // ← Passed to backend
  };
  onSubmit(enrichedData);
};
```

---

## 🧪 Testing Checklist

### Manual Testing Steps

**1. Search Existing Companies:**
- [ ] Type "Jardine" → Should show matching companies
- [ ] Type Thai characters → Should search name_th field
- [ ] Empty search → Should show all companies

**2. Select Multiple Companies:**
- [ ] Click company → Should add blue tag
- [ ] Click another → Should add second tag
- [ ] Selected companies disabled in dropdown

**3. Remove Companies:**
- [ ] Click X on tag → Should remove from selection
- [ ] Company becomes available in dropdown again

**4. Create New Company:**
- [ ] Type "Test Company ABC" → Should show "Add new company" button
- [ ] Click button → Confirmation modal appears
- [ ] Confirm → Company created and auto-selected
- [ ] New company appears in dropdown for future use

**5. Error Scenarios:**
- [ ] Supabase not configured → Should handle gracefully
- [ ] RLS policy error → Should show permission message
- [ ] Network error → Should show error alert

**6. UI Responsiveness:**
- [ ] Mobile view → Full width, touch-friendly
- [ ] Desktop view → Proper spacing
- [ ] Long company names → Truncate or wrap gracefully

---

## 📁 File Structure

```
src/
├── components/
│   ├── common/
│   │   └── CompanyMultiSelect.tsx ← NEW COMPONENT
│   └── features/
│       └── safety/
│           └── SafetyAuditFormV3.tsx ← UPDATED
└── types/
    └── safetyAudit.ts ← company_ids already exists
```

---

## 🔄 Migration from Old to New

### Breaking Changes
- **None** - The component maintains backward compatibility
- `selectedCompanies` state remains a string array
- Form submission structure unchanged

### Backward Compatibility
- ✅ Works with existing `companies` prop (but now fetches from DB)
- ✅ Same state management (`selectedCompanies: string[]`)
- ✅ Same form data structure
- ✅ No changes required in parent components

---

## 🚀 Future Enhancements

**Possible Improvements:**

1. **Keyboard Navigation:**
   - Arrow keys to navigate dropdown
   - Enter to select
   - Escape to close

2. **Company Details:**
   - Show address/contact on hover
   - Company type badge (client/contractor)
   - Status indicator

3. **Bulk Actions:**
   - "Select All" button
   - "Clear All" button
   - Export selected companies

4. **Advanced Search:**
   - Filter by company type
   - Filter by status
   - Search by contact person/email

5. **Performance:**
   - Virtual scrolling for large lists
   - Debounced search
   - Pagination if > 100 companies

6. **Caching:**
   - Cache companies in localStorage
   - Background refresh
   - Offline support

---

## 📝 Code Quality

### TypeScript
- ✅ **Full type safety**
- ✅ **No `any` types** (except for Supabase responses)
- ✅ **Proper interfaces**
- ✅ **0 compilation errors**

### React Best Practices
- ✅ **Functional components**
- ✅ **Proper hooks usage**
- ✅ **Effect cleanup**
- ✅ **Ref management**

### Performance
- ✅ **Efficient filtering** (no unnecessary re-renders)
- ✅ **Single data fetch** (on mount)
- ✅ **Optimized state updates**

---

## 🐛 Known Issues

**None currently identified.**

---

## 📞 Support

If you encounter issues:

1. **Check Console:** Look for error messages
2. **Verify Supabase:** Ensure `.env` has correct credentials
3. **Check RLS:** Verify policies in Supabase Dashboard
4. **Test Permissions:** Ensure user can read/write companies table

---

## ✅ Verification

**Status Check:**

```bash
# TypeScript compilation
✅ No errors in CompanyMultiSelect.tsx
✅ No errors in SafetyAuditFormV3.tsx

# Integration
✅ Import added successfully
✅ Component replaced checkboxes
✅ State management unchanged
✅ Form submission compatible
```

**Ready for Testing! 🎉**

---

## 📖 Related Documentation

- [Database Schema](../database/supabase_schema.md)
- [Safety Audit Service](../services/safetyAuditService.ts)
- [CreateUserModal Pattern](../components/features/admin/CreateUserModal.tsx) - Reference implementation

---

**END OF DOCUMENTATION**
