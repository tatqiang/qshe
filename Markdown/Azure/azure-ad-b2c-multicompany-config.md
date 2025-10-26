# Azure AD B2C Configuration for Multi-Company External Users

## Overview
This configuration supports external users who can work for multiple companies with different roles, removing biometric requirements while maintaining security compliance.

## Custom User Attributes Configuration

### Required B2C Custom Attributes

```json
{
  "customAttributes": {
    "extension_worker_type": {
      "dataType": "string",
      "description": "Type of external worker",
      "defaultValue": "contractor",
      "allowedValues": ["contractor", "consultant", "temporary", "visitor"],
      "required": true
    },
    "extension_verification_status": {
      "dataType": "string", 
      "description": "Verification status for external worker",
      "defaultValue": "unverified",
      "allowedValues": ["unverified", "pending", "verified", "rejected"],
      "required": true
    },
    "extension_company_affiliations": {
      "dataType": "stringCollection",
      "description": "List of company IDs user is affiliated with",
      "maxItems": 10,
      "required": false
    },
    "extension_primary_company_id": {
      "dataType": "string",
      "description": "Primary company UUID for this user",
      "required": false
    },
    "extension_external_worker_id": {
      "dataType": "string",
      "description": "External system worker ID for integration",
      "required": false
    },
    "extension_nationality": {
      "dataType": "string",
      "description": "User nationality",
      "required": false
    },
    "extension_passport_number": {
      "dataType": "string",
      "description": "Passport number for international workers",
      "required": false
    },
    "extension_work_permit_number": {
      "dataType": "string", 
      "description": "Work permit number if applicable",
      "required": false
    },
    "extension_emergency_contact_name": {
      "dataType": "string",
      "description": "Emergency contact person name",
      "required": false
    },
    "extension_emergency_contact_phone": {
      "dataType": "string",
      "description": "Emergency contact phone number",
      "required": false
    },
    "extension_pending_company_invitations": {
      "dataType": "stringCollection",
      "description": "List of pending company invitation tokens",
      "maxItems": 5,
      "required": false
    },
    "extension_approved_companies": {
      "dataType": "stringCollection", 
      "description": "List of approved company associations",
      "maxItems": 10,
      "required": false
    }
  }
}
```

## User Flow Configuration

### 1. Sign-Up Flow (External Users)

```xml
<TechnicalProfile Id="SelfAsserted-ProfileUpdate-ExternalWorker">
  <DisplayName>Update External Worker Profile</DisplayName>
  <Protocol Name="Proprietary" Handler="Web.TPEngine.Providers.SelfAssertedAttributeProvider, Web.TPEngine, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
  <Metadata>
    <Item Key="ContentDefinitionReferenceId">api.selfasserted.profileupdate</Item>
  </Metadata>
  <InputClaims>
    <InputClaim ClaimTypeReferenceId="objectId" />
    <InputClaim ClaimTypeReferenceId="givenName" />
    <InputClaim ClaimTypeReferenceId="surname" />
    <InputClaim ClaimTypeReferenceId="extension_worker_type" DefaultValue="contractor" />
    <InputClaim ClaimTypeReferenceId="extension_verification_status" DefaultValue="unverified" />
  </InputClaims>
  <OutputClaims>
    <!-- Personal Information -->
    <OutputClaim ClaimTypeReferenceId="givenName" Required="true" />
    <OutputClaim ClaimTypeReferenceId="surname" Required="true" />
    <OutputClaim ClaimTypeReferenceId="displayName" />
    
    <!-- Worker Information -->
    <OutputClaim ClaimTypeReferenceId="extension_worker_type" Required="true" />
    <OutputClaim ClaimTypeReferenceId="extension_nationality" />
    <OutputClaim ClaimTypeReferenceId="extension_passport_number" />
    <OutputClaim ClaimTypeReferenceId="extension_work_permit_number" />
    
    <!-- Emergency Contact -->
    <OutputClaim ClaimTypeReferenceId="extension_emergency_contact_name" />
    <OutputClaim ClaimTypeReferenceId="extension_emergency_contact_phone" />
    
    <!-- Company Association (will be managed post-registration) -->
    <OutputClaim ClaimTypeReferenceId="extension_primary_company_id" />
  </OutputClaims>
  <ValidationTechnicalProfiles>
    <ValidationTechnicalProfile ReferenceId="REST-ValidateExternalWorker" />
  </ValidationTechnicalProfiles>
</TechnicalProfile>
```

