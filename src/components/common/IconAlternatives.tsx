// Alternative icon options for camera controls
// You can replace the current icons with any of these if you prefer

// Option 1: Emoji Icons (Most Universal)
const emojiIcons = {
  switch: "🔄", // Refresh/Switch icon
  close: "❌",  // Close/X icon  
  capture: "📸", // Camera icon
};

// Option 2: Unicode Symbols
const unicodeIcons = {
  switch: "⟲", // Circular arrow
  close: "✕",  // Cross mark
  capture: "●", // Solid circle
};

// Option 3: Custom SVG Icons
const customSvgIcons = {
  switch: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M1 4v6h6M23 20v-6h-6"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
    </svg>
  ),
  close: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  capture: (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="12" r="10"/>
    </svg>
  ),
};

// To use any of these, replace the current icon in CameraModal.tsx:
// Example for emoji icons:
// <span className="text-xl">{emojiIcons.switch}</span>
