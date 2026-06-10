# HYP Convert - Next Steps (CLI Action Plan)

## Current Status
✅ Cloudflare Pages: Live at https://hyp-convert.pages.dev
✅ D1 Database: Ready with 5 tables initialized
⏳ Expo Web Build: Blocked on npm install (Windows permissions)

---

## Immediate Next Steps (Do These)

### Option A: Fix npm & Build Locally (RECOMMENDED)
```bash
# Step 1: Clean up problematic node_modules
rm -r node_modules -Force
npm cache clean --force

# Step 2: Install with legacy peer deps flag
npm install --legacy-peer-deps

# Step 3: Build Expo web app
npm run build:web:prod

# Step 4: Deploy to Cloudflare
wrangler pages deploy dist --branch=main

# Expected result: App live at https://hyp-convert.pages.dev with Expo UI
```

### Option B: Use GitHub Actions (FASTER)
```bash
# 1. Create .github/workflows/deploy.yml in repo
# 2. Push to GitHub
# 3. Actions automatically builds + deploys
# 4. No local npm issues

# See: GitHub_Actions_Deploy.yml (template below)
```

### Option C: Use Cloudflare's Auto-Build (EASIEST)
```bash
# Connect GitHub repo to Cloudflare Pages
# Set build command: npm install --legacy-peer-deps && npm run build:web:prod
# Set output directory: dist
# Push to main branch
# Automatic deployment!
```

---

## Option B: GitHub Actions Template

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Cloudflare Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm install --legacy-peer-deps
      
      - name: Build web app
        run: npm run build:web:prod
      
      - name: Deploy to Cloudflare Pages
        run: |
          npx wrangler pages deploy dist \
            --project-name=hyp-convert \
            --branch=main
        env:
          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}
```

To enable:
1. Generate API token: https://dash.cloudflare.com/account/api-tokens
2. Add to GitHub repo secrets as `CLOUDFLARE_API_TOKEN`
3. Commit and push `.github/workflows/deploy.yml`

---

## Phase 2: Create API Workers (After Build)

Once dist/ is built and deployed:

```bash
# Create API endpoint for D1 database access
mkdir -p src/workers

# Create handlers
touch src/workers/api.ts
touch src/workers/db-client.ts
touch src/workers/handlers.ts
```

### D1 API Handler Template

```typescript
// src/workers/api.ts
export default {
  async fetch(request: Request, env: any) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (path.startsWith('/api/users')) {
      return handleUserRoutes(request, env);
    }
    if (path.startsWith('/api/tokens')) {
      return handleTokenRoutes(request, env);
    }
    if (path.startsWith('/api/convert')) {
      return handleConversionRoutes(request, env);
    }

    return new Response('Not Found', { status: 404 });
  }
};

// User endpoints
async function handleUserRoutes(req: Request, env: any) {
  const db = env.hyp_convert_db;

  if (req.method === 'GET' && req.url.includes('/api/users/')) {
    const userId = req.url.split('/').pop();
    const { results } = await db.prepare(
      'SELECT * FROM profiles WHERE user_id = ?'
    ).bind(userId).all();
    return Response.json(results[0]);
  }

  return new Response('Method not allowed', { status: 405 });
}

// Token endpoints
async function handleTokenRoutes(req: Request, env: any) {
  const db = env.hyp_convert_db;

  if (req.method === 'POST' && req.url.includes('/api/tokens/transfer')) {
    const { from_user, to_user, amount } = await req.json();
    
    await db.batch([
      db.prepare(
        'UPDATE profiles SET hyp_tokens = hyp_tokens - ? WHERE user_id = ?'
      ).bind(amount, from_user),
      
      db.prepare(
        'UPDATE profiles SET hyp_tokens = hyp_tokens + ? WHERE user_id = ?'
      ).bind(amount, to_user),
      
      db.prepare(
        'INSERT INTO token_transactions (user_id, amount, type) VALUES (?, ?, ?)'
      ).bind(from_user, -amount, 'transfer'),
      
      db.prepare(
        'INSERT INTO token_transactions (user_id, amount, type) VALUES (?, ?, ?)'
      ).bind(to_user, amount, 'transfer')
    ]);

    return Response.json({ success: true });
  }

  return new Response('Method not allowed', { status: 405 });
}
```

Deploy Workers:

```bash
npm install -D wrangler
wrangler publish
```

---

## Phase 3: Migrate Frontend (After Workers Ready)

Update `lib/d1-client.ts`:

```typescript
// lib/d1-client.ts
const API_BASE = 'https://hyp-convert-api.example.com';

export const hyp_api = {
  async getProfile(userId: string) {
    return fetch(`${API_BASE}/api/users/${userId}`).then(r => r.json());
  },

  async transferTokens(fromUser: string, toUser: string, amount: number) {
    return fetch(`${API_BASE}/api/tokens/transfer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ from_user: fromUser, to_user: toUser, amount })
    }).then(r => r.json());
  },

  async getConversionHistory(userId: string) {
    return fetch(`${API_BASE}/api/history/${userId}`).then(r => r.json());
  }
};
```

Update components:

```typescript
// Example: Replace supabase calls in components
import { hyp_api } from '@/lib/d1-client';

// OLD: const profile = await supabase.from('profiles').select().eq('user_id', userId);
// NEW:
const profile = await hyp_api.getProfile(userId);
```

---

## Checklist: From Now to Fully Deployed

- [ ] **Step 1:** npm install --legacy-peer-deps (or use GitHub Actions)
- [ ] **Step 2:** npm run build:web:prod
- [ ] **Step 3:** wrangler pages deploy dist --branch=main
- [ ] **Step 4:** Verify app at https://hyp-convert.pages.dev
- [ ] **Step 5:** Create D1 API Worker (src/workers/api.ts)
- [ ] **Step 6:** Deploy worker (wrangler publish)
- [ ] **Step 7:** Update frontend to use D1 API instead of Supabase
- [ ] **Step 8:** Remove Supabase client references from codebase
- [ ] **Step 9:** Full testing in production
- [ ] **Step 10:** Monitor Cloudflare dashboard for performance

---

## Troubleshooting

### If npm install still fails:
```bash
# Use GitHub Actions instead (see Option B above)
# Or try WSL2:
wsl --install
cd /mnt/c/Users/USER/Documents/HYP\ convert
npm install --legacy-peer-deps
npm run build:web:prod
```

### If Pages deploy fails:
```bash
# Check build output
wrangler pages deploy dist --verbose

# Verify dist folder exists
dir dist

# Check wrangler config
cat wrangler.toml
```

### If D1 queries fail:
```bash
# Test D1 connection
wrangler d1 execute hyp-convert-db --sql="SELECT 1"

# Check schema
wrangler d1 execute hyp-convert-db --sql="SELECT name FROM sqlite_master WHERE type='table'"

# Sync local to remote
wrangler d1 migrate hyp-convert-db
```

---

## Reference URLs

- **Pages:** https://hyp-convert.pages.dev
- **Cloudflare Dashboard:** https://dash.cloudflare.com
- **D1 Documentation:** https://developers.cloudflare.com/d1
- **Pages Documentation:** https://developers.cloudflare.com/pages
- **Workers Documentation:** https://developers.cloudflare.com/workers

---

**Last Updated:** 2026-06-10 08:04 UTC
**Status:** Ready to build & deploy full app
