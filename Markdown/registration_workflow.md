Member Registration with Email Key/Code Activation
1. Pre-Registration (Admin)
Admin pre-registers internal member (name, email, position) in the system.

Member status: "pending"

No email is sent yet.

2. User Self-Registration Start
Member visits the registration page.

Enters their pre-registered email.

System verifies that email exists and status is "pending".

3. Password Setup
If email is valid, show registration form:

Name, Last Name, Position (pre-filled, but editable if needed)

Password (user sets their own)

User completes the form and submits.

4. Generate & Send Activation Code
On submit:

System generates a unique activation code (random, e.g., 6-8 digits or alphanumeric).

Stores hashed code & expiry (e.g., 15 minutes) in the DB with the member record.

Sends an email to the member with the activation code (and instructions).

5. Code Verification
After submitting the registration form, show "Enter Activation Code" screen.

User checks their email, copies the code, and enters it in the app.

6. Activation
If code is correct and not expired:

Set member status to "active".

Delete the code from DB (or mark as used).

Log in the user automatically (start session) or show login button.

If code is incorrect:

Show error and allow retry (limit attempts for security).

If code expires:

Show “code expired” message and offer a “Resend Code” option.

7. Profile Completion (if needed)
After activation, user completes any remaining profile info, uploads profile photo, and (optionally) face recognition data as previously planned.

8. Done
Member is now active, logged in, and can access app features.

Workflow Diagram
plaintext
Copy
Edit
[Admin] Pre-register member (email, position)
        ↓
[User] Enter email on registration page
        ↓
System: Check email & status
        ↓
[User] Set password, review/edit info, submit
        ↓
System: Generate + email activation code
        ↓
[User] Enter activation code from email
        ↓
System: Verify code, activate user
        ↓
[User] Log in and complete profile/photo/face reg (if not done)
UX Notes
Always explain each step clearly: e.g., “You will receive an email with an activation code shortly.”

Make it clear where to enter the code and what to do if not received.

Provide “Resend code” option with appropriate rate limiting.

Keep the user’s email/session alive between steps (store temp info in local state/Dexie).

After activation, optionally redirect to profile/photo/face registration if needed.

Technical Checklist
 Endpoint/UI for entering pre-registered email and verifying pending status.

 Registration form (name, password, etc.)

 Activation code generator (backend or frontend, but backend is more secure).

 Email sending logic for activation code.

 DB fields for storing code + expiry.

 Code verification endpoint/UI.

 Error, expired, and retry handling.

 “Resend code” feature.

 Final activation and session/login logic.

 (Optional) Next step: Photo/Face registration after activation.