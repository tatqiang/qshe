# 🚀 QSHE PWA Deployment Options

> **Build Status**: ✅ Successful  
> **Date**: November 10, 2025

---

## Quick Deployment Guide

Your QSHE PWA is ready for deployment! Choose one of these options:

---

## Option 1: Vercel (Recommended) ⭐

**Best for**: Fast deployment, automatic HTTPS, global CDN

### Steps:

1. **Push to GitHub** (if not already done):
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin master
   ```

2. **Deploy to Vercel**:
   - Visit: https://vercel.com
   - Click "Add New Project"
   - Import your GitHub repository: `tatqiang/qshe`
   - Vercel auto-detects settings from `vercel.json`
   - Click "Deploy"

3. **Add Environment Variables** (in Vercel dashboard):
   - `VITE_SUPABASE_URL` → Your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` → Your Supabase anon key

4. **Done!** Your app will be live at: `https://your-app.vercel.app`

### Features:
- ✅ Automatic deployments on git push
- ✅ Free SSL certificate
- ✅ Global CDN (fast worldwide)
- ✅ Preview deployments for branches
- ✅ Perfect for PWA/SPA

---

## Option 2: Netlify

**Best for**: Simple hosting, drag-and-drop deployment

### Steps:

1. **Deploy via Git**:
   - Visit: https://netlify.com
   - "Add new site" → "Import from Git"
   - Connect GitHub repo: `tatqiang/qshe`
   - Settings auto-detected from `netlify.toml`
   - Deploy

2. **OR Deploy via Drop**:
   - Visit: https://app.netlify.com/drop
   - Drag your `dist/` folder to the page
   - Instant deployment!

3. **Add Environment Variables**:
   - Site settings → Environment variables
   - Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
   - Trigger redeploy

### Features:
- ✅ Drag-and-drop deployment
- ✅ Free SSL
- ✅ Global CDN
- ✅ Simple interface

---

## Option 3: Manual Deployment to Any Host

**Best for**: Custom servers, VPS, shared hosting

### Steps:

1. **Build locally**:
   ```bash
   npm run build
   ```

2. **Upload `dist/` folder** to your server via:
   - FTP/SFTP
   - cPanel File Manager
   - SSH/SCP

3. **Server Configuration**:

   **Apache** (`.htaccess`):
   ```apache
   <IfModule mod_rewrite.c>
     RewriteEngine On
     RewriteBase /
     RewriteRule ^index\.html$ - [L]
     RewriteCond %{REQUEST_FILENAME} !-f
     RewriteCond %{REQUEST_FILENAME} !-d
     RewriteRule . /index.html [L]
   </IfModule>

   # Service Worker Headers
   <FilesMatch "sw\.js$">
     Header set Cache-Control "public, max-age=0, must-revalidate"
     Header set Service-Worker-Allowed "/"
   </FilesMatch>
   ```

   **Nginx** (`nginx.conf`):
   ```nginx
   location / {
     try_files $uri $uri/ /index.html;
   }

   location ~* ^/(sw|service-worker)\.js$ {
     add_header Cache-Control "public, max-age=0, must-revalidate";
     add_header Service-Worker-Allowed "/";
   }
   ```

4. **Environment Variables**:
   - Update `.env.production` before building
   - Or use server environment variables

---

## Option 4: GitHub Pages (Free)

**Best for**: Open source projects, simple hosting

### Steps:

1. **Install gh-pages**:
   ```bash
   npm install --save-dev gh-pages
   ```

2. **Update `package.json`**:
   ```json
   {
     "scripts": {
       "deploy": "npm run build && gh-pages -d dist"
     },
     "homepage": "https://tatqiang.github.io/qshe"
   }
   ```

3. **Deploy**:
   ```bash
   npm run deploy
   ```

4. **Enable GitHub Pages**:
   - GitHub repo → Settings → Pages
   - Source: `gh-pages` branch
   - Save

**Note**: GitHub Pages doesn't support environment variables, so embed Supabase keys in build.

---

## Environment Variables Setup

### Required Variables:
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### Optional Variables:
```env
VITE_API_BASE_URL=https://your-backend.com/api
NODE_ENV=production
```

---

## Pre-Deployment Checklist

- [x] Build successful (`npm run build`)
- [ ] Environment variables configured
- [ ] Supabase project accessible
- [ ] Database tables created
- [ ] Storage buckets configured
- [ ] RLS policies enabled
- [ ] Test deployment on staging first

---

## Post-Deployment Testing

1. **PWA Installation**:
   - Open deployed URL in Chrome/Edge
   - Check for "Install" button in address bar
   - Install and test offline functionality

2. **Service Worker**:
   - DevTools → Application → Service Workers
   - Verify service worker is registered and activated

3. **Features**:
   - [ ] Login/Authentication
   - [ ] Safety Patrol CRUD
   - [ ] Photo upload/delete
   - [ ] Corrective actions
   - [ ] Verification workflow
   - [ ] Filters and search
   - [ ] Offline mode

4. **Performance**:
   - Lighthouse score (target 90+ for PWA)
   - Check mobile responsiveness
   - Test on slow 3G connection

---

## Recommended: Vercel + Environment Variables

**Why Vercel?**
- Optimized for Vue/Vite apps
- Zero configuration needed (uses `vercel.json`)
- Automatic HTTPS
- Global edge network
- Free for personal/hobby projects
- Excellent PWA support

**Deployment Command**:
```bash
# One-time setup
npm install -g vercel

# Deploy
vercel --prod
```

Or use the Vercel dashboard for GUI deployment.

---

## Troubleshooting

### Issue: Service Worker Not Registering
**Solution**: Ensure HTTPS is enabled (Vercel/Netlify provide this automatically)

### Issue: Environment Variables Not Working
**Solution**: 
- Rebuild after adding variables
- Use `VITE_` prefix for all variables
- Don't commit `.env` files to Git

### Issue: 404 on Refresh
**Solution**: 
- Ensure rewrites are configured (already in `vercel.json` and `netlify.toml`)
- For manual deployment, configure server rewrite rules

### Issue: Photos Not Uploading
**Solution**:
- Check Supabase storage bucket CORS settings
- Verify Supabase URL and keys are correct
- Check browser console for CORS errors

---

## Monitoring & Analytics

**Recommended Tools**:
- **Vercel Analytics** (built-in for Vercel deployments)
- **Google Analytics** (add to `index.html`)
- **Sentry** (error tracking)
- **Supabase Dashboard** (database monitoring)

---

## Continuous Deployment

### Vercel (Auto-Deploy):
Every push to `master` branch automatically deploys to production.

### Netlify (Auto-Deploy):
Same - every commit triggers a new build and deployment.

### Manual Workflow:
```bash
# 1. Make changes
git add .
git commit -m "Feature: Add new functionality"
git push

# 2. Build locally
npm run build

# 3. Deploy
# - Upload dist/ folder, OR
# - Run deployment command
```

---

## Next Steps

1. Choose your deployment platform
2. Add environment variables
3. Deploy!
4. Test all features
5. Share the URL with your team
6. Set up monitoring

---

**Need Help?**
- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Supabase Docs: https://supabase.com/docs

**Ready to deploy?** Start with Vercel for the easiest experience! 🚀
