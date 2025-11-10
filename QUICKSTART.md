# QSHE Vue PWA - Quick Start Guide

## ✅ Installation Complete!

Your new Vue 3 PWA project has been successfully set up with:

- ✅ Vue 3 + Vite
- ✅ Vue Router (5 routes configured)
- ✅ Supabase integration (using same database as reference project)
- ✅ PWA support with offline capabilities
- ✅ Dark mode with toggle
- ✅ Tailwind CSS
- ✅ Top & Bottom navigation bars
- ✅ Role-based access control (system_admin)

## 📋 Navigation Structure

### Bottom Navigation (Always Visible)
1. **Dashboard** - `/dashboard` - Overview and statistics
2. **Patrol** - `/patrol` - Safety patrols and inspections
3. **Risk Assessment** - `/risk-assessment` - Risk management
4. **System** - `/system` - Admin panel (system_admin only)

### Top Navigation
- Dark mode toggle
- User email display
- Sign out button

## 🚀 Quick Start

### 1. Verify Environment Variables
Check your `.env` file has been copied from reference_qshe:
```bash
# Should contain:
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Access the Application
Open your browser to: http://localhost:5173

### 4. Test Login
- Navigate to `/login`
- Use credentials from your Supabase database
- Users table should have `role` field with 'system_admin' for admin access

## 📁 Project Structure

```
src/
├── components/
│   ├── TopNav.vue          # Top navigation with dark mode toggle
│   └── BottomNav.vue       # Bottom navigation (5 menus)
├── composables/
│   ├── useAuth.js          # Authentication logic
│   └── useDarkMode.js      # Dark mode state management
├── lib/
│   └── supabase.js         # Supabase client configuration
├── router/
│   └── index.js            # Route definitions & guards
├── views/
│   ├── LoginView.vue       # Login page
│   ├── DashboardView.vue   # Dashboard
│   ├── PatrolView.vue      # Patrol management
│   ├── RiskAssessmentView.vue  # Risk assessments
│   └── SystemView.vue      # System admin panel
└── App.vue                 # Root component
```

## 🎨 Features Implemented

### Authentication
- Email/password login via Supabase
- Session persistence
- Protected routes
- Auto-redirect on auth state changes

### Dark Mode
- Manual toggle in top nav
- Persists in localStorage
- Respects system preference
- Smooth transitions

### PWA Capabilities
- Offline support
- Service worker auto-update
- App manifest configured
- Installable on mobile/desktop

### Role-Based Access
- System menu only visible to `system_admin` role
- Route guards check user permissions
- Automatic redirect if unauthorized

## 🔧 Database Requirements

Ensure your Supabase database has:

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Common Roles
- `user` - Regular user (Dashboard, Patrol, Risk Assessment)
- `system_admin` - Admin user (All menus including System)

## 🎯 Next Steps

1. **Add Business Logic**
   - Implement data fetching in views
   - Add forms for creating patrols/assessments
   - Connect to Supabase tables

2. **Create Icons**
   - Generate PWA icons (192x192 and 512x512)
   - Place in `/public` folder
   - Update manifest.json if needed

3. **Customize Styling**
   - Update Tailwind config
   - Modify color schemes
   - Add custom components

4. **Add More Features**
   - File uploads
   - Notifications
   - Real-time updates
   - Export functionality

## 📱 Testing PWA

### Desktop
1. Run `npm run build`
2. Run `npm run preview`
3. Open browser DevTools > Application > Service Workers
4. Check "Offline" and reload

### Mobile
1. Deploy to a hosting service (Netlify, Vercel, etc.)
2. Open on mobile device
3. Add to home screen
4. Test offline functionality

## 🐛 Troubleshooting

### Dark Mode Not Working
- Check browser console for errors
- Verify localStorage is enabled
- Clear cache and reload

### Routes Not Found
- Ensure Vue Router is properly installed
- Check `src/main.js` imports router
- Verify `App.vue` has `<RouterView />`

### Supabase Connection Issues
- Verify `.env` variables are correct
- Check Supabase URL format
- Ensure anon key has proper permissions
- Check browser console for connection errors

### System Menu Not Showing
- Verify user role is exactly `system_admin`
- Check Supabase users table
- Review navigation guard logic

## 📚 Documentation

- [Vue 3 Docs](https://vuejs.org/)
- [Vue Router](https://router.vuejs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Supabase](https://supabase.com/docs)
- [Vite PWA](https://vite-pwa-org.netlify.app/)

## 🎉 You're All Set!

Your QSHE Vue PWA is ready for development. Start by running:

```bash
npm run dev
```

Happy coding! 🚀
