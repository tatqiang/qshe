# ❓ External User Authentication - Common Questions

> **Date**: October 15, 2025  
> **Purpose**: Clarify common misconceptions about external user authentication

---

## 🔍 Key Clarifications

### ❌ **MISCONCEPTION #1: External users need a Microsoft account**

**Answer: NO! External users do NOT need a Microsoft account.**

---

## 📧 Question 1: Do external users need a Microsoft account?

### **NO - They register with ANY email address**

```
┌─────────────────────────────────────────────────────────────┐
│  INTERNAL USERS (Employees)                                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ MUST use Microsoft account                              │
│  ✅ MUST have @th.jec.com email                            │
│  ✅ Company Active Directory (Azure AD)                     │
│                                                             │
│  Login: Microsoft SSO                                       │
│                                                             │
│  Example:                                                   │
│  • nithat.su@th.jec.com → Uses Microsoft account           │
│  • sarah.manager@th.jec.com → Uses Microsoft account       │
│                                                             │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  EXTERNAL USERS (Contractors/Consultants)                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ✅ Can use ANY email address                               │
│  ✅ Do NOT need Microsoft account                           │
│  ✅ Azure External ID (B2C) - Separate system               │
│                                                             │
│  Login: Email + Password (they create)                      │
│                                                             │
│  Examples of VALID email addresses:                         │
│  • john.contractor@gmail.com        ✅                      │
│  • worker@yahoo.com                 ✅                      │
│  • consultant@hotmail.com           ✅                      │
│  • supervisor@company.co.th         ✅                      │
│  • any-email@any-domain.com         ✅                      │
│                                                             │
│  NO Microsoft account needed!                               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **How It Works for External Users**

```
Registration Process:

Step 1: User enters THEIR email
┌────────────────────────────────┐
│ Email: john@gmail.com          │  ← Any email, not Microsoft!
│ Password: CreateNewOne123!     │  ← They create a new password
└────────────────────────────────┘

Step 2: Email verification
• System sends code to john@gmail.com
• User enters code
• Email verified ✅

Step 3: Account created in Azure B2C
• Stored in Azure External ID (NOT regular Azure AD)
• No Microsoft account involved
• User owns the password
```

### **Technical Explanation**

```typescript
// INTERNAL USERS (Employees)
const internalAuth = {
  provider: 'Microsoft Entra ID (Azure AD)',
  requirement: 'Must have @th.jec.com email',
  authentication: 'Microsoft Account (SSO)',
  managed_by: 'Company IT Department',
  example: 'nithat.su@th.jec.com'
};

// EXTERNAL USERS (Contractors)
const externalAuth = {
  provider: 'Microsoft Entra External ID (Azure AD B2C)',
  requirement: 'Any email address',
  authentication: 'Email + Password (user creates)',
  managed_by: 'User themselves',
  microsoft_account_needed: false, // ← KEY POINT!
  examples: [
    'john@gmail.com',
    'contractor@yahoo.com',
    'worker@company.co.th'
  ]
};
```

---

## 📱 Question 2: Must external users install Authenticator App or verify via mobile?

### **Answer: YES - MFA is REQUIRED (but they have options)**

External users **MUST** use Multi-Factor Authentication (MFA), but they can **CHOOSE** their preferred method:

```
┌─────────────────────────────────────────────────────────────┐
│  MFA OPTIONS FOR EXTERNAL USERS (Choose 1 or more)          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  OPTION 1: Authenticator App (RECOMMENDED)                   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ Most secure                                       │   │
│  │ ✅ Works offline                                     │   │
│  │ ✅ Push notifications                                │   │
│  │ ✅ FREE                                              │   │
│  │                                                      │   │
│  │ Supported Apps:                                      │   │
│  │ • LINE (Popular in Thailand/Asia!) ← NEW!           │   │
│  │ • Microsoft Authenticator                            │   │
│  │ • Google Authenticator                               │   │
│  │ • Any TOTP authenticator app                         │   │
│  │                                                      │   │
│  │ Requirements:                                        │   │
│  │ • Install app on smartphone (or use LINE!)           │   │
│  │ • Scan QR code during setup                          │   │
│  │ • Enter 6-digit code when logging in                 │   │
│  │                                                      │   │
│  │ Download:                                            │   │
│  │ [iOS App Store] [Google Play Store] [LINE]          │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  OPTION 2: SMS to Mobile Phone (EASIER)                     │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ Simple to use                                     │   │
│  │ ✅ No app installation needed                        │   │
│  │ ⚠️  Requires phone signal                            │   │
│  │ ⚠️  Less secure than app                             │   │
│  │                                                      │   │
│  │ Requirements:                                        │   │
│  │ • Mobile phone number                                │   │
│  │ • Receive SMS text messages                          │   │
│  │ • Enter code from SMS when logging in                │   │
│  │                                                      │   │
│  │ Example:                                             │   │
│  │ SMS: "Your QSHE code is: 742891"                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  OPTION 3: Email Verification (BACKUP)                      │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ ✅ No phone needed                                   │   │
│  │ ✅ No app installation needed                        │   │
│  │ ⚠️  Slowest method                                   │   │
│  │ ⚠️  Least secure                                     │   │
│  │                                                      │   │
│  │ Requirements:                                        │   │
│  │ • Access to email inbox                              │   │
│  │ • Check email for code                               │   │
│  │ • Enter code when logging in                         │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  Users can enable MULTIPLE methods for backup               │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### **Why MFA is Required**

