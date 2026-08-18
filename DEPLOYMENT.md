# ExamForge Deployment Guide

## Quick Deploy to Render + Neon (Free Stack)

This is the fastest way to get ExamForge running in production for free.

### What You'll Get

- **Frontend**: Hosted on Render Static Sites (free CDN)
- **Backend API**: Hosted on Render Web Services (free tier)
- **Database**: Neon PostgreSQL with pgvector (free forever)
- **File Storage**: Render persistent disk (1GB free)

### Total Cost: $0/month

---

## Step-by-Step Instructions

### 1. Create Neon Database (2 minutes)

1. Go to [https://neon.tech](https://neon.tech)
2. Sign up with GitHub (free)
3. Click **New Project**
4. Name it `examforge`
5. Keep default region (or choose closest to you)
6. Click **Create Project**
7. On the dashboard, copy the **Connection String** (looks like):
   ```
   postgresql://examforge_user:password@ep-xxx.region.aws.neon.tech/examforge?sslmode=require
   ```
8. Click **SQL Editor** tab
9. Run this command to enable vector search:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```
10. Save this connection string - you'll need it next

### 2. Push Code to GitHub (1 minute)

```bash
# In your project directory
git init
git add .
git commit -m "Ready for deployment"
git branch -M main

# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/examforge.git
git push -u origin main
```

### 3. Deploy to Render (3 minutes)

#### Option A: One-Click Deploy (Recommended)

1. Go to [https://dashboard.render.com](https://dashboard.render.com)
2. Sign up with GitHub (free)
3. Click **New +** → **Blueprint**
4. Connect your `examforge` repository
5. Select `main` branch
6. Click **Apply**

Render will automatically:
- Read the `render.yaml` configuration
- Create the database (or you can modify to use Neon)
- Deploy backend and frontend
- Configure environment variables

**Important**: After deployment, you MUST:
1. Go to the backend service settings
2. Update `DATABASE_URL` with your Neon connection string
3. Add your `AI_PROVIDER_API_KEY` (OpenAI key)
4. Restart the service

#### Option B: Manual Deploy

If you want full control or to use Neon from the start:

**Backend Service:**

1. Dashboard → New + → **Web Service**
2. Connect your repository
3. Configure:
   ```
   Name: examforge-api
   Region: Oregon (or closest to you)
   Branch: main
   Root Directory: (leave blank)
   Runtime: Node
   Build Command: cd apps/api && npm install && npm run build
   Start Command: cd apps/api && npm run start
   Instance Type: Free
   ```
4. Under **Advanced**, add a disk:
   ```
   Name: uploads
   Mount Path: /opt/render/project/src/uploads
   Size: 1 GB
   ```
5. Health Check Path: `/api/health`
6. Add Environment Variables (see below)
7. Click **Create Web Service**

**Frontend Service:**

1. Dashboard → New + → **Static Site**
2. Connect your repository
3. Configure:
   ```
   Name: examforge-web
   Branch: main
   Build Command: cd apps/web && npm install && npm run build
   Publish Directory: apps/web/dist
   ```
4. Add Environment Variable:
   ```
   Key: VITE_API_URL
   Value: https://examforge-api.onrender.com (your actual backend URL)
   ```
5. Click **Create Static Site**

### 4. Configure Environment Variables

For the **backend service**, set these variables:

| Variable | Value | Required? |
|----------|-------|-----------|
| `NODE_ENV` | `production` | ✅ |
| `DATABASE_URL` | Your Neon connection string | ✅ |
| `AUTH_SECRET` | Random 32+ chars (use generator) | ✅ |
| `AI_PROVIDER_API_KEY` | Your OpenAI API key | ✅ |
| `AI_PROVIDER_BASE_URL` | `https://api.openai.com/v1` | ✅ |
| `AI_MODEL` | `gpt-4o-mini` | ✅ |
| `AI_EMBEDDING_MODEL` | `text-embedding-3-small` | ✅ |
| `STORAGE_TYPE` | `local` | ✅ |
| `STORAGE_PATH` | `/opt/render/project/src/uploads` | ✅ |
| `APP_URL` | Your frontend URL | ✅ |
| `API_URL` | Your backend URL | ✅ |
| `CORS_ORIGINS` | Same as APP_URL | ✅ |
| `ENABLE_OCR` | `true` | Optional |
| `ENABLE_VECTOR_SEARCH` | `true` | Optional |

**Get an AUTH Secret:**
```bash
# Generate a random secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Get OpenAI API Key:**
1. Go to [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create new secret key
3. Copy it (you can only see it once!)

### 5. Run Database Migrations

After the backend deploys:

**Via Render Shell:**
1. Go to backend service → **Shell** tab
2. Wait for shell to connect
3. Run:
   ```bash
   cd apps/api
   npx prisma migrate deploy
   npm run db:seed
   ```

**Or Locally:**
```bash
export DATABASE_URL="your-neon-connection-string"
cd apps/api
npx prisma migrate deploy
npm run db:seed
```

### 6. Test Your Deployment

1. Visit your frontend: `https://examforge-web.onrender.com`
2. Check health: `https://examforge-api.onrender.com/api/health`
3. Expected response:
   ```json
   {
     "status": "healthy",
     "database": "connected",
     "timestamp": "2024-01-01T00:00:00Z",
     "environment": "production"
   }
   ```

---

## Troubleshooting

### Backend won't start

Check logs in Render dashboard:
```
Services → examforge-api → Logs
```

Common issues:
- Missing `DATABASE_URL` - verify it's correct
- Missing `AI_PROVIDER_API_KEY` - add your OpenAI key
- Database not migrated - run migrations
- Port conflict - ensure PORT=3000

### Database connection errors

1. Verify Neon connection string includes `?sslmode=require`
2. Check pgvector extension is enabled:
   ```sql
   SELECT * FROM pg_extension WHERE extname = 'vector';
   ```
3. Ensure Neon project is not paused

### CORS errors from frontend

1. Verify `CORS_ORIGINS` includes your frontend URL
2. Verify `APP_URL` matches your frontend URL exactly
3. Check for trailing slashes

### File upload fails

1. Verify disk is mounted at `/opt/render/project/src/uploads`
2. Check disk size (1GB minimum)
3. Review logs for permission errors

### Cold starts (slow first request)

Free tier services sleep after 15 minutes of inactivity. First request takes ~30 seconds. Solutions:
- Upgrade to paid plan ($7/month)
- Use external monitoring to ping health endpoint every 14 minutes
- Accept the delay (it's free!)

---

## Alternative: Use Render Database Instead of Neon

If you prefer simplicity over long-term free usage:

1. In `render.yaml`, remove the `fromDatabase` reference
2. Render will auto-create a PostgreSQL database
3. Note: Render free databases are deleted after 90 days

For production, **Neon is recommended** (free forever).

---

## Post-Deployment Tasks

### 1. Create Admin Account

The seed script creates an admin account. Check logs for credentials or create manually:

```bash
# In Render Shell
cd apps/api
npx tsx prisma/seed.ts
```

Default admin (if seeded):
- Email: `admin@examforge.app`
- Password: Check your seed script or logs

### 2. Configure Custom Domain (Optional)

**For Frontend:**
1. Render Dashboard → Static Site → Settings
2. Custom Domains → Add Custom Domain
3. Follow DNS instructions

**For Backend:**
1. Render Dashboard → Web Service → Settings
2. Custom Domains → Add Custom Domain
3. Update `APP_URL` and `CORS_ORIGINS` environment variables

### 3. Set Up Monitoring

Recommended free tools:
- **Uptime**: [UptimeRobot](https://uptimerobot.com) (ping health endpoint)
- **Errors**: [Sentry](https://sentry.io) (free tier)
- **Analytics**: [Google Analytics](https://analytics.google.com) or [Plausible](https://plausible.io)

### 4. Backup Database

Neon automatically backs up, but you can also:

```bash
# Export schema and data
pg_dump "your-neon-connection-string" > backup.sql

# Import later
psql "your-neon-connection-string" < backup.sql
```

---

## Scaling When You Grow

### Signs You Need to Upgrade

- Consistent high memory usage (>80%)
- Slow response times (>2s average)
- Database storage limit reached
- File storage limit reached
- Too many cold start complaints

### Upgrade Path

1. **Backend**: Render Standard ($7/month)
   - More RAM and CPU
   - No cold starts
   - Better performance

2. **Database**: Neon Pro ($19/month)
   - More storage
   - Higher compute limits
   - Priority support

3. **File Storage**: Cloudflare R2
   - Move from local disk to S3-compatible storage
   - Pay only for what you use
   - Virtually unlimited

4. **Add Caching**: Redis
   - Cache AI responses
   - Session management
   - Rate limiting storage

---

## Cost Estimates

### Free Tier (What we just deployed)

- Render Web Service (Backend): $0
- Render Static Site (Frontend): $0
- Neon Database: $0
- Render Disk (1GB): $0
- **Total: $0/month**

Limits:
- Backend: 750 hours/month (enough for one always-on service)
- Database: 0.5 GB storage, limited compute
- Disk: 1 GB file storage
- Cold starts after 15 min inactivity

### Starter Tier (When you have users)

- Render Standard Backend: $7/month
- Neon Pro: $19/month (optional, free tier may suffice)
- Larger Disk: $1/month per additional GB
- **Total: ~$8-27/month**

Benefits:
- No cold starts
- Better performance
- More storage
- Priority support

---

## Security Checklist

- [ ] `AUTH_SECRET` is randomly generated and unique
- [ ] `DATABASE_URL` uses SSL (`sslmode=require`)
- [ ] AI API keys stored only in environment variables
- [ ] CORS configured correctly (only your domains)
- [ ] HTTPS enabled (automatic on Render)
- [ ] Admin password changed from defaults
- [ ] Regular dependency updates scheduled
- [ ] Database backups configured
- [ ] File upload limits enforced
- [ ] Rate limiting enabled

---

## Support

### Documentation
- [Render Docs](https://render.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Prisma Docs](https://prisma.io/docs)

### Common Commands

```bash
# View logs (in Render Shell)
tail -f logs.txt

# Restart service (via Dashboard or CLI)
render restart

# Run migrations
npx prisma migrate deploy

# Seed database
npm run db:seed

# Check database
npx prisma studio
```

---

## Next Steps

1. ✅ Deploy successfully
2. ✅ Test all features
3. ✅ Invite beta users
4. 📊 Monitor usage and errors
5. 🚀 Iterate based on feedback
6. 💰 Consider upgrade when needed

Good luck with your deployment! 🎉
