# Quick Reference: Responsive Design Classes

## 🎯 Quick Copy-Paste Classes

### Text Sizes
```tsx
// Labels
className="text-xs sm:text-sm"           // 12px → 14px

// Headings
className="text-base sm:text-lg"         // 16px → 18px

// Small text (descriptions, counts)
className="text-[10px] sm:text-xs"       // 10px → 12px

// Body text
className="text-sm sm:text-base"         // 14px → 16px
```

### Padding & Margin
```tsx
// Card padding
className="p-4 sm:p-6"                   // 16px → 24px
className="p-3 sm:p-4"                   // 12px → 16px

// Input padding
className="px-2 py-1.5 sm:px-3 sm:py-2" // 8px/6px → 12px/8px

// Button padding
className="px-2 py-1 sm:px-3 sm:py-1.5" // 8px/4px → 12px/6px

// Margins
className="mb-1.5 sm:mb-2"               // 6px → 8px
className="mb-3 sm:mb-4"                 // 12px → 16px
```

### Spacing (Gap)
```tsx
// Grid/Flex gaps
className="gap-1.5 sm:gap-2"             // 6px → 8px
className="gap-3 sm:gap-4"               // 12px → 16px
className="space-x-1.5 sm:space-x-2"     // 6px → 8px
className="space-y-4 sm:space-y-6"       // 16px → 24px
```

### Icon Sizes
```tsx
// Small icons (in tags, buttons)
className="h-2.5 w-2.5 sm:h-3 sm:w-3"   // 10px → 12px
className="h-3.5 w-3.5 sm:h-4 sm:w-4"   // 14px → 16px

// Medium icons (checkboxes, bullets)
className="h-4 w-4 sm:h-5 sm:w-5"       // 16px → 20px

// Large icons (headers)
className="h-5 w-5 sm:h-6 sm:w-6"       // 20px → 24px
```

### Common Patterns
```tsx
// Filter Card
<Card padding="sm" className="sm:p-6">

// Filter Header
<div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
  <h3 className="text-base sm:text-lg font-medium">Filters</h3>
  <Button 
    size="sm" 
    className="text-xs sm:text-sm px-2 py-1 sm:px-3 sm:py-1.5"
  >
    Clear Filters
  </Button>
</div>

// Form Grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">

// Label
<label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5 sm:mb-2">

// Input Field
<input
  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
/>

// Select Field
<select
  className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm bg-white"
>
```

## 🎨 Component Templates

### Responsive Card
```tsx
<Card padding="sm" className="sm:p-6">
  <div className="flex items-center justify-between mb-3 sm:mb-4">
    <h3 className="text-base sm:text-lg font-medium text-gray-900">
      Title
    </h3>
    <Button size="sm" className="text-xs sm:text-sm">
      Action
    </Button>
  </div>
  <div className="space-y-3 sm:space-y-4">
    {/* Content */}
  </div>
</Card>
```

### Responsive Form Section
```tsx
<div className="space-y-1.5 sm:space-y-2">
  <label className="block text-xs sm:text-sm font-medium text-gray-700">
    Label
  </label>
  <input
    type="text"
    className="w-full px-2 py-1.5 sm:px-3 sm:py-2 border border-gray-300 rounded-md text-xs sm:text-sm"
  />
</div>
```

### Responsive Tag/Badge
```tsx
<span className="inline-flex items-center px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-md text-[10px] sm:text-xs font-medium bg-blue-100 text-blue-800">
  <span className="mr-0.5 sm:mr-1">🏷️</span>
  <span className="truncate max-w-[80px] sm:max-w-none">
    Tag Name
  </span>
</span>
```

### Responsive Checkbox List Item
```tsx
<div className="flex items-center px-2 py-1.5 sm:px-3 sm:py-2">
  <input
    type="checkbox"
    className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-600 border-gray-300 rounded mr-2 sm:mr-3 flex-shrink-0"
  />
  <div className="flex-1 min-w-0">
    <span className="text-xs sm:text-sm font-medium text-gray-900 truncate">
      Option Name
    </span>
  </div>
</div>
```

## 📋 Design System Tokens

### Spacing Scale (Tailwind)
```
0.5  = 2px
1    = 4px
1.5  = 6px   ← Mobile common
2    = 8px   ← Mobile/Desktop transition
3    = 12px  ← Desktop common
4    = 16px
6    = 24px
8    = 32px
```

