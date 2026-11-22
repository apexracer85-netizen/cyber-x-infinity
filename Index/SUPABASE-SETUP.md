# CyberX Supabase setup

Project: `CyberX`
Project ref: `phzobbtapdmygfxzkgxt`
URL: `https://phzobbtapdmygfxzkgxt.supabase.co`

The browser bundle uses the public publishable key from `supabase-config.js`. This key is intended for browser use and is only safe because the application tables have Row Level Security policies. Never put a service-role key, secret key, database password, Google OAuth client secret, GitHub token, or a user's password in browser source files.

## Login and roles

- Email/password uses Supabase Auth.
- Google/Facebook/Apple require their OAuth providers to be enabled and configured in Supabase Auth → Providers.
- Once an account signs in, CyberX checks `public.cyberx_developer_allowlist`. Only enabled `owner` or `developer` entries enter `Developer-Console.html`.
- The seeded owner email is `brightonsabo@gmail.com`. Register this account through the Index sign-up form and confirm the email. Set a new strong password in Supabase Auth; do not reuse any password that has been shared in chat.
- Ordinary accounts are routed to `../Command-Centre.html`.

## Redirect URLs

For the GitHub Pages website, set the Site URL to:

`https://apexracer85-netizen.github.io/cyber-x-infinity/`

Add this Redirect URL:

`https://apexracer85-netizen.github.io/cyber-x-infinity/Index/index.html`

For local development, also add:

`http://127.0.0.1:8765/Index/index.html`

Google sign-in additionally needs the Google OAuth Client ID and Client Secret created in Google Cloud Console and configured in the Supabase Google provider. Do not store the Google Client Secret in this repository.

## Tables and analytics

The installed SQL migrations create:
- `cyberx_developer_allowlist`
- `cyberx_developer_audit`
- `cyberx_app_events`
- `cyberx_public_library`
- `cyberx_developer_metrics()`

All exposed tables have RLS enabled. Normal users can read public catalogue content and write only their own app events. Developer-only reads and shared-library writes use the database allowlist. Metrics start at zero and increase as real user accounts create application events.
