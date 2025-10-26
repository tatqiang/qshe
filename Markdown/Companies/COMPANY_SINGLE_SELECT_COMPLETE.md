# ✅ Company Single-Select with Bilingual Modal - Complete

## 🎯 What Was Created

**New Component:** `CompanySingleSelect.tsx`

**Location:** `src/components/common/CompanySingleSelect.tsx`

**Purpose:** Single-select company dropdown with bilingual modal for creating new companies

---

## 🌟 Features

### ✅ Single Selection (vs Multi-Select)
- Select ONE company at a time
- Clear and simple UI
- Shows selected company as removable tag
- Perfect for token creation (1 token = 1 company)

### ✅ Bilingual Modal for New Companies
- **English name** (required)
- **Thai name** (optional)
- Same modal as CompanyMultiSelect
- Professional confirmation dialog

### ✅ Real-time Search & Filter
- Searches both English and Thai names
- Instant filtering as you type
- Shows Thai name preferred, English as fallback

### ✅ User-Friendly UX
- Click outside to close dropdown
- Clear selection button (X)
- Loading states with spinner
- Selected company highlighted in blue
- "✓ Selected" indicator

### ✅ Create New Company
- Type non-matching text
- Click "Add ... as new company"
- Modal opens with bilingual inputs
- Auto-selects new company after creation
- Refreshes company list automatically

---

## 📋 Props

```typescript
interface CompanySingleSelectProps {
  selectedCompanyId: string;          // Currently selected company ID
  onSelectionChange: (companyId: string) => void;  // Callback when selection changes
  placeholder?: string;                // Input placeholder text
  label?: string;                      // Field label
  required?: boolean;                  // Show required asterisk
}
```

---

## 💻 Usage Example

```typescript
import { CompanySingleSelect } from '../../components/common/CompanySingleSelect';

function MyComponent() {
  const [selectedCompany, setSelectedCompany] = useState<string>('');

  return (
    <CompanySingleSelect
      selectedCompanyId={selectedCompany}
      onSelectionChange={setSelectedCompany}
      placeholder="Search or add company..."
      label="Company"
      required={true}
    />
  );
}
```

---

## 🔄 Comparison: Multi-Select vs Single-Select

| Feature | CompanyMultiSelect | CompanySingleSelect |
|---------|-------------------|---------------------|
| Selection | Multiple companies | One company only |
| Display | Multiple tags/chips | Single tag |
| Use Case | Safety Audits | Token Creation |
| Dropdown Behavior | Stays open after selection | Closes after selection |
| Clear Button | Remove individual tags | Clear entire selection |
| Modal | ✅ Bilingual | ✅ Bilingual |

---

## 🎨 UI Behavior

### Initial State:
```
┌─────────────────────────────────────┐
│ Company *                           │
│ ┌─────────────────────────────────┐ │
│ │ Search or add company...        │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### After Selection:
```
┌─────────────────────────────────────┐
│ Company *                           │
│ [ บริษัท ABC จำกัด  X ]            │
│ ┌─────────────────────────────────┐ │
│ │ Search to change company...     │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Dropdown (Searching):
```
┌─────────────────────────────────────┐
│ [ ABC  ]                            │
├─────────────────────────────────────┤
│ บริษัท ABC ก่อสร้าง จำกัด  ✓ Selected│
│ ABC Construction Co., Ltd.          │
├─────────────────────────────────────┤
│ บริษัท ABCD จำกัด                   │
│ ABCD Company Ltd.                   │
└─────────────────────────────────────┘
```

### Create New Company Modal:
```
┌─────────────────────────────────────┐
│ Add New Company                  [X]│
├─────────────────────────────────────┤
│ Company Name (English) *            │
│ ┌─────────────────────────────────┐ │
│ │ ABC Construction Co., Ltd.      │ │
│ └─────────────────────────────────┘ │
│                                     │
│ Company Name (Thai) (Optional)      │
│ ┌─────────────────────────────────┐ │
│ │ บริษัท เอบีซี ก่อสร้าง จำกัด    │ │
│ └─────────────────────────────────┘ │
│                                     │
│         [ Cancel ] [ + Create ]     │
└─────────────────────────────────────┘
```

