# Deployment Checklist - Syntiant Atlas

Use this checklist when deploying for the first time or troubleshooting deployments.

---

## Pre-Deployment Checks

- [ ] Code builds successfully locally
  ```bash
  npm install
  npm run build
  ```

- [ ] Environment variables are documented in `.env.example`

- [ ] Database migrations work locally
  ```bash
  npm run db:migrate
  npm run db:seed
  ```

- [ ] All changes committed and pushed to GitHub
  ```bash
  git add .
  git commit -m "Ready for deployment"
  git push origin main
  ```

---

## Part 1: Railway Backend Setup (20-30 minutes)

### Step 1: Create Railway Project
- [ ] Go to https://railway.app
- [ ] Click "New Project"
- [ ] Select "Deploy from GitHub repo"
- [ ] Authorize Railway for GitHub
- [ ] Select `syntiantatlas2` repository

### Step 2: Add PostgreSQL
- [ ] Click "+ New" in Railway project
- [ ] Select "Database" → "PostgreSQL"
- [ ] Wait for provisioning to complete
- [ ] Verify `DATABASE_URL` variable is created

### Step 3: Add Redis
- [ ] Click "+ New" again
- [ ] Select "Database" → "Redis"
- [ ] Wait for provisioning to complete
- [ ] Verify `REDIS_URL` variable is created

### Step 4: Configure API Service
- [ ] Click on your GitHub repo service
- [ ] Go to "Settings" → "General"
- [ ] Set Root Directory: `apps/api`
- [ ] Set Build Command:
  ```
  npm install && npx prisma generate && npm run build
  ```
- [ ] Set Start Command:
  ```
  npm run start:prod
  ```
- [ ] Set Watch Paths:
  ```
  apps/api/**
  packages/**
  prisma/**
  ```

### Step 5: Add Environment Variables
- [ ] Go to "Variables" tab
- [ ] Add the following variables:

#### Required Variables:
```env
NODE_ENV=production
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}
```

- [ ] Generate JWT secrets:
  ```bash
  # Run locally to generate:
  openssl rand -base64 32
  openssl rand -base64 32
  ```

- [ ] Add JWT variables:
```env
JWT_SECRET=<paste-first-secret>
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=<paste-second-secret>
JWT_REFRESH_EXPIRY=30d
```

- [ ] Add admin credentials:
```env
ADMIN_EMAIL=admin@syntiantatlas.com
ADMIN_PASSWORD=<choose-strong-password>
```

- [ ] Add app config:
```env
API_PORT=8080
ALLOWED_ORIGINS=http://localhost:3000
```

### Step 6: Deploy Backend
- [ ] Wait for automatic deployment to complete
- [ ] Check deployment logs for errors
- [ ] Verify service is running (should show "Active")

### Step 7: Generate Backend Domain
- [ ] Go to "Settings" → "Networking"
- [ ] Click "Generate Domain"
- [ ] Copy the URL (e.g., `https://syntiantatlas2-production.up.railway.app`)
- [ ] **SAVE THIS URL** - You'll need it for frontend setup

Backend URL: `____________________________________`

### Step 8: Run Database Migrations
- [ ] Click on API service
- [ ] Click "Terminal" tab (or use Railway CLI)
- [ ] Run migrations:
  ```bash
  npx prisma migrate deploy
  ```
- [ ] Seed the database:
  ```bash
  npx prisma db seed
  ```
- [ ] Verify no errors in output

### Step 9: Test Backend
- [ ] Test health endpoint:
  ```bash
  curl https://your-api.railway.app/api/health
  ```
- [ ] Should return successful response
- [ ] Check Railway logs if there are issues

---

## Part 2: Vercel Frontend Setup (10-15 minutes)

### Step 1: Import Project to Vercel
- [ ] Go to https://vercel.com
- [ ] Click "Add New" → "Project"
- [ ] Select "Import Git Repository"
- [ ] Choose `syntiantatlas2` from GitHub
- [ ] Click "Import"

### Step 2: Configure Project
- [ ] Framework Preset: **Next.js** (should be auto-detected)
- [ ] Root Directory: Click "Edit" → Select `apps/web`
- [ ] Build & Development Settings:
  - Build Command:
    ```
    npm install && npm run build --filter=@syntiant/web
    ```
  - Output Directory: `.next` (default)
  - Install Command: `npm install` (default)

### Step 3: Add Environment Variables
- [ ] Click "Environment Variables"
- [ ] Add the following:

```env
NEXT_PUBLIC_API_URL=https://your-api.railway.app/api
NODE_ENV=production
```

**Important:** Replace `your-api.railway.app` with your actual Railway backend URL from Step 7 above!

### Step 4: Deploy Frontend
- [ ] Click "Deploy"
- [ ] Wait for build to complete (3-5 minutes)
- [ ] Check build logs for any errors
- [ ] Wait for "Congratulations!" message

### Step 5: Get Frontend URL
- [ ] Copy the production URL (e.g., `https://syntiantatlas2.vercel.app`)
- [ ] **SAVE THIS URL**

Frontend URL: `____________________________________`

### Step 6: Test Frontend
- [ ] Visit your Vercel URL
- [ ] Verify the page loads
- [ ] Check browser console for errors
- [ ] Test basic navigation

---

## Part 3: Connect Frontend & Backend (5 minutes)

### Step 1: Update CORS in Railway
- [ ] Go back to Railway dashboard
- [ ] Click on API service
- [ ] Go to "Variables" tab
- [ ] Update `ALLOWED_ORIGINS`:
  ```
  https://your-app.vercel.app,https://your-app-*.vercel.app
  ```
  **Important:** Use your actual Vercel URL!

- [ ] Service will automatically redeploy

### Step 2: Verify Connection
- [ ] Go to your Vercel frontend URL
- [ ] Open browser DevTools (F12)
- [ ] Try to login or make API calls
- [ ] Check Network tab for API requests
- [ ] Verify no CORS errors
- [ ] Verify API calls succeed (200 status)

---

## Part 4: Security & Polish (10 minutes)

### Step 1: Secure Environment Variables
- [ ] Verify no `.env` files in Git:
  ```bash
  git status
  ```
- [ ] Confirm `.env` is in `.gitignore`
- [ ] Update production passwords if using defaults

### Step 2: Configure Custom Domains (Optional)
- [ ] **Railway:** Settings → Networking → Custom Domain
- [ ] Add domain (e.g., `api.yourdomain.com`)
- [ ] Configure DNS records as shown
- [ ] **Vercel:** Settings → Domains
- [ ] Add domain (e.g., `yourdomain.com`)
- [ ] Configure DNS records as shown

### Step 3: Test Critical Flows
- [ ] User Registration
- [ ] User Login
- [ ] Dashboard loads
- [ ] API calls work
- [ ] Database queries succeed
- [ ] Redis caching works (check logs)

### Step 4: Set Up Monitoring
- [ ] **Railway:** Check Metrics tab
- [ ] **Vercel:** Check Analytics
- [ ] Set up error tracking (optional)
- [ ] Configure alerts (optional)

---

## Part 5: Final Verification

### Functionality Tests
- [ ] Homepage loads and renders correctly
- [ ] Login with admin credentials works
- [ ] Dashboard displays data
- [ ] API endpoints respond correctly
- [ ] Database queries return data
- [ ] No errors in browser console
- [ ] No errors in Railway logs
- [ ] No errors in Vercel logs

### Performance Tests
- [ ] Page load time is acceptable
- [ ] API response times are good
- [ ] No timeout errors
- [ ] Images/assets load properly

### Security Tests
- [ ] HTTPS is enforced
- [ ] CORS is properly configured
- [ ] Authentication works
- [ ] Unauthorized requests are blocked
- [ ] Environment variables are secure

---

## Post-Deployment Tasks

### Documentation
- [ ] Update `.env.example` with any new variables
- [ ] Document custom domain setup (if used)
- [ ] Note any deployment-specific configurations
- [ ] Update README with deployment info

### Team Access
- [ ] Add team members to Railway project
- [ ] Add team members to Vercel project
- [ ] Share deployment URLs
- [ ] Share admin credentials (securely)

### Backups & Maintenance
- [ ] Verify Railway automatic backups are enabled
- [ ] Set up monitoring alerts
- [ ] Plan for database maintenance windows
- [ ] Schedule regular security updates

---

## Troubleshooting Guide

### Issue: Build Fails on Railway
**Symptoms:** Deployment fails, build errors in logs

**Solutions:**
- [ ] Check build logs for specific error
- [ ] Verify root directory is `apps/api`
- [ ] Verify build command includes `npx prisma generate`
- [ ] Check all dependencies are in `package.json`
- [ ] Try manual deployment via Railway CLI

### Issue: Build Fails on Vercel
**Symptoms:** Deployment fails, build errors

**Solutions:**
- [ ] Check build logs for specific error
- [ ] Verify root directory is `apps/web`
- [ ] Verify `NEXT_PUBLIC_API_URL` is set
- [ ] Check all dependencies are installed
- [ ] Try deploying from CLI: `vercel --prod`

### Issue: CORS Errors
**Symptoms:** Network errors, "CORS policy" in console

**Solutions:**
- [ ] Verify `ALLOWED_ORIGINS` in Railway includes Vercel URL
- [ ] Include both production and preview URLs: `https://your-app.vercel.app,https://your-app-*.vercel.app`
- [ ] Redeploy Railway after updating
- [ ] Clear browser cache and retry

### Issue: Database Connection Fails
**Symptoms:** "Connection refused", "Database not found" errors

**Solutions:**
- [ ] Verify PostgreSQL service is running in Railway
- [ ] Check `DATABASE_URL` is correctly set: `${{Postgres.DATABASE_URL}}`
- [ ] Run migrations: `npx prisma migrate deploy`
- [ ] Check database logs in Railway
- [ ] Verify Prisma schema is correct

### Issue: Frontend Shows 404 or Blank Page
**Symptoms:** Page doesn't load, 404 errors

**Solutions:**
- [ ] Check Vercel deployment status
- [ ] Verify build succeeded
- [ ] Check browser console for errors
- [ ] Verify `NEXT_PUBLIC_API_URL` is correct
- [ ] Try hard refresh (Ctrl+Shift+R)
- [ ] Check Vercel function logs

---

## Success Criteria

You've successfully deployed when:
- ✅ Backend API responds at Railway URL
- ✅ Frontend loads at Vercel URL
- ✅ Login works with admin credentials
- ✅ Dashboard displays data from database
- ✅ No errors in browser console
- ✅ No errors in Railway logs
- ✅ No errors in Vercel logs
- ✅ CORS is properly configured
- ✅ HTTPS is working
- ✅ Database queries succeed

---

## Deployment Complete! 🎉

### Your URLs:
- **Frontend:** `____________________________________`
- **Backend:** `____________________________________`
- **Railway Dashboard:** `https://railway.app/project/<project-id>`
- **Vercel Dashboard:** `https://vercel.com/<username>/<project>`

### Admin Credentials:
- **Email:** `____________________________________`
- **Password:** `____________________________________`

### Next Steps:
1. Test all critical features
2. Set up custom domains (if needed)
3. Configure production API keys (Stripe, SendGrid, etc.)
4. Share access with team
5. Set up monitoring and alerts
6. Plan for regular updates and maintenance

---

**Deployment Time Estimate:** 45-60 minutes for first deployment
**Need Help?** Refer to `DEPLOYMENT_GUIDE.md` for detailed instructions
