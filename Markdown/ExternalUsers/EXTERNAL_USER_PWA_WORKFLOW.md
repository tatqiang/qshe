# 🚀 External User Registration & Login - PWA Workflow
## Complete User Journey: From Landing Page to Dashboard

> **Date**: October 15, 2025  
> **Purpose**: End-to-end workflow for external users accessing QSHE PWA  
> **User Types**: Contractors, Consultants, Temporary Workers, Visitors  

---

## 📱 Complete User Journey Map

```
┌─────────────────────────────────────────────────────────────────┐
│                    QSHE PWA - External User Flow                 │
└─────────────────────────────────────────────────────────────────┘

   NEW USER                                      RETURNING USER
      │                                                │
      ▼                                                ▼
┌──────────────┐                              ┌──────────────┐
│ Landing Page │                              │ Landing Page │
│ your-app.com │                              │ your-app.com │
└──────┬───────┘                              └──────┬───────┘
       │                                              │
       │ Click "Get Started"                         │ Click "Login"
       ▼                                              ▼
┌──────────────────┐                          ┌──────────────────┐
│ Choose User Type │                          │ Login Selection  │
│ • Internal User  │                          │ • Internal Login │
│ • External User  │◄─────────────────────────┤ • External Login │
└──────┬───────────┘                          └──────┬───────────┘
       │                                              │
       │ Select "External"                           │ Select "External"
       ▼                                              ▼
┌──────────────────┐                          ┌──────────────────┐
│ Registration     │                          │ External Login   │
│ Options          │                          │ (Azure B2C)      │
│ • Have Code?     │                          └──────┬───────────┘
│ • Register Now   │                                 │
└──────┬───────────┘                                 │ Authenticate
       │                                              │ with MFA
       │ Choose path                                  │
       ▼                                              ▼
┌──────────────────┐                          ┌──────────────────┐
│ Azure B2C        │                          │ Redirect to PWA  │
│ Registration     │                          │ with Token       │
│ (Steps 1-6)      │                          └──────┬───────────┘
└──────┬───────────┘                                 │
       │                                              │
       │ Complete signup                              │
       │ Setup MFA                                    │
       │                                              │
       ▼                                              │
┌──────────────────┐                                 │
│ Redirect to PWA  │                                 │
│ with Token       │                                 │
└──────┬───────────┘                                 │
       │                                              │
       └──────────────────┬───────────────────────────┘
                          │
                          ▼
                  ┌───────────────┐
                  │ Check Status  │
                  │ in Database   │
                  └───────┬───────┘
                          │
          ┌───────────────┴───────────────┐
          │                               │
          ▼                               ▼
   ┌──────────────┐              ┌──────────────┐
   │ UNVERIFIED   │              │  VERIFIED    │
   │ Limited      │              │  Full Access │
   └──────┬───────┘              └──────┬───────┘
          │                             │
          ▼                             ▼
   ┌──────────────┐              ┌──────────────┐
   │ Onboarding   │              │ Dashboard    │
   │ Wizard       │              │ Full Access  │
   └──────────────┘              └──────────────┘
```

---

## 🌐 Part 1: Landing Page (First Visit)

### **URL**: `https://qshe-app.com`

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] QSHE Safety Management                    [Login]       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│               🏗️ Construction Safety Made Simple                │
│                                                                 │
│         Digital Safety Management for Construction Sites        │
│                                                                 │
│              ┌────────────────────────────────┐                │
│              │      [Get Started Free]        │                │
│              └────────────────────────────────┘                │
│                                                                 │
│              Already have an account? [Login]                   │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  ✓ Safety Patrols            ✓ Project Management              │
│  ✓ Corrective Actions        ✓ Document Management             │
│  ✓ Risk Assessment           ✓ Mobile & Offline Ready          │
│                                                                 │
│  ────────────────────────────────────────────────────────────  │
│                                                                 │
│  "Working with multiple construction companies?                 │
│   Register once, access all your projects."                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**User Actions**:
- Click **"Get Started Free"** → Goes to registration selection
- Click **"Login"** (top right) → Goes to login selection

---

## 📝 Part 2: User Type Selection