### 2. Company Selection Flow

```xml
<TechnicalProfile Id="SelfAsserted-CompanySelection">
  <DisplayName>Select Company Context</DisplayName>
  <Protocol Name="Proprietary" Handler="Web.TPEngine.Providers.SelfAssertedAttributeProvider, Web.TPEngine, Version=1.0.0.0, Culture=neutral, PublicKeyToken=null" />
  <Metadata>
    <Item Key="ContentDefinitionReferenceId">api.selfasserted.companyselection</Item>
  </Metadata>
  <InputClaims>
    <InputClaim ClaimTypeReferenceId="extension_company_affiliations" />
    <InputClaim ClaimTypeReferenceId="extension_approved_companies" />
  </InputClaims>
  <OutputClaims>
    <OutputClaim ClaimTypeReferenceId="selected_company_id" Required="true" />
    <OutputClaim ClaimTypeReferenceId="selected_company_role" />
  </OutputClaims>
  <ValidationTechnicalProfiles>
    <ValidationTechnicalProfile ReferenceId="REST-ValidateCompanyAccess" />
  </ValidationTechnicalProfiles>
</TechnicalProfile>
```

## REST API Integration Points

### 1. Validate External Worker Registration

```csharp
[HttpPost("validate-external-worker")]
public async Task<IActionResult> ValidateExternalWorker([FromBody] ExternalWorkerValidationRequest request)
{
    var validationResult = new B2CValidationResponse();
    
    try
    {
        // Validate worker type
        if (!IsValidWorkerType(request.WorkerType))
        {
            validationResult.AddError("extension_worker_type", "Invalid worker type selected");
        }
        
        // Validate passport for international workers
        if (request.Nationality != "Thai" && string.IsNullOrEmpty(request.PassportNumber))
        {
            validationResult.AddError("extension_passport_number", "Passport number required for international workers");
        }
        
        // Check for duplicate external worker ID
        if (!string.IsNullOrEmpty(request.ExternalWorkerId))
        {
            var existingWorker = await _userService.GetByExternalWorkerIdAsync(request.ExternalWorkerId);
            if (existingWorker != null)
            {
                validationResult.AddError("extension_external_worker_id", "External worker ID already exists");
            }
        }
        
        return Ok(validationResult);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validating external worker");
        validationResult.AddError("general", "Validation failed. Please try again.");
        return BadRequest(validationResult);
    }
}
```

### 2. Company Access Validation

```csharp
[HttpPost("validate-company-access")]
public async Task<IActionResult> ValidateCompanyAccess([FromBody] CompanyAccessRequest request)
{
    var validationResult = new B2CValidationResponse();
    
    try
    {
        var userId = Guid.Parse(request.ObjectId);
        var companyId = Guid.Parse(request.SelectedCompanyId);
        
        // Check if user has approved access to this company
        var hasAccess = await _userCompanyService.UserHasCompanyAccessAsync(userId, companyId);
        if (!hasAccess)
        {
            validationResult.AddError("selected_company_id", "Access to this company is not approved");
            return BadRequest(validationResult);
        }
        
        // Get user role in this company
        var userRole = await _userCompanyService.GetUserRoleInCompanyAsync(userId, companyId);
        
        // Add company context to claims
        validationResult.AddClaim("selected_company_role", userRole);
        validationResult.AddClaim("company_access_level", GetAccessLevel(userRole));
        
        return Ok(validationResult);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error validating company access");
        validationResult.AddError("general", "Company access validation failed");
        return BadRequest(validationResult);
    }
}
```

## Token Claims Configuration

### JWT Token Claims for Multi-Company Users

