# Final Setup: GitHub + Cloudflare Auto-Deploy Checklist

## ✅ Completed Locally

- [x] Created `.github/workflows/deploy.yml` (GitHub Actions)
- [x] Committed all files to git
- [x] Switched to main branch
- [x] Ready to push to GitHub

## 🔗 Next: Connect to GitHub & Cloudflare

### Step 1: Create GitHub Repository (5 minutes)

1. **Go to GitHub:**
   - https://github.com/new
   
2. **Create new repository:**
   - Repository name: `hyp-convert`
   - Description: `Document conversion platform with Cloudflare Pages + D1`
   - Visibility: Public (or Private)
   - **DO NOT** initialize with README/license (we have files locally)
   - Click "Create repository"

3. **You'll see instructions like:**
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/hyp-convert.git
   git branch -M main
   git push -u origin main
   ```

### Step 2: Push to GitHub (2 minutes)

Copy your repository URL from GitHub, then run:

```bash
# REPLACE: YOUR_USERNAME with your GitHub username
git remote add origin https://github.com/YOUR_USERNAME/hyp-convert.git
git push -u origin main
```

**Expected output:**
```
Enumerating objects: ...
Counting objects: ...
Compressing objects: ...
Writing objects: 100% (...)
Total ... (delta ...), reused ... (delta ...)
remote: Resolving deltas: ...
To https://github.com/YOUR_USERNAME/hyp-convert.git
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

### Step 3: Add GitHub Secrets (3 minutes)

1. **Go to GitHub repo settings:**
   ```
   https://github.com/YOUR_USERNAME/hyp-convert/settings/secrets/actions
   ```

2. **Click "New repository secret"**

3. **Add Secret #1: CLOUDFLARE_API_TOKEN**
   - Name: `CLOUDFLARE_API_TOKEN`
   - Secret: Follow instructions below ↓
   
4. **Generate Cloudflare API Token:**
   - Go to: https://dash.cloudflare.com/account/api-tokens
   - Click "Create Token"
   - Select template: "Edit Cloudflare Workers" (or create custom)
   - Make sure these permissions are checked:
     - ✅ Account.Pages → Read/Write
     - ✅ Zone.Workers Scripts → Read/Write
   - TTL: 1 year
   - Click "Create Token"
   - **Copy the token** → paste into GitHub secret
   - Click "Add secret"

5. **Add Secret #2: CLOUDFLARE_ACCOUNT_ID**
   - Name: `CLOUDFLARE_ACCOUNT_ID`
   - Secret: `57a43ffcdd96968a982985d41a26860e`
   - Click "Add secret"

**Verify secrets added:**
```
https://github.com/YOUR_USERNAME/hyp-convert/settings/secrets/actions
```
Should show both CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID ✅

### Step 4: Verify GitHub Actions (2 minutes)

1. **Go to Actions tab:**
   ```
   https://github.com/YOUR_USERNAME/hyp-convert/actions
   ```

2. **You should see:**
   - "Deploy to Cloudflare Pages" workflow
   - Status: ✅ (green checkmark)
   - Click it to see build logs

**Expected logs:**
```
✓ Checkout repository
✓ Setup Node.js
✓ Install dependencies (npm install --legacy-peer-deps)
✓ Build Expo web app (npm run build:web:prod)
✓ Deploy to Cloudflare Pages
```

### Step 5: Enable Cloudflare Auto-Build (3 minutes)

This lets Cloudflare auto-build when you push, WITHOUT GitHub Actions.

1. **Go to Cloudflare dashboard:**
   ```
   https://dash.cloudflare.com/account/pages/view/hyp-convert
   ```

2. **Click "Settings" tab**

3. **Find "Build & deployment" section**

4. **Under "Source":**
   - Click "Connect a GitHub repository"
   - Authorize Cloudflare to access GitHub
   - Select: `YOUR_USERNAME/hyp-convert`
   - Click "Connect"

5. **Under "Build Settings":**
   - Production branch: `main`
   - Build command: 
     ```
     npm install --legacy-peer-deps && npm run build:web:prod
     ```
   - Build output directory: `dist`
   - Click "Save"

**Verify connection:**
- Go to: https://dash.cloudflare.com/account/pages/view/hyp-convert
- Should show "Connected to GitHub" ✅

### Step 6: Test Deployment (2 minutes)

Push a test commit:

```bash
# Make a small change (e.g., edit this file)
echo "Auto-deploy test" >> DEPLOYMENT_COMPLETE.txt
git add .
git commit -m "test: trigger auto-deploy"
git push origin main
```

