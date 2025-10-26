# 🚀 External User Authentication - Quick Start Guide

> **Quick Implementation**: Get external user authentication running in 1 week  
> **Status**: Step-by-step activation guide

---

## ✅ What You Already Have

From your existing setup:
```bash
# Already configured in .env
VITE_AZURE_EXTERNAL_CLIENT_ID=68419950-8189-4e0d-b193-9a1fc59c3961
VITE_AZURE_EXTERNAL_TENANT=jectqshe
VITE_AZURE_EXTERNAL_AUTHORITY=https://jectqshe.ciamlogin.com
```

**Status**: ✅ External ID tenant created, just needs activation!

---

## 📋 30-Minute Setup Checklist

### Step 1: Azure Portal Configuration (10 minutes)

1. **Login to Azure Portal**
   ```
   https://portal.azure.com
   ```

2. **Navigate to External ID**
   ```
   Search: "External Identities"
   → Click "jectqshe" tenant
   → Overview
   ```

3. **Add Redirect URIs**
   ```
   App registrations → Select your app (68419950-8189-4e0d-b193-9a1fc59c3961)
   → Authentication
   → Add platform: Single-page application (SPA)
   
   Add these URIs:
   ✓ http://localhost:5173/auth/callback/external
   ✓ https://your-production-domain.com/auth/callback/external
   
   → Save
   ```

4. **Configure User Attributes**
   ```
   User attributes → Add custom attribute
   
   Create these attributes:
   ┌─────────────────────────┬──────────┬───────────────┐
   │ Attribute Name          │ Type     │ User flow?    │
   ├─────────────────────────┼──────────┼───────────────┤
   │ worker_type             │ String   │ ✓ Show        │
   │ verification_status     │ String   │ ✓ Show        │
   │ company_id              │ String   │ ✓ Optional    │
   │ nationality             │ String   │ ✓ Optional    │
   │ passport_number         │ String   │ ✓ Optional    │
   │ work_permit_number      │ String   │ ✓ Optional    │
   └─────────────────────────┴──────────┴───────────────┘
   ```

5. **Create User Flow**
   ```
   User flows → New user flow
   → Type: Sign up and sign in
   → Name: "B2C_1_external_signup_signin"
   
   Identity providers:
   ✓ Email signup
   
   User attributes:
   ✓ Email Address (required)
   ✓ Given Name (required)
   ✓ Surname (required)
   ✓ Worker Type (required)
   ✓ Nationality (optional)
   
   → Create
   ```

6. **Enable MFA**
   ```
   User flows → B2C_1_external_signup_signin
   → Properties
   → Multi-factor authentication
   
   Method: Email, Phone
   Enforcement: Always on
   
   → Save
   ```

### Step 2: Install Dependencies (5 minutes)

```bash
# Already installed! Verify:
npm list @azure/msal-browser @azure/msal-react

# If missing:
npm install @azure/msal-browser @azure/msal-react
```

### Step 3: Create Authentication Service (10 minutes)

**File**: `src/lib/auth/externalAuthService.ts`

```typescript
import { PublicClientApplication, AccountInfo } from '@azure/msal-browser';

// External ID Configuration
const externalMsalConfig = {
  auth: {
    clientId: '68419950-8189-4e0d-b193-9a1fc59c3961',
    authority: 'https://jectqshe.ciamlogin.com/jectqshe.onmicrosoft.com/B2C_1_external_signup_signin',
    knownAuthorities: ['jectqshe.ciamlogin.com'],
    redirectUri: window.location.origin + '/auth/callback/external'
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false
  }
};

class ExternalAuthService {
  private msalInstance: PublicClientApplication;
  
  constructor() {
    this.msalInstance = new PublicClientApplication(externalMsalConfig);
  }
  
  async initialize() {
    await this.msalInstance.initialize();
  }
  
  // Login (redirects to External ID)
  async login() {
    await this.msalInstance.loginRedirect({
      scopes: ['openid', 'profile', 'email']
    });
  }
  
  // Handle redirect after login
  async handleRedirect() {
    const response = await this.msalInstance.handleRedirectPromise();
    if (response && response.account) {
      return this.parseUserInfo(response.account);
    }
    return null;
  }
  
  // Get current user
  getCurrentUser(): AccountInfo | null {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }
  
  // Logout
  async logout() {
    await this.msalInstance.logoutRedirect();
  }
  
  // Parse user info from token claims
  private parseUserInfo(account: AccountInfo) {
    const claims = account.idTokenClaims as any;
    return {
      id: account.localAccountId,
      email: account.username,
      name: account.name,
      workerType: claims?.extension_worker_type || 'contractor',
      verificationStatus: claims?.extension_verification_status || 'unverified',
      nationality: claims?.extension_nationality,
      isExternal: true
    };
  }
}

export const externalAuthService = new ExternalAuthService();
```

### Step 4: Create Login Component (5 minutes)