### **URL**: `https://qshe-app.com/get-started`

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] QSHE                          [← Back]    [Have Code?]  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    Choose Your Account Type                      │
│                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐ │
│  │  👔 Internal Staff          │  │  🔧 External Worker     │ │
│  │                             │  │                         │ │
│  │  For company employees      │  │  For contractors,       │ │
│  │  with @th.jec.com email     │  │  consultants, visitors  │ │
│  │                             │  │                         │ │
│  │  • Single Sign-On (SSO)     │  │  • Multi-company access │ │
│  │  • Company directory        │  │  • Project-based work   │ │
│  │  • Full system access       │  │  • Flexible roles       │ │
│  │                             │  │                         │ │
│  │  [Login with Microsoft]     │  │  [Register Now]         │ │
│  │                             │  │                         │ │
│  └─────────────────────────────┘  └─────────────────────────┘ │
│                                                                 │
│  ℹ️  Not sure which one? Contact your project manager           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**User Flow**:
1. User clicks **"External Worker"** → **"Register Now"**
2. System checks if user has invitation code
3. Redirects to appropriate flow

---

## 🎯 Part 3: Registration Path Selection

### **URL**: `https://qshe-app.com/register/external`

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] QSHE                                         [← Back]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│              Register as External Worker                         │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🎫 Do you have an invitation code?                             │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  YES - I have an invitation code from a company        │    │
│  │                                                        │    │
│  │  Enter your invitation code:                           │    │
│  │  ┌──────────────────────────────────────────┐         │    │
│  │  │ ABC-2025-_____________                   │         │    │
│  │  └──────────────────────────────────────────┘         │    │
│  │                                                        │    │
│  │  ✓ Faster approval process                            │    │
│  │  ✓ Auto-assigned to company & projects                │    │
│  │  ✓ Pre-configured access rights                       │    │
│  │                                                        │    │
│  │  [Continue with Code]                                  │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ─── OR ───                                                     │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐    │
│  │  NO - I want to register without a code                │    │
│  │                                                        │    │
│  │  Register independently and request access to          │    │
│  │  companies later.                                      │    │
│  │                                                        │    │
│  │  ⚠️  Requires company admin approval                   │    │
│  │  ⏱️  May take 1-2 business days                         │    │
│  │                                                        │    │
│  │  [Continue without Code]                               │    │
│  └────────────────────────────────────────────────────────┘    │
│                                                                 │
│  ℹ️  You can add multiple companies after registration          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**User Clicks**:
- **"Continue with Code"** → Validates code → Pre-fills company info → Azure B2C
- **"Continue without Code"** → Standard registration → Azure B2C

---

## 🔐 Part 4: Azure B2C Registration

### **Redirects to**: `https://jectqshe.ciamlogin.com/...`

This is the Azure B2C hosted page (covered in detail in EXTERNAL_USER_REGISTRATION_WORKFLOW.md)

**Steps**:
1. Email & Password creation
2. Email verification (6-digit code)
3. Worker information (type, nationality, documents)
4. MFA setup (Authenticator/SMS)
5. Company association
6. Registration complete

**Duration**: 8-12 minutes

**Upon Completion**: Redirects back to PWA

---

## 🔄 Part 5: Return to PWA After Registration

### **Redirect URL**: `https://qshe-app.com/auth/callback?code=...`

```typescript
// Automatic backend processing
const handleAuthCallback = async () => {
  // 1. Exchange code for token
  const token = await exchangeAuthCode(code);
  
  // 2. Get user info from Azure B2C token
  const azureUser = decodeToken(token);
  
  // 3. Check if user exists in Supabase
  let user = await supabase
    .from('users')
    .select('*')
    .eq('azure_object_id', azureUser.oid)
    .single();
  
  // 4. Create or update user in database
  if (!user) {
    user = await createExternalUser({
      azure_object_id: azureUser.oid,
      email: azureUser.email,
      full_name: azureUser.name,
      user_type: 'external',
      worker_type: azureUser.extension_worker_type,
      verification_status: 'unverified',
      nationality: azureUser.extension_nationality,
      created_at: new Date()
    });
  }
  
  // 5. Set session and redirect based on status
  if (user.verification_status === 'unverified') {
    redirect('/onboarding');
  } else if (user.verification_status === 'verified') {
    redirect('/dashboard');
  }
};
```

