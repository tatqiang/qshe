# Vue DevTools Setup Guide

## What is Vue DevTools?

Vue DevTools is a browser extension that provides a powerful debugging interface for Vue.js applications. It allows you to inspect components, track state changes, monitor performance, and debug your app effectively.

## Installation

### Chrome/Edge
1. Visit [Chrome Web Store](https://chrome.google.com/webstore/detail/vuejs-devtools/nhdogjmejiglipccpnnnanhbledajbpd)
2. Click "Add to Chrome/Edge"
3. The Vue logo icon will appear in your browser toolbar

### Firefox
1. Visit [Firefox Add-ons](https://addons.mozilla.org/en-US/firefox/addon/vue-js-devtools/)
2. Click "Add to Firefox"

## How to Use

### 1. Open DevTools
- Press `F12` or `Ctrl+Shift+I` (Windows/Linux) / `Cmd+Option+I` (Mac)
- Look for the "Vue" tab in your browser DevTools

### 2. Vue DevTools Icon
When the extension detects a Vue app, you'll see:
- **Green Vue icon** 🟢 in the toolbar = Vue detected and DevTools active
- **Gray Vue icon** ⚫ = No Vue app detected or production mode

### 3. Main Features

#### Components Tab
- **Inspect component tree**: See all Vue components in your app
- **View props & data**: Check component state, props, computed properties
- **Edit state**: Modify data directly to test different scenarios
- **Find in page**: Click the crosshair to select elements

#### Timeline Tab
- Track all events, mutations, and updates
- Performance profiling
- Time-travel debugging

#### Routes Tab (with Vue Router)
- View current route
- Navigate between routes
- Inspect route params and queries

## Configuration

Your QSHE PWA is now configured for optimal Vue DevTools experience:

### ✅ Enabled Features:
- Component names visible in DevTools
- Source maps for debugging
- Path aliases (`@/` for `src/`)
- Development mode detection

### Component Naming
All components have proper names:
```vue
<script setup lang="ts">
defineOptions({
  name: 'ComponentName'
})
</script>
```

This makes them easy to identify in Vue DevTools!

## Tips & Tricks

1. **Select Component**: Use the crosshair icon (🎯) to click any element on your page and jump to its component in DevTools

2. **Edit Live**: In the Components tab, you can edit data values and see changes instantly

3. **Performance**: Use the Timeline tab to identify slow components or unnecessary re-renders

4. **Dark Mode**: Vue DevTools supports dark mode - toggle it in the settings

## Troubleshooting

### Vue DevTools not detecting app?
- Make sure you're running in development mode (`npm run dev`)
- Check that the Vue DevTools extension is enabled
- Refresh the page after opening DevTools

### Icon stays gray?
- Vue DevTools doesn't work well with production builds
- Make sure you're viewing `http://localhost:5174/`

### Components not showing names?
- We've configured `defineOptions({ name: '...' })` in all components
- This should display properly in the component tree

## Quick Reference

| Action | Shortcut |
|--------|----------|
| Open DevTools | F12 or Ctrl+Shift+I |
| Select component | Click crosshair, then click element |
| Refresh DevTools | Click refresh icon in Vue tab |
| Toggle settings | Click gear icon |

---

**Current Status**: Your QSHE PWA is fully configured for Vue DevTools! 🎉

Just install the browser extension and press F12 to start debugging.
