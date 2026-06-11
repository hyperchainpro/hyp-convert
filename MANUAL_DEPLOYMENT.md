# 🚀 Manual Deployment Guide - Vercel

## Problem: 404 Error Persisting

The automated build on Vercel is showing 404. This guide provides manual steps to fix it.

## Root Cause Analysis

Vercel might be having issues with:
1. Build output not being recognized
2. Region configuration (sin1 might be restricted)
3. Default index handling

## Solution: Manual Deployment

### Option 1: Using Vercel CLI (Recommended) 🎯

#### Step 1: Install Vercel CLI
```bash
npm install -g vercel
```

#### Step 2: Login to Vercel
```bash
vercel login
```
(Opens browser for authentication)

#### Step 3: Navigate to Project
```bash
cd "c:\Users\USER\Documents\HYP convert"
```

#### Step 4: Deploy Production
```bash
vercel --prod --name hypconvert
```

This will:
- Use built dist/ folder
- Configure project automatically
- Deploy to hypconvert.vercel.app

#### Step 5: Monitor
```bash
vercel logs https://hypconvert.vercel.app
```

### Option 2: Fresh Vercel Deploy 🆕

#### Delete Existing Deployment
1. Go to https://vercel.com/dashboard
2. Find "hyp-convert" project
3. Click Settings → Danger Zone
4. Click "Delete Project"

#### Create New Project
```bash
vercel --prod --name hypconvert
```

### Option 3: Manual Build & Deploy

#### Step 1: Clean Build
```bash
cd "c:\Users\USER\Documents\HYP convert"
rm -r dist -Force
npm ci --legacy-peer-deps
npm run build:web:prod
```

#### Step 2: Verify dist/ Exists
```bash
ls dist/
# Should see index.html, _expo/, and other files
```

#### Step 3: Deploy Built Files
```bash
vercel --prod --name hypconvert
```

## Simpler vercel.json (Current)

Now using minimal config:

```json
{
  "buildCommand": "npm ci --legacy-peer-deps && npm run build:web:prod",
  "outputDirectory": "dist",
  "cleanUrls": true,
  "rewrites": [
    {
      "source": "/:path*",
      "destination": "/index.html"
    }
  ]
}
```

Benefits:
- ✅ No region restrictions
- ✅ Simpler routing config
- ✅ Vercel auto-detects framework
- ✅ Better SPA handling

## Troubleshooting: Still 404?

### Check 1: Verify Local Build Works
```bash
npm run build:web:prod
ls dist/index.html  # Should exist

# Test locally
vercel dev
# Visit: http://localhost:3000
```

### Check 2: Check Vercel Build Logs
1. https://vercel.com/dashboard
2. Select project
3. Click "Deployments"
4. Click latest deployment
5. Go to "Runtime Logs" tab
6. Look for errors

### Check 3: Check Build Command
```bash
npm ci --legacy-peer-deps
npm run build:web:prod
# Should complete without errors
```

### Check 4: Force Fresh Deploy
```bash
# Delete node_modules and reinstall
rm -r node_modules -Force
npm ci --legacy-peer-deps

# Clean build
rm -r dist -Force
npm run build:web:prod

# Deploy
vercel --prod --name hypconvert
```

## Expected Output

After successful deploy:

```
✓ Linked to hyperchainpro/hyp-convert (created .vercel)
✓ Inspecting project structure...
✓ Detected Next.js, Remix or SvelteKit project...
✓ Using Remix as your Framework. Learn more: https://vercel.com/docs/frameworks/remix
> npm ci --legacy-peer-deps && npm run build:web:prod
✓ Ready! Deployed to hypconvert.vercel.app [in 2m15s]

Visit https://hypconvert.vercel.app to see your deployment.
```

## Verify Deployment Works

```bash
# Test the deployment
curl https://hypconvert.vercel.app/

# Should return HTML content, not 404

# Test routing
curl https://hypconvert.vercel.app/login
curl https://hypconvert.vercel.app/convert

# All should return 200
```

## Environment Variables in Vercel

If deploy works but app shows errors, check environment variables:

1. Go to https://vercel.com/dashboard
2. Select project → Settings
3. Go to "Environment Variables"
4. Verify all variables are set:
   - EXPO_PUBLIC_SUPABASE_URL
   - EXPO_PUBLIC_SUPABASE_ANON_KEY
   - EXPO_PUBLIC_ADMOB_ANDROID_APP_ID
   - EXPO_PUBLIC_ADMOB_IOS_APP_ID

## Quick Deployment Steps

```bash
# 1. Ensure logged in
vercel login

# 2. Go to project
cd "c:\Users\USER\Documents\HYP convert"

# 3. Deploy
vercel --prod --name hypconvert

# 4. Wait for deployment
# 5. Visit https://hypconvert.vercel.app
```

## Git Push (Auto-Deploy)

Or just push to GitHub:
```bash
git push origin main
```

Vercel will auto-deploy if GitHub integration is set up.

## If All Else Fails

Try deploying without using vercel.json:

1. Delete vercel.json temporarily
2. Deploy manually:
   ```bash
   vercel --prod --name hypconvert
   ```
3. When prompted, choose settings manually
4. Once deployed, restore vercel.json

## Support

- Vercel Status: https://www.vercel-status.com
- Vercel Docs: https://vercel.com/docs
- Vercel Support: https://vercel.com/support

---

**Current Setup**: vercel.json simplified ✅  
**Build Status**: Tested and working ✅  
**Ready for**: Manual CLI deployment  
**Next Step**: Run `vercel --prod --name hypconvert`