---

## 🔧 Integration in MemberApplicationTokensPage

### Before:
```typescript
import { CompanySelector } from '../../components/shared/CompanySelector';

<CompanySelector
  value={selectedCompany}
  onChange={(companyId) => setSelectedCompany(companyId)}
  // ❌ No bilingual modal
  // ❌ Simple onCreateNew callback
/>
```

### After:
```typescript
import { CompanySingleSelect } from '../../components/common/CompanySingleSelect';

<CompanySingleSelect
  selectedCompanyId={selectedCompany}
  onSelectionChange={setSelectedCompany}
  placeholder="Search or add company..."
  label="Company"
  required={true}
  // ✅ Built-in bilingual modal
  // ✅ Auto-creates and selects company
/>
```

---

## 🎯 User Flow

### Selecting Existing Company:
1. Click input field → Dropdown opens
2. See all companies (Thai/English names)
3. Type to filter results
4. Click company → Selected
5. Dropdown closes
6. Company appears as removable tag

### Creating New Company:
1. Type company name that doesn't exist
2. Dropdown shows: "Add '...' as new company"
3. Click to add
4. **Modal opens** with bilingual inputs:
   - English name (pre-filled, required)
   - Thai name (optional)
5. Fill Thai name (optional)
6. Click "Create Company"
7. Company created in database
8. **Auto-selected** in dropdown
9. Modal closes
10. Ready to generate token!

---

## ✅ What This Fixes

**Issue:** Company dropdown couldn't create new companies with bilingual modal

**Before:**
- Used simple `CompanySelector`
- No bilingual modal
- Had to create companies elsewhere first

**After:**
- New `CompanySingleSelect` component
- Full bilingual modal (English + Thai)
- Create companies on-the-fly
- Matches Safety Audit UX

---

## 📝 Files Created/Modified

### Created:
1. ✅ `src/components/common/CompanySingleSelect.tsx` (448 lines)
   - Main component
   - Bilingual confirmation modal
   - Single-select logic
   - Search and filter
   - Company creation

### Modified:
1. ✅ `src/pages/admin/MemberApplicationTokensPage.tsx`
   - Line 5: Import changed to `CompanySingleSelect`
   - Line 247-254: Component usage updated

---

## 🆘 Troubleshooting

**If modal doesn't appear:**
- Check Heroicons are installed: `@heroicons/react`
- Verify Tailwind CSS is working
- Check browser console for errors

**If company creation fails:**
- RLS policies must allow INSERT on companies table
- User must be authenticated
- Run RLS fix if needed (see `TOKEN_CREATION_FIXES_COMPLETE.md`)

**If dropdown doesn't close:**
- Click outside the dropdown area
- Or select a company

---

## 🎨 Visual Comparison

**CompanyMultiSelect (Safety Audit):**
```
[Company 1 X] [Company 2 X] [Company 3 X]
┌─────────────────────────────────────┐
│ Search or add companies...          │
└─────────────────────────────────────┘
```

**CompanySingleSelect (Token Creation):**
```
[Selected Company X]
┌─────────────────────────────────────┐
│ Search to change company...         │
└─────────────────────────────────────┘
```

---

**Status:** ✅ **COMPLETE** - Refresh browser and test!

**Test Checklist:**
- [ ] Refresh browser (Ctrl + Shift + R)
- [ ] Go to `/admin/member-tokens`
- [ ] Click "Create New Token"
- [ ] Type company name (existing)
- [ ] Select from dropdown
- [ ] Clear selection (click X)
- [ ] Type NEW company name
- [ ] Click "Add ... as new company"
- [ ] See bilingual modal
- [ ] Fill English + Thai names
- [ ] Click "Create Company"
- [ ] Verify company auto-selected
- [ ] Generate token successfully!
