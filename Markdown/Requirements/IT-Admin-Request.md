# Azure AD App Registration Request for IT Administrator
## QSHE PWA System - Company Authentication

**Request Date:** October 11, 2025  
**Requestor:** Nithat Suwanprom (nithat.su@th.jec.com)  
**Project:** QSHE PWA System Migration to Azure

---

## Application Details

**Application Name:** QSHE Company Authentication  
**Application ID:** 6a6b941f-54bc-4ba6-a340-43fcb39a5e29  
**Tenant:** Jardine Engineering Company Limited (d6bb4e04-1f12-4be5-bcaf-bdf394845098)

---

## Purpose
This application enables company employees to authenticate with their @th.jec.com credentials to access the QSHE (Quality, Safety, Health, Environment) Progressive Web Application. The system manages:
- Safety patrols and inspections
- Risk assessments
- Compliance documentation
- Multi-company project management

---

## Required Permissions (Microsoft Graph API)

### Minimum Required Permissions:
1. **User.Read** - Read current user's profile
2. **User.ReadBasic.All** - Read basic profile of all users

### Desired Permissions (for full functionality):
1. **User.Read.All** - Read all users' full profiles
2. **Directory.Read.All** - Read directory data
3. **Group.Read.All** - Read group memberships

---

## Technical Configuration

### Redirect URIs:
- **Development:** http://localhost:5175
- **Production:** [To be provided when deployed]

### Application Type:
- Single-page application (SPA)
- Single tenant (Jardine Engineering only)

---

## Security Considerations
- Application only reads user data (no write permissions)
- Single tenant configuration (only Jardine Engineering users)
- Modern MSAL authentication with secure token handling
- Complies with Microsoft security best practices

---

## Business Justification
The QSHE system currently supports 823 Jardine Engineering employees across multiple companies and projects. Azure AD integration will:
1. Eliminate separate user management
2. Leverage existing company credentials
3. Improve security with centralized authentication
4. Enable automatic user provisioning/deprovisioning

---

## Action Required from IT Administrator

1. **Register the application** in Azure AD (if not already done)
2. **Grant admin consent** for the required permissions
3. **Verify the application** appears in Enterprise Applications
4. **Confirm** the redirect URIs are properly configured

---

## Contact Information
**Developer:** Nithat Suwanprom  
**Email:** nithat.su@th.jec.com  
**Department:** [Your Department]  
**Manager:** [Your Manager's Name]

---

## Timeline
**Target Go-Live:** [Your preferred date]  
**Testing Required:** 1-2 days after approval  
**Fallback:** Current Supabase authentication (until migration complete)

---

Thank you for your assistance with this enterprise application integration.