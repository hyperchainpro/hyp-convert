# Cloudflare Workers Backend Setup (Optional)

## Overview

Gunakan Cloudflare Workers untuk:
- Advanced image processing (server-side)
- Rate limiting & authentication
- API proxying & transformation
- Webhook handling
- Scheduled tasks (cron jobs)

## Setup Langkah demi Langkah

### 1. Create Worker

```bash
# Create new worker
wrangler generate src/workers/api

# Or use existing setup with our config
```

### 2. Create Backend API Handler

**File: `src/workers/api/index.ts`**

```typescript
import { Router } from 'itty-router';

const router = Router();

// Health check
router.get('/health', () => {
  return new Response(JSON.stringify({ status: 'ok' }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Image processing endpoint
router.post('/api/process-image', async (request) => {
  const formData = await request.formData();
  const imageFile = formData.get('image') as File;
  
  if (!imageFile) {
    return new Response('No image provided', { status: 400 });
  }

  // TODO: Process image here
  // - Compress
  // - Convert format
  // - Extract metadata
  
  return new Response(JSON.stringify({
    success: true,
    message: 'Image processed'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// Token verification
router.post('/api/verify-token', async (request) => {
  const { token } = await request.json();
  
  // Verify with Supabase
  const response = await fetch('https://svktkvjlkvmgyxelpjys.supabase.co/rest/v1/profiles', {
    headers: {
      'Authorization': \`Bearer \${token}\`,
      'apikey': token
    }
  });

  return new Response(JSON.stringify({
    valid: response.ok
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
});

// 404
router.all('*', () => {
  return new Response('Not Found', { status: 404 });
});

export default router.handle;
```

### 3. Update Wrangler Config

**Update: `wrangler.toml`**

```toml
name = "hyp-convert-api"
type = "javascript"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true
main = "src/workers/api/index.ts"
compatibility_date = "2024-01-10"

[env.production]
name = "hyp-convert-api-prod"
route = "api.your-domain.com/*"
zone_id = "YOUR_ZONE_ID"

[build]
command = "tsc src/workers/api/index.ts --outDir dist"
```

### 4. Deploy Worker

```bash
# Deploy to development
wrangler deploy --env development

# Deploy to production
wrangler deploy --env production

# Tail logs
wrangler tail
```

### 5. Test Worker

```bash
# Local testing
wrangler dev

# Test endpoints
curl http://localhost:8787/health
curl -X POST http://localhost:8787/api/process-image -F "image=@test.jpg"
```

## Environment Variables

**Development:**
```bash
wrangler secret put SUPABASE_API_KEY
wrangler secret put SUPABASE_URL
```

**Production:**
```bash
wrangler secret put SUPABASE_API_KEY --env production
wrangler secret put SUPABASE_URL --env production
```

## Integration with Frontend

Update API calls in app:

```typescript
// Before (Supabase direct)
const { data } = await supabase.from('documents').select('*');

// After (via Worker API)
const response = await fetch('https://api.your-domain.com/api/documents', {
  headers: {
    'Authorization': \`Bearer \${token}\`
  }
});
const data = await response.json();
```

## Advanced Features

### Scheduled Tasks (Cron)

```typescript
// src/workers/scheduled.ts
export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    // Run daily cleanup
    await cleanupOldSessions(env);
  }
};
```

Configure in `wrangler.toml`:
```toml
triggers = { crons = ["0 2 * * *"] }  # 2 AM daily
```

### KV Store for Caching

```typescript
import { KVNamespace } from '@cloudflare/workers-types';

export interface Env {
  DOCUMENTS_KV: KVNamespace;
}

router.get('/api/documents/:id', async (request, env: Env) => {
  const cacheKey = \`doc-\${request.params.id}\`;
  
  let doc = await env.DOCUMENTS_KV.get(cacheKey, 'json');
  if (!doc) {
    // Fetch from Supabase
    doc = await fetchFromSupabase(request.params.id);
    await env.DOCUMENTS_KV.put(cacheKey, JSON.stringify(doc), { expirationTtl: 3600 });
  }
  
  return new Response(JSON.stringify(doc));
});
```

### R2 for File Storage

```typescript
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

export interface Env {
  R2: R2Bucket;
}

router.post('/api/upload', async (request, env: Env) => {
  const file = await request.arrayBuffer();
  const filename = \`documents/\${Date.now()}.pdf\`;
  
  await env.R2.put(filename, file, {
    httpMetadata: { contentType: 'application/pdf' }
  });
  
  return new Response(JSON.stringify({ url: \`/files/\${filename}\` }));
});
```

## Monitoring & Analytics

```bash
# View real-time logs
wrangler tail --format pretty

# View analytics
wrangler analytics workers
```

## Deployment Best Practices

1. ✅ Use environment secrets (tidak hardcoded)
2. ✅ Implement error handling
3. ✅ Add request validation
4. ✅ Use rate limiting
5. ✅ Monitor performance metrics
6. ✅ Regular backup data
7. ✅ Version API endpoints
8. ✅ Document API specs

## Cost Estimation

- **Requests:** 10M free/month, \$0.50/M after
- **Duration:** 50M GB-s free/month
- **Data Storage (KV):** \$0.50/GB/month
- **Data Transfer (R2):** \$0.015/GB

---

*Optional setup - only implement if you need backend APIs beyond Supabase*