```
SECL Security Requirement 5.3:
"MFA for all users if solution is public facing"

✅ Your QSHE PWA is public-facing (external users access via internet)
✅ Therefore, MFA is MANDATORY for all external users
✅ This is a COMPLIANCE requirement, not optional
```

### **User Experience - MFA Setup**

```
During Registration:

Step 1: Choose your MFA method
┌────────────────────────────────────────────┐
│ Secure your account with MFA               │
│                                            │
│ ● LINE / Authenticator App (Recommended)  │
│   [Set Up with LINE] [Other Apps]         │
│                                            │
│ ○ SMS to phone: +66 81 234 5678           │
│   [Use SMS]                                │
│                                            │
│ ○ Email codes                              │
│   [Use Email]                              │
└────────────────────────────────────────────┘

Step 2: If they choose Authenticator App
┌────────────────────────────────────────────┐
│ Install Microsoft Authenticator            │
│                                            │
│ 1. Download app (FREE):                    │
│    [iOS] [Android]                         │
│                                            │
│ 2. Open app and scan this QR code:         │
│    ┌─────────────────┐                    │
│    │  [QR CODE]      │                    │
│    └─────────────────┘                    │
│                                            │
│ 3. Enter the 6-digit code from app:        │
│    [_][_][_][_][_][_]                     │
│                                            │
│ [Verify]                                   │
└────────────────────────────────────────────┘

Step 3: If they choose SMS
┌────────────────────────────────────────────┐
│ Verify your phone number                   │
│                                            │
│ We'll send a code to: +66 81 234 5678     │
│                                            │
│ [Send Code]                                │
│                                            │
│ Enter the code you receive:                │
│ [_][_][_][_][_][_]                        │
│                                            │
│ [Verify]                                   │
└────────────────────────────────────────────┘
```

### **Daily Login with MFA**

```
Every time user logs in:

Step 1: Enter email + password
┌────────────────────────────────┐
│ Email: john@gmail.com          │
│ Password: ••••••••••           │
│ [Sign In]                      │
└────────────────────────────────┘

Step 2: MFA challenge (their chosen method)

If using Authenticator App:
┌────────────────────────────────┐
│ Verify it's you                │
│                                │
│ Open Microsoft Authenticator   │
│ and enter the code:            │
│                                │
│ [_][_][_][_][_][_]            │
│                                │
│ [Verify]                       │
└────────────────────────────────┘

If using SMS:
┌────────────────────────────────┐
│ Verify it's you                │
│                                │
│ We sent a code to your phone   │
│ +66 *** *** 5678              │
│                                │
│ Enter code: [_][_][_][_][_][_]│
│                                │
│ [Verify]                       │
└────────────────────────────────┘
```

---

## 🔄 Comparison: Internal vs External Users

