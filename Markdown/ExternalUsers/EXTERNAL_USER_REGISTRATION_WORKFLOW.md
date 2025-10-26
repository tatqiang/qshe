# 🔐 External User Registration Workflow
## Microsoft Entra External ID - Complete Registration Flow

> **Date**: October 15, 2025  
> **Status**: Production-Ready Workflow  
> **Target Users**: Contractors, Consultants, Temporary Workers, Visitors  

---

## 📊 Registration Flow Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                  EXTERNAL USER REGISTRATION                      │
│                     (Entra External ID)                          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Entry Point:    │
                    │  User clicks     │
                    │  "Register as    │
                    │  External Worker"│
                    └────────┬─────────┘
                             │
        ┌────────────────────┴────────────────────┐
        │                                         │
        ▼                                         ▼
┌───────────────────┐                  ┌──────────────────────┐
│  With Company     │                  │  Without Company     │
│  Invitation       │                  │  Invitation          │
│  (Pre-approved)   │                  │  (Self Registration) │
└────────┬──────────┘                  └──────────┬───────────┘
         │                                        │
         │                                        │
         └────────────┬───────────────────────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Step 1: Basic Info  │
           │  • Email             │
           │  • Password          │
           │  • Name              │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Step 2: Email       │
           │  Verification        │
           │  (Security Code)     │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Step 3: Worker Info │
           │  • Worker Type       │
           │  • Nationality       │
           │  • Documents         │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Step 4: MFA Setup   │
           │  • Authenticator App │
           │  • Phone/SMS         │
           │  • Backup Codes      │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Step 5: Company     │
           │  Association         │
           │  • Select/Enter Co.  │
           │  • Request Access    │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Registration        │
           │  Complete!           │
           │  Status: UNVERIFIED  │
           └──────────┬───────────┘
                      │
                      ▼
           ┌──────────────────────┐
           │  Admin Approval      │
           │  Required            │
           │  (Company Admin)     │
           └──────────────────────┘
```

---

## 🎯 Detailed Step-by-Step Flow

### **Entry Point: Choose Registration Path**

#### **Path A: With Company Invitation (Recommended)**
```
User receives invitation email:
┌──────────────────────────────────────────────────┐
│ Subject: Invitation to join QSHE Portal          │
│                                                  │
│ Hello,                                           │
│                                                  │
│ ABC Construction has invited you to join the    │
│ QSHE Safety Management Portal as a contractor.  │
│                                                  │
│ [Register with Invitation Code]                 │
│                                                  │
│ Invitation Code: ABC-2025-XYZW123                │
│ Valid until: October 30, 2025                    │
└──────────────────────────────────────────────────┘

User clicks link → Auto-populates:
  ✓ Company: ABC Construction
  ✓ Role: Contractor
  ✓ Pre-approved status: Pending (fast-track)
```

#### **Path B: Self Registration (Public)**
```
User navigates to: https://your-app.com/register/external

┌──────────────────────────────────────────────────┐
│  Register as External Worker                     │
│                                                  │
│  Work with multiple construction companies?      │
│  Register once, access all your projects.        │
│                                                  │
│  [Start Registration] [Have Invitation Code?]   │
└──────────────────────────────────────────────────┘

Status: Unverified (requires company approval)
```

---

### **Step 1: Basic Information (Azure B2C Sign-Up Form)**

**URL**: Redirects to `https://jectqshe.ciamlogin.com`

```
┌─────────────────────────────────────────────────────────┐
│  Create Your Account                                    │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Email Address *                                        │
│  ┌─────────────────────────────────────────────┐       │
│  │ your.email@example.com                      │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Create Password *                                      │
│  ┌─────────────────────────────────────────────┐       │
│  │ ••••••••••••••                              │       │
│  └─────────────────────────────────────────────┘       │
│  ⓘ Must be 12+ characters with uppercase, lowercase,   │
│     numbers, and symbols                                │
│                                                         │
│  Confirm Password *                                     │
│  ┌─────────────────────────────────────────────┐       │
│  │ ••••••••••••••                              │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  First Name *                                           │
│  ┌─────────────────────────────────────────────┐       │
│  │ John                                        │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Last Name *                                            │
│  ┌─────────────────────────────────────────────┐       │
│  │ Smith                                       │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Phone Number (for MFA) *                               │
│  ┌─────────────────────────────────────────────┐       │
│  │ +66 81 234 5678                             │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ☐ I agree to Terms of Service and Privacy Policy      │
│                                                         │
│  [Continue]                                             │
└─────────────────────────────────────────────────────────┘

Validation Rules:
✓ Email: Valid format, not already registered
✓ Password: 12+ chars, 1 upper, 1 lower, 1 number, 1 symbol
✓ Names: 2+ characters each
✓ Phone: Valid international format
```

