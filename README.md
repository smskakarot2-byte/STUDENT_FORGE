# ExamForge

**Everything you need to prepare smarter.**

ExamForge is an AI-powered academic platform for university and college students. It transforms your course materials—syllabus, notes, lecture PDFs, and past papers—into a personalized preparation system with intelligent study tools.

## Features

### Core Platform
- **Course Knowledge Base**: Upload your course material once, power multiple AI tools
- **Document Processing**: Real PDF, DOCX, PPTX extraction with OCR support
- **AI Provider Abstraction**: Configurable AI backends with usage tracking

### AI Tools
- **Study AI**: Course-specific AI assistant with source citations
- **Past Paper Analyzer**: Identify repeated questions, topics, and trends
- **Quiz Generator**: Adaptive MCQs, short answer, and long-form questions
- **Exam Generator & Simulator**: Full mock exams with timer and scoring
- **Viva Simulator**: Oral exam practice with multiple difficulty modes
- **Notes Generator**: Concise and detailed notes from lectures
- **Flashcard Generator**: Spaced repetition-ready flashcards
- **Study Planner**: Intelligent daily study schedules
- **Assignment Assistant**: Task breakdown and workflow guidance

### Student Utilities
- CGPA/GPA Calculator
- Attendance Tracker
- Grade Predictor
- Pomodoro Timer
- Word/Character Counter
- Citation Helper

### Platform Features
- Authentication (Email/Password + OAuth)
- Multi-university support
- Study groups
- Progress analytics
- Gamification (achievements, streaks)
- Referral system
- Free/Pro subscription tiers
- Admin dashboard

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS
- React Router
- TanStack Query
- Lucide Icons
- Recharts

### Backend
- Node.js + TypeScript
- Express
- Prisma ORM
- PostgreSQL + pgvector
- JWT Authentication
- Multer (file uploads)
- Winston (logging)

### AI & Processing
- Configurable AI providers
- Document parsing (pdf-parse, mammoth, pptx-parser)
- Tesseract OCR
- Vector embeddings

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ with pgvector extension
- npm or yarn

### Environment Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd examforge
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your credentials:
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/examforge"

# Authentication
AUTH_SECRET="your-secret-key-here"

# AI Provider (OpenAI-compatible)
AI_PROVIDER_API_KEY="sk-..."
AI_PROVIDER_BASE_URL="https://api.openai.com/v1"
AI_MODEL="gpt-4o-mini"

# Storage
STORAGE_PATH="./uploads"
MAX_FILE_SIZE=52428800

# App
APP_URL="http://localhost:5173"
API_URL="http://localhost:3000"
NODE_ENV="development"
```

4. Set up database:
```bash
npm run db:migrate
npm run db:seed
```

5. Start development servers:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- API: http://localhost:3000

## Project Structure

```
examforge/
├── apps/
│   ├── web/           # React frontend
│   └── api/           # Express backend
├── packages/
│   ├── ui/            # Shared UI components
│   └── config/        # Shared configuration
├── prisma/
│   └── schema.prisma  # Database schema
└── uploads/           # File storage
```

## Database Schema

Core entities:
- Users & Profiles
- Universities, Programs, Semesters
- Courses & Enrollments
- Documents & Chunks
- Topics & Subtopics
- Past Papers & Questions
- Quizzes & Exams
- Viva Sessions
- Flashcards
- Study Plans
- Groups & Memberships
- Subscriptions & Usage
- Referrals & Achievements

## API Architecture

### Authentication
- JWT-based sessions
- Refresh token rotation
- Protected routes middleware

### File Processing Pipeline
1. Upload → MIME validation
2. Text extraction (PDF/DOCX/PPTX)
3. OCR for scanned documents
4. Chunking & embedding
5. Topic extraction
6. Knowledge base indexing

### AI Provider Interface
```typescript
interface AIProvider {
  analyzeDocument(content: string): Promise<DocumentAnalysis>;
  extractTopics(chunks: Chunk[]): Promise<Topic[]>;
  answerQuestion(query: string, context: string[]): Promise<AIResponse>;
  generateQuestions(topic: Topic, count: number): Promise<Question[]>;
  gradeAnswer(answer: string, rubric: Rubric): Promise<Grade>;
  // ... more methods
}
```

## Security

- Password hashing (bcrypt)
- JWT with refresh tokens
- Rate limiting
- CORS configuration
- File type validation
- Path traversal prevention
- SQL injection protection (Prisma)
- XSS prevention
- CSRF protection

## Deployment

### Deploy to Render + Neon (Recommended Free Stack)

This guide shows you how to deploy ExamForge for free using Render for hosting and Neon for the database.

#### Prerequisites

1. **GitHub Account** - Your code should be pushed to a GitHub repository
2. **Render Account** - Sign up at [render.com](https://render.com)
3. **Neon Account** - Sign up at [neon.tech](https://neon.tech) for a free PostgreSQL database
4. **OpenAI API Key** (or compatible AI provider) - Get one at [platform.openai.com](https://platform.openai.com)

#### Step 1: Set Up Neon Database

1. Go to [neon.tech](https://neon.tech) and create a free account
2. Create a new project named `examforge`
3. Copy the connection string (it looks like `postgresql://user:password@host/neondb`)
4. In the Neon dashboard, run this SQL to enable pgvector:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