**File**: `src/components/auth/ExternalWorkerLogin.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { externalAuthService } from '@/lib/auth/externalAuthService';
import { useNavigate } from 'react-router-dom';

export const ExternalWorkerLogin = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Handle redirect from External ID
    const init = async () => {
      await externalAuthService.initialize();
      const user = await externalAuthService.handleRedirect();
      
      if (user) {
        console.log('✅ External user logged in:', user);
        // Sync with Supabase and redirect
        await syncExternalUser(user);
        navigate('/dashboard');
      }
    };
    init();
  }, [navigate]);
  
  const handleLogin = async () => {
    setLoading(true);
    try {
      await externalAuthService.login();
    } catch (error) {
      console.error('❌ External login failed:', error);
      setLoading(false);
    }
  };
  
  return (
    <div className="external-login-container">
      <div className="login-card">
        <h2>External Worker Login</h2>
        <p>For contractors, consultants, and visitors</p>
        
        <button 
          onClick={handleLogin}
          disabled={loading}
          className="btn-primary"
        >
          {loading ? 'Redirecting...' : 'Login with Email'}
        </button>
        
        <div className="register-link">
          <p>First time? <a href="/register/external">Register as External Worker</a></p>
        </div>
        
        <div className="features">
          <ul>
            <li>✓ Secure multi-factor authentication</li>
            <li>✓ Work with multiple companies</li>
            <li>✓ Access safety patrol system</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Helper: Sync external user to Supabase
async function syncExternalUser(user: any) {
  const { data, error } = await supabase
    .from('users')
    .upsert({
      azure_object_id: user.id,
      email: user.email,
      full_name: user.name,
      user_type: 'external',
      worker_type: user.workerType,
      verification_status: user.verificationStatus,
      is_active: true,
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'azure_object_id',
      ignoreDuplicates: false
    });
  
  if (error) {
    console.error('Failed to sync user:', error);
    throw error;
  }
  
  return data;
}
```

---

## 🧪 Testing (5 minutes)

### Test External Login

1. **Start your app**
   ```bash
   npm run dev
   ```

2. **Navigate to external login**
   ```
   http://localhost:5173/login/external
   ```

3. **Test registration flow**
   - Click "Register as External Worker"
   - Fill form (email, name, worker type)
   - Verify email
   - Setup MFA
   - Login

4. **Verify in database**
   ```sql
   SELECT * FROM users 
   WHERE user_type = 'external' 
   ORDER BY created_at DESC 
   LIMIT 1;
   ```

Expected result:
```json
{
  "email": "contractor@example.com",
  "user_type": "external",
  "worker_type": "contractor",
  "verification_status": "unverified",
  "azure_object_id": "abc-123-def"
}
```

---

## 🎯 Quick Wins Checklist

After 30 minutes, you should have:
- ✅ External ID tenant activated
- ✅ Redirect URIs configured
- ✅ User flow created with MFA
- ✅ Login component working
- ✅ User registration functional
- ✅ Supabase sync operational

---

## 🔐 Security Verification

Run these checks:

### Check 1: MFA Enforcement
```
Login → Should require email/phone verification
Result: ✅ MFA enforced
```

### Check 2: Password Policy
```
Register → Try weak password "12345"
Result: ✅ Rejected (requires 12+ chars)
```

### Check 3: Email Verification
```
Register → Check email inbox
Result: ✅ Verification email sent
```

### Check 4: Account Lockout
```
Login → Enter wrong password 5 times
Result: ✅ Account locked for 30 minutes
```

---

## 📊 Monitoring & Logs

### Azure Portal Logs
```
External Identities → jectqshe
→ Monitoring → Sign-ins
→ View user authentication events
```

### Application Logs
```typescript
// Add logging
console.log('🔐 External auth event:', {
  event: 'login_success',
  userId: user.id,
  workerType: user.workerType,
  timestamp: new Date().toISOString()
});
```

---

## 🚨 Common Issues & Fixes

### Issue 1: "AADB2C90091: The user has cancelled"
```
Cause: User clicked "Cancel" on login screen
Fix: Normal behavior, no action needed
```

### Issue 2: "Redirect URI mismatch"
```
Cause: URI not configured in Azure
Fix: Add URI in App Registration → Authentication
```

### Issue 3: "Custom attributes not showing"
```
Cause: Attributes not added to user flow
Fix: User flows → B2C_1_external_signup_signin → User attributes → Add
```

### Issue 4: "User not syncing to Supabase"
```typescript
// Debug: Check token claims
const claims = account.idTokenClaims;
console.log('Token claims:', claims);

// Verify custom attributes:
console.log('Worker type:', claims.extension_worker_type);
```

---

## 📈 Next Steps

After basic setup works:

### Week 2: Advanced Features
- [ ] Company invitation system
- [ ] Multi-company context switching
- [ ] Document verification upload
- [ ] Admin approval workflow

### Week 3: Security Hardening
- [ ] Risk-based authentication
- [ ] Conditional access policies
- [ ] Advanced audit logging
- [ ] SECL compliance verification

### Week 4: Production Deployment
- [ ] Update production redirect URIs
- [ ] Configure production domain
- [ ] Load testing (500+ users)
- [ ] Security penetration testing

---

## 📚 Resources

- **Full Proposal**: `docs/EXTERNAL_USER_AUTHENTICATION_PROPOSAL.md`
- **Azure External ID Docs**: https://learn.microsoft.com/en-us/azure/active-directory-b2c/
- **MSAL.js Documentation**: https://github.com/AzureAD/microsoft-authentication-library-for-js
- **Your tenant**: https://jectqshe.ciamlogin.com

---

## ✅ Success Criteria

You know it's working when:
- ✅ External users can register with email
- ✅ MFA is enforced during login
- ✅ Users sync to Supabase automatically
- ✅ Verification status tracked correctly
- ✅ Multiple worker types supported
- ✅ No internal user conflicts

---

**Ready to start?** Follow the 30-minute checklist above! 🚀
