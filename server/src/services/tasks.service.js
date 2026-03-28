import { v4 as uuidv4 } from 'uuid';
import * as tasksDb from '../db/queries/tasks.js';
import * as users from '../db/queries/users.js';
import { create as createNotification } from './notifications.service.js';

const KID_TRANSITIONS = {
  todo: ['in_progress'],
  in_progress: ['done'],
  done: [],
  approved: [],
  archived: [],
};

export function create(io, { familyId, kidUserId, title, description, dueDate, createdByParentId }) {
  const id = uuidv4();
  const task = tasksDb.create({
    id,
    family_id: familyId,
    kid_user_id: kidUserId,
    title,
    description: description || null,
    due_date: dueDate,
    status: 'todo',
    created_by_parent_id: createdByParentId ?? null,
  });
  if (io) {
    io.to(`family:${familyId}`).emit('task:created', task);
  }
  return task;
}

function enrichTaskWithCreator(task) {
  const creator = task.created_by_parent_id ? users.getById(task.created_by_parent_id) : null;
  return { ...task, createdByParentName: creator?.name ?? null };
}

export function list({ familyId, userId, role, kidId, status }) {
  let list;
  if (role === 'kid') {
    list = tasksDb.list({ familyId, kidId: userId, status });
  } else {
    list = tasksDb.list({ familyId, kidId: kidId || undefined, status });
  }
  return list.map(enrichTaskWithCreator);
}

export function getById(taskId) {
  const task = tasksDb.getById(taskId);
  return task ? enrichTaskWithCreator(task) : null;
}

export function update(io, taskId, actor, fields) {
  const task = tasksDb.getById(taskId);
  if (!task) return null;
  const updated = tasksDb.update(taskId, fields);
  if (io) {
    io.to(`family:${task.family_id}`).emit('task:updated', updated);
  }
  return updated;
}

export function updateStatus(io, taskId, actor, newStatus, createNotif) {
  const task = tasksDb.getById(taskId);
  if (!task) return null;
  const fromStatus = task.status;
  const allowedKid = KID_TRANSITIONS[fromStatus]?.includes(newStatus);
  const isParent = actor.role === 'parent';
  if (!isParent && !allowedKid) {
    const err = new Error('Invalid status transition');
    err.status = 400;
    throw err;
  }
  const updates = { status: newStatus };
  if (newStatus === 'done') {
    updates.completed_at = new Date().toISOString();
  }
  if (newStatus === 'approved') {
    updates.approved_at = new Date().toISOString();
  }
  const updated = tasksDb.update(taskId, updates);
  tasksDb.insertActivity({
    id: uuidv4(),
    task_id: taskId,
    actor_user_id: actor.id,
    action: 'STATUS_CHANGE',
    from_status: fromStatus,
    to_status: newStatus,
  });
  if (io) {
    io.to(`family:${task.family_id}`).emit('task:status_changed', {
      taskId,
      from: fromStatus,
      to: newStatus,
      task: updated,
    });
  }
  if (newStatus === 'done' && createNotif && io) {
    const parents = getParentsForFamily(task.family_id);
    for (const p of parents) {
      createNotification(io, {
        familyId: task.family_id,
        userId: p.id,
        type: 'TASK_DONE',
        payload: { taskId, task: updated },
      });
    }
  }
  return updated;
}

export function deleteTask(io, taskId, familyId) {
  const task = tasksDb.getById(taskId);
  if (!task) return null;
  if (task.family_id !== familyId) return null;
  tasksDb.deleteById(taskId);
  if (io) {
    io.to(`family:${familyId}`).emit('task:deleted', { taskId });
  }
  return { deleted: true };
}

function getParentsForFamily(familyId) {
  const list = users.listByFamily(familyId);
  return list.filter((u) => u.role === 'parent');
}
