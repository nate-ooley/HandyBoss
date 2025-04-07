import { Router } from 'express';
import { z } from 'zod';
import { validateRequest } from '../middleware/validation.middleware';
import { UserStorage } from '../storage/user.storage';
import { AuthenticationError, NotFoundError } from '../errors/api.error';

const router = Router();
const userStorage = new UserStorage();

// Validation schemas
const createUserSchema = z.object({
  body: z.object({
    username: z.string().min(3).max(50),
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().optional(),
    lastName: z.string().optional()
  })
});

const updateUserSchema = z.object({
  params: z.object({
    id: z.string().transform(Number)
  }),
  body: z.object({
    username: z.string().min(3).max(50).optional(),
    email: z.string().email().optional(),
    firstName: z.string().optional(),
    lastName: z.string().optional()
  }).partial()
});

// Routes
router.post(
  '/',
  validateRequest(createUserSchema),
  async (req, res, next) => {
    try {
      const user = await userStorage.createUser(req.body);
      res.status(201).json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.get(
  '/:id',
  async (req, res, next) => {
    try {
      const user = await userStorage.getUser(Number(req.params.id));
      if (!user) {
        throw new NotFoundError('User');
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.put(
  '/:id',
  validateRequest(updateUserSchema),
  async (req, res, next) => {
    try {
      const user = await userStorage.updateUser(Number(req.params.id), req.body);
      if (!user) {
        throw new NotFoundError('User');
      }
      res.json(user);
    } catch (error) {
      next(error);
    }
  }
);

router.delete(
  '/:id',
  async (req, res, next) => {
    try {
      const success = await userStorage.deleteUser(Number(req.params.id));
      if (!success) {
        throw new NotFoundError('User');
      }
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
);

export default router; 