---

## 🎓 Part 6A: Onboarding (Unverified Users)

### **URL**: `https://qshe-app.com/onboarding`

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] QSHE                        👤 John Smith  [Profile]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ✓ Welcome to QSHE Portal!                                      │
│                                                                 │
│  Your account is created but needs verification to              │
│  access all features.                                           │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📋 Complete Your Profile                                       │
│                                                                 │
│  Progress: ████████████░░░░░░░░ 60%                            │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ Step 1: Basic Information                      ✅   │       │
│  │ Name, email, contact info                          │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ Step 2: Upload Verification Documents         ⏳   │       │
│  │                                                     │       │
│  │ Please upload the following:                        │       │
│  │                                                     │       │
│  │ Required Documents:                                 │       │
│  │ ☐ Government-issued ID (front)                     │       │
│  │    [📎 Upload File]                                 │       │
│  │                                                     │       │
│  │ ☐ Government-issued ID (back)                      │       │
│  │    [📎 Upload File]                                 │       │
│  │                                                     │       │
│  │ Optional Documents:                                 │       │
│  │ ☐ Passport (for international workers)             │       │
│  │    [📎 Upload File]                                 │       │
│  │                                                     │       │
│  │ ☐ Work permit (if applicable)                      │       │
│  │    [📎 Upload File]                                 │       │
│  │                                                     │       │
│  │ ℹ️ Supported formats: JPG, PNG, PDF (max 5MB each)  │       │
│  │                                                     │       │
│  │ [Save & Continue]                                   │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  ┌─────────────────────────────────────────────────────┐       │
│  │ Step 3: Company Association                    ⏸️   │       │
│  │ Waiting for admin approval                          │       │
│  └─────────────────────────────────────────────────────┘       │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  🔒 Limited Access Mode                                         │
│                                                                 │
│  What you can do now:                                           │
│  ✓ Complete your profile                                        │
│  ✓ Upload verification documents                               │
│  ✓ View safety guidelines                                       │
│  ✓ Browse help documentation                                    │
│                                                                 │
│  ⏳ After verification (1-2 business days):                     │
│  • Create and manage safety patrols                             │
│  • Access assigned projects                                     │
│  • Upload documents and photos                                  │
│  • Join meetings and training                                   │
│                                                                 │
│  [Complete Profile]              [Skip for Now]                 │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**User Experience**:
1. User uploads documents
2. System notifies company admin
3. User can access limited features
4. Status shown in profile: "⏳ Pending Verification"

---

## 📊 Part 6B: Dashboard (Verified Users)

### **URL**: `https://qshe-app.com/dashboard`

```
┌─────────────────────────────────────────────────────────────────┐
│  [≡] QSHE Portal                    👤 John Smith [Profile] [🔔]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Welcome back, John! 👋                                         │
│  ABC Construction Ltd. | Contractor ✅ Verified                 │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  📈 Your Activity                                               │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐    │
│  │  Patrols    │   Issues    │  Projects   │  Documents  │    │
│  │     12      │      3      │      2      │     45      │    │
│  │  This Month │  Open       │  Active     │  Uploaded   │    │
│  └─────────────┴─────────────┴─────────────┴─────────────┘    │
│                                                                 │
│  🏢 Your Companies                                              │
│  ┌──────────────────────────────────────────────────────┐      │
│  │ 🔵 ABC Construction Ltd. (Active)                    │      │
│  │    Role: Safety Contractor                           │      │
│  │    Projects: Central Plaza, North Tower              │      │
│  │    [Switch to this company] ←                        │      │
│  ├──────────────────────────────────────────────────────┤      │
│  │ ⚪ XYZ Engineering Co.                               │      │
│  │    Role: Consultant                                  │      │
│  │    Projects: Industrial Park Phase 2                 │      │
│  │    [Switch to this company]                          │      │
│  └──────────────────────────────────────────────────────┘      │
│                                                                 │
│  🚨 Recent Alerts                                               │
│  • New safety patrol assigned (Central Plaza)                   │
│  • Corrective action due in 2 days                             │
│                                                                 │
│  📋 Quick Actions                                               │
│  [+ New Safety Patrol]  [View Projects]  [Upload Document]     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Sidebar Menu:
├── 🏠 Dashboard
├── 🏗️ Projects (2 active)
├── 🚶 Safety Patrols
├── ⚠️ Issues & Corrective Actions (3 open)
├── 📊 Risk Management
├── 📁 Documents
├── 👥 Team (if assigned)
├── ⚙️ Settings
└── 🚪 Logout
```