#### Step 2: Push Code to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/examforge.git
git push -u origin main
```

#### Step 3: Deploy to Render

**Option A: Using render.yaml (Recommended)**

1. Make sure your `render.yaml` file is committed to your repository
2. Log in to [Render Dashboard](https://dashboard.render.com)
3. Click **New +** → **Blueprint**
4. Connect your GitHub repository
5. Select the `main` branch
6. Click **Apply**

Render will automatically:
- Create a PostgreSQL database (or use your Neon connection string if you modified render.yaml)
- Deploy the backend API service
- Deploy the frontend static site
- Configure environment variables

**Option B: Manual Setup**

If you prefer manual setup or want to use Neon instead of Render's database:

1. **Create the Backend Service:**
   - Go to Dashboard → New + → Web Service
   - Connect your GitHub repository
   - Configure:
     - **Name:** `examforge-api`
     - **Region:** Choose closest to your users
     - **Branch:** `main`
     - **Root Directory:** Leave blank
     - **Runtime:** `Node`
     - **Build Command:** `cd apps/api && npm install && npm run build`
     - **Start Command:** `cd apps/api && npm run start`
     - **Instance Type:** Free
   - Add Environment Variables (see below)
   - Add Disk:
     - Name: `uploads`
     - Mount Path: `/opt/render/project/src/uploads`
     - Size: 1 GB
   - Health Check Path: `/api/health`

2. **Create the Frontend Service:**
   - Go to Dashboard → New + → Static Site
   - Connect your GitHub repository
   - Configure:
     - **Name:** `examforge-web`
     - **Branch:** `main`
     - **Build Command:** `cd apps/web && npm install && npm run build`
     - **Publish Directory:** `apps/web/dist`
   - Add Environment Variable:
     - `VITE_API_URL`: Your backend URL (e.g., `https://examforge-api.onrender.com`)

3. **Set Environment Variables:**

For the backend service, add these environment variables:

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | Your Neon connection string |
| `AUTH_SECRET` | Generate a random 32+ character string |
| `AI_PROVIDER_API_KEY` | Your OpenAI API key |
| `AI_PROVIDER_BASE_URL` | `https://api.openai.com/v1` |
| `AI_MODEL` | `gpt-4o-mini` |
| `AI_EMBEDDING_MODEL` | `text-embedding-3-small` |
| `STORAGE_TYPE` | `local` |
| `STORAGE_PATH` | `/opt/render/project/src/uploads` |
| `APP_URL` | Your frontend URL (e.g., `https://examforge-web.onrender.com`) |
| `API_URL` | Your backend URL (e.g., `https://examforge-api.onrender.com`) |
| `CORS_ORIGINS` | Same as APP_URL |
| `ENABLE_OCR` | `true` |
| `ENABLE_VECTOR_SEARCH` | `true` |

#### Step 4: Run Database Migrations

After deployment, you need to run migrations:

**Option A: Via Render Dashboard**
1. Go to your backend service
2. Click **Shell** tab
3. Run: `cd apps/api && npx prisma migrate deploy`
4. Run: `cd apps/api && npm run db:seed` (optional, for demo data)

**Option B: Locally**
```bash
# Set your DATABASE_URL to the production Neon URL
export DATABASE_URL="your-neon-connection-string"
cd apps/api
npx prisma migrate deploy
npm run db:seed
```

#### Step 5: Verify Deployment

1. Visit your frontend URL (e.g., `https://examforge-web.onrender.com`)
2. Check the health endpoint: `https://examforge-api.onrender.com/api/health`
3. You should see: `{"status": "healthy", "database": "connected", ...}`

### Alternative Hosting Options

#### Vercel (Frontend) + Render (Backend) + Neon (Database)

For better CDN performance:

1. **Frontend on Vercel:**
   ```bash
   cd apps/web
   npm install
   npm run build
   # Deploy to Vercel
   vercel deploy
   ```

2. **Backend on Render:** Follow Step 3 above

3. **Database on Neon:** Follow Step 1 above

#### Railway

Railway offers an alternative with generous free tier:

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. Create new project from GitHub
4. Add PostgreSQL plugin
5. Configure environment variables
6. Deploy

### Production Checklist

- [ ] Database migrated successfully
- [ ] Health check returns healthy status
- [ ] Environment variables configured correctly
- [ ] AI provider API key set
- [ ] CORS origins include frontend URL
- [ ] File upload disk mounted (backend)
- [ ] HTTPS enabled (automatic on Render)
- [ ] Admin account created (check logs for initial setup)
- [ ] Test authentication flow
- [ ] Test file upload functionality
- [ ] Monitor logs for errors

### Scaling Considerations

When your app grows:

1. **Upgrade Database:** Move from free Neon to paid plan for more storage
2. **Upgrade Render Services:** Move from free to paid plans for more resources
3. **Add CDN:** Use Cloudflare for additional caching
4. **File Storage:** Migrate from local storage to S3/Cloudflare R2
5. **Background Jobs:** Add Redis for job queues
6. **Monitoring:** Add Sentry, LogRocket, or similar tools

## Testing

```bash
# Run tests
npm test

# Test coverage
npm run test:coverage
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make changes
4. Add tests
5. Submit pull request

## License

Proprietary - All rights reserved

## Support

For issues and feature requests, please use the project's issue tracker.

---

Built with ❤️ for students worldwide.
