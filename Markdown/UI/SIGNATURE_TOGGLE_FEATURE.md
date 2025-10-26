# Signature Toggle Feature ✅

## Overview
Added a hide/show signature toggle button to the member application report page. This allows users to print blank forms (without signatures) for manual signing later.

## Files Modified

### 1. `src/pages/public/MemberReportPage.tsx`
**Changes:**
- Added `showSignatures` state (default: `true`)
- Added toggle button in action bar with eye/eye-off icon
- Button text changes: "ซ่อนลายเซ็น" (Hide Signature) / "แสดงลายเซ็น" (Show Signature)
- Button variant toggles between "outline" and "primary" based on state
- Passed `showSignatures` prop to `MemberRegistrationReport` component

**Button Position:**
Located in action bar between "ย้อนกลับ" (Back) and "พิมพ์" (Print) buttons

### 2. `src/components/member-form/MemberRegistrationReport.tsx`
**Changes:**
- Added `showSignatures?: boolean` to `MemberRegistrationReportProps` interface
- Added default parameter `showSignatures = true` in component props
- Updated signature rendering logic to conditionally show/hide signature images

**Affected Signatures:**
1. **Page 1 - Personal Info:**
   - Applicant signature (`applicant_signature` or `signature_applicant`)
   - Supervisor signature (`supervisor_signature` or `signature_supervisor`)

2. **Page 2 - Consent Form:**
   - Consent signature (`applicant_signature`)

**Implementation:**
```tsx
{showSignatures && memberData?.applicant_signature && (
  <img src={memberData.applicant_signature} alt="Signature" />
)}
```

## User Workflow

### Printing with Signatures (Default)
1. Open member report page
2. Click "พิมพ์" (Print) button
3. Form prints with all signatures visible

### Printing Blank Form
1. Open member report page
2. Click "ซ่อนลายเซ็น" (Hide Signature) button
3. Signatures disappear from display
4. Click "พิมพ์" (Print) button
5. Form prints blank (signature fields empty but labels remain)
6. Can be signed manually later

### Toggle Behavior
- **When signatures shown (default):**
  - Button displays: "ซ่อนลายเซ็น" with eye-off icon
  - Button style: outline variant
  
- **When signatures hidden:**
  - Button displays: "แสดงลายเซ็น" with eye icon
  - Button style: primary variant (highlighted)

## Technical Details

### State Management
```tsx
const [showSignatures, setShowSignatures] = useState(true);
```

### SVG Icons Used
- **Eye Icon (Show):** Visible eye symbol
- **Eye-Off Icon (Hide):** Eye with slash-through symbol

### Props Flow
```
MemberReportPage (useState)
  → showSignatures state
  → MemberRegistrationReport prop
  → Conditional rendering of <img> tags
```

## Visual Behavior

### What Gets Hidden
- All signature images (`<img>` elements)
- Both applicant and supervisor signatures
- Signatures on both Page 1 and Page 2

### What Remains Visible
- Signature labels (e.g., "ลายเซ็น")
- Name labels (e.g., "({first_name} {last_name})")
- Signature box borders and lines
- All other form content

## Use Cases
1. **Print blank forms for new applicants** - Print empty forms for physical distribution
2. **Re-sign forms** - Print forms without old signatures to collect new ones
3. **Template printing** - Print clean copies as templates
4. **Manual signing workflow** - Print for situations requiring wet signatures

## Testing Checklist
- ✅ Toggle button appears in action bar
- ✅ Button text changes on click
- ✅ Button style changes on click
- ✅ Page 1 signatures hide when toggled off
- ✅ Page 2 consent signature hides when toggled off
- ✅ Signatures reappear when toggled back on
- ✅ Print function works with signatures hidden
- ✅ PDF download works with signatures hidden
- ✅ No TypeScript errors

## Notes
- Default state is `true` (signatures shown) to maintain existing behavior
- Toggle state resets when navigating away and returning to page
- Does not affect the saved form data in database
- Only affects display/print output
