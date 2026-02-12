# Quick Deployment Reference

## Railway (Backend) - One-Time Setup

### 1. Create Project & Services
```bash
# In Railway Dashboard:
1. New Project → Deploy from GitHub → Select 'syntiantatlas2'
2. Add Database → PostgreSQL
3. Add Database → Redis
```

### 2. Configure API Service
```
Root Directory: apps/api
Build Command: npm install && npx prisma generate && npm run build
Start Command: npm run start:prod
Watch Paths: apps/api/**, packages/**, prisma/**
```

### 3. Key Environment Variables
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
JWT_SECRET=<Generate with: openssl rand -base64 32>
JWT_REFRESH_SECRET=<Different secret>
ALLOWED_ORIGINS=https://your-app.vercel.app
```

### 4. Run Migrations
```bash
# In Railway service terminal:
npx prisma migrate deploy
npx prisma db seed
```

### 5. Get Your Backend URL
```
Settings → Networking → Generate Domain
Copy: https://your-api.railway.app
```

---

## Vercel (Frontend) - One-Time Setup

### 1. Import Project
```bash
# In Vercel Dashboard:
Add New → Project → Import 'syntiantatlas2' from GitHub
```

### 2. Configure Build Settings
```
Framework: Next.js
Root Directory: apps/web
Build Command: npm install && npm run build --filter=@syntiant/web
Output Directory: .next
Install Command: npm install
```

### 3. Environment Variables
```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api
NODE_ENV=production
```

### 4. Deploy & Get URL
```
Click Deploy → Copy: https://your-app.vercel.app
```

### 5. Update Railway CORS
```env
# Back in Railway, update:
ALLOWED_ORIGINS=https://your-app.vercel.app,https://your-app-*.vercel.app
```

---

## Daily Development Workflow

### Making Changes

1. **Make your changes locally**
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```

2. **Automatic Deployments**
   - Railway: Auto-deploys from `main` branch
   - Vercel: Auto-deploys from `main` branch

### Viewing Logs

**Railway:**
```bash
# Install Railway CLI
npm i -g @railway/cli

# Login
railway login

# View logs
railway logs
```

**Vercel:**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# View logs
vercel logs
```

---

## Database Operations

### Run Migrations
```bash
# Via Railway CLI
railway run npx prisma migrate deploy

# Or in Railway Dashboard → Service → Terminal
npx prisma migrate deploy
```

### Seed Database
```bash
railway run npx prisma db seed
```

### Access Database
```bash
railway connect postgres
```

### Create New Migration
```bash
# Locally:
npm run db:migrate

# Then push to trigger deployment
git push origin main
```

---

## Troubleshooting Quick Fixes

### Frontend can't connect to backend
```bash
# 1. Check Vercel env var
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api

# 2. Verify Railway is running
curl https://your-api.railway.app/api/health

# 3. Check Railway CORS includes Vercel domain
```

### Database connection errors
```bash
# 1. Verify DATABASE_URL in Railway
echo $DATABASE_URL

# 2. Run migrations
railway run npx prisma migrate deploy

# 3. Check Postgres service is running in Railway
```

### Build failures
```bash
# Railway: Check build logs in Dashboard
# Vercel: Check deployment logs

# Common fixes:
# - Verify root directory is correct
# - Check all dependencies in package.json
# - Ensure environment variables are set
```

### Force Redeploy
```bash
# Railway
railway up

# Vercel
vercel --prod

# Or trigger via dashboard by clicking "Redeploy"
```

---

## Environment Variables Checklist

### Railway (Backend)
- [ ] DATABASE_URL (auto from Postgres)
- [ ] REDIS_URL (auto from Redis)
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] ALLOWED_ORIGINS
- [ ] NODE_ENV=production
- [ ] ADMIN_EMAIL
- [ ] ADMIN_PASSWORD

### Vercel (Frontend)
- [ ] NEXT_PUBLIC_API_URL
- [ ] NODE_ENV=production

---

## URLs to Save

```
Backend API: https://your-api.railway.app
Frontend: https://your-app.vercel.app
Railway Dashboard: https://railway.app/project/<your-project-id>
Vercel Dashboard: https://vercel.com/<your-username>/<your-project>
```

---

## Important Notes

1. **Never commit `.env` files** - They're in `.gitignore`
2. **Use strong secrets in production** - Generate with `openssl rand -base64 32`
3. **Railway auto-deploys** on push to main
4. **Vercel auto-deploys** on push to main
5. **Always test locally first** with `npm run dev`
6. **Preview deployments**: Vercel creates preview for each PR
7. **Database backups**: Railway has automatic backups enabled

---

## Getting Help

- Railway: https://railway.app/help
- Vercel: https://vercel.com/support
- Your logs are your friend! Check them first.