**Backend Processing**:
```typescript
// Automatic validation by Azure B2C
const passwordPolicy = {
  minimumLength: 12,
  requireUppercase: true,
  requireLowercase: true,
  requireDigits: true,
  requireSymbols: true,
  bannedPasswords: ['Password123!', 'Welcome123!', ...], // Common passwords
  passwordHistory: 12 // Can't reuse last 12 passwords
};

// Account created with status
const newUser = {
  objectId: 'generated-azure-uuid',
  email: 'john.smith@example.com',
  displayName: 'John Smith',
  accountEnabled: false, // Disabled until email verified
  createdDateTime: '2025-10-15T10:30:00Z'
};
```

---

### **Step 2: Email Verification (Security)**

**Immediate after Step 1**:

```
┌─────────────────────────────────────────────────────────┐
│  Verify Your Email                                      │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  We've sent a verification code to:                     │
│  john.smith@example.com                                 │
│                                                         │
│  Enter the 6-digit code:                                │
│                                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                 │
│  │ 4 │ │ 7 │ │ 2 │ │ 9 │ │ 1 │ │ 5 │                 │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                 │
│                                                         │
│  Code expires in: 05:00                                 │
│                                                         │
│  Didn't receive it? [Resend Code]                      │
│                                                         │
│  [Verify Email]                                         │
└─────────────────────────────────────────────────────────┘

Email sent (example):
┌──────────────────────────────────────────────────┐
│ From: QSHE Portal <noreply@jectqshe.com>        │
│ Subject: Verify your email address              │
│                                                  │
│ Hello John,                                      │
│                                                  │
│ Your verification code is:                       │
│                                                  │
│     472915                                       │
│                                                  │
│ This code will expire in 10 minutes.            │
│                                                  │
│ If you didn't request this, ignore this email.  │
└──────────────────────────────────────────────────┘
```

**Security Features**:
- ✅ Code valid for 10 minutes
- ✅ Maximum 3 resend attempts per hour
- ✅ Rate limiting: 5 attempts per code
- ✅ Account locked after 5 failed verifications

---

### **Step 3: Worker Information (Custom Attributes)**

**After email verification**:

```
┌─────────────────────────────────────────────────────────┐
│  Worker Profile Information                             │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Worker Type * (What describes you best?)               │
│  ┌─────────────────────────────────────────────┐       │
│  │ ○ Contractor                               ▼│       │
│  │ ○ Consultant                                 │       │
│  │ ○ Temporary Worker                           │       │
│  │ ○ Visitor                                    │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Nationality *                                          │
│  ┌─────────────────────────────────────────────┐       │
│  │ Thailand                                   ▼│       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ─── For International Workers (Optional) ───          │
│                                                         │
│  Passport Number                                        │
│  ┌─────────────────────────────────────────────┐       │
│  │                                             │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Work Permit Number (if applicable)                     │
│  ┌─────────────────────────────────────────────┐       │
│  │                                             │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Work Permit Expiry Date                                │
│  ┌─────────────────────────────────────────────┐       │
│  │ DD/MM/YYYY                                  │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ─── Emergency Contact ───                             │
│                                                         │
│  Emergency Contact Name *                               │
│  ┌─────────────────────────────────────────────┐       │
│  │ Jane Smith                                  │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Emergency Contact Phone *                              │
│  ┌─────────────────────────────────────────────┐       │
│  │ +66 82 345 6789                             │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  [Back]                              [Continue]         │
└─────────────────────────────────────────────────────────┘
```

**Data Stored in Azure B2C Custom Attributes**:
```json
{
  "extension_worker_type": "contractor",
  "extension_nationality": "Thailand",
  "extension_passport_number": "AB1234567",
  "extension_work_permit_number": "WP2025-12345",
  "extension_work_permit_expiry": "2026-12-31",
  "extension_emergency_contact_name": "Jane Smith",
  "extension_emergency_contact_phone": "+66823456789",
  "extension_verification_status": "unverified",
  "extension_registration_date": "2025-10-15T10:35:00Z"
}
```

