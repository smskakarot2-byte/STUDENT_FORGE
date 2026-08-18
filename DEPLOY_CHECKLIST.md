# ExamForge Deployment Checklist

Use this checklist before and after deploying to Render + Neon.

## Pre-Deployment

### Code Preparation
- [ ] All code committed to Git
- [ ] `render.yaml` file present in root
- [ ] `.env.example` updated with all required variables
- [ ] No secrets committed to repository
- [ ] `.gitignore` excludes sensitive files
- [ ] `package.json` scripts work correctly
- [ ] Application runs locally without errors

### Database Setup (Neon)
- [ ] Neon account created
- [ ] Project named `examforge` created
- [ ] Connection string copied
- [ ] pgvector extension enabled: `CREATE EXTENSION IF NOT EXISTS vector;`
- [ ] Connection string includes `?sslmode=require`
- [ ] Database password stored securely

### API Keys & Secrets
- [ ] OpenAI API key obtained from platform.openai.com
- [ ] AUTH_SECRET generated (32+ random characters)
- [ ] Google OAuth credentials (if using OAuth)
- [ ] SMTP credentials (if using email)
- [ ] All secrets stored in password manager

### GitHub Repository
- [ ] Repository created on GitHub
- [ ] Code pushed to `main` branch
- [ ] Repository is private (recommended for initial deployment)
- [ ] README.md is up to date
- [ ] LICENSE file present

## Deployment Day

### Render Setup
- [ ] Render account created
- [ ] GitHub connected to Render
- [ ] Blueprint deployed OR services created manually
- [ ] Backend service name: `examforge-api`
- [ ] Frontend service name: `examforge-web`
- [ ] Disk mounted for backend at `/opt/render/project/src/uploads`
- [ ] Health check path set to `/api/health`

### Environment Variables (Backend)
- [ ] `NODE_ENV` = `production`
- [ ] `DATABASE_URL` = Neon connection string
- [ ] `AUTH_SECRET` = generated secret
- [ ] `AI_PROVIDER_API_KEY` = OpenAI key
- [ ] `AI_PROVIDER_BASE_URL` = `https://api.openai.com/v1`
- [ ] `AI_MODEL` = `gpt-4o-mini`
- [ ] `AI_EMBEDDING_MODEL` = `text-embedding-3-small`
- [ ] `STORAGE_TYPE` = `local`
- [ ] `STORAGE_PATH` = `/opt/render/project/src/uploads`
- [ ] `APP_URL` = frontend URL
- [ ] `API_URL` = backend URL
- [ ] `CORS_ORIGINS` = frontend URL
- [ ] `ENABLE_OCR` = `true`
- [ ] `ENABLE_VECTOR_SEARCH` = `true`

### Environment Variables (Frontend)
- [ ] `VITE_API_URL` = backend URL
- [ ] `NODE_ENV` = `production`

### Database Migration
- [ ] Connected to backend via Shell
- [ ] Ran `npx prisma migrate deploy`
- [ ] Ran `npm run db:seed` (optional)
- [ ] No migration errors
- [ ] Verified tables exist in Neon

## Post-Deployment Testing

### Basic Connectivity
- [ ] Frontend loads: `https://examforge-web.onrender.com`
- [ ] Backend health OK: `https://examforge-api.onrender.com/api/health`
- [ ] Health response shows `"database": "connected"`
- [ ] No console errors in browser DevTools

### Authentication Flow
- [ ] Can access signup page
- [ ] Can create new account
- [ ] Email verification works (if enabled)
- [ ] Can login with credentials
- [ ] Can logout
- [ ] Password reset works (if configured)
- [ ] Session persists across page refreshes

### Core Features
- [ ] Can create a course
- [ ] Can upload a PDF document
- [ ] Document processing completes
- [ ] Study AI responds to questions
- [ ] Quiz generator creates questions
- [ ] Past paper analyzer works
- [ ] File uploads saved correctly

