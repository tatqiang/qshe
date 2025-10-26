# 🔐 External User Authentication Solution Proposal
## QSHE PWA Security Gap Analysis & Recommendation

> **Date**: October 15, 2025  
> **Status**: Proposal for Review  
> **Focus**: External User (Contractors, Consultants, Visitors) Authentication  

---

## 📊 Current Security Gap Summary

### ✅ **Internal Users - COMPLETED**
- **Solution**: Microsoft Entra ID (Azure AD)
- **Authentication**: Company domain (@th.jec.com)
- **Status**: ✅ Fully Implemented
- **Security Level**: Enterprise SSO with MFA
- **Cost**: FREE (Azure AD Free Tier)

### ⚠️ **External Users - GAP IDENTIFIED**

| User Type | Current Status | Security Requirement | Gap |
|-----------|---------------|----------------------|-----|
| **Contractors** | ❌ No authentication | MFA + Password Policy | HIGH |
| **Consultants** | ❌ No authentication | MFA + Password Policy | HIGH |
| **Temporary Workers** | ❌ No authentication | MFA + Password Policy | MEDIUM |
| **Visitors** | ❌ No authentication | Basic Authentication | LOW |

### 📋 SECL Security Requirements (Must Comply)

From `SECL_Security_Compliance_Table.md`:

**Item 5.2**: Password policies for external users:
- ✅ 12+ character passwords with complexity
- ✅ Last 12 passwords blocked
- ✅ 30-minute lockout after 5 failed attempts
- ✅ Email-based verification for each company

**Item 5.3**: MFA Requirements:
- ✅ Mandatory MFA for all external users (public-facing)
- ✅ Enhanced MFA for privileged external roles
- ✅ Risk-based authentication
- ✅ Company context switching authentication

---

## 🎯 Recommended Solution: Microsoft Entra External ID

### Why Entra External ID (Previously Azure AD B2C)?

| Criteria | Entra External ID | Supabase Auth | Custom Solution |
|----------|-------------------|---------------|-----------------|
| **SECL Compliance** | ✅ Native support | ⚠️ Requires custom | ❌ High effort |
| **MFA Support** | ✅ Built-in | ⚠️ Limited | ❌ Manual |
| **Cost (Free Tier)** | ✅ 50,000 users | ✅ 50,000 users | ❌ Dev cost |
| **Integration** | ✅ Same ecosystem | ⚠️ Separate | ❌ Complex |
| **Multi-Company** | ✅ Native | ⚠️ Custom RLS | ❌ Manual |
| **Password Policies** | ✅ Enterprise-grade | ⚠️ Basic | ❌ Manual |
| **Audit Logs** | ✅ Comprehensive | ⚠️ Limited | ❌ Manual |
| **Identity Protection** | ✅ AI-powered | ❌ None | ❌ None |

### ✅ Decision: **Microsoft Entra External ID** (Best fit)

---

## 🏗️ Proposed Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    QSHE PWA Authentication                    │
└─────────────────────────────────────────────────────────────┘
                              │
                              │
              ┌───────────────┴───────────────┐
              │                               │
              ▼                               ▼
┌─────────────────────────┐   ┌─────────────────────────────┐
│   Internal Users        │   │   External Users            │
│   (Employees)           │   │   (Contractors/Visitors)    │
├─────────────────────────┤   ├─────────────────────────────┤
│ Microsoft Entra ID      │   │ Microsoft Entra External ID │
│ (Azure AD)              │   │ (Azure AD B2C)              │
│                         │   │                             │
│ • @th.jec.com domain   │   │ • Email-based registration  │
│ • SSO Integration       │   │ • Multiple company access   │
│ • Company AD sync       │   │ • Worker type validation    │
│ • Enterprise MFA        │   │ • Document verification     │
│                         │   │ • Enhanced MFA              │
│ FREE (up to 50K users) │   │ FREE (up to 50K users)     │
└─────────────────────────┘   └─────────────────────────────┘
              │                               │
              └───────────────┬───────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │   Supabase DB    │
                    │   User Profiles  │
                    │   Permissions    │
                    └──────────────────┘