```
┌──────────────────┬─────────────────────┬──────────────────────┐
│ Feature          │ Internal Users      │ External Users       │
│                  │ (Employees)         │ (Contractors)        │
├──────────────────┼─────────────────────┼──────────────────────┤
│ Email Required   │ @th.jec.com        │ Any email            │
│                  │ (company domain)    │ (gmail, yahoo, etc.) │
├──────────────────┼─────────────────────┼──────────────────────┤
│ Microsoft        │ ✅ YES             │ ❌ NO                │
│ Account Needed   │ (Company managed)   │ (Independent)        │
├──────────────────┼─────────────────────┼──────────────────────┤
│ Password         │ Company manages     │ User creates own     │
│                  │ (AD sync)           │                      │
├──────────────────┼─────────────────────┼──────────────────────┤
│ MFA Required     │ ✅ YES             │ ✅ YES               │
│                  │ (Company policy)    │ (SECL requirement)   │
├──────────────────┼─────────────────────┼──────────────────────┤
│ MFA Options      │ Company decides     │ User chooses:        │
│                  │ (Usually mandatory  │ • Authenticator      │
│                  │  Authenticator)     │ • SMS                │
│                  │                     │ • Email              │
├──────────────────┼─────────────────────┼──────────────────────┤
│ Registration     │ IT Admin            │ Self-registration    │
│                  │ pre-registers       │ + admin approval     │
├──────────────────┼─────────────────────┼──────────────────────┤
│ Authentication   │ Microsoft Entra ID  │ Microsoft Entra      │
│ System           │ (Azure AD)          │ External ID (B2C)    │
├──────────────────┼─────────────────────┼──────────────────────┤
│ Cost             │ Free                │ Free                 │
│                  │ (up to 50K users)   │ (up to 50K users)    │
└──────────────────┴─────────────────────┴──────────────────────┘
```

---

## 💡 Real-World Examples

### **Example 1: Contractor John (External User)**

```
John's Information:
• Name: John Smith
• Email: john.contractor@gmail.com (NOT a Microsoft account!)
• Phone: +66 81 234 5678
• Company: ABC Construction (contractor)

Registration Process:
1. Visits qshe-app.com
2. Registers with john.contractor@gmail.com
3. Creates password: "MySecure2025!"
4. Chooses MFA: SMS to phone
5. Receives SMS code: 742891
6. Enters code → Verified ✅
7. Account created!

Daily Login:
1. Email: john.contractor@gmail.com
2. Password: MySecure2025!
3. SMS code sent to phone
4. Enters code: 583294
5. Logged in! ✅

John does NOT need:
❌ Microsoft account
❌ @th.jec.com email
❌ Company Active Directory
```

### **Example 2: Consultant Sarah (External User)**

```
Sarah's Information:
• Name: Sarah Wilson
• Email: s.wilson@yahoo.com (Yahoo email, not Microsoft!)
• Phone: +66 89 765 4321
• Company: XYZ Consulting (consultant)

Registration Process:
1. Receives invitation from company
2. Registers with s.wilson@yahoo.com
3. Creates password
4. Chooses MFA: Microsoft Authenticator App
   - Downloads FREE app on her iPhone
   - Scans QR code
   - App generates codes
5. Account created!

Daily Login:
1. Email: s.wilson@yahoo.com
2. Password: (her password)
3. Opens Authenticator app
4. Enters 6-digit code: 495823
5. Logged in! ✅

Sarah uses Authenticator app because:
✅ More secure
✅ Works without phone signal
✅ Faster than SMS
```

### **Example 3: Visitor Tom (External User)**

```
Tom's Information:
• Name: Tom Green
• Email: tom.green@hotmail.com (Hotmail, not Microsoft work account!)
• No smartphone (only tablet with WiFi)
• Company: Temporary visitor

Registration Process:
1. Registers with tom.green@hotmail.com
2. Creates password
3. Chooses MFA: Email verification
   - No phone available
   - Uses email instead
4. Account created!

Daily Login:
1. Email: tom.green@hotmail.com
2. Password: (his password)
3. Checks email inbox
4. Receives code: 638192
5. Enters code
6. Logged in! ✅

Tom uses email MFA because:
✅ No smartphone required
✅ Can use tablet/computer
⚠️  Slower (must check email each time)
```

---

## 📝 Summary: Clear Answers

### **Question 1: Do external users need Microsoft account?**

```
❌ NO!

External users can register with:
✅ Gmail (john@gmail.com)
✅ Yahoo (sarah@yahoo.com)
✅ Hotmail (tom@hotmail.com)
✅ Company email (worker@company.co.th)
✅ ANY email address from ANY provider

They create their own password.
No Microsoft account needed.
```

### **Question 2: Must they install Authenticator App or use mobile?**

