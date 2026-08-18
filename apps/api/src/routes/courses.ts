import { Router } from 'express';
import prisma from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { z } from 'zod';
import { logger } from '../config/logger.js';

const router = Router();

// Validation schemas
const createCourseSchema = z.object({
  name: z.string().min(2, 'Course name is required'),
  code: z.string().min(1, 'Course code is required'),
  description: z.string().optional(),
  instructor: z.string().optional(),
  examDate: z.string().optional(),
  totalMarks: z.number().optional(),
  confidence: z.number().min(0).max(100).default(50),
});

// GET /api/courses - List user's courses
router.get('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const enrollments = await prisma.enrollment.findMany({
      where: { userId: req.user!.id },
      include: {
        course: {
          include: {
            topics: {
              select: {
                id: true,
                name: true,
                priorityScore: true,
                priorityLabel: true,
              },
            },
            documents: {
              select: {
                id: true,
                originalName: true,
                category: true,
                status: true,
              },
            },
            _count: {
              select: {
                pastPapers: true,
                quizSessions: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const courses = enrollments.map(e => ({
      enrollmentId: e.id,
      ...e.course,
      confidence: e.confidence,
      readinessScore: e.readinessScore,
      topicCount: e.course.topics.length,
      documentCount: e.course.documents.length,
      pastPaperCount: e.course._count.pastPapers,
      quizCount: e.course._count.quizSessions,
    }));

    res.json({ courses });
  } catch (error) {
    logger.error('Error fetching courses:', error);
    throw error;
  }
});

// POST /api/courses - Create a new course
router.post('/', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, code, description, instructor, examDate, totalMarks, confidence } = 
      createCourseSchema.parse(req.body);

    // Check if user has reached course limit
    const existingCourses = await prisma.enrollment.count({
      where: { userId: req.user!.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      select: { plan: true, isFoundingStudent: true },
    });

    const maxCourses = user?.isFoundingStudent ? 999 : (user?.plan === 'PRO' ? 999 : 3);

    if (existingCourses >= maxCourses) {
      res.status(403).json({ 
        error: `Course limit reached. Upgrade to Pro for unlimited courses.` 
      });
      return;
    }

    // Check if course code already exists for this user
    const existingEnrollment = await prisma.enrollment.findFirst({
      where: {
        userId: req.user!.id,
        course: {
          code: code.toUpperCase(),
        },
      },
      include: { course: true },
    });

    if (existingEnrollment) {
      res.status(400).json({ error: 'You already have a course with this code' });
      return;
    }

    // Create course and enrollment
    const course = await prisma.course.create({
      data: {
        name,
        code: code.toUpperCase(),
        description,
        instructor,
        examDate: examDate ? new Date(examDate) : null,
        totalMarks,
        enrollments: {
          create: {
            userId: req.user!.id,
            confidence,
          },
        },
      },
      include: {
        enrollments: {
          where: { userId: req.user!.id },
        },
      },
    });

    logger.info(`Course created: ${course.name} (${course.code}) by user ${req.user!.id}`);

    res.status(201).json({
      message: 'Course created successfully',
      course: {
        id: course.id,
        name: course.name,
        code: course.code,
        description: course.description,
        instructor: course.instructor,
        examDate: course.examDate,
        totalMarks: course.totalMarks,
        confidence: course.enrollments[0].confidence,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    logger.error('Error creating course:', error);
    throw error;
  }
});

// GET /api/courses/:courseId - Get course details
router.get('/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;

    // Verify user owns this course
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId: req.user!.id,
        courseId,
      },
      include: {
        course: {
          include: {
            topics: {
              orderBy: { priorityScore: 'desc' },
              include: {
                subtopics_rel: true,
              },
            },
            documents: {
              orderBy: { createdAt: 'desc' },
            },
            pastPapers: {
              include: {
                questions: {
                  select: {
                    id: true,
                    text: true,
                    type: true,
                    marks: true,
                    frequency: true,
                  },
                },
              },
            },
            quizSessions: {
              select: {
                id: true,
                score: true,
                startedAt: true,
              },
              orderBy: { startedAt: 'desc' },
              take: 5,
            },
            examSessions: {
              select: {
                id: true,
                score: true,
                startedAt: true,
              },
              orderBy: { startedAt: 'desc' },
              take: 5,
            },
            flashcardSets: true,
            studyPlans: {
              where: { endDate: { gte: new Date() } },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    res.json({
      enrollment: {
        id: enrollment.id,
        confidence: enrollment.confidence,
        readinessScore: enrollment.readinessScore,
        readinessBreakdown: enrollment.readinessBreakdown,
      },
      course: enrollment.course,
    });
  } catch (error) {
    logger.error('Error fetching course details:', error);
    throw error;
  }
});

// PATCH /api/courses/:courseId - Update course
router.patch('/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;
    const { name, description, instructor, examDate, totalMarks, confidence } = req.body;

    // Verify ownership
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: req.user!.id, courseId },
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    const updateData: any = {};
    const enrollmentUpdate: any = {};

    if (name !== undefined) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (instructor !== undefined) updateData.instructor = instructor;
    if (examDate !== undefined) updateData.examDate = examDate ? new Date(examDate) : null;
    if (totalMarks !== undefined) updateData.totalMarks = totalMarks;
    if (confidence !== undefined) enrollmentUpdate.confidence = confidence;

    const [course] = await Promise.all([
      prisma.course.update({
        where: { id: courseId },
        data: updateData,
      }),
      Object.keys(enrollmentUpdate).length > 0
        ? prisma.enrollment.update({
            where: { id: enrollment.id },
            data: enrollmentUpdate,
          })
        : Promise.resolve(null),
    ]);

    res.json({
      message: 'Course updated successfully',
      course,
    });
  } catch (error) {
    logger.error('Error updating course:', error);
    throw error;
  }
});

// DELETE /api/courses/:courseId - Delete course
router.delete('/:courseId', authenticate, async (req: AuthRequest, res) => {
  try {
    const { courseId } = req.params;

    // Verify ownership
    const enrollment = await prisma.enrollment.findFirst({
      where: { userId: req.user!.id, courseId },
    });

    if (!enrollment) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Delete enrollment (cascade will handle related data)
    await prisma.enrollment.delete({
      where: { id: enrollment.id },
    });

    logger.info(`Course deleted: ${courseId} by user ${req.user!.id}`);

    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    logger.error('Error deleting course:', error);
    throw error;
  }
});

export default router;
