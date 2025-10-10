🛠️ Step-by-Step PWA Setup Guide (Day 1)
✅ Step 1: Create the Project Folder

bash
CopyEdit
mkdir construction-safety-pwa
cd construction-safety-pwa

✅ Step 2: Scaffold a React + TypeScript Project
Use Vite (lightweight and fast):

bash
CopyEdit
npm create vite@latest
    • Choose: construction-safety-pwa
    • Select React
    • Select TypeScript
Then:

bash
CopyEdit
cd construction-safety-pwa
npm install

✅ Step 3: Install Required Libraries
We’ll begin with core tech stack:

bash
CopyEdit
npm install tailwindcss postcss autoprefixer

npx tailwindcss init -p - "ERROR" follow "manualTailwindConfig.md"


npm install react-router-dom@6
npm install @reduxjs/toolkit react-redux
npm install dexie
npm install face-api.js
npm install react-hook-form
npm install classnames

✅ Step 4: Configure Tailwind
Edit tailwind.config.js:

js
CopyEdit
content: [
  "./index.html",
  "./src/**/*.{js,ts,jsx,tsx}",
],
In src/index.css, replace with:

css
CopyEdit
@tailwind base;
@tailwind components;
@tailwind utilities;
Import it in main.tsx:

tsx
CopyEdit
import './index.css';

✅ Step 5: Add PWA Support (Workbox)

bash
CopyEdit
npm install workbox-cli --save-dev



Add public/service-worker.js:

js
CopyEdit
self.addEventListener('install', event => {
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  clients.claim();
});


✅ STEP 2: Set Up Routing & Folder Structure
🏗️ 1. Create Folder Structure
Inside your src/ folder, create this:

bash
CopyEdit
mkdir src\pages
mkdir src\routes
mkdir src\components
mkdir src\app
mkdir src\features

type NUL > src\routes\AppRoutes.tsx

This gives you:

bash
CopyEdit
src/
├── pages/          # Each screen (Dashboard, Members, etc.)
├── routes/         # Route definitions
├── components/     # Reusable UI
├── app/            # Redux, global setup
├── features/       # State + logic per feature


📦 2. Install Router + React Helmet (for page titles)

bash
CopyEdit
npm install react-router-dom@6 react-helmet

🧠 3. Add Routing (src/routes/AppRoutes.tsx)

tsx
CopyEdit
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard';
import Members from '../pages/Members';
import Patrol from '../pages/Patrol';
export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/members" element={<Members />} />
        <Route path="/patrol" element={<Patrol />} />
      </Routes>
    </BrowserRouter>
  );
}

📋 4. Add Page Files
src/pages/Dashboard.tsx

tsx
CopyEdit
export default function Dashboard() {
  return <div className="p-4 text-xl">📊 Dashboard Page</div>;
}
src/pages/Members.tsx

tsx
CopyEdit
export default function Members() {
  return <div className="p-4 text-xl">👥 Member Management</div>;
}
src/pages/Patrol.tsx

tsx
CopyEdit
export default function Patrol() {
  return <div className="p-4 text-xl">🚧 Site Patrol Report</div>;
}

⚙️ 5. Use Routing in main.tsx
Edit main.tsx:

tsx
CopyEdit
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import AppRoutes from './routes/AppRoutes';
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AppRoutes />
  </React.StrictMode>
);

🔍 BONUS: Add Type Checking via Vite Plugin (Optional but Recommended)

bash
CopyEdit
npm install vite-plugin-checker -D
Edit vite.config.ts:

ts
CopyEdit
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import checker from 'vite-plugin-checker';
export default defineConfig({
  plugins: [
    react(),
    checker({ typescript: true })
  ],
});
Now you’ll see type errors in the terminal and browser overlay even though SWC skips it during compile. Best of both worlds 💪