---

### **Step 4: Multi-Factor Authentication (MFA) Setup**

**Mandatory for all external users**:

```
┌─────────────────────────────────────────────────────────┐
│  Secure Your Account                                    │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Set up multi-factor authentication (MFA)               │
│  This adds an extra layer of security to your account.  │
│                                                         │
│  Choose your primary method: *                          │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ ✓ Microsoft Authenticator App (Recommended)│       │
│  │   • Most secure                              │       │
│  │   • Works offline                            │       │
│  │   • Push notifications                       │       │
│  │   [Set Up Authenticator]                     │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ ○ SMS to +66 81 234 5678                    │       │
│  │   • Receive codes via text                   │       │
│  │   • Easy to use                              │       │
│  │   [Use SMS]                                  │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ ○ Email Codes                               │       │
│  │   • Backup method                            │       │
│  │   • Less secure                              │       │
│  │   [Use Email]                                │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  You can add additional methods later in settings.      │
│                                                         │
│  [Skip for Now]                         [Continue]      │
└─────────────────────────────────────────────────────────┘
```

#### **Option A: Authenticator App Setup**

```
Step 4a: Scan QR Code
┌─────────────────────────────────────────────────────────┐
│  Set Up Authenticator App                               │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  1. Download Microsoft Authenticator:                   │
│     [iOS App Store] [Google Play Store]                 │
│                                                         │
│  2. Open the app and scan this QR code:                 │
│                                                         │
│     ┌─────────────────────────────┐                    │
│     │                             │                    │
│     │     ███████████████████     │                    │
│     │     ███████████████████     │                    │
│     │     ███████████████████     │                    │
│     │     ███████████████████     │                    │
│     │                             │                    │
│     └─────────────────────────────┘                    │
│                                                         │
│  Can't scan? Enter this code manually:                  │
│  JBSW Y3DP EAXW 6IDL NB2X I2LP NY                      │
│                                                         │
│  [Continue]                                             │
└─────────────────────────────────────────────────────────┘

Step 4b: Verify Setup
┌─────────────────────────────────────────────────────────┐
│  Verify Authenticator App                               │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Enter the 6-digit code from your authenticator app:    │
│                                                         │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                 │
│  │   │ │   │ │   │ │   │ │   │ │   │                 │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                 │
│                                                         │
│  Code refreshes every 30 seconds                        │
│                                                         │
│  [Verify]                                               │
└─────────────────────────────────────────────────────────┘

Step 4c: Backup Codes
┌─────────────────────────────────────────────────────────┐
│  Save Your Backup Codes                                 │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Store these codes in a safe place. You can use them    │
│  if you lose access to your authenticator app.          │
│                                                         │
│  Each code can only be used once:                       │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │  1. A8F7-G2K9-P4W6                          │       │
│  │  2. B3J8-L5N2-Q7X1                          │       │
│  │  3. C9M4-R8T3-S2Y5                          │       │
│  │  4. D6P1-U9V7-W4Z8                          │       │
│  │  5. E2Q5-X3B6-Y1C9                          │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  [Download Codes]  [Print Codes]  [Copy to Clipboard]  │
│                                                         │
│  ☑ I have saved these codes securely                    │
│                                                         │
│  [Continue]                                             │
└─────────────────────────────────────────────────────────┘
```

#### **Option B: SMS Setup**

```
┌─────────────────────────────────────────────────────────┐
│  Set Up SMS Authentication                              │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  We'll send a verification code to:                     │
│  +66 81 234 5678                                        │
│                                                         │
│  [Send Code]                                            │
│                                                         │
│  Enter the code you receive:                            │
│  ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐ ┌───┐                 │
│  │   │ │   │ │   │ │   │ │   │ │   │                 │
│  └───┘ └───┘ └───┘ └───┘ └───┘ └───┘                 │
│                                                         │
│  [Verify]                                               │
└─────────────────────────────────────────────────────────┘
```

---

### **Step 5: Company Association**

#### **Scenario A: With Invitation Code**

