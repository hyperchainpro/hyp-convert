# 🚀 PUSH KE GITHUB: STEP BY STEP (5 MENIT)

## STEP 1️⃣: Create GitHub Repository (2 menit)

1. Buka: **https://github.com/new**
2. Isi form:
   ```
   Repository name: hyp-convert
   Description: Document conversion platform with Cloudflare Pages + D1
   Visibility: Public (atau Private, tergantung preferensi)
   ```
3. **JANGAN** check "Initialize this repository with:" (kita sudah punya code)
4. Click **"Create repository"**

Selesai! GitHub akan tampilkan page dengan instruksi.

---

## STEP 2️⃣: Push Code (3 menit)

Ganti `YOUR_USERNAME` dengan username GitHub kamu, kemudian jalankan:

```powershell
cd "c:\Users\USER\Documents\HYP convert"
git remote add origin https://github.com/YOUR_USERNAME/hyp-convert.git
git branch -M main
git push -u origin main
```

**Expected output:**
```
Enumerating objects: 55, done.
Counting objects: 100% (55/55), done.
...
 * [new branch]      main -> main
Branch 'main' set up to track remote branch 'main' from 'origin'.
```

✅ **Code is now on GitHub!**

---

## STEP 3️⃣: Add GitHub Secrets (2 menit)

### Generate Cloudflare API Token

1. Go to: **https://dash.cloudflare.com/account/api-tokens**
2. Click **"Create Token"**
3. Select template: **"Edit Cloudflare Workers"**
4. Scroll down, make sure these are ✅:
   - Account.Pages (Read/Write)
   - Zone.Workers Scripts (Read/Write)
5. TTL: Set to 1 year
6. Click **"Create Token"**
7. **COPY the token** (will look like: `dFZoU2FrUjJWMmN3ZW...`)

### Add Token to GitHub

1. Go to: **https://github.com/YOUR_USERNAME/hyp-convert/settings/secrets/actions**
2. Click **"New repository secret"**
3. Fill form:
   ```
   Name: CLOUDFLARE_API_TOKEN
   Secret: [PASTE your token here]
   ```
4. Click **"Add secret"**

5. Click **"New repository secret"** again
6. Fill form:
   ```
   Name: CLOUDFLARE_ACCOUNT_ID
   Secret: 57a43ffcdd96968a982985d41a26860e
   ```
7. Click **"Add secret"**

✅ **Secrets added to GitHub!**

---

## STEP 4️⃣: Connect GitHub to Cloudflare (2 menit)

1. Go to: **https://dash.cloudflare.com/account/pages/view/hyp-convert**
2. Click **"Settings"** tab (top right)
3. Find **"Build & deployment"** section
4. Click **"Connect a GitHub repository"**
5. Click **"Authorize"** (if prompted)
6. Select your repo: `YOUR_USERNAME/hyp-convert`
7. Click **"Connect"**

8. Now fill in **Build Settings**:
   ```
   Production branch: main
   Build command: npm install --legacy-peer-deps && npm run build:web:prod
   Build output directory: dist
   ```
9. Click **"Save"**

✅ **Auto-build connected!**

---

## STEP 5️⃣: Test Auto-Deploy (5 menit)

Push a test change:

```powershell
cd "c:\Users\USER\Documents\HYP convert"
echo "test" >> test.txt
git add .
git commit -m "test: trigger auto-deploy"
git push origin main
```

**Monitor deployment:**

1. **GitHub Actions:** https://github.com/YOUR_USERNAME/hyp-convert/actions
   - Should see "Deploy to Cloudflare Pages" running
   - Takes ~8-10 minutes

2. **Cloudflare Pages:** https://dash.cloudflare.com/account/pages/view/hyp-convert
   - Should see new deployment in progress
   - Wait for "✓ Completed"

3. **Visit app:** https://hyp-convert.pages.dev
   - Page should load (might take 1-2 min)

---

## ✅ DONE!

After this:
- ✅ Every push to GitHub = auto-deploy
- ✅ Cloudflare Pages + D1 all connected
- ✅ GitHub Actions builds automatically
- ✅ Zero manual deployment steps needed

---

## 🔗 Key URLs to Bookmark

```
GitHub Repo:      https://github.com/YOUR_USERNAME/hyp-convert
GitHub Actions:   https://github.com/YOUR_USERNAME/hyp-convert/actions
GitHub Secrets:   https://github.com/YOUR_USERNAME/hyp-convert/settings/secrets/actions
Cloudflare Pages: https://dash.cloudflare.com/account/pages/view/hyp-convert
Live App:         https://hyp-convert.pages.dev
```

---

## 💡 Quick Ref: After Setup

```powershell
# Make changes to code
git add .
git commit -m "feature: your message"
git push origin main

# Auto-deploy starts automatically!
# Check status at: https://github.com/YOUR_USERNAME/hyp-convert/actions
# Live at: https://hyp-convert.pages.dev (after 8-10 min)
```

---

**Total time: ~20 minutes**
**Result: Fully automated CI/CD pipeline** 🎉

Last Updated: 2026-06-10 08:25 UTC