**Monitor deployment:**
- GitHub Actions: https://github.com/YOUR_USERNAME/hyp-convert/actions
- Cloudflare Pages: https://dash.cloudflare.com/account/pages/view/hyp-convert
- Live app: https://hyp-convert.pages.dev

**You should see:**
1. GitHub Actions starts workflow (30 seconds)
2. npm install (2 minutes)
3. npm run build:web:prod (5 minutes)
4. Deploy to Cloudflare (1 minute)
5. **App live at: https://hyp-convert.pages.dev** ✅

---

## 📋 Complete Checklist

### GitHub Setup
- [ ] Created GitHub repository: https://github.com/YOUR_USERNAME/hyp-convert
- [ ] Added GitHub remote: `git remote add origin https://github.com/YOUR_USERNAME/hyp-convert.git`
- [ ] Pushed to main: `git push -u origin main`
- [ ] Added CLOUDFLARE_API_TOKEN secret
- [ ] Added CLOUDFLARE_ACCOUNT_ID secret (57a43ffcdd96968a982985d41a26860e)
- [ ] GitHub Actions workflow visible and running

### Cloudflare Setup
- [ ] Connected GitHub repository to Cloudflare Pages
- [ ] Set build command: `npm install --legacy-peer-deps && npm run build:web:prod`
- [ ] Set output directory: `dist`
- [ ] Set production branch: `main`
- [ ] D1 database bound: `hyp_convert_db`
- [ ] Environment variables added (optional)

### Testing
- [ ] Made test push to trigger workflow
- [ ] GitHub Actions completed successfully
- [ ] Cloudflare build completed successfully
- [ ] App live at https://hyp-convert.pages.dev

---

## 🚀 After Setup: Auto-Deploy Flow

```
You: git push origin main
         ↓
GitHub: Triggers "Deploy to Cloudflare Pages" workflow
         ↓
GitHub Actions:
  • npm install --legacy-peer-deps (2 min)
  • npm run build:web:prod (5 min)
  • Deploy to Cloudflare Pages (1 min)
         ↓
Cloudflare: Build & deploy complete
         ↓
App: Live at https://hyp-convert.pages.dev ✅
```

**Total deployment time: 8-10 minutes**

---

## 🔗 Important URLs

| Service | URL | Purpose |
|---------|-----|---------|
| **GitHub Repo** | https://github.com/YOUR_USERNAME/hyp-convert | Source code |
| **GitHub Actions** | https://github.com/YOUR_USERNAME/hyp-convert/actions | Build logs |
| **GitHub Secrets** | https://github.com/YOUR_USERNAME/hyp-convert/settings/secrets/actions | API tokens |
| **Cloudflare Pages** | https://dash.cloudflare.com/account/pages/view/hyp-convert | Deployments |
| **Live App** | https://hyp-convert.pages.dev | Your app 🎉 |
| **API Tokens** | https://dash.cloudflare.com/account/api-tokens | Generate token |

---

## ⚡ Quick Commands Reference

```bash
# Push new changes (auto-deploys)
git add .
git commit -m "your message"
git push origin main

# View deployment status
# → https://github.com/YOUR_USERNAME/hyp-convert/actions

# View live app
# → https://hyp-convert.pages.dev

# Rollback to previous deployment
# → https://dash.cloudflare.com/account/pages/view/hyp-convert → Deployments → Select & Rollback
```

---

## 🐛 Troubleshooting

### "Workflow not found" in GitHub Actions
→ Make sure `.github/workflows/deploy.yml` is committed and pushed

### "API token failed" in Actions
→ Regenerate token at https://dash.cloudflare.com/account/api-tokens
→ Update GitHub secret

### "Build failed: npm error"
→ GitHub runs Linux, no Windows issues!
→ `--legacy-peer-deps` flag handles all dependency conflicts

### "Cloudflare deploy failed: 403"
→ Check CLOUDFLARE_API_TOKEN is valid
→ Check CLOUDFLARE_ACCOUNT_ID is `57a43ffcdd96968a982985d41a26860e`

### "App shows 404"
→ Wait 2-3 minutes for Cloudflare to fully deploy
→ Hard refresh browser: Ctrl+Shift+R
→ Check deployment status at https://dash.cloudflare.com/account/pages/view/hyp-convert

---

## 📊 Status Summary

**Local Git:** ✅ Committed and ready
**GitHub Actions:** ✅ Workflow created
**Cloudflare:** ✅ Pages project ready
**D1 Database:** ✅ Created with schema
**Auto-Deploy:** ⏳ Ready (needs GitHub connection)

**Next:** Follow steps above to connect GitHub + Cloudflare!

---

**Setup Time:** ~15 minutes
**After Setup:** Fully automated deploy on every push! 🚀

Last Updated: 2026-06-10 08:15 UTC