```

---

## 🔧 Implementation Details

### 1. **External ID Tenant Setup** (Already Configured!)

From your `azure-setup/external-id-config.txt`:
```
VITE_AZURE_EXTERNAL_TENANT_NAME=jectqshe
VITE_AZURE_EXTERNAL_CLIENT_ID=68419950-8189-4e0d-b193-9a1fc59c3961
VITE_AZURE_EXTERNAL_AUTHORITY=https://jectqshe.ciamlogin.com
```

**Status**: ✅ Already created! Just needs activation.

### 2. **Custom User Attributes** (External Workers)

Configure in Azure Portal → External ID → User Attributes:

```typescript
interface ExternalUserProfile {
  // Standard B2C attributes
  email: string;
  givenName: string;
  surname: string;
  displayName: string;
  
  // Custom attributes for QSHE
  extension_worker_type: 'contractor' | 'consultant' | 'temporary' | 'visitor';
  extension_verification_status: 'unverified' | 'pending' | 'verified' | 'rejected';
  extension_primary_company_id: string; // UUID
  extension_company_affiliations: string[]; // Multiple companies
  extension_nationality?: string;
  extension_passport_number?: string;
  extension_work_permit_number?: string;
  extension_emergency_contact_name?: string;
  extension_emergency_contact_phone?: string;
}
```

### 3. **Authentication Flow**

#### **Registration Flow** (External Workers)
```
1. User visits: https://your-app.com/register/external
2. Click "Register as External Worker"
3. Redirect to External ID tenant (jectqshe.ciamlogin.com)
4. Complete registration form:
   ├── Email & Password (12+ chars, complexity)
   ├── Full Name
   ├── Worker Type (contractor/consultant/etc.)
   ├── Company Selection (dropdown)
   ├── Nationality (optional)
   ├── Passport/Work Permit (if international)
   └── Emergency Contact
5. Email verification sent
6. User clicks verification link
7. MFA enrollment (mandatory):
   ├── LINE (Popular in Thailand/Asia - recommended) ← NEW!
   ├── Microsoft Authenticator App
   ├── SMS to phone number
   └── Email code (fallback)
8. Redirect back to app with auth token
9. Status: "unverified" (requires company admin approval)
```

#### **Login Flow** (External Workers)
```
1. User visits: https://your-app.com/login/external
2. Click "Login as External Worker"
3. Redirect to External ID tenant
4. Enter email + password
5. MFA challenge (authenticator/SMS)
6. Company context selection (if multiple companies)
7. Redirect back to app with token
8. Load user permissions based on:
   ├── Worker type
   ├── Verification status
   └── Company-specific role
```

#### **Multi-Company Access Flow**
```
User working for multiple companies:

1. Login with External ID
2. Token includes: company_affiliations = ['company-A-uuid', 'company-B-uuid']
3. User selects active company context
4. App loads permissions for selected company:
   ├── Company A: role = 'external_worker'
   ├── Company B: role = 'safety_officer'
5. User can switch company context:
   ├── Click company switcher
   ├── Additional MFA challenge (security)
   └── Load new company context
```

### 4. **Security Implementation**

#### **Password Policies** (SECL Compliant)
```json
{
  "passwordPolicies": {
    "minimumLength": 12,
    "requireUppercase": true,
    "requireLowercase": true,
    "requireNumbers": true,
    "requireSymbols": true,
    "passwordHistory": 12,
    "maxPasswordAge": 90,
    "accountLockout": {
      "threshold": 5,
      "duration": 1800,
      "observationWindow": 300
    }
  }
}
```

#### **MFA Configuration**
```typescript
const mfaConfig = {
  required: true, // All external users
  methods: [
    'MicrosoftAuthenticator', // Primary
    'SMS',                    // Secondary
    'Email'                   // Fallback
  ],
  challenges: {
    onLogin: true,
    onCompanySwitch: true,
    onHighRiskAction: true,
    frequency: 'every-8-hours'
  }
};
```

#### **Risk-Based Authentication**
```typescript
const riskPolicy = {
  highRisk: {
    triggers: [
      'unknown_location',
      'impossible_travel',
      'anonymous_ip',
      'malware_linked_ip'
    ],
    actions: [
      'require_mfa',
      'require_admin_approval',
      'block_access'
    ]
  },
  unverifiedWorkers: {
    restrictions: [
      'read_only_access',
      'no_document_upload',
      'no_project_creation',
      'limited_viewing'
    ]
  }
};
```

---

## 📋 Worker Types & Access Levels

### External Worker Types

| Worker Type | Access Level | Verification Required | MFA Required |
|-------------|--------------|----------------------|--------------|
| **Contractor** | Medium | ✅ Yes | ✅ Yes |
| **Consultant** | Medium-High | ✅ Yes | ✅ Yes |
| **Temporary** | Low-Medium | ⚠️ Recommended | ✅ Yes |
| **Visitor** | Low | ❌ Optional | ✅ Yes |

### Verification Status Workflow

```
┌─────────────┐
│ UNVERIFIED  │ ← Initial registration
└──────┬──────┘
       │ Company admin reviews:
       │ • Identity documents
       │ • Background check
       │ • Company invitation
       ▼
┌─────────────┐
│  PENDING    │ ← Documents submitted
└──────┬──────┘
       │ Admin decision
       ├─────────────┐
       ▼             ▼
┌─────────────┐ ┌──────────┐
│  VERIFIED   │ │ REJECTED │
└─────────────┘ └──────────┘
   Full Access    No Access
```

### Permissions by Verification Status

**UNVERIFIED** (Limited Access):
```typescript
const unverifiedPermissions = [
  'profile.view_own',
  'profile.edit_own',
  'document.upload_verification', // Upload ID/passport
  'project.view_assigned',
  'dashboard.view_basic'
];
```

**VERIFIED** (Full Access):
```typescript
const verifiedPermissions = [
  // All unverified permissions +
  'patrol.create',
  'patrol.edit_own',
  'issue.create',
  'issue.assign',
  'risk.create',
  'document.upload',
  'project.view_all',
  'meeting.join',
  'corrective_action.view'
];
```

---

## 💻 Code Implementation

### Frontend: Login Component

```typescript
// src/components/auth/ExternalLogin.tsx
import { useExternalAuth } from '@/hooks/useExternalAuth';

export const ExternalLogin = () => {
  const { loginWithExternal, loading } = useExternalAuth();
  
  const handleExternalLogin = async () => {
    try {
      // Redirect to External ID tenant
      await loginWithExternal({
        authority: 'https://jectqshe.ciamlogin.com',
        clientId: '68419950-8189-4e0d-b193-9a1fc59c3961',
        redirectUri: `${window.location.origin}/auth/callback/external`,
        scopes: ['openid', 'profile', 'email', 'offline_access']
      });
    } catch (error) {
      console.error('External login failed:', error);
    }
  };
  
  return (
    <div className="external-login">
      <button onClick={handleExternalLogin} disabled={loading}>
        {loading ? 'Redirecting...' : 'Login as External Worker'}
      </button>
      <a href="/register/external">Register as External Worker</a>
    </div>
  );
};
```

### Backend: Token Validation

```typescript
// src/lib/auth/externalAuthService.ts
import { PublicClientApplication } from '@azure/msal-browser';

const externalMsalConfig = {
  auth: {
    clientId: '68419950-8189-4e0d-b193-9a1fc59c3961',
    authority: 'https://jectqshe.ciamlogin.com',
    redirectUri: window.location.origin
  },
  cache: {
    cacheLocation: 'localStorage'
  }
};

export class ExternalAuthService {
  private msalInstance: PublicClientApplication;
  
  constructor() {
    this.msalInstance = new PublicClientApplication(externalMsalConfig);
  }
  
  async loginRedirect() {
    await this.msalInstance.loginRedirect({
      scopes: ['openid', 'profile', 'email']
    });
  }
  
  async handleRedirect() {
    const response = await this.msalInstance.handleRedirectPromise();
    if (response) {
      // Extract custom attributes
      const user = {
        id: response.uniqueId,
        email: response.account.username,
        name: response.account.name,
        workerType: response.idTokenClaims?.extension_worker_type,
        verificationStatus: response.idTokenClaims?.extension_verification_status,
        companies: response.idTokenClaims?.extension_company_affiliations
      };
      
      // Sync with Supabase
      await this.syncUserToDatabase(user);
      return user;
    }
  }
  