### Font Size Scale
```
text-[10px] = 10px  (Custom - very small mobile)
text-xs     = 12px  (Mobile standard)
text-sm     = 14px  (Desktop standard)
text-base   = 16px  (Desktop heading/emphasis)
text-lg     = 18px  (Desktop large heading)
text-xl     = 20px  (Page title)
```

### Component Heights
```
Min Touch Target:  38px (mobile)
Standard Input:    42px (desktop)
Compact Input:     32px (mobile)
Button (small):    30px (mobile), 34px (desktop)
Button (medium):   38px (mobile), 42px (desktop)
```

## 🔍 Common Utility Combinations

### Prevent Text Overflow
```tsx
className="truncate max-w-[80px] sm:max-w-none"
className="overflow-hidden text-ellipsis whitespace-nowrap"
```

### Prevent Icon Compression
```tsx
className="flex-shrink-0"  // Always add to icons in flex containers
```

### Responsive Flexbox
```tsx
className="flex flex-col sm:flex-row gap-2 sm:gap-4"
```

### Responsive Grid
```tsx
className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
```

### Center with Responsive Padding
```tsx
className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
```

## 🚨 Common Mistakes to Avoid

### ❌ Don't Do This
```tsx
// Fixed sizes without responsive variants
className="text-sm"           // Will be too large on mobile
className="p-6"               // Too much padding on mobile
className="space-x-4"         // Too much space on mobile
className="h-5 w-5"           // Icon too large on mobile

// Missing flex-shrink-0 on icons
<Icon className="h-4 w-4" />  // Icon will compress

// No max-width on text in narrow spaces
<span className="text-xs">Very Long Text Here</span>

// Not using min-w-0 on flex children
<div className="flex-1">Long text that overflows</div>
```

### ✅ Do This Instead
```tsx
// Always include responsive variants
className="text-xs sm:text-sm"
className="p-4 sm:p-6"
className="space-x-2 sm:space-x-4"
className="h-4 w-4 sm:h-5 sm:w-5"

// Always prevent icon compression
<Icon className="h-4 w-4 flex-shrink-0" />

// Always handle text overflow
<span className="text-xs truncate max-w-[100px] sm:max-w-none">
  Very Long Text Here
</span>

// Always allow flex children to shrink
<div className="flex-1 min-w-0 truncate">
  Long text that overflows
</div>
```

## 📱 Testing Commands

### Browser DevTools
```
1. F12 → Toggle Device Toolbar (Ctrl+Shift+M)
2. Select "Responsive"
3. Test these widths:
   - 320px (iPhone SE)
   - 375px (iPhone 12 Mini)
   - 400px (Reference)
   - 560px (Reference)
   - 640px (Breakpoint)
   - 768px (Tablet)
```

### Tailwind Breakpoint Reference
```
Default: < 640px   (mobile)
sm:      ≥ 640px   (tablet/desktop)
md:      ≥ 768px   (tablet)
lg:      ≥ 1024px  (desktop)
xl:      ≥ 1280px  (large desktop)
2xl:     ≥ 1536px  (extra large)
```

## 🎓 Pro Tips

1. **Mobile First**: Start with mobile classes, add `sm:` for desktop
   ```tsx
   className="text-xs sm:text-sm"  // ✅ Good
   className="sm:text-xs text-sm"  // ❌ Wrong order
   ```

2. **Consistent Scale**: Always use Tailwind's spacing scale
   ```tsx
   className="p-3 sm:p-6"         // ✅ Good (multiple of 3)
   className="p-5 sm:p-7"         // ❌ Inconsistent
   ```

3. **Icon + Text**: Always add margin between
   ```tsx
   <Icon className="h-4 w-4 mr-1 sm:mr-2 flex-shrink-0" />
   <span>Text</span>
   ```

4. **Truncate Pattern**: parent = `min-w-0`, child = `truncate`
   ```tsx
   <div className="flex-1 min-w-0">
     <span className="truncate">Long text</span>
   </div>
   ```

5. **Touch Targets**: Minimum 38px for mobile buttons
   ```tsx
   className="min-h-[38px] sm:min-h-[42px]"
   ```

## 🔗 Related Files

- `src/components/common/Card.tsx` - Card component
- `src/components/common/Button.tsx` - Button component
- `src/components/common/MultiSelect.tsx` - MultiSelect dropdown
- `src/components/features/safety/SafetyPatrolList.tsx` - Filter implementation

---

**Keep this reference handy when building responsive UIs!** 🚀