```json
{
  "tokenClaims": {
    "standardClaims": [
      "sub", "oid", "email", "given_name", "family_name"
    ],
    "customClaims": [
      "extension_worker_type",
      "extension_verification_status", 
      "extension_primary_company_id",
      "extension_company_affiliations",
      "extension_approved_companies",
      "selected_company_id",
      "selected_company_role",
      "company_access_level"
    ]
  }
}
```

## Conditional Access Policies

### 1. External Worker Verification Policy

```json
{
  "policyName": "ExternalWorkerVerificationPolicy",
  "conditions": {
    "userAttributes": {
      "extension_worker_type": ["contractor", "consultant", "temporary", "visitor"]
    }
  },
  "controls": {
    "requireMFA": true,
    "requireCompliantDevice": false,
    "requireApprovedApp": true,
    "sessionControls": {
      "signInFrequency": {
        "value": 1,
        "type": "hours"
      }
    }
  }
}
```

### 2. Unverified Worker Policy

```json
{
  "policyName": "UnverifiedWorkerPolicy", 
  "conditions": {
    "userAttributes": {
      "extension_verification_status": ["unverified", "pending"]
    }
  },
  "controls": {
    "requireMFA": true,
    "blockAccess": false,
    "customMessage": "Your account is pending verification. Limited access granted.",
    "sessionControls": {
      "signInFrequency": {
        "value": 4,
        "type": "hours" 
      }
    }
  }
}
```

## Application Registration Configuration

### API Permissions for QSHE PWA

```json
{
  "requiredResourceAccess": [
    {
      "resourceAppId": "00000003-0000-0000-c000-000000000000",
      "resourceAccess": [
        {
          "id": "37f7f235-527c-4136-accd-4a02d197296e",
          "type": "Scope"
        },
        {
          "id": "14dad69e-099b-42c9-810b-d002981feec1", 
          "type": "Scope"
        }
      ]
    }
  ],
  "customScopes": [
    {
      "scopeName": "user.company.read",
      "description": "Read user company associations"
    },
    {
      "scopeName": "user.company.write", 
      "description": "Manage user company associations"
    },
    {
      "scopeName": "company.members.manage",
      "description": "Manage company member access"
    }
  ]
}
```

## Implementation Steps

### 1. B2C Tenant Setup
```bash
# Create custom attributes via Graph API
az rest --method POST \
  --url "https://graph.microsoft.com/beta/applications/{b2c-app-id}/extensionProperties" \
  --body '{
    "name": "worker_type",
    "dataType": "String",
    "targetObjects": ["User"]
  }'
```

### 2. User Flow Configuration
1. Create signup/signin user flow
2. Add custom attributes to collection
3. Configure conditional access policies
4. Set up REST API connectors

### 3. Application Integration
1. Update application to handle multi-company claims
2. Implement company selection UI
3. Configure session management for company context
4. Test multi-company user scenarios

## Security Considerations

### 1. Data Protection
- Encrypt sensitive worker data (passport numbers, work permits)
- Implement field-level access controls
- Regular audit of external worker access

### 2. Access Management
- Quarterly review of company associations
- Automated removal of expired work permits
- Risk-based authentication for high-privilege operations

### 3. Compliance
- GDPR compliance for international workers
- Data retention policies for terminated associations
- Audit logging for all access control changes

## Testing Scenarios

### 1. Multi-Company Worker Flow
1. External contractor registers with primary company A
2. Company B invites contractor to their projects
3. Contractor approves invitation and gains access to Company B
4. Contractor switches between company contexts during sessions
5. Access is properly isolated between companies

### 2. Access Revocation
1. Company A revokes contractor access
2. Contractor loses access to Company A resources
3. Contractor maintains access to Company B
4. Audit trail records the revocation

### 3. Verification Workflow
1. New external worker registers (unverified status)
2. Company admin reviews and verifies worker
3. Worker gains full access after verification
4. Unverified workers have limited access

This configuration eliminates face scan requirements while providing robust multi-company support and maintaining security compliance for external workers.