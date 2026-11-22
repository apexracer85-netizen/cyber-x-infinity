# CyberX — Zero Trust Nexus

CyberX is a browser-first cybersecurity learning and operations workspace with a single role-aware login, Zero Trust command centre, Code Studio, shared Code Index, authorized Device Security Lab, and a private Developer Control Centre.

## Open CyberX
The public entry page is [Index/index.html](./Index/index.html). After login:
- approved owner/developer accounts are routed to the private Developer Console;
- normal accounts open the Zero Trust Command Centre;
- guest preview is local-only and is not included in cloud usage analytics.

## Source repository and deployment
This repository is public: https://github.com/apexracer85-netizen/cyber-x-infinity

The GitHub Actions workflow at `.github/workflows/deploy-pages.yml` deploys the root to GitHub Pages after the repository Pages source is set to **GitHub Actions**. The expected Pages address is `https://apexracer85-netizen.github.io/cyber-x-infinity/`. Verify a successful Pages workflow before treating that URL as live.

## Supabase cloud backend
CyberX connects to its dedicated Supabase project `phzobbtapdmygfxzkgxt`. Browser code contains only the public publishable key. Passwords are handled by Supabase Auth and never stored in source code. The developer owner email `brightonsabo@gmail.com` is allowlisted in the database; the owner must register and confirm the email before first sign-in.

All exposed tables have Row Level Security. Normal users can read the shared catalogue and append their own app events. Only allowlisted developers can read audit/usage records or write shared catalogue data.

## Shared catalogue size
The public GitHub repository currently includes an **8-example starter catalogue** in `Index/code-library.json`. The complete downloadable CyberX project bundle contains **104 curated examples**. When the owner opens Developer Console from that full local bundle, it automatically checks the existing cloud count and can sync all 104 examples into `public.cyberx_public_library`. Once synced, users on the hosted app read the larger shared cloud catalogue. The hosted Developer Console will not replace a larger cloud catalogue with its smaller 8-example starter copy.

The examples cover programming, APIs, databases, operating systems, Arduino/ESP32, electronics, and defensive device-security learning. This is a curated expandable catalogue, not every program ever written.

## Metrics and demo data
The Developer Console reads aggregate metrics from `public.cyberx_developer_metrics()` and protected audit rows. Metrics start at zero and increase when registered users use the application. Threat maps, activity counts, alert cards, and endpoint states in the command centre are illustrative sample telemetry until actual monitoring collectors are connected.

## Security and limitations
Never commit user passwords, Google/Facebook/Apple OAuth client secrets, service-role keys, database passwords, or GitHub personal access tokens. Google/social sign-in require those providers to be configured in Supabase Auth. Hardware APIs require HTTPS or localhost and explicit user permission. Arduino/ESP32 flashing and non-browser language execution require their appropriate local runtimes.
