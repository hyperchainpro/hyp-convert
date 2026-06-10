# GitHub Actions + Cloudflare Auto-Build Setup Guide

## Status: READY TO CONNECT

Your `.github/workflows/deploy.yml` is created. Now connect to GitHub and Cloudflare!

---

## Step 1: Initialize Git Repository

```bash
# Navigate to project
cd "c:\Users\USER\Documents\HYP convert"

# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: HYP Convert with Cloudflare Pages + D1"

# Add remote (replace YOUR_USERNAME/YOUR_REPO)
git remote add origin https://github.com/YOUR_USERNAME/hyp-convert.git

# Push to GitHub
git branch -M main
git push -u origin main
```

---

## Step 2: Add GitHub Secrets

Go to: `https://github.com/YOUR_USERNAME/hyp-convert/settings/secrets/actions`

Click **"New repository secret"** and add:

### Secret 1: CLOUDFLARE_API_TOKEN
1. Go to https://dash.cloudflare.com/account/api-tokens
2. Click "Create Token"
3. Choose "Edit Cloudflare Workers" template (or create custom)
4. Add permissions:
   - Zone.Workers Scripts:Read/Write
   - Account.Pages Build System:Read/Write
   - Account.Cloudflare Pages:Read/Write
5. Copy token → paste into GitHub Secrets
6. Name: `CLOUDFLARE_API_TOKEN`

### Secret 2: CLOUDFLARE_ACCOUNT_ID
1. Go to https://dash.cloudflare.com/account/api-tokens
2. Under "Account details", copy Account ID
3. Paste into GitHub Secrets
4. Name: `CLOUDFLARE_ACCOUNT_ID`

**Expected Account ID:** `57a43ffcdd96968a982985d41a26860e` (from earlier `wrangler whoami`)

---

## Step 3: Verify GitHub Actions Setup

After pushing to GitHub:

1. Go to: `https://github.com/YOUR_USERNAME/hyp-convert/actions`
2. See "Deploy to Cloudflare Pages" workflow
3. Click it → should see:
   - ✅ Checkout repository
   - ✅ Setup Node.js
   - ✅ Install dependencies (--legacy-peer-deps)
   - ✅ Build Expo web app (npm run build:web:prod)
   - ✅ Deploy to Cloudflare Pages

On **push to main** or **pull request**, workflow auto-triggers!

---

## Step 4: Enable Cloudflare Auto-Build (Optional But Easy!)

This lets Cloudflare auto-build without GitHub Actions.

### Method A: Via Cloudflare Dashboard (Simplest)

1. Go to https://dash.cloudflare.com
2. Pages → hyp-convert
3. Settings → Build & deployment
4. Under "Git":
   - Click "Connect a GitHub repository"
   - Select repo: `YOUR_USERNAME/hyp-convert`
   - Production branch: `main`
   - Build command: `npm install --legacy-peer-deps && npm run build:web:prod`
   - Build output directory: `dist`
5. Click "Save"
6. On next push to main → Cloudflare auto-builds!

### Method B: Via API (Advanced)

```bash
# Already configured in wrangler.toml, but you can verify:
cat wrangler.toml | grep -A5 "build"

# Should show:
# [build]
# command = "npm install --legacy-peer-deps && npm run build:web:prod"
```

---

## Deployment Flow (After Setup)

### When you push to GitHub:

```
1. You: git push origin main
   ↓
2. GitHub: Triggers "Deploy to Cloudflare Pages" workflow
   ↓
3. GitHub Actions:
   - Installs npm dependencies (--legacy-peer-deps)
   - Builds Expo web app (npm run build:web:prod)
   - Uploads to Cloudflare Pages (using API token)
   ↓
4. Cloudflare Pages: App live at https://hyp-convert.pages.dev
   ↓
5. GitHub: Automatically comments on PRs with preview URL
```

---

## Testing GitHub Actions Locally (Optional)

Before pushing, test workflow locally:

```bash
# Install act (GitHub Actions local runner)
# https://github.com/nektos/act

# On Windows with PowerShell:
choco install act-cli

# Or download from https://github.com/nektos/act/releases

# Then run:
act push --secret CLOUDFLARE_API_TOKEN="your_token" --secret CLOUDFLARE_ACCOUNT_ID="57a43ffcdd96968a982985d41a26860e"
```

---

## Monitoring Deployments

### Via GitHub Actions
```
https://github.com/YOUR_USERNAME/hyp-convert/actions
```
See build logs, success/failure status

### Via Cloudflare Pages Dashboard
```
https://dash.cloudflare.com/account/pages/view/hyp-convert
```
See deployment history, preview URLs

---

## Quick Reference: All URLs

| Purpose | URL |
|---------|-----|
| **Production** | https://hyp-convert.pages.dev |
| **GitHub Repo** | https://github.com/YOUR_USERNAME/hyp-convert |
| **GitHub Actions** | https://github.com/YOUR_USERNAME/hyp-convert/actions |
| **GitHub Secrets** | https://github.com/YOUR_USERNAME/hyp-convert/settings/secrets/actions |
| **Cloudflare Pages** | https://dash.cloudflare.com/account/pages/view/hyp-convert |
| **Cloudflare API Tokens** | https://dash.cloudflare.com/account/api-tokens |
| **Cloudflare Account ID** | 57a43ffcdd96968a982985d41a26860e |

---

## Troubleshooting

### "workflow not running"
→ Make sure `git push` is to `main` branch, not other branches

### "API token expired"
→ Regenerate at https://dash.cloudflare.com/account/api-tokens
→ Update GitHub secret

### "Build failed: npm install error"
→ GitHub runs on Linux, Windows npm issues won't happen here!
→ --legacy-peer-deps flag handles React 19 + Expo compatibility

### "Deploy failed: 403 Unauthorized"
→ Check CLOUDFLARE_API_TOKEN is correct
→ Check CLOUDFLARE_ACCOUNT_ID matches `wrangler whoami` output

### "Preview URL not working"
→ Wait 2-3 minutes for Cloudflare to fully deploy
→ Check https://dash.cloudflare.com/account/pages/view/hyp-convert for status

---

## Complete CLI Commands

```bash
# 1. Initialize git & push
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/hyp-convert.git
git branch -M main
git push -u origin main

# 2. Trigger GitHub Actions
git push origin main

# 3. Check deployment status
# → Go to: https://github.com/YOUR_USERNAME/hyp-convert/actions

# 4. View live app
# → https://hyp-convert.pages.dev

# 5. Update code & auto-redeploy
git add .
git commit -m "Update feature"
git push origin main
# → Automatic deployment starts!
```

---

## What's Automated Now?

✅ **Build:** npm install + npm run build:web:prod
✅ **Deploy:** Auto-push to Cloudflare Pages
✅ **Monitoring:** GitHub Actions shows logs
✅ **Previews:** PR comments with preview URLs
✅ **Branches:** main = production, develop = staging

---

## Next: After First Successful Deploy

1. ✅ Create D1 API Workers (see WORKERS_SETUP.md)
2. ✅ Migrate frontend to use D1 instead of Supabase
3. ✅ Set up environment variables in Cloudflare
4. ✅ Test full app functionality

---

**Last Updated:** 2026-06-10 08:10 UTC
**Status:** Ready for GitHub + Cloudflare connection