---

## 🔑 Part 7: Returning User Login

### **URL**: `https://qshe-app.com/login`

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] QSHE Safety Management                    [Get Started] │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                        Welcome Back!                             │
│                                                                 │
│                    Login to Your Account                         │
│                                                                 │
│  ┌─────────────────────────────┐  ┌─────────────────────────┐ │
│  │  👔 Internal Staff          │  │  🔧 External Worker     │ │
│  │                             │  │                         │ │
│  │  For company employees      │  │  For contractors,       │ │
│  │  @th.jec.com                │  │  consultants, visitors  │ │
│  │                             │  │                         │ │
│  │  [Login with Microsoft]     │  │  [Login with Email]     │ │
│  │                             │  │                         │ │
│  └─────────────────────────────┘  └─────────────────────────┘ │
│                                                                 │
│  Don't have an account? [Register Now]                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**User Clicks**: **"Login with Email"** (External Worker)

---

## 🔐 Part 8: External Login Flow

### **Redirects to**: `https://jectqshe.ciamlogin.com/...`

```
┌─────────────────────────────────────────────────────────────────┐
│  QSHE Portal                                         [← Back]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    Sign in to your account                       │
│                                                                 │
│  Email address                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ john.smith@example.com                                   │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Password                                                       │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ••••••••••••••                                           │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ☐ Keep me signed in                                            │
│                                                                 │
│  [Sign In]                                                      │
│                                                                 │
│  [Forgot your password?]                                        │
│                                                                 │
│  Don't have an account? [Sign up now]                           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**After submitting credentials**:

```
┌─────────────────────────────────────────────────────────────────┐
│  QSHE Portal                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    Verify your identity                          │
│                                                                 │
│  Choose a verification method:                                  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ● Microsoft Authenticator App                            │  │
│  │   Enter the code from your app                           │  │
│  │                                                          │  │
│  │   ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                 │  │
│  │   │   │ │   │ │   │ │   │ │   │ │   │                 │  │
│  │   └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ ○ Text message (+66 *** *** 5678)                       │  │
│  │   [Send Code]                                            │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  [Verify]                                                       │
│                                                                 │
│  [Use backup code]                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**After MFA verification**: Redirects back to PWA dashboard

---

## 🔄 Part 9: Company Context Switching

When user belongs to multiple companies:

