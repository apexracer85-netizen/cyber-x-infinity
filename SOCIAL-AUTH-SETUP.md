# CyberX Social Sign-in Setup

CyberX provides email/password sign-in and buttons for Google, Facebook, and Apple. Each provider is checked before the OAuth redirect starts. An unconfigured provider reports a setup message instead of silently waiting.

## Google
1. Create a Google OAuth Client ID for a Web application in Google Cloud Console.
2. Add the GitHub Pages origin: `https://apexracer85-netizen.github.io`.
3. Add the local development origin: `http://127.0.0.1:8765`.
4. In Supabase → Authentication → Providers → Google, enable Google and enter the OAuth Client ID and Client Secret.
5. In Supabase Auth URL Configuration, allow:
   - `https://apexracer85-netizen.github.io/cyber-x-infinity/Index/index.html`
   - `http://127.0.0.1:8765/Index/index.html`

## Facebook and Apple
Enable each provider only if its OAuth application has been created and its client credentials are configured in Supabase.

CyberX never asks users to type their Google/Facebook/Apple account password into the CyberX form. The provider handles the authentication screen and returns the verified identity to Supabase. Role routing is then checked against the CyberX developer allowlist.

Never commit OAuth Client Secrets to GitHub or put them in JavaScript files.
