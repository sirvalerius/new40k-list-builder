# Feedback Worker

A tiny Cloudflare Worker that appends bug-feedback (submitted from the app) to
`FEEDBACK.md` in this repo. The GitHub token lives as a Worker **secret**, so the
static site never exposes it and testers can submit anonymously.

## One-time deploy

1. **Create a GitHub token** (fine-grained PAT):
   - GitHub → Settings → Developer settings → Fine-grained tokens → *Generate new token*.
   - Repository access: **Only select repositories** → `new40k-list-builder`.
   - Permissions: **Contents → Read and write**.
   - Copy the token.

2. **Deploy the Worker** (needs a free Cloudflare account):
   ```bash
   cd feedback-worker
   npm install -g wrangler        # or: npx wrangler ...
   wrangler login                 # opens the browser once
   wrangler secret put GITHUB_TOKEN   # paste the token from step 1
   wrangler deploy
   ```
   Wrangler prints the Worker URL, e.g. `https://new40k-feedback.<you>.workers.dev`.

3. **Tell the app the Worker URL**:
   - GitHub repo → Settings → Secrets and variables → Actions → **Variables** tab →
     *New repository variable* → name `FEEDBACK_URL`, value = the Worker URL.
   - Re-run the latest **CI & Deploy** workflow (or push any commit). The feedback
     button appears once `FEEDBACK_URL` is set.

## Notes
- `ALLOWED_ORIGIN` in `wrangler.toml` restricts CORS to the Pages site.
- Submissions are appended with a UTC timestamp + the app context (screen, list,
  user-agent). A hidden honeypot field drops obvious bots.
- To change the target file or repo, edit `[vars]` in `wrangler.toml` and redeploy.
