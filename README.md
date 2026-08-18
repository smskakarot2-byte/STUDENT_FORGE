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

### Production Build
```bash
npm run build
```

### Environment Variables (Production)
- Set `NODE_ENV=production`
- Configure secure `AUTH_SECRET`
- Use production database URL
- Configure cloud storage (S3-compatible)
- Set up reverse proxy (nginx)

### Health Check
Endpoint: `GET /api/health`

Returns:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-01-01T00:00:00Z"
}
```

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