```
┌─────────────────────────────────────────────────────────────────┐
│  [≡] QSHE Portal                    👤 John Smith [Profile] [🔔]│
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  🏢 ABC Construction Ltd. ▼                                     │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │ Current Company: ABC Construction Ltd.                   │  │
│  │ Role: Safety Contractor                                  │  │
│  │ ──────────────────────────────────────────────────────── │  │
│  │                                                          │  │
│  │ 🔵 ABC Construction Ltd. (Active)                       │  │
│  │    2 Projects • 3 Open Issues                           │  │
│  │    ✓ Currently viewing                                   │  │
│  │                                                          │  │
│  │ ⚪ XYZ Engineering Co.                                   │  │
│  │    1 Project • No open issues                           │  │
│  │    [🔄 Switch to this company]                          │  │
│  │                                                          │  │
│  │ ⚪ Thai Construction Partners                            │  │
│  │    Status: ⏳ Pending verification                       │  │
│  │    [View status]                                         │  │
│  │                                                          │  │
│  │ ──────────────────────────────────────────────────────── │  │
│  │ [+ Join Another Company]                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**When switching companies**:
1. User clicks "Switch to this company"
2. MFA re-authentication prompt (security)
3. System loads new company context:
   - Projects from new company
   - Permissions for new company role
   - Documents from new company
4. Dashboard updates with new company data

---

## 📱 Part 10: Mobile PWA Experience

### **Installation Prompt**

When user visits on mobile browser 3 times:

```
┌──────────────────────────┐
│  Install QSHE App?       │
├──────────────────────────┤
│                          │
│  [App Icon]              │
│  QSHE Safety Management  │
│                          │
│  • Work offline          │
│  • Home screen access    │
│  • Faster performance    │
│  • Push notifications    │
│                          │
│  [Install] [Not Now]     │
└──────────────────────────┘
```

### **After Installation**

User gets app icon on home screen:

```
Phone Home Screen:
┌────┬────┬────┬────┐
│ 📧 │ 📱 │ 🎵 │ 📷 │
├────┼────┼────┼────┤
│ 🌐 │ 📊 │ 🏗️ │ 💬 │  ← 🏗️ = QSHE App
├────┼────┼────┼────┤
│    │    │    │    │
└────┴────┴────┴────┘
```

Tap icon → Opens PWA (app-like experience, no browser UI)

---

## 🔐 Part 11: Session Management

### **Session Behavior**

```typescript
// Session settings for external users
const sessionConfig = {
  duration: '8 hours',
  inactivityTimeout: '30 minutes',
  refreshTokenValidity: '30 days',
  requireReauth: {
    companySwitching: true,
    sensitiveActions: true,
    after24Hours: true
  }
};
```

**User Experience**:
- ✅ Stays logged in for 8 hours (active use)
- ⏱️ Auto-logout after 30 min inactivity
- 🔒 Re-authentication required for:
  - Company switching
  - Sensitive actions (delete, approve)
  - After 24 hours (regardless of activity)

### **Session Expired Screen**

```
┌─────────────────────────────────────────────────────────────────┐
│  [Logo] QSHE                                                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│                    🔒 Session Expired                            │
│                                                                 │
│  Your session has expired for security reasons.                 │
│                                                                 │
│  Please log in again to continue.                               │
│                                                                 │
│  [Login Again]                                                  │
│                                                                 │
│  ℹ️ For security, we automatically log you out after 30         │
│     minutes of inactivity.                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📧 Part 12: Email Notifications

### **Registration Confirmation**

```
From: QSHE Portal <noreply@qshe.com>
Subject: Welcome to QSHE Portal! 🎉

Hello John,

Your external worker account has been created successfully!

Account Details:
• Email: john.smith@example.com
• Worker Type: Contractor
• Status: Pending Verification
• Companies: ABC Construction Ltd. (Pending)

Next Steps:
1. Complete your profile
2. Upload verification documents
3. Wait for company admin approval (1-2 business days)

[Complete Your Profile]

Need help? Visit our Help Center or contact support@qshe.com

Best regards,
QSHE Team
```

### **Verification Approved**

```
From: QSHE Portal <noreply@qshe.com>
Subject: ✅ Your account has been verified!

Hello John,

Great news! Your account has been verified by ABC Construction Ltd.

You now have full access to:
✓ Create and manage safety patrols
✓ Access assigned projects (2 projects)
✓ Upload documents and photos
✓ Report issues and track corrective actions
✓ Join meetings and training sessions

[Go to Dashboard]

Welcome to the team!

QSHE Team
```

### **Weekly Activity Summary**

```
From: QSHE Portal <noreply@qshe.com>
Subject: Your weekly activity summary - Oct 8-15

Hello John,

Here's your activity summary for ABC Construction Ltd.:

This Week:
• 🚶 3 safety patrols completed
• ⚠️ 1 new issue reported
• ✅ 2 corrective actions closed
• 📄 5 documents uploaded

Action Required:
• 1 corrective action due tomorrow
• 2 pending safety observations

[View Full Report]

Keep up the great work!
```

---

## 🚨 Part 13: Error States & Recovery

### **Account Not Verified**

When user tries to access restricted feature:

```
┌─────────────────────────────────────────────────────────────────┐
│  ⚠️ Verification Required                                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  This feature requires a verified account.                      │
│                                                                 │
│  Your account status: ⏳ Pending Verification                    │
│                                                                 │
│  To access this feature:                                        │
│  1. Complete your profile                                       │
│  2. Upload verification documents                               │
│  3. Wait for company admin approval                             │
│                                                                 │
│  [Upload Documents]          [Contact Admin]                    │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Company Access Denied**

```
┌─────────────────────────────────────────────────────────────────┐
│  🚫 Access Denied                                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  You don't have access to this company's data.                  │
│                                                                 │
│  Current company: ABC Construction Ltd.                         │
│  Attempted access: XYZ Engineering Co.                          │
│                                                                 │
│  If you believe this is an error, please:                       │
│  • Request access from company admin                            │
│  • Verify you're using the correct account                      │
│                                                                 │
│  [Request Access]            [Switch Company]                   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### **Offline Mode**

