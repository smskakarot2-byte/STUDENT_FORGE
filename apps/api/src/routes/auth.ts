import { Router } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import prisma from '../config/database.js';
import { config } from '../config/index.js';
import { authenticate } from '../middleware/auth.js';
import { AuthRequest } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { logger } from '../config/logger.js';

const router = Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

// Generate JWT token
const generateToken = (userId: string, email: string): string => {
  return jwt.sign({ userId, email }, config.authSecret, {
    expiresIn: config.jwtExpiresIn as string,
  });
};

// Generate refresh token
const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, config.authSecret, {
    expiresIn: config.refreshTokenExpiresIn as string,
  });
};

// POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res) => {
  try {
    const { email, password, name } = signupSchema.parse(req.body);

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      res.status(400).json({ error: 'Email already registered' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with profile
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        profile: {
          create: {},
        },
      },
      include: {
        profile: true,
      },
    });

    // Generate tokens
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`New user signed up: ${user.email}`);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    throw error;
  }
});

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        profile: true,
      },
    });

    if (!user || !user.password) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Check account status
    if (!user.isActive) {
      res.status(403).json({ error: 'Account is deactivated' });
      return;
    }

    if (user.isBanned) {
      res.status(403).json({ error: 'Account has been banned' });
      return;
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate tokens
    const token = generateToken(user.id, user.email);
    const refreshToken = generateRefreshToken(user.id);

    logger.info(`User logged in: ${user.email}`);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        plan: user.plan,
        isFoundingStudent: user.isFoundingStudent,
      },
      token,
      refreshToken,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: error.errors[0].message });
      return;
    }
    throw error;
  }
});

// POST /api/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: 'Refresh token required' });
      return;
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, config.authSecret) as { userId: string };

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, isActive: true },
    });

    if (!user || !user.isActive) {
      res.status(401).json({ error: 'User not found or inactive' });
      return;
    }

    // Generate new tokens
    const newToken = generateToken(user.id, user.email);
    const newRefreshToken = generateRefreshToken(user.id);

    res.json({
      token: newToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError || error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ error: 'Invalid refresh token' });
      return;
    }
    throw error;
  }
});

// GET /api/auth/me
router.get('/me', authenticate, async (req: AuthRequest, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.id },
      include: {
        profile: true,
        enrollments: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
        plan: user.plan,
        isFoundingStudent: user.isFoundingStudent,
        referralCode: user.referralCode,
      },
      profile: user.profile,
      courses: user.enrollments.map(e => ({
        id: e.course.id,
        name: e.course.name,
        code: e.course.code,
        examDate: e.course.examDate,
        confidence: e.confidence,
        readinessScore: e.readinessScore,
      })),
    });
  } catch (error) {
    logger.error('Error fetching user profile:', error);
    throw error;
  }
});

// PATCH /api/auth/profile
router.patch('/profile', authenticate, async (req: AuthRequest, res) => {
  try {
    const { name, profileImage, country, university, program, semester } = req.body;

    const updateData: any = {};

    if (name) updateData.name = name;
    if (profileImage) updateData.profileImage = profileImage;

    const profileData: any = {};
    if (country) profileData.country = country;
    if (university) profileData.university = university;
    if (program) profileData.program = program;
    if (semester) profileData.semester = semester;

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: updateData,
      include: {
        profile: {
          update: profileData,
        },
      },
    });

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        profileImage: user.profileImage,
      },
      profile: user.profile,
    });
  } catch (error) {
    logger.error('Error updating profile:', error);
    throw error;
  }
});

export default router;
