# Backend Directory

This directory now only contains:
- `.env` - Supabase credentials (kept for reference)

## Architecture Change
We switched from backend server to **frontend-only** architecture:
- Direct Supabase client connections from React
- Azure AD authentication via MSAL.js
- Registration handled by RegistrationModal component

## Old Backend Files
Moved to `../backend_backup/` directory:
- Express.js server files
- API endpoints
- Node.js dependencies

## Current Setup
The application now uses:
- `src/hooks/useUserRegistration.ts` for user registration
- `src/components/common/RegistrationModal.tsx` for UI
- Direct Supabase client in frontend components