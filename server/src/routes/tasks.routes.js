import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireRole } from '../middleware/requireRole.js';
import { validate } from '../middleware/validate.js';
import * as tasksService from '../services/tasks.service.js';

const uuidSchema = z.string().uuid();

export function createTasksRouter(getIo) {
  const router = Router();
  const io = () => getIo ? getIo() : null;

  router.post(
    '/',
    requireAuth,
    requireRole('parent'),
    validate(z.object({
      kidId: uuidSchema,
      title: z.string().min(1).max(500),
      description: z.string().max(2000).optional(),
      dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    })),
    (req, res, next) => {
      const { kidId, title, description, dueDate } = req.valid;
      const user = req.user;
      const task = tasksService.create(io(), {
        familyId: user.family_id,
        kidUserId: kidId,
        title,
        description,
        dueDate,
        createdByParentId: user.id,
      });
      res.status(201).json(task);
    }
  );

  router.get(
    '/',
    requireAuth,
    validate(z.object({
      kidId: uuidSchema.optional(),
      status: z.enum(['todo', 'in_progress', 'done', 'approved', 'archived']).optional(),
    })),
    (req, res, next) => {
      const { kidId, status } = req.valid || {};
      const user = req.user;
      if (user.role === 'kid' && kidId && kidId !== user.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
      const list = tasksService.list({
        familyId: user.family_id,
        userId: user.id,
        role: user.role,
        kidId: user.role === 'parent' ? kidId : undefined,
        status,
      });
      res.json(list);
    }
  );

  router.get(
    '/:taskId',
    requireAuth,
    validate(z.object({ taskId: uuidSchema })),
    (req, res, next) => {
      const task = tasksService.getById(req.valid.taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      if (task.family_id !== req.user.family_id) return res.status(404).json({ error: 'Task not found' });
      if (req.user.role === 'kid' && task.kid_user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      res.json(task);
    }
  );

  router.patch(
    '/:taskId',
    requireAuth,
    requireRole('parent'),
    validate(z.object({
      taskId: uuidSchema,
      title: z.string().min(1).max(500).optional(),
      description: z.string().max(2000).optional(),
      dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    })),
    (req, res, next) => {
      const { taskId, ...rest } = req.valid;
      const fields = {};
      if (rest.title !== undefined) fields.title = rest.title;
      if (rest.description !== undefined) fields.description = rest.description;
      if (rest.dueDate !== undefined) fields.due_date = rest.dueDate;
      const task = tasksService.getById(taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      if (task.family_id !== req.user.family_id) return res.status(404).json({ error: 'Task not found' });
      const updated = tasksService.update(io(), taskId, req.user, fields);
      res.json(updated);
    }
  );

  router.patch(
    '/:taskId/status',
    requireAuth,
    validate(z.object({
      taskId: uuidSchema,
      status: z.enum(['todo', 'in_progress', 'done', 'approved', 'archived']),
    })),
    (req, res, next) => {
      const { taskId, status } = req.valid;
      const task = tasksService.getById(taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      if (task.family_id !== req.user.family_id) return res.status(404).json({ error: 'Task not found' });
      if (req.user.role === 'kid' && task.kid_user_id !== req.user.id) return res.status(403).json({ error: 'Forbidden' });
      try {
        const updated = tasksService.updateStatus(io(), taskId, req.user, status, true);
        res.json(updated);
      } catch (e) {
        next(e);
      }
    }
  );

  router.post(
    '/:taskId/archive',
    requireAuth,
    requireRole('parent'),
    validate(z.object({ taskId: uuidSchema })),
    (req, res, next) => {
      const { taskId } = req.valid;
      const task = tasksService.getById(taskId);
      if (!task) return res.status(404).json({ error: 'Task not found' });
      if (task.family_id !== req.user.family_id) return res.status(403).json({ error: 'Forbidden' });
      const updated = tasksService.update(io(), taskId, req.user, { status: 'archived' });
      res.json(updated);
    }
  );

  router.delete(
    '/:taskId',
    requireAuth,
    requireRole('parent'),
    validate(z.object({ taskId: uuidSchema })),
    (req, res, next) => {
      const { taskId } = req.valid;
      const result = tasksService.deleteTask(io(), taskId, req.user.family_id);
      if (!result) return res.status(404).json({ error: 'Task not found' });
      res.json(result);
    }
  );

  return router;
}
