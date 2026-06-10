# Cloudflare Pages Auto-Build Configuration

## Option 1: CLI Setup (Fastest)

```bash
# Use wrangler to configure Pages build settings
wrangler pages project create hyp-convert \
  --build-command="npm install --legacy-peer-deps && npm run build:web:prod" \
  --build-output-dir="dist" \
  --production-branch="main"
```

*Note: Project already exists, so this adds Git integration*

---

## Option 2: Dashboard Setup (Visual)

1. **Go to Cloudflare Dashboard**
   ```
   https://dash.cloudflare.com/account/pages/view/hyp-convert
   ```

2. **Click "Settings"**

3. **Find "Build & deployment" section**

4. **Under "Source":**
   - Click "Connect a GitHub repository" (or "Manage GitHub connection")
   - Authorize Cloudflare to access your GitHub account
   - Select repository: `YOUR_USERNAME/hyp-convert`
   - Click "Connect"

5. **Under "Build Settings":**
   - **Production branch:** `main`
   - **Build command:** 
     ```
     npm install --legacy-peer-deps && npm run build:web:prod
     ```
   - **Build output directory:** 
     ```
     dist
     ```

6. **Click "Save"**

7. **On next push to main:**
   ```
   GitHub push → Cloudflare auto-builds → Deploy to https://hyp-convert.pages.dev
   ```

---

## Updated wrangler.toml (With Auto-Build Config)

Replace your `wrangler.toml` with this:

```toml
name = "hyp-convert"
account_id = "57a43ffcdd96968a982985d41a26860e"
workers_dev = true
compatibility_date = "2024-01-10"
compatibility_flags = ["nodejs_compat"]
pages_build_output_dir = "dist"

# Build configuration for Cloudflare Pages
[build]
command = "npm install --legacy-peer-deps && npm run build:web:prod"
cwd = "./"

# D1 Database binding
[[d1_databases]]
binding = "hyp_convert_db"
database_name = "hyp-convert-db"
database_id = "cac71aa5-8a30-4a22-adaf-5db1da6b4400"

# Environment variables (will set in Cloudflare dashboard)
[env.production]
d1_databases = [{binding = "hyp_convert_db", database_id = "cac71aa5-8a30-4a22-adaf-5db1da6b4400"}]

[env.development]
d1_databases = [{binding = "hyp_convert_db", database_id = "cac71aa5-8a30-4a22-adaf-5db1da6b4400"}]
```

---

## CLI Commands for Auto-Build Setup

```bash
# 1. Initialize git (if not done)
cd "c:\Users\USER\Documents\HYP convert"
git init
git add .
git commit -m "Initial: HYP Convert Cloudflare Pages + D1"

# 2. Add GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/hyp-convert.git
git branch -M main
git push -u origin main

# 3. Link to Cloudflare Pages project
wrangler pages project create hyp-convert --production-branch main

# 4. Verify configuration
wrangler pages project list
wrangler d1 list

# 5. Test build locally (optional)
npm install --legacy-peer-deps
npm run build:web:prod

# 6. Push to trigger auto-build
git push origin main
# → Check: https://dash.cloudflare.com/account/pages/view/hyp-convert
```

---

## Environment Setup in Cloudflare Dashboard

After connecting GitHub repo:

1. **Go to:** https://dash.cloudflare.com/account/pages/view/hyp-convert
2. **Click "Settings" → "Environment variables"**
3. **Add for "Production":**
   ```
   D1_DATABASE_ID = cac71aa5-8a30-4a22-adaf-5db1da6b4400
   NODE_ENV = production
   API_BASE_URL = https://hyp-convert.pages.dev
   ```
4. **Add for "Preview" (for pull requests):**
   ```
   D1_DATABASE_ID = cac71aa5-8a30-4a22-adaf-5db1da6b4400
   NODE_ENV = development
   API_BASE_URL = https://preview.hyp-convert.pages.dev
   ```

---

## Deployment Triggers

Auto-builds trigger on:

| Event | Trigger | Builds To |
|-------|---------|-----------|
| Push to `main` | Automatic | Production (https://hyp-convert.pages.dev) |
| Push to `develop` | Automatic | Preview/Staging |
| Pull Request | Automatic | Preview (unique URL per PR) |
| Manual | Dashboard button | On-demand |

---

## Monitoring Auto-Builds

### Via Cloudflare Dashboard
```
https://dash.cloudflare.com/account/pages/view/hyp-convert
→ "Deployments" tab shows all builds
→ Click any deployment to see logs
```

### Via GitHub Actions (if both enabled)
```
https://github.com/YOUR_USERNAME/hyp-convert/actions
→ "Deploy to Cloudflare Pages" workflow shows status
```

### Live URLs

| Environment | URL |
|-------------|-----|
| Production | https://hyp-convert.pages.dev |
| Latest Deploy | https://[deployment-id].hyp-convert.pages.dev |
| PR Previews | https://[pr-number].hyp-convert.pages.dev |

---

## Rollback & Debugging

### View Build Logs
```bash
# Via dashboard: Pages → hyp-convert → Deployments → [click build]
# Via CLI:
wrangler pages deployments list hyp-convert
```

### Rollback to Previous Build
```bash
# Via dashboard:
# Pages → hyp-convert → Deployments → [select previous] → Rollback
```

### Rebuild Current Commit
```bash
# Via dashboard:
# Pages → hyp-convert → Deployments → [select build] → Rebuild
```

---

## Common Issues & Fixes

### Build fails with "peer dependency" error
**Fix:** Add to build command:
```
npm install --legacy-peer-deps && npm run build:web:prod
```
→ Already configured ✅

### Build succeeds but app shows 404
**Fix:** Check output directory is `dist`
→ Already configured in wrangler.toml ✅

### GitHub not connecting
**Fix:**
1. Go to GitHub Settings → Applications → Authorized OAuth Apps
2. Find "Cloudflare Pages"
3. Click "Revoke" then reconnect in Cloudflare dashboard

### Secrets not available in build
**Fix:** For auto-build, use "Environment variables" in Pages settings:
→ https://dash.cloudflare.com/account/pages/view/hyp-convert/settings

---

## Recommended: Hybrid Setup (Best of Both)

Use **BOTH** GitHub Actions AND Cloudflare auto-build:

**GitHub Actions Benefits:**
- ✅ More customization
- ✅ Run tests before deploy
- ✅ Complex workflows
- ✅ Access to GitHub secrets

**Cloudflare Auto-Build Benefits:**
- ✅ Simpler setup
- ✅ Built-in previews for PRs
- ✅ Direct Git integration
- ✅ Instant rollbacks

**Recommendation:** Use Cloudflare auto-build + optional GitHub Actions for tests

---

## Quick Start (TL;DR)

```bash
# 1. Initialize & push to GitHub
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOU/hyp-convert.git
git push -u origin main

# 2. Connect to Cloudflare Pages in dashboard:
# https://dash.cloudflare.com/account/pages/view/hyp-convert
# → Settings → Build & deployment → Connect GitHub repo

# 3. Set build command:
npm install --legacy-peer-deps && npm run build:web:prod

# 4. Set output directory:
dist

# 5. Done! Push to main = auto-deploy
git push origin main

# 6. Watch at:
# https://dash.cloudflare.com/account/pages/view/hyp-convert
```

---

**Status:** Ready to deploy! 🚀
**Last Updated:** 2026-06-10 08:12 UTC