### Security Checks
- [ ] Cannot access other users' files
- [ ] API requires authentication
- [ ] CORS only allows configured origins
- [ ] Rate limiting active (test with rapid requests)
- [ ] SQL injection prevented (Prisma handles this)
- [ ] XSS prevented (React escapes by default)

### Mobile Responsiveness
- [ ] Frontend works on phone screen size
- [ ] Exam simulator usable on mobile
- [ ] Upload works on mobile
- [ ] Navigation menu collapses properly

### Performance
- [ ] Initial page load < 3 seconds (after cold start)
- [ ] API responses < 2 seconds (simple queries)
- [ ] AI responses appear within reasonable time
- [ ] No memory leak warnings in logs

### Error Handling
- [ ] 404 page displays for unknown routes
- [ ] Graceful error messages for failed operations
- [ ] No stack traces exposed to users
- [ ] Errors logged server-side

## Monitoring Setup

### Uptime Monitoring
- [ ] UptimeRobot account created
- [ ] Monitoring endpoint: `/api/health`
- [ ] Check interval: 5 minutes
- [ ] Alerts configured (email/SMS)

### Error Tracking (Optional but Recommended)
- [ ] Sentry account created
- [ ] Sentry SDK installed
- [ ] DSN configured in environment variables
- [ ] Test error sent successfully

### Analytics (Optional)
- [ ] Google Analytics or Plausible configured
- [ ] Tracking code added to frontend
- [ ] Goals/events configured

## Documentation Updates

### Internal Docs
- [ ] Production URLs documented
- [ ] Admin credentials stored securely
- [ ] Runbook created for common issues
- [ ] Team members have access

### User-Facing Docs
- [ ] Help section updated
- [ ] FAQ includes deployment info
- [ ] Contact information current

## Backup & Recovery

### Database Backups
- [ ] Neon automatic backups confirmed
- [ ] Manual backup script tested
- [ ] Backup restoration tested (in staging)
- [ ] Backup schedule documented

### Disaster Recovery
- [ ] Steps documented for redeployment
- [ ] Database restore procedure documented
- [ ] Rollback plan exists
- [ ] Emergency contacts identified

## Scaling Plan

### When to Upgrade
- [ ] Defined metrics for upgrade (e.g., response time > 2s)
- [ ] Budget approved for upgrades
- [ ] Upgrade procedure documented

### Cost Monitoring
- [ ] Render billing alerts configured
- [ ] Neon usage monitoring enabled
- [ ] Monthly cost estimate tracked
- [ ] Payment method on file

## Compliance & Legal

### Privacy
- [ ] Privacy policy published
- [ ] Data retention policy defined
- [ ] User data export feature planned
- [ ] Account deletion feature works

### Terms
- [ ] Terms of service published
- [ ] Acceptable use policy defined
- [ ] DMCA contact information available

### Accessibility
- [ ] Basic accessibility testing done
- [ ] Alt text on images
- [ ] Keyboard navigation works
- [ ] Color contrast adequate

## Final Sign-Off

- [ ] All critical tests passed
- [ ] No P0 bugs open
- [ ] Stakeholders notified of launch
- [ ] Support plan in place
- [ ] Celebration! 🎉

---

## Quick Reference

**Frontend URL**: `https://examforge-web.onrender.com`
**Backend URL**: `https://examforge-api.onrender.com`
**Health Check**: `https://examforge-api.onrender.com/api/health`
**Database**: Neon PostgreSQL

**Common Commands**:
```bash
# Run migrations
cd apps/api && npx prisma migrate deploy

# Seed database
cd apps/api && npm run db:seed

# View logs (Render Dashboard → Logs tab)

# Restart service (Render Dashboard → Restart button)
```

**Emergency Contacts**:
- Render Support: https://render.com/support
- Neon Support: https://neon.tech/docs
- OpenAI Status: https://status.openai.com

---

Last updated: $(date)