```
⚠️  MFA is REQUIRED (security compliance)

But users can CHOOSE:

Option A: Authenticator App
• Most secure
• Must install app (FREE)
• Must have smartphone

Option B: SMS
• Easier
• No app needed
• Must have phone number

Option C: Email
• Simplest
• No phone/app needed
• Least secure (backup only)

Recommendation: SMS (easiest) or Authenticator (most secure)
```

---

## 🎯 Recommendations

### **For Most External Users**

```
✅ RECOMMENDED SETUP:

Primary MFA: SMS to phone
• Easy to use
• No app installation
• Works immediately
• Most contractors/workers prefer this

Backup MFA: Email
• If phone is lost
• Emergency access
```

### **For Security-Conscious Users**

```
🔐 BEST SECURITY SETUP:

Primary MFA: Microsoft Authenticator App
• Most secure
• Works offline
• Fast authentication

Backup MFA: SMS
• If phone app is unavailable
• Secondary verification
```

---

## ❓ Common Questions

### **Q: Is Microsoft Authenticator app free?**
**A:** Yes, 100% FREE on iOS and Android.

### **Q: Can users change their MFA method later?**
**A:** Yes, they can add/remove methods anytime in settings.

### **Q: What if user loses their phone?**
**A:** They can use backup codes or contact admin for account recovery.

### **Q: Do they need to enter MFA code every login?**
**A:** Yes, for security. But can stay logged in for 8 hours.

### **Q: Can they use other authenticator apps (Google, Authy)?**
**A:** Yes! Any TOTP authenticator app works, not just Microsoft's.

### **Q: What if they don't have a smartphone?**
**A:** They can use SMS to basic phone or email verification.

---

## 🔧 Technical Details

### **Azure External ID (B2C) vs Regular Azure AD**

```
Azure AD (For Internal Users):
• Requires company Microsoft account
• Managed by IT department
• Company domain email required (@th.jec.com)
• Used by: Employees

Azure External ID / B2C (For External Users):
• Does NOT require Microsoft account
• Self-service registration
• Any email address works
• Used by: Contractors, consultants, customers, partners

They are SEPARATE systems!
```

### **Authentication Flow**

```typescript
// Internal User Login
const internalLogin = async (email: string) => {
  // Must be @th.jec.com
  if (!email.endsWith('@th.jec.com')) {
    throw new Error('Must use company email');
  }
  
  // Redirects to Microsoft login
  await msalInstance.loginRedirect({
    authority: 'https://login.microsoftonline.com/YOUR-TENANT',
    scopes: ['User.Read']
  });
  
  // User logs in with their Microsoft account
  // (Same account they use for Outlook, Teams, etc.)
};

// External User Login
const externalLogin = async (email: string) => {
  // Can be ANY email
  // No Microsoft account needed!
  
  // Redirects to Azure B2C
  await msalB2C.loginRedirect({
    authority: 'https://jectqshe.ciamlogin.com/...',
    scopes: ['openid', 'profile', 'email']
  });
  
  // User enters their email + password (they created)
  // Then MFA challenge (SMS/App/Email)
};
```

---

## ✅ Final Summary

```
┌─────────────────────────────────────────────────────────────┐
│  KEY TAKEAWAYS                                              │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. ❌ External users DO NOT need Microsoft account         │
│     • Any email works (Gmail, Yahoo, Hotmail, etc.)        │
│     • They create their own password                        │
│     • Independent from company systems                      │
│                                                             │
│  2. ✅ MFA is REQUIRED (but flexible options)               │
│     • Option A: SMS (easiest, no app needed)               │
│     • Option B: Authenticator App (most secure)            │
│     • Option C: Email (backup only)                         │
│     • User chooses their preferred method                   │
│                                                             │
│  3. 💰 Everything is FREE                                   │
│     • Registration: Free                                    │
│     • Authenticator app: Free                              │
│     • SMS codes: Free (system pays)                         │
│     • Email codes: Free                                     │
│                                                             │
│  4. 📱 Smartphone NOT mandatory                             │
│     • Can use SMS to basic phone                           │
│     • Can use email verification                            │
│     • Authenticator app is optional (but recommended)       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

**Does this clear up the confusion? 🎯**

The key points are:
1. **No Microsoft account needed** - any email works!
2. **MFA is required** - but users choose SMS, App, or Email (flexible!)