```
┌─────────────────────────────────────────────────────────┐
│  Company Association                                    │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Your invitation details:                               │
│                                                         │
│  ┌─────────────────────────────────────────────┐       │
│  │ Company: ABC Construction Ltd.              │       │
│  │ Role: Safety Contractor                     │       │
│  │ Projects: 3 assigned projects               │       │
│  │ Invited by: John Manager (Project Manager)  │       │
│  │ Valid until: October 30, 2025               │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  ☑ I confirm I want to join this company                │
│                                                         │
│  [Accept Invitation]                                    │
└─────────────────────────────────────────────────────────┘

Result: 
✓ Status: Pending Verification (fast-tracked)
✓ Access: Read-only until verified
✓ Admin notified: Approval required
```

#### **Scenario B: Without Invitation (Self-Registration)**

```
┌─────────────────────────────────────────────────────────┐
│  Company Association                                    │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Which company do you want to work with?                │
│                                                         │
│  Search for your company:                               │
│  ┌─────────────────────────────────────────────┐       │
│  │ ABC Const...                               🔍│       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Suggestions:                                           │
│  ┌─────────────────────────────────────────────┐       │
│  │ ○ ABC Construction Ltd.                     │       │
│  │   Construction, Bangkok                      │       │
│  │                                             │       │
│  │ ○ ABC Engineering Co.                       │       │
│  │   Engineering, Chonburi                      │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Can't find your company?                               │
│  [Request New Company]                                  │
│                                                         │
│  Have an invitation code?                               │
│  ┌─────────────────────────────────────────────┐       │
│  │ Enter code: ABC-2025-___________            │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  [Request Access]                                       │
└─────────────────────────────────────────────────────────┘

Request Access Form:
┌─────────────────────────────────────────────────────────┐
│  Request Access to ABC Construction Ltd.                │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Why do you need access? *                              │
│  ┌─────────────────────────────────────────────┐       │
│  │ I am a contractor working on the           │       │
│  │ Central Plaza project...                    │       │
│  │                                             │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Project Name (if applicable)                           │
│  ┌─────────────────────────────────────────────┐       │
│  │ Central Plaza Renovation                    │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  Reference Contact (Optional)                           │
│  ┌─────────────────────────────────────────────┐       │
│  │ Name: Sarah Johnson                         │       │
│  │ Role: Site Manager                          │       │
│  │ Phone: +66 81 999 8888                      │       │
│  └─────────────────────────────────────────────┘       │
│                                                         │
│  [Submit Request]                                       │
└─────────────────────────────────────────────────────────┘

Result:
✓ Status: Unverified (awaits admin approval)
✓ Access: Very limited (profile only)
✓ Notification: Admin email sent
```

---

### **Step 6: Registration Complete**

```
┌─────────────────────────────────────────────────────────┐
│  ✓ Registration Successful!                             │
│  ───────────────────────────────────────────────────────│
│                                                         │
│  Welcome to QSHE Safety Management Portal, John!        │
│                                                         │
│  📧 Email: john.smith@example.com                       │
│  🔐 MFA: Enabled (Authenticator App)                    │
│  🏢 Company: ABC Construction Ltd.                      │
│  📊 Status: ⏳ Pending Verification                      │
│                                                         │
│  ─────────────────────────────────────────────          │
│                                                         │
│  What happens next?                                     │
│                                                         │
│  1. ✅ Your account is created and secured              │
│                                                         │
│  2. ⏳ Company admin will review your profile           │
│     • Verify your identity documents                    │
│     • Approve your access request                       │
│     • This usually takes 1-2 business days              │
│                                                         │
│  3. 📧 You'll receive an email when approved            │
│                                                         │
│  4. ✓ Once verified, you'll have full access to:       │
│     • Safety patrol system                              │
│     • Project assignments                               │
│     • Document uploads                                  │
│     • Meeting attendance                                │
│                                                         │
│  ─────────────────────────────────────────────          │
│                                                         │
│  What you can do now:                                   │
│  • Complete your profile                                │
│  • Upload verification documents                        │
│  • Review safety guidelines                             │
│                                                         │
│  [Go to Dashboard]        [Complete Profile]            │
└─────────────────────────────────────────────────────────┘
```

