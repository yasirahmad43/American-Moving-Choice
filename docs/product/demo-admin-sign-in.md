# Demo admin sign in

On 2026-10-29 the owner requested removal of the authenticator step because the seeded admin
had been enrolled without an authenticator app being set up by the owner.

Set `DEMO_ADMIN_PASSWORD_ONLY=true` on `amc-app` Production and Preview and deploy this change.
It applies only when `DEMO_MODE=true` and the authenticated account has an admin role. The
correct password, existing login limits, account lockout, secure session cookie and admin role
are still required. Company accounts keep their existing second-factor requirements.

Both the password check and the session authorization use this same policy. A previously
password-authenticated session waiting at `/mfa` can reload and enter the admin area without
another code. Direct enrollment visits redirect to the admin area while this demo option applies.

The default is false. If `DEMO_MODE=false`, admin enrollment and second-factor verification are
required regardless of this flag. No existing authenticator secret is deleted and no session is
falsely marked as having passed a second factor. Restoring the requirement therefore does not
leave a password-only session able to bypass it. Never describe the demo option as live MFA.
