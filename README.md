# CyberX — Zero Trust Nexus

CyberX is a browser-first cybersecurity learning and operations workspace with a single role-aware login, Zero Trust command dashboard, Code Studio, shared Code Index, authorized Device Security Lab, and a private Developer Control Centre.

## Open CyberX

The public entry page is [Index/index.html](./Index/index.html). After login:
- approved owner/developer accounts are routed to the private Developer Console;
- normal accounts open the Zero Trust Command Centre;
- Guest Preview is local-only and is not counted in cloud usage metrics.

## Cloud backend

The app connects to the dedicated Supabase project `phzobbtapdmygfxzkgxt`. It uses a browser-safe publishable key with Row Level Security. Passwords are stored only in Supabase Auth. Never commit user passwords, Google OAuth client secrets, service-role keys, or GitHub personal access tokens.

Supabase URL/redirect setup is described in `SUPABASE-SETUP.md`. Google sign-in requires enabling the Google provider and configuring its OAuth client credentials in Supabase.

## Shared code catalogue

The cloud catalogue is stored in `public.cyberx_public_library`. Signed-in users have read access; only accounts in the developer allowlist can update it. The bundled local catalogue contains 104 curated examples. The Developer Console can sync it to the cloud so users on other devices can read the shared version.

## Usage analytics

The Developer Console reads aggregate metrics from `public.cyberx_developer_metrics()` and audit events from the protected audit table. Metrics start at zero and increase when registered accounts use the app. Dashboard threat routes, counts and endpoint status are labelled sample data until actual collectors are connected.

## Deploy

GitHub Actions deploys the repository to GitHub Pages after pushes to `main`. In the repository settings, set Pages' build source to **GitHub Actions**. Then add the published site URL and `/Index/index.html` to Supabase Auth's allowed redirect URLs.

The website is static and works across phones, tablets and computers. Browser device APIs require HTTPS or localhost and explicit user permission. Hardware flashing and non-browser language execution need their relevant local runtimes.