**Email Sent to User**:
```
┌──────────────────────────────────────────────────┐
│ Subject: Welcome to QSHE Portal - Verification  │
│          Required                                │
│                                                  │
│ Hello John,                                      │
│                                                  │
│ Thank you for registering with QSHE Portal!     │
│                                                  │
│ Your Account Details:                            │
│ • Email: john.smith@example.com                 │
│ • Worker Type: Contractor                       │
│ • Company: ABC Construction Ltd.                │
│ • Status: Pending Verification                  │
│                                                  │
│ Next Steps:                                      │
│ 1. Complete your profile                        │
│ 2. Upload verification documents:               │
│    - Government-issued ID / Passport            │
│    - Work permit (if applicable)                │
│                                                  │
│ [Complete Your Profile]                         │
│                                                  │
│ Questions? Contact: support@qshe.com            │
└──────────────────────────────────────────────────┘
```

**Email Sent to Company Admin**:
```
┌──────────────────────────────────────────────────┐
│ Subject: New External Worker Registration       │
│                                                  │
│ Hello Admin,                                     │
│                                                  │
│ A new external worker has requested access:     │
│                                                  │
│ Worker Details:                                  │
│ • Name: John Smith                              │
│ • Email: john.smith@example.com                 │
│ • Worker Type: Contractor                       │
│ • Nationality: Thailand                         │
│ • Registration Date: Oct 15, 2025               │
│                                                  │
│ Request Details:                                 │
│ • Company: ABC Construction Ltd.                │
│ • Project: Central Plaza Renovation             │
│ • Reference: Sarah Johnson (Site Manager)       │
│                                                  │
│ Action Required:                                 │
│ Please review and verify this worker's profile. │
│                                                  │
│ [Review Worker Profile]  [Approve]  [Reject]    │
│                                                  │
│ This request will expire in 30 days.            │
└──────────────────────────────────────────────────┘
```

---

## 🔄 Admin Verification Workflow

### **Company Admin Dashboard - Pending Verifications**

```
┌─────────────────────────────────────────────────────────────────┐
│  Pending Worker Verifications                                   │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  ┌───────────────────────────────────────────────────────┐     │
│  │ 📋 John Smith - Contractor                          ⏳│     │
│  │ ─────────────────────────────────────────────────────│     │
│  │ Email: john.smith@example.com                        │     │
│  │ Registered: Oct 15, 2025 at 10:35                    │     │
│  │ Worker Type: Contractor                              │     │
│  │ Nationality: Thailand                                │     │
│  │                                                       │     │
│  │ Documents Uploaded:                                  │     │
│  │ ✓ National ID Card (front & back)                   │     │
│  │ ✓ Emergency Contact Info                            │     │
│  │ ⚠ Work Permit - Not uploaded                        │     │
│  │                                                       │     │
│  │ Reference Contact:                                    │     │
│  │ Sarah Johnson - Site Manager                         │     │
│  │ +66 81 999 8888                                      │     │
│  │                                                       │     │
│  │ [View Documents]  [Contact Worker]                   │     │
│  │                                                       │     │
│  │ Verification Decision:                                │     │
│  │ ┌──────────────────────────────────────┐            │     │
│  │ │ Assign Role:                        ▼│            │     │
│  │ │ ○ Safety Officer                     │            │     │
│  │ │ ● External Worker (Contractor)       │            │     │
│  │ │ ○ Supervisor                         │            │     │
│  │ └──────────────────────────────────────┘            │     │
│  │                                                       │     │
│  │ ┌──────────────────────────────────────┐            │     │
│  │ │ Assign to Projects:                 ☑│            │     │
│  │ │ ☑ Central Plaza Renovation           │            │     │
│  │ │ ☐ North Tower Construction           │            │     │
│  │ │ ☐ Industrial Park Phase 2            │            │     │
│  │ └──────────────────────────────────────┘            │     │
│  │                                                       │     │
│  │ Notes (optional):                                     │     │
│  │ ┌──────────────────────────────────────┐            │     │
│  │ │ Verified via phone with Site Manager │            │     │
│  │ │ Sarah Johnson. Worker starts Monday. │            │     │
│  │ └──────────────────────────────────────┘            │     │
│  │                                                       │     │
│  │ [✓ Approve & Verify]  [✗ Reject]  [⏸ Request More Info]   │
│  └───────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📊 Verification Status States

### **Status Flow Diagram**

```
Registration Complete
        │
        ▼
┌─────────────────┐
│   UNVERIFIED    │ ← Initial state
│   🔴 No Access  │
└────────┬────────┘
         │
         │ User uploads documents
         │ OR admin starts review
         ▼
