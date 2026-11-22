# CyberX GitHub setup and publishing

Repository: https://github.com/apexracer85-netizen/cyber-x-infinity

The unified login, Zero Trust Command Centre, workspace launcher, Developer Console, Code Index, Code Studio, Device Security Lab, public Supabase config, migrations, PWA assets and GitHub Actions workflows are in this repository.

## Enable GitHub Pages
1. Open repository Settings → Pages.
2. Set Build and deployment source to **GitHub Actions**.
3. The `.github/workflows/deploy-pages.yml` workflow deploys the repository root on pushes to `main` or manual workflow dispatch.
4. Confirm that the Deploy CyberX to GitHub Pages workflow completes successfully before sharing the site URL.

Expected site: `https://apexracer85-netizen.github.io/cyber-x-infinity/`
Single login: `https://apexracer85-netizen.github.io/cyber-x-infinity/Index/index.html`

## Supabase redirects
After Pages is live, set the Supabase Site URL to the expected site URL and add the single login URL above to allowed redirect URLs. Retain `http://127.0.0.1:8765/Index/index.html` for local testing.

The repository is public. Only the Supabase publishable key is present in browser files. Never commit passwords, service-role keys, OAuth Client Secrets, database passwords or personal access tokens.
