# LoadingOverlay Component

A reusable full-screen loading overlay with spinner for long-running operations.

## Location
`src/components/ui/LoadingOverlay.vue`

## Features
- ✨ Full-screen overlay with blur effect
- 🎨 Centered modal with spinner
- 📝 Customizable title and message
- 🌗 Dark mode support
- ⚡ Smooth transitions
- 🚫 Blocks user interaction during processing

## Usage

### Basic Example
```vue
<template>
  <div>
    <LoadingOverlay
      :show="isProcessing"
      title="Processing..."
      message="Please wait while we process your request."
    />
    
    <button @click="handleSubmit">Submit</button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LoadingOverlay from '@/components/ui/LoadingOverlay.vue'

const isProcessing = ref(false)

const handleSubmit = async () => {
  isProcessing.value = true
  try {
    await someAsyncOperation()
  } finally {
    isProcessing.value = false
  }
}
</script>
```

### With Dynamic Message
```vue
<LoadingOverlay
  :show="saving"
  :title="mode === 'edit' ? 'Updating...' : 'Creating...'"
  :message="`Processing ${items.length} items...`"
/>
```

### Multi-line Message
```vue
<LoadingOverlay
  :show="uploading"
  title="Uploading Files"
  message="Uploading photos to server...\nThis may take a moment."
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `show` | `boolean` | ✅ Yes | - | Controls overlay visibility |
| `title` | `string` | ❌ No | `'Processing...'` | Main heading text |
| `message` | `string` | ❌ No | `'Please wait...'` | Descriptive message |

## Examples in QSHE App

### ✅ Already Implemented

#### 1. Material Receive - Step 3 Acknowledge
**File:** `src/components/materials/receive/Step3Acknowledge.vue`
```vue
<LoadingOverlay
  :show="isProcessing"
  title="Processing Acknowledgement"
  :message="`Updating ${receiveData.items?.length || 0} items in inventory...
Please wait, this may take a moment.`"
/>
```

#### 2. Patrol Form
**File:** `src/features/patrol/views/PatrolFormView.vue`
```vue
<LoadingOverlay
  :show="submitting"
  :title="mode === 'edit' ? 'Updating Patrol...' : 'Creating Patrol...'"
  :message="mode === 'edit' 
    ? 'Saving your changes, please wait...' 
    : 'Processing patrol data and uploading photos...'"
/>
```

### 🎯 Recommended Use Cases

Add LoadingOverlay to any operation that:
- Takes more than 2 seconds
- Processes multiple items
- Uploads files
- Updates inventory
- Performs bulk operations
- Makes multiple API calls

## Best Practices

### ✅ Do:
```vue
<!-- Clear, specific messages -->
<LoadingOverlay
  :show="processing"
  title="Uploading Photos"
  message="Uploading 5 photos to server..."
/>

<!-- Show progress when possible -->
<LoadingOverlay
  :show="saving"
  title="Saving Changes"
  :message="`Processed ${current} of ${total} items...`"
/>
```

### ❌ Don't:
```vue
<!-- Vague messages -->
<LoadingOverlay
  :show="loading"
  title="Loading"
  message="Loading..."
/>

<!-- Too long messages -->
<LoadingOverlay
  :show="processing"
  message="This is a very long message that explains everything..."
/>
```

## Styling

The component uses:
- **Overlay**: 50% black opacity + blur
- **Modal**: White (dark mode: gray-800)
- **Spinner**: Blue (customizable via border color)
- **Z-index**: 50 (appears above most content)

To customize spinner color, edit `LoadingOverlay.vue`:
```vue
<!-- Change from blue to green -->
<div class="... border-b-4 border-green-600 ..."></div>
```

## Accessibility

- Overlay blocks all interactions (prevents accidental clicks)
- Teleported to body (appears above all content)
- Screen readers can access title/message text

## Performance

- Lightweight component (~2KB)
- Uses CSS transitions (GPU accelerated)
- Teleport prevents layout thrashing
- No external dependencies

## Migration Guide

### From Button Loading Prop
**Before:**
```vue
<Button :loading="submitting">
  Save Changes
</Button>
```

**After:**
```vue
<LoadingOverlay :show="submitting" title="Saving..." />
<Button :disabled="submitting">
  Save Changes
</Button>
```

### From Custom Spinner
**Before:**
```vue
<div v-if="loading" class="fixed inset-0...">
  <div class="spinner">...</div>
</div>
```

**After:**
```vue
<LoadingOverlay :show="loading" title="Processing..." />
```

## Troubleshooting

### Overlay not showing?
- Check `show` prop is `true`
- Verify component is imported correctly
- Ensure Teleport target `body` exists

### Message not visible?
- Break long text with `\n` for new lines
- Keep messages under 2 lines
- Use dynamic messages for better UX

### Overlay stuck?
- Make sure to set `show` to `false` in `finally` block
- Check for unhandled promise rejections
- Add timeout as fallback

## Future Enhancements

Possible additions:
- Progress bar support
- Cancel button option
- Custom spinner colors via props
- Animation variations
- Timeout warnings