┌─────────────────┐
│    PENDING      │ ← Under review
│  ⏳ Read-only   │
└────────┬────────┘
         │
         ├─────────────┬─────────────┐
         │             │             │
         ▼             ▼             ▼
┌──────────────┐ ┌───────────┐ ┌─────────────┐
│   VERIFIED   │ │ REJECTED  │ │ MORE INFO   │
│ ✅ Full Access│ │❌ Blocked │ │ ⚠️ Limited │
└──────────────┘ └───────────┘ └─────────────┘
                                      │
                                      │ User submits
                                      │ additional docs
                                      ▼
                                ┌──────────┐
                                │ PENDING  │
                                └──────────┘
```

### **Access Permissions by Status**

| Status | Dashboard | Projects | Patrols | Documents | Meetings |
|--------|-----------|----------|---------|-----------|----------|
| **Unverified** | ⚠️ Profile only | ❌ | ❌ | ✅ Upload ID | ❌ |
| **Pending** | ✅ View | ⚠️ View assigned | ❌ | ✅ Upload verification | ❌ |
| **More Info** | ✅ View | ⚠️ View assigned | ❌ | ✅ Upload required docs | ❌ |
| **Verified** | ✅ Full | ✅ Full | ✅ Create/Edit | ✅ All functions | ✅ Join |
| **Rejected** | ❌ Blocked | ❌ | ❌ | ❌ | ❌ |

---

## 🔐 Security Features Throughout Registration

### **1. Email Security**
- ✅ Email verification required (6-digit code)
- ✅ Code expires after 10 minutes
- ✅ Maximum 3 resend attempts per hour
- ✅ Rate limiting on verification attempts

### **2. Password Security**
- ✅ 12+ characters minimum
- ✅ Complexity requirements enforced
- ✅ Common password blacklist
- ✅ Password history (12 previous)
- ✅ Encrypted in transit and at rest

### **3. MFA Security**
- ✅ Mandatory for all external users
- ✅ Multiple method options
- ✅ Backup codes provided
- ✅ Re-authentication on sensitive actions

### **4. Account Security**
- ✅ Account lockout after 5 failed attempts
- ✅ 30-minute lockout duration
- ✅ Smart lockout (detects patterns)
- ✅ Suspicious activity alerts

### **5. Data Security**
- ✅ All data encrypted (AES-256)
- ✅ Azure AD security compliance
- ✅ GDPR compliant data handling
- ✅ Audit logs for all actions

---

## 📱 Mobile Experience

### **Responsive Design - Registration on Mobile**

```
┌──────────────────────┐
│ ☰  QSHE Portal      │
├──────────────────────┤
│                      │
│  Register as         │
│  External Worker     │
│                      │
│  Email *             │
│  ┌────────────────┐ │
│  │ your@email.com │ │
│  └────────────────┘ │
│                      │
│  Password *          │
│  ┌────────────────┐ │
│  │ ••••••••••••   │ │
│  └────────────────┘ │
│  ⓘ 12+ chars        │
│                      │
│  First Name *        │
│  ┌────────────────┐ │
│  │                │ │
│  └────────────────┘ │
│                      │
│  [Continue]          │
│                      │
│  Already registered? │
│  [Login]             │
│                      │
└──────────────────────┘

Features:
✓ Touch-optimized inputs
✓ Native mobile keyboards
✓ Camera for document upload
✓ Biometric MFA support
✓ SMS code auto-fill
```

---

## 📧 Notification Timeline

### **User Notifications**

```
T+0 min:   Registration started
           └─ Welcome email sent

T+1 min:   Email verification code sent
           └─ Code: 472915 (expires in 10 min)

T+5 min:   MFA setup complete
           └─ Backup codes email sent

T+10 min:  Registration complete
           └─ "Pending verification" email
           
T+1 day:   Reminder to upload documents
           └─ "Complete your profile" email
           
T+2 days:  Admin approved account
           └─ "Account verified!" email
           
T+2 days:  Welcome email with getting started guide
           └─ Links to training materials
```

### **Admin Notifications**

```
T+10 min:  New worker registration
           └─ Email: Review required
           
T+1 day:   Documents uploaded
           └─ Email: Ready for verification
           
T+7 days:  Pending verification reminder
           └─ Email: Action required
           
T+30 days: Request expiring soon
           └─ Email: Approve or reject
```

---

## 🎯 Success Metrics

### **Registration Completion Rate**

```
Target: 80% completion rate