  private async syncUserToDatabase(user: ExternalUser) {
    // Store in Supabase for permissions
    const { data, error } = await supabase
      .from('users')
      .upsert({
        azure_object_id: user.id,
        email: user.email,
        full_name: user.name,
        worker_type: user.workerType,
        verification_status: user.verificationStatus,
        user_type: 'external',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'azure_object_id'
      });
    
    return data;
  }
}
```

---

## 💰 Cost Analysis

### Free Tier Comparison

| Service | Free Tier | Your Usage | Cost |
|---------|-----------|------------|------|
| **Entra ID** (Internal) | 50,000 users | ~100 employees | $0/month |
| **External ID** (External) | 50,000 users | ~500 contractors | $0/month |
| **Supabase** | Included | User profiles | $25/month (existing) |
| **Azure Blob Storage** | 5GB | Documents | $0-5/month |
| **Total** | | | **$25-30/month** |

### Premium Features (Optional)

If you need advanced features:
- **Identity Protection**: $6/user/month (external workers only)
- **Conditional Access**: Included in P1
- **Advanced Risk Detection**: P2 feature

**Recommendation**: Start with free tier, upgrade only if needed.

---

## 📅 Implementation Timeline

### Phase 1: Setup & Configuration (Week 1)
- ✅ External ID tenant already created
- [ ] Configure custom user attributes
- [ ] Setup user flows (sign-up, sign-in, password reset)
- [ ] Configure MFA policies
- [ ] Test authentication flow

### Phase 2: Application Integration (Week 2)
- [ ] Install MSAL library for External ID
- [ ] Create external login/register components
- [ ] Implement token handling
- [ ] Setup user sync with Supabase
- [ ] Create company context switcher

### Phase 3: Security & Verification (Week 3)
- [ ] Implement verification workflow
- [ ] Admin approval interface
- [ ] Document upload for verification
- [ ] Risk-based authentication rules
- [ ] Audit logging

### Phase 4: Testing & Deployment (Week 4)
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Load testing (500+ concurrent users)
- [ ] SECL compliance verification
- [ ] Production deployment

**Total Duration**: 4 weeks

---

## ✅ SECL Compliance Checklist

| Requirement | Solution | Status |
|-------------|----------|--------|
| **5.2: Password Policy** | 12+ chars, complexity, history | ✅ Compliant |
| **5.3: MFA Required** | Mandatory for all external | ✅ Compliant |
| **6.1: Account Lockout** | 5 attempts, 30 min lockout | ✅ Compliant |
| **6.2: Lockout Monitoring** | Azure Monitor alerts | ✅ Compliant |
| **8.1-8.5: User Account Review** | Azure AD access reviews | ✅ Compliant |
| **9.1: 2FA Public Facing** | MFA for all external users | ✅ Compliant |
| **Multi-Company Support** | Native B2C attributes | ✅ Compliant |

---

## 🎯 Recommendation Summary

### ✅ **Proposed Solution: Microsoft Entra External ID**

**Why?**
1. **Free** - No cost for your scale (< 50K users)
2. **SECL Compliant** - Meets all security requirements
3. **Already Setup** - Tenant exists, just needs activation
4. **Same Ecosystem** - Integrates with internal Entra ID
5. **Enterprise Security** - MFA, risk detection, audit logs
6. **Multi-Company Native** - Built-in support for complex scenarios

### 📊 **Risk Assessment**

| Risk | Mitigation |
|------|------------|
| Implementation complexity | Use existing documentation, 4-week timeline |
| User experience | Similar to internal login, familiar flow |
| Cost overrun | Free tier sufficient, no hidden costs |
| Security gaps | Azure handles SECL compliance natively |
| Maintenance | Managed service, minimal maintenance |

### 🚀 **Next Steps**

1. **Approval**: Get stakeholder approval for External ID approach
2. **Configuration**: Complete External ID tenant setup (1 day)
3. **Development**: Implement authentication flows (2 weeks)
4. **Testing**: Security & user testing (1 week)
5. **Deployment**: Phased rollout (1 week)

---

## 📚 Reference Documents

- `SECL_Security_Compliance_Table.md` - Security requirements
- `azure-ad-b2c-multicompany-config.md` - Detailed configuration
- `Multi-factor authentication.md` - MFA requirements
- `Password Usage Requirement.md` - Password policies
- `AZURE_MIGRATION_COMPLETE.md` - Current architecture

---

## 👥 Contacts & Support

**Azure Support**: [Azure External ID Documentation](https://learn.microsoft.com/en-us/azure/active-directory-b2c/)  
**Security Team**: Refer to SECL compliance table  
**Development Team**: Implementation guide included above

---

**Document Status**: ✅ Ready for Review  
**Recommendation**: Proceed with Microsoft Entra External ID implementation  
**Estimated Cost**: $0/month (Free tier)  
**Timeline**: 4 weeks to production  
