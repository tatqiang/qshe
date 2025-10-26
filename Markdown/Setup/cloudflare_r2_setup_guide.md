# Cloudflare R2 Setup Guide for QSHE PWA

## Step 1: Create Cloudflare R2 Bucket

### 1.1 Access Cloudflare Dashboard
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Select your account
3. Navigate to **R2 Object Storage** in the left sidebar

### 1.2 Create Bucket
1. Click **"Create bucket"**
2. **Bucket name**: `qshe` (or your preferred name)
3. **Location**: Choose closest to your users (e.g., Asia Pacific for Thailand)
4. Click **"Create bucket"**

### 1.3 Configure Public Access (Important!)
1. After creating the bucket, go to **Settings** > **Public access**
2. Click **"Allow Access"** to make the bucket publicly readable
3. **Warning**: This allows anyone with the URL to view photos
4. For production, consider using a custom domain with better access control

## Step 2: Configure CORS for Web Uploads

### 2.1 Set CORS Policy
1. Go to your bucket settings
2. Navigate to **Settings** > **CORS policy**
3. Add this CORS configuration for development and common hosting platforms:

[
  {
    "AllowedOrigins": [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://*.vercel.app",
      "https://*.netlify.app",
      "https://*.pages.dev",
      "https://*.surge.sh",
      "https://*.github.io"
    ],
    "AllowedMethods": [
      "GET",
      "PUT",
      "POST",
      "DELETE"
    ],
    "AllowedHeaders": [
      "*"
    ],
    "ExposeHeaders": [
      "ETag"
    ],
    "MaxAgeSeconds": 3600
  }
]
```json
```

**Note**: This configuration works with popular hosting platforms:
- **Vercel**: `your-app.vercel.app`
- **Netlify**: `your-app.netlify.app`
- **Cloudflare Pages**: `your-app.pages.dev`
- **Surge**: `your-app.surge.sh`
- **GitHub Pages**: `username.github.io`

## Step 3: Create R2 API Credentials

### 3.1 Generate R2 Token
1. In Cloudflare Dashboard, go to **R2 Object Storage**
2. Click **"Manage R2 API tokens"**
3. Click **"Create API token"**
4. **Token name**: `qshe-pwa-uploads`
5. **Permissions**: 
   - Select **"Object Read & Write"**
   - **Bucket**: Select your `qshe` bucket
6. Click **"Create API token"**

### 3.2 Copy Credentials
After creating, you'll see:
- **Access Key ID**: Copy this value
- **Secret Access Key**: Copy this value (shown only once!)
- **Account ID**: Available in the dashboard

## Step 4: Configure Environment Variables

### 4.1 Create .env File
Create a `.env` file in your project root with:

```bash
# Cloudflare R2 Configuration
VITE_R2_ACCOUNT_ID=your_cloudflare_account_id_here
VITE_R2_ACCESS_KEY_ID=your_access_key_id_here
VITE_R2_SECRET_ACCESS_KEY=your_secret_access_key_here
VITE_R2_BUCKET_NAME=qshe

# Optional: Custom domain (set up in Step 5)
# VITE_R2_PUBLIC_URL=https://photos.your-domain.com

# Your existing Supabase config
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

### 4.2 Restart Development Server
```bash
npm run dev
```

## Step 5: Test Photo Upload

### 5.1 Test Registration Flow
1. Go to your registration page: `http://localhost:5173/register/test-invitation-token-123`
2. Fill out the form
3. Try uploading a photo in the photo step
4. Check browser console for upload success/failure messages

### 5.2 Verify Upload in R2
1. Go to your R2 bucket in Cloudflare dashboard
2. Check if files appear in the `profiles/` folder
3. Files should be named like: `profiles/user-id/timestamp-random.jpg`

## Step 6: Optional - Custom Domain Setup

### 6.1 Set Up Custom Domain (Recommended for Production)
1. In your R2 bucket settings, go to **Settings** > **Custom Domains**
2. Click **"Connect Domain"**
3. Enter your subdomain: `photos.your-domain.com`
4. Follow Cloudflare's DNS setup instructions
5. Update your `.env` file:
   ```bash
   VITE_R2_PUBLIC_URL=https://photos.your-domain.com
   ```

### Benefits of Custom Domain:
- Better performance
- No CORS issues
- Professional URLs
- Better caching

## Step 7: Update Database Schema (if needed)

Make sure your `users` table has these columns:
```sql
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS photo_filename TEXT;
```

## Troubleshooting

### Common Issues:

#### 1. CORS Error
**Error**: Access blocked by CORS policy
**Solution**: 
- Check CORS configuration in R2 bucket
- Ensure your domain is in AllowedOrigins
- Restart your dev server after .env changes

#### 2. Authentication Error
**Error**: Access denied or invalid credentials
**Solution**: 
- Verify R2 API token has correct permissions
- Check that Access Key ID and Secret are correct
- Ensure token isn't expired

#### 3. Upload Fails Silently
**Error**: No error but photo doesn't upload
**Solution**: 
- Check browser console for detailed errors
- Verify bucket name matches exactly
- Test with smaller image files first

#### 4. Mock Upload Message
**Message**: "Using mock upload - R2 not configured"
**Solution**: 
- Check all environment variables are set
- Restart development server
- Verify .env file is in project root

### Testing Commands:

```bash
# Check if environment variables are loaded
echo $VITE_R2_ACCOUNT_ID

# Test in browser console
console.log(import.meta.env.VITE_R2_ACCOUNT_ID)
```

## Security Notes

1. **Never commit .env files** - They contain sensitive credentials
2. **Use different credentials for production** - Don't use dev credentials in production
3. **Regularly rotate API tokens** - Update credentials periodically
4. **Monitor R2 usage** - Check Cloudflare dashboard for usage patterns

## Cost Estimation

Cloudflare R2 pricing (as of 2024):
- **Storage**: $0.015 per GB per month
- **Operations**: $4.50 per million requests
- **Data transfer**: Free egress

For 1000 users with 1MB photos each:
- Storage: ~$0.015/month
- Very cost-effective for profile photos!

## Next Steps

Once R2 is working:
1. ✅ Photo upload in registration works
2. ✅ Photos display in admin interface
3. ✅ Photos are compressed and optimized
4. 🔄 Ready for offline mode implementation

Your photo upload system is now production-ready!