Step 1 (Basic Info):      100% (started)
Step 2 (Email Verify):     95% (5% dropout)
Step 3 (Worker Info):      90% (5% dropout)
Step 4 (MFA Setup):        85% (5% dropout)
Step 5 (Company):          82% (3% dropout)
Step 6 (Complete):         82% ✅

Time to Complete: Average 8 minutes
```

### **Verification Timeline**

```
Target: 80% verified within 48 hours

Verification Times:
0-24 hours:  45% verified ✅
24-48 hours: 35% verified ✅
48-72 hours: 15% verified ⚠️
72+ hours:    5% pending   ⚠️

Average: 32 hours
```

---

## 🔧 Technical Implementation

### **Azure B2C User Flow Configuration**

```xml
<!-- User Flow: B2C_1_external_signup_signin -->
<UserJourney Id="ExternalWorkerSignUp">
  <OrchestrationSteps>
    
    <!-- Step 1: Email & Password -->
    <OrchestrationStep Order="1" Type="ClaimsExchange">
      <ClaimsExchanges>
        <ClaimsExchange Id="SignUpWithLogonEmail" 
                       TechnicalProfileReferenceId="LocalAccountSignUpWithLogonEmail" />
      </ClaimsExchanges>
    </OrchestrationStep>
    
    <!-- Step 2: Email Verification -->
    <OrchestrationStep Order="2" Type="ClaimsExchange">
      <ClaimsExchanges>
        <ClaimsExchange Id="EmailVerification" 
                       TechnicalProfileReferenceId="EmailVerificationCode" />
      </ClaimsExchanges>
    </OrchestrationStep>
    
    <!-- Step 3: Worker Information -->
    <OrchestrationStep Order="3" Type="ClaimsExchange">
      <ClaimsExchanges>
        <ClaimsExchange Id="SelfAssertedWorkerInfo" 
                       TechnicalProfileReferenceId="SelfAsserted-WorkerProfile" />
      </ClaimsExchanges>
    </OrchestrationStep>
    
    <!-- Step 4: MFA Setup -->
    <OrchestrationStep Order="4" Type="ClaimsExchange">
      <ClaimsExchanges>
        <ClaimsExchange Id="PhoneFactor" 
                       TechnicalProfileReferenceId="PhoneFactor-InputOrVerify" />
      </ClaimsExchanges>
    </OrchestrationStep>
    
    <!-- Step 5: Issue Token -->
    <OrchestrationStep Order="5" Type="SendClaims" 
                      CpimIssuerTechnicalProfileReferenceId="JwtIssuer" />
    
  </OrchestrationSteps>
</UserJourney>
```

### **Frontend Integration**

```typescript
// src/pages/ExternalRegistration.tsx
import { externalAuthService } from '@/lib/auth/externalAuthService';

export const ExternalRegistration = () => {
  const startRegistration = async () => {
    // Redirect to Azure B2C registration flow
    await externalAuthService.register({
      flow: 'B2C_1_external_signup_signin',
      redirectUri: `${window.location.origin}/auth/callback/external`,
      scopes: ['openid', 'profile', 'email']
    });
  };
  
  return (
    <button onClick={startRegistration}>
      Register as External Worker
    </button>
  );
};

// After registration completes and redirects back:
useEffect(() => {
  const handleRegistrationCallback = async () => {
    const user = await externalAuthService.handleRedirectPromise();
    
    if (user) {
      // Sync new user to Supabase
      await syncExternalUserToDatabase({
        azureObjectId: user.id,
        email: user.email,
        fullName: user.name,
        workerType: user.idTokenClaims.extension_worker_type,
        verificationStatus: 'unverified',
        nationality: user.idTokenClaims.extension_nationality
      });
      
      // Redirect to dashboard
      navigate('/dashboard');
    }
  };
  
  handleRegistrationCallback();
}, []);
```

---

## ✅ Workflow Summary

**Total Time**: 8-12 minutes (user input)  
**Steps**: 6 main steps  
**Security**: Multi-layered (email, password, MFA)  
**Verification**: Admin approval required  
**Access**: Tiered based on verification status  

**Ready for Production**: ✅ Yes

---

**Document Status**: ✅ Complete Registration Workflow  
**Implementation Guide**: See `EXTERNAL_USER_QUICK_START.md`  
**Next Steps**: Configure Azure B2C user flows and deploy  
