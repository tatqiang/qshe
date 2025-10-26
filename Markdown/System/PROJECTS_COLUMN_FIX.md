# ✅ Projects Table Column Fix - RESOLVED

## 🔍 Root Cause
The `projects` table in your database **only has a `name` column** (English), but the code was trying to select **both `name` AND `name_th`** (Thai).

```sql
-- Current structure (from recreate_clean_schema.sql)
CREATE TABLE public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL,  -- ✅ Only English name
    description TEXT,
    status project_status_enum DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## ❌ Error Before Fix
```
Error: column projects_1.name_th does not exist
Hint: Perhaps you meant to reference the column "projects_1.name"
```

## ✅ Fix Applied

### Changed Query (MemberApplicationTokensPage.tsx)
```typescript
// BEFORE (tried to get name_th)
.select(`
  *,
  projects (name, name_th),  // ❌ name_th doesn't exist
  companies (name, name_th)
`)

// AFTER (only get name)
.select(`
  *,
  projects (name),           // ✅ Only English name
  companies (name, name_th)  // ✅ Companies has both
`)
```

### Updated TypeScript Interface
```typescript
interface TokenData {
  // ...
  projects?: { name: string }; // ✅ Fixed: only 'name' field
  companies?: { name: string; name_th?: string }; // ✅ Companies still bilingual
}
```

## 📊 Comparison: Projects vs Companies

| Table | Has `name` | Has `name_th` | Why? |
|-------|-----------|---------------|------|
| `projects` | ✅ | ❌ | Projects are typically managed internally (English names) |
| `companies` | ✅ | ✅ | Companies need bilingual support (Thai + English) |

## 🎯 Expected Result

**After hard refresh (Ctrl + Shift + R):**
- ✅ No more "column name_th does not exist" error
- ✅ Token page loads successfully
- ✅ Can see token list with:
  - Project name (English only)
  - Company name (Thai preferred, English fallback)
- ✅ Ready to create new tokens

## 🔄 Display Behavior

```typescript
// Project display (English only)
<span>{token.projects?.name}</span>
// Output: "Project Alpha"

// Company display (Thai preferred)
<span>{token.companies?.name_th || token.companies?.name}</span>
// Output: "บริษัท ABC จำกัด" (Thai) or "ABC Company Ltd" (English fallback)
```

## 💡 Future Enhancement (Optional)

If you want **bilingual project names** in the future:

```sql
-- Add name_th column to projects table
ALTER TABLE projects ADD COLUMN name_th VARCHAR;

-- Update existing projects
UPDATE projects SET name_th = name WHERE name_th IS NULL;
```

Then update the code back to:
```typescript
.select(`
  *,
  projects (name, name_th),
  companies (name, name_th)
`)
```

---

## 📝 Files Modified

1. ✅ `src/pages/admin/MemberApplicationTokensPage.tsx`
   - Line 52-55: Changed query to only select `projects (name)`
   - Line 25: Updated TypeScript interface (removed `name_th?` from projects)

---

## 🚀 Next Steps

1. **Hard refresh browser** (Ctrl + Shift + R) - Clear cache
2. **Navigate to** `/admin/member-tokens`
3. **Verify:**
   - ✅ Page loads without errors
   - ✅ Can see existing tokens (if any)
   - ✅ Can create new tokens
4. **Test token creation:**
   - Select companies
   - Generate token
   - Copy link and test

---

## ⚠️ Important Notes

- **NO database changes needed** - this was purely a code fix
- **NO migration required** - projects table stays as-is
- **Backward compatible** - existing tokens still work
- **Company names** still show Thai (unchanged)
- **Project names** show English only (as per database design)

---

## 🆘 If Error Persists

1. **Hard refresh:** Ctrl + Shift + R (clear cache)
2. **Check console:** F12 → Console tab
3. **Verify query:** Should NOT mention `name_th` for projects
4. **Clear browser cache:** Settings → Clear browsing data
5. **Try incognito:** Open app in private/incognito window
