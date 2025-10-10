# Supabase Setup Guide for QSHE PWA

## Step 1: Create Supabase Project

1. Go to [Supabase](https://supabase.com) and create a new account if you don't have one
2. Click "New Project" and fill in the details:
   - Project Name: `QSHE Management`
   - Database Password: Choose a strong password
   - Region: Select the closest region to your users

## Step 2: Configure Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and paste the contents of `database/schema.sql` (created in this project)
3. Run the script to create all tables, indexes, and policies
4. The script will create:
   - All necessary tables (users, projects, patrols, etc.)
   - Row Level Security policies
   - Sample data for testing

## Step 3: Get Your Project Credentials

1. Go to Settings → API in your Supabase dashboard
2. Copy the following values:
   - Project URL
   - Project API Keys → `anon` `public` key

## Step 4: Configure Environment Variables

1. Create a `.env.local` file in your project root (copy from `.env.example`)
2. Add your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_project_url_here
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

## Step 5: Configure Authentication

1. In Supabase Dashboard, go to Authentication → Settings
2. Configure the following settings:
   - **Site URL**: `http://localhost:5173` (for development)
   - **Redirect URLs**: Add `http://localhost:5173/**` (for development)
   - **Email Settings**: Configure Gmail SMTP or use the default for testing

### Gmail SMTP Configuration (Recommended for Production)

To use Gmail for sending authentication emails:

1. **Enable 2-Factor Authentication** on your Gmail account
2. **Generate App Password**:
   - Go to Google Account Settings → Security
   - Under "Signing in to Google", select "App passwords"
   - Generate a new app password for "Mail"
   - Copy the 16-character password

3. **Configure in Supabase**:
   - Go to Authentication → Settings → SMTP Settings
   - Enable "Enable custom SMTP"
   - Fill in the following details:
     ```
     SMTP Host: smtp.gmail.com
     SMTP Port: 587
     SMTP User: your-gmail-address@gmail.com
     SMTP Pass: your-16-character-app-password
     SMTP Admin Email: your-gmail-address@gmail.com
     ```

4. **Test the Configuration**:
   - Click "Save" to save your SMTP settings
   - Scroll down to find the "Send test email" button
   - Click "Send test email" 
   - Enter your email address in the popup dialog
   - Click "Send" to send the test email
   - Check your email inbox (and spam folder) for the test message

### How to Test Email Configuration Step-by-Step:

1. **Save SMTP Settings First**: 
   - After entering your Gmail SMTP details, click "Save"
   - Wait for the success confirmation message

2. **Locate Test Email Section**:
   - In the same SMTP Settings page, scroll down
   - Look for "Test SMTP settings" section
   - You'll see a "Send test email" button

3. **Send Test Email**:
   - Click the "Send test email" button
   - A popup will appear asking for an email address
   - Enter the email address where you want to receive the test
   - Click "Send"

4. **Verify Email Delivery**:
   - Check your email inbox within 1-2 minutes
   - If not in inbox, check spam/junk folder
   - The test email should have subject like "Test email from Supabase"

5. **Check Supabase Logs** (if email doesn't arrive):
   - Go to Logs → Auth in Supabase dashboard
   - Look for SMTP-related error messages
   - Common errors: authentication failed, connection timeout

### What the Test Email Looks Like:
The test email will be a simple message from Supabase confirming that your SMTP configuration is working correctly. It's just to verify the connection and authentication.

### Alternative: Use Supabase Default (Development Only)
For quick development testing, you can use Supabase's default email service:
- Leave SMTP settings as default
- Check the Supabase logs for magic links during development
- Note: Default service has limitations and is not suitable for production

## Step 6: Test Authentication

1. Start your development server: `npm run dev`
2. The app should now show a login screen
3. You can:
   - Register a new account (will send confirmation email)
   - Or manually create a user in Supabase Auth panel for testing

## Step 7: Create Test Users (Optional)

For quick testing, you can manually create users in the Supabase Auth panel:

1. Go to Authentication → Users
2. Click "Add User"
3. Add test users like:
   - Email: `admin@test.com`
   - Password: `password123`
   - Auto Confirm User: Yes (for testing)

## Step 8: Verify Database Tables

After running the schema, you should see these tables in your Database → Tables:
- `users`
- `projects`
- `project_members`
- `companies`
- `patrols`
- `patrol_issues`
- `file_metadata`
- `issue_photos`

## Security Considerations

The schema includes Row Level Security (RLS) policies that:
- Users can only see their own profile data
- Users can only see projects they're assigned to
- Users can only see patrols and issues for their projects
- File access is controlled by entity relationships

## Next Steps

Once Supabase is configured:
1. Test the login/logout functionality
2. Verify user data is properly stored and retrieved
3. Continue with user management features
4. Add face recognition capabilities
5. Implement offline synchronization

## Troubleshooting

**Login not working?**
- Check your environment variables are correct
- Verify the Supabase URL and anon key
- Check browser console for detailed error messages

**Database errors?**
- Ensure the schema script ran without errors
- Check that RLS policies are enabled
- Verify user has proper permissions

**Email confirmation not working?**
- For development, you can disable email confirmation in Auth settings
- Or configure a proper email provider (SMTP/SendGrid/etc.)

**Gmail SMTP Issues?**
- Ensure you're using an App Password, not your regular Gmail password
- Verify 2-Factor Authentication is enabled on your Google account
- Check that "Less secure app access" is NOT enabled (use App Passwords instead)
- Test the SMTP connection in Supabase settings
- Check Supabase logs for detailed SMTP error messages

**Test Email Not Received?**
- Wait 2-3 minutes before assuming it failed
- Check spam/junk folder thoroughly
- Verify the email address you entered is correct
- Check Supabase Logs → Auth for error messages
- Try sending test email to a different email provider (Gmail, Outlook, etc.)
- Ensure your Gmail account isn't hitting daily sending limits

**Common Test Email Error Messages:**
- "Authentication failed" → Wrong App Password or username
- "Connection timeout" → Check SMTP host and port (smtp.gmail.com:587)
- "Sender rejected" → Verify the SMTP user email is correct
- "Rate limit exceeded" → Your Gmail account has hit sending limits

**App Password Not Working?**
- Make sure you're copying the entire 16-character password without spaces
- Try generating a new App Password
- Verify the Gmail account has sufficient sending limits

## Production Setup

For production deployment:
1. Update Site URL and Redirect URLs in Supabase Auth settings
2. Configure proper email provider
3. Set up custom domain (optional)
4. Enable additional security features as needed
5. Configure backup and monitoring
