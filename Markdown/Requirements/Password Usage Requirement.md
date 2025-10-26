Password Usage Requirement
1.	A password policy must exist which governs all operating sy stem user and administrative accounts. Its contents must include a minimum length, maximum lifetime, complexity requirements and history setting for passwords. The following password policy requirements are mandatory minimums:
•	Password minimum length requirement:
o	a minimum password length of 8 characters for general users;
o	a minimum password length of 16 characters for privileged users;
o	a minimum password length of 24 characters for services account which
o	password cannot be changed (e.g. SPN Services Account);

•	a maximum lifespan of 90 days for any password (Except services account);
•	enforced complexity requiring the use of upper-case letters (A-Z), lower case letters (a-z) numeric characters (0-9) and special characters;
•	a password history that prevents re-use of the user's last twelve passwords;
•	locking the account out after no more than five failed login attempts; and
•	a lock-out duration of at least 30 minutes, or until an administrator intervenes.

2.	If password expiry requirement is not adopted, an alternative password policy must at least include:
•	The use of long passphrases (at least 16 characters) to eliminate the risk of brute force attacks;
•	Screening of all passwords against lists of known commonly used or compromised passwords to prevent use of known weak, bad or compromised passwords;
•	Locking the account out after no more than five failed login attempts;
•	Enforcing multi-factor authentication (MFA) on all users; and
•	Salt and hash passwords to ensure they cannot be recovered using decryption tools.
