# Deployment Guide - HYP Convert ke Vercel

## 📋 Prerequisites

Pastikan Anda memiliki:
- ✅ GitHub repository yang sudah di-push (hyperchainpro/hyp-convert)
- ✅ Vercel account (https://vercel.com)
- ✅ Domain atau akan menggunakan hypconvert.vercel.app

## 🚀 Step-by-Step Deployment

### 1. Connect Repository ke Vercel

1. Login ke Vercel: https://vercel.com
2. Click "Add New..." → "Project"
3. Select "Import Git Repository"
4. Search untuk `hyp-convert` atau paste: `https://github.com/hyperchainpro/hyp-convert`
5. Click "Import"

### 2. Configure Project Settings

Pada halaman "Configure Project":

**Framework Preset**: `Other` (karena menggunakan Expo/React Native Web)

**Build Command**: `npm ci --legacy-peer-deps && npm run build:web:prod`

**Output Directory**: `dist`

**Install Command**: `npm ci --legacy-peer-deps`

### 3. Environment Variables Setup

Di Vercel Project Settings → "Environment Variables", tambahkan:

```
EXPO_PUBLIC_SUPABASE_URL=https://sdzxvoflksbesfrhcekm.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkenh2b2Zsa3NiZXNmcmhjZWttIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODEwODU2NDgsImV4cCI6MjA5NjY2MTY0OH0.y0Ry4FFexVKgo01-Y_oMdK39k5-T8iTmuQYkv0qmsdM
EXPO_PUBLIC_ADMOB_ANDROID_APP_ID=ca-app-pub-3940256099942544~3347511713
EXPO_PUBLIC_ADMOB_IOS_APP_ID=ca-app-pub-3940256099942544~1458002511
EXPO_PUBLIC_APP_URL=https://hypconvert.vercel.app
VITE_API_BASE_URL=https://hypconvert.vercel.app/api
EXPO_PUBLIC_ENABLE_ANALYTICS=true
EXPO_PUBLIC_ENABLE_CRASH_REPORTING=true
NODE_ENV=production
```

### 4. Deploy

1. Click "Deploy"
2. Tunggu build process selesai (±5-10 menit)
3. Setelah berhasil, Anda akan mendapat URL: `https://hyp-convert-<hash>.vercel.app`

### 5. Custom Domain Setup

#### Option A: Gunakan Vercel Domain (hypconvert.vercel.app)

1. Di Vercel Project → "Domains"
2. Click "Add"
3. Enter: `hypconvert.vercel.app`
4. Vercel akan otomatis configure

**Note**: Vercel akan mengubah default project domain ke `hypconvert` jika tersedia.

#### Option B: Custom Domain Sendiri

1. Di Vercel Project → "Domains"
2. Click "Add"
3. Enter domain Anda (contoh: `hypconvert.id`)
4. Follow Vercel's DNS configuration instructions

## ✅ Post-Deployment Checklist

Setelah deployment berhasil:

- [ ] Buka https://hypconvert.vercel.app
- [ ] Login page muncul dengan benar
- [ ] Dashboard cards animation smooth
- [ ] Semua navigation tabs berfungsi
- [ ] Check browser console untuk errors
- [ ] Test Supabase connection
- [ ] Verify environment variables loaded correctly

## 🔍 Monitoring

### Check Deployment Status
```bash
# View Vercel deployments
vercel ls

# Check specific deployment
vercel inspect <deployment-url>
```

### View Logs
1. Di Vercel Dashboard → Project → "Deployments"
2. Click on deployment → "Runtime Logs"
3. View build logs jika ada error

## 🐛 Troubleshooting

### Build Fails with Node.js Error
```bash
# Ensure correct Node version (18+)
node --version

# Clean install dependencies
npm ci --legacy-peer-deps
npm run build:web:prod
```

### Environment Variables Not Loading
1. Check `.env.production` file exists
2. Verify all variables set in Vercel dashboard
3. Re-deploy after adding env variables

### Animations Not Working
1. Check JavaScript bundles loaded correctly
2. Open DevTools → Network tab
3. Look for failed requests
4. Check console for errors

### Supabase Connection Issues
1. Verify `EXPO_PUBLIC_SUPABASE_URL` is correct
2. Check `EXPO_PUBLIC_SUPABASE_ANON_KEY` not corrupted
3. Test connection via browser console:
```javascript
// In browser console
fetch('https://sdzxvoflksbesfrhcekm.supabase.co/rest/v1/')
```

## 📊 Build Information

**Build Command**:
```bash
npm ci --legacy-peer-deps && npm run build:web:prod
```

**Output Structure**:
```
dist/
├── _expo/
│   ├── static/
│   │   ├── js/web/ (bundles)
│   │   ├── css/ (stylesheets)
│   │   └── fonts/
│   └── assets/
├── index.html
└── [routes].html
```

**Bundle Sizes** (approx):
- Main bundle: 4.07 MB (gzipped ~1.2 MB)
- PDF support: 580 KB
- JPSPdf: 454 KB
- Total gzipped: ~3-4 MB

## 🔐 Security Notes

1. **Never commit** `.env` atau `.env.production` ke version control ✅ (already in .gitignore)
2. **Rotate keys** jika diperlukan di Supabase Dashboard
3. **Enable CORS** di Supabase untuk domain production
4. **Use HTTPS** (Vercel provides automatic SSL)

## 📝 Deployment Versions

| Version | Date | Status | URL |
|---------|------|--------|-----|
| 1.0.0 | Jun 11, 2026 | ✅ Live | https://hypconvert.vercel.app |

## 💡 Auto-Deployment

Setelah initial setup, Vercel akan automatically deploy setiap kali ada:
- Push ke `main` branch
- Merge pull request
- Manual trigger dari Vercel dashboard

### Disable Auto-Deployment

Jika ingin manual deployment:
1. Project Settings → "Git"
2. Toggle off "Deploy on push"

## 📞 Support

Untuk issues:
1. Check Vercel Status: https://www.vercel-status.com
2. Check GitHub Actions
3. Review Vercel deployment logs
4. Contact Vercel support: https://vercel.com/support

---

**Deployment Date**: June 11, 2026
**Primary Domain**: hypconvert.vercel.app
**Framework**: Expo + React Native Web
**Node Version**: 18+ recommended