```
┌─────────────────────────────────────────────────────────────────┐
│  📴 You're Offline                                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  No internet connection detected.                               │
│                                                                 │
│  ✓ You can still:                                               │
│  • View cached data                                             │
│  • Create safety patrols                                        │
│  • Take photos                                                  │
│  • Fill out forms                                               │
│                                                                 │
│  Your changes will sync automatically when you're back online.  │
│                                                                 │
│  Changes pending sync: 3 items                                  │
│  [View Pending Changes]                                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Complete User Journey Timeline

### **First-Time User** (New Registration)

```
Day 0 - Registration Day:
00:00  User visits qshe-app.com
00:02  Clicks "Get Started" → "External Worker"
00:03  Redirected to Azure B2C registration
00:15  Completes registration (8-12 min average)
00:15  Redirected back to PWA
00:16  Sees onboarding wizard
00:20  Uploads verification documents
00:21  Dashboard access (limited features)

Email sent:
✉️ Welcome email with next steps

Day 1 - Pending Verification:
Admin receives notification
User can:
  ✓ Complete profile
  ✓ Browse documentation
  ✗ Create patrols (locked)
  ✗ Access projects (locked)

Day 2 - Approval Day:
Admin reviews and approves account
User receives email: "Account Verified!"

Day 2+ - Full Access:
User can:
  ✅ Create safety patrols
  ✅ Access all assigned projects
  ✅ Upload documents
  ✅ Join meetings
  ✅ Full system access
```

### **Returning User** (Daily Login)

```
Day N - Regular Day:
08:00  Opens PWA app (installed on phone)
08:01  Biometric unlock (if enabled)
08:02  Dashboard loads
08:05  Creates safety patrol
08:30  Takes photos offline
09:00  Back online → Auto-syncs
12:00  Switches to another company
12:01  MFA re-authentication
12:02  New company context loaded
17:00  Logs out

Session: 8 hours active
MFA challenges: 2 (initial + company switch)
Offline time: 30 minutes (auto-synced)
```

---

## ✅ Key Workflow Features

### **Security**
- ✅ Multi-factor authentication mandatory
- ✅ Session timeout after 30 min inactivity
- ✅ Re-authentication for sensitive actions
- ✅ Encrypted data transmission (HTTPS)

### **User Experience**
- ✅ Progressive onboarding
- ✅ Clear status indicators
- ✅ Helpful error messages
- ✅ Mobile-optimized interface
- ✅ Offline capability

### **Multi-Company**
- ✅ Easy company switching
- ✅ Context-aware permissions
- ✅ Separate data per company
- ✅ Clear role indication

### **Verification**
- ✅ Tiered access (unverified → verified)
- ✅ Document upload system
- ✅ Admin approval workflow
- ✅ Email notifications

---

## 🎯 Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Registration Completion | 80% | From start to finish |
| Time to First Login | < 15 min | Registration to dashboard |
| Verification Approval | < 48 hours | Admin approval time |
| Daily Active Users | 70% | External workers logging in |
| Session Duration | 2+ hours | Average active time |
| Feature Adoption | 60% | Creating patrols/issues |

---

## 📚 Related Documents

1. **Technical Workflow**: `EXTERNAL_USER_REGISTRATION_WORKFLOW.md`
2. **Authentication Proposal**: `EXTERNAL_USER_AUTHENTICATION_PROPOSAL.md`
3. **Quick Start Guide**: `EXTERNAL_USER_QUICK_START.md`
4. **Solution Comparison**: `EXTERNAL_USER_SOLUTION_COMPARISON.md`

---

**Document Status**: ✅ Complete PWA User Journey  
**Ready for**: UI/UX Design & Development  
**Next Steps**: Create UI components and implement flows  
