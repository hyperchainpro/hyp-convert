📝 # HYP Convert - Cloudflare + Supabase Deployment Guide

## 📋 Daftar Lengkap Langkah Deployment

### Phase 1: Persiapan & Setup (15 menit)
### Phase 2: Build Web App (10 menit)  
### Phase 3: Deploy ke Cloudflare Pages (5 menit)
### Phase 4: Deploy Backend API (Optional) (20 menit)
### Phase 5: Testing & Monitoring (10 menit)

---

## 🔧 Phase 1: Persiapan

### 1.1 Install Cloudflare CLI
```bash
# Windows (PowerShell)
npm install -g wrangler
# atau dengan Chocolatey
choco install wrangler
```

### 1.2 Login ke Cloudflare
```bash
wrangler login
# Ini akan membuka browser untuk autentikasi
```

### 1.3 Verify Credentials
```bash
wrangler whoami
```

### 1.4 Setup Environment Variables

**Development (.env)** - Sudah ada:
```
EXPO_PUBLIC_SUPABASE_URL=https://svktkvjlkvmgyxelpjys.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

**Production (.env.production)** - Edit dengan nilai production Anda:
```bash
# Copy .env.production.example
cp .env .env.production

# Edit dan tambahkan nilai production:
EXPO_PUBLIC_SUPABASE_URL=https://svktkvjlkvmgyxelpjys.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_production_key
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-xxxxxxxxxxxx
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-xxxxxxxxxxxx
```

---

## 🏗️ Phase 2: Build Web App

### 2.1 Install Dependencies
```bash
npm install
```

### 2.2 Test Build Lokal
```bash
# Development build
npm run build:web

# Production build
npm run build:web:prod

# Verify output
ls -la dist/
```

### 2.3 Test Web Version Lokal
```bash
npm run web
# Buka browser: http://localhost:3000
```

---

## 🚀 Phase 3: Deploy ke Cloudflare Pages

### 3.1 Setup Cloudflare Pages Project

**Option A: Via Cloudflare Dashboard**
1. Go to https://dash.cloudflare.com/
2. Navigate to **Pages**
3. Click **Create a project**
4. Select **Connect to Git** (GitHub/GitLab)
5. Select repository
6. Build settings:
   - **Build command:** `npm run build:web:prod`
   - **Build output directory:** `dist`
   - **Root directory:** `/` (biarkan kosong)
7. Environment variables:
   - `EXPO_PUBLIC_SUPABASE_URL`
   - `EXPO_PUBLIC_SUPABASE_ANON_KEY`
   - `EXPO_PUBLIC_ADMOB_ANDROID_APP_ID`
   - `EXPO_PUBLIC_ADMOB_IOS_APP_ID`
8. Click **Save and Deploy**

**Option B: Via Wrangler CLI**
```bash
# Create new Pages project
wrangler pages project create hyp-convert

# Deploy local build
npm run build:web:prod
npm run deploy:cloudflare

# Or deploy with preview
npm run deploy:preview
```

### 3.2 Verify Deployment
```bash
# Check deployment status
wrangler pages project info hyp-convert

# Akses URL: https://hyp-convert.pages.dev
```

### 3.3 Setup Custom Domain (Optional)
1. Di Cloudflare dashboard
2. Pages > hyp-convert > Custom domain
3. Enter domain (e.g., hyp-convert.com)
4. Update DNS records sesuai instruksi

---

## 🔌 Phase 4: Deploy Backend API (Optional)

Jika Anda perlu Cloudflare Workers untuk backend API (misal: image processing, advanced auth):

### 4.1 Create Workers Directory
```bash
mkdir src/workers
```

### 4.2 Create API Worker
```bash
# File: src/workers/api.ts
```

Lihat `WORKERS_SETUP.md` untuk detail setup backend API.

---

## 🧪 Phase 5: Testing & Monitoring

### 5.1 Test Web App
```bash
# Login test
1. Go to https://hyp-convert.pages.dev
2. Register account
3. Upload document
4. Test conversion
5. Verify Supabase data
```

### 5.2 Monitor Performance
```bash
# Cloudflare Analytics
1. Dashboard > Pages > hyp-convert > Analytics
2. Monitor: Requests, Bandwidth, Error rate
```

### 5.3 Check Logs
```bash
# Real-time logs
wrangler pages deployment tail hyp-convert

# Or via dashboard: Pages > Deployments > View details
```

---

## 🔐 Security Checklist

- [ ] Supabase keys tidak di-commit ke Git
- [ ] .env.production di-ignore oleh .gitignore
- [ ] Gunakan Cloudflare environment secrets (bukan hardcoded)
- [ ] Enable 2FA di Cloudflare account
- [ ] Setup WAF rules untuk produksi
- [ ] Enable DDoS protection
- [ ] Regular backup Supabase data
- [ ] Monitor Supabase API usage

---

## 📊 Supabase Verification

### Check Database Connection
```bash
# Via Supabase CLI
supabase status

# Or test direct:
# https://svktkvjlkvmgyxelpjys.supabase.co/rest/v1/users
# Header: Authorization: Bearer YOUR_ANON_KEY
```

### Verify Tables Exist
```bash
# Supabase Dashboard:
# 1. Go to https://supabase.com/dashboard
# 2. Select project
# 3. Check SQL Editor for tables:
#    - users
#    - profiles
#    - token_transactions
#    - referrals
#    - documents (if needed)
```

---

## 🐛 Troubleshooting

### Build Error: "Cannot find module"
```bash
# Solution:
npm install
npm run build:web:prod
```

### 401 Unauthorized from Supabase
```
Problem: EXPO_PUBLIC_SUPABASE_ANON_KEY invalid
Solution: 
1. Check .env.production file
2. Verify key matches Supabase project
3. Check key permissions in Supabase
```

### Blank Page on Load
```
Problem: dist folder empty
Solution:
1. npm run build:web:prod
2. Check if dist/ has index.html
3. Verify app.json web config
```

### Cloudflare Build Timeout
```
Problem: Build takes > 10 minutes
Solution:
1. Increase build timeout in dashboard
2. Consider splitting large components
3. Use code splitting in metro config
```

---

## 📱 Mobile App Setup (Opsional)

Untuk deploy mobile app, gunakan **EAS Build**:

```bash
# Install EAS CLI
npm install -g eas-cli

# Configure EAS
eas build:configure

# Build untuk Production
eas build --platform android --auto-submit
eas build --platform ios
```

---

## 🔄 CI/CD Pipeline

### GitHub Actions Example
File: `.github/workflows/deploy.yml`

```yaml
name: Deploy to Cloudflare

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Install dependencies
        run: npm install
      
      - name: Build web
        run: npm run build:web:prod
      
      - name: Deploy to Cloudflare
        uses: cloudflare/wrangler-action@v3
        with:
          apiToken: \${{ secrets.CLOUDFLARE_API_TOKEN }}
          accountId: \${{ secrets.CLOUDFLARE_ACCOUNT_ID }}
          command: pages deploy dist
```

---

## 📞 Support & Resources

- **Expo Docs:** https://docs.expo.dev
- **Cloudflare Pages:** https://developers.cloudflare.com/pages
- **Supabase Docs:** https://supabase.com/docs
- **Cloudflare Workers:** https://developers.cloudflare.com/workers

---

**Last Updated:** 2026-06-10  
**Status:** ✅ Ready for Deployment
