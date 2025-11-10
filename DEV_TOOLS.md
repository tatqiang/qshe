# QSHE PWA - Developer Tools

## Dev Tools Feature

The application includes a development-only feature that displays the current file path and line number in a green box at the bottom of the screen (similar to the image you provided).

### How It Works

1. **Automatic Display**: In development mode, you'll see a green box at the bottom-center showing the current component file path
   - Example: `src/App.vue:1`

2. **Click to Open**: Click the green box to open the file directly in VS Code at the specified line

3. **Production Build**: The dev tools automatically hide in production builds (won't appear when you run `npm run build`)

### Using Dev Tools in Your Components

To show the current file in any component, use the `useDevTools` composable:

```vue
<script setup lang="ts">
import { onMounted } from 'vue'
import { useDevTools } from '@/composables/useDevTools'

const { setCurrentFile } = useDevTools()

onMounted(() => {
  // Update the dev tools to show this component's file
  setCurrentFile('c:/pwa/qshe12/qshe/src/views/MyView.vue', 10, 5)
  // Parameters: (filePath, line, column)
})
</script>
```

### Features

✅ Only visible in development mode  
✅ Click to open file in VS Code  
✅ Shows file path, line, and column  
✅ Globally shared state across all components  
✅ Clean green design matching your reference image  

### Components

- **DevTools.vue**: The visual component that displays the file info
- **useDevTools.ts**: Composable for managing the current file state
- **useDarkMode.ts**: Composable for dark mode toggle

## Dark Mode

Click the sun/moon icon in the sidebar header to toggle between light and dark modes. Your preference is saved to localStorage.
