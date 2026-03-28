import { withTransaction } from '../sqlite.js';

/**
 * Hard-delete a user row and dependent data. Caller must ensure the user is already soft-deleted
 * and that business rules (no self-delete, etc.) are enforced.
 */
export function permanentDeleteUserRecords(userId) {
  withTransaction((run) => {
    run(
      `DELETE FROM task_activity WHERE task_id IN (
         SELECT id FROM tasks WHERE kid_user_id = ? OR created_by_parent_id = ?
       )`,
      [userId, userId]
    );
    run('DELETE FROM tasks WHERE kid_user_id = ? OR created_by_parent_id = ?', [userId, userId]);
    run('DELETE FROM task_activity WHERE actor_user_id = ?', [userId]);
    run('DELETE FROM notifications WHERE user_id = ?', [userId]);
    run('DELETE FROM messages WHERE kid_user_id = ? OR sender_user_id = ?', [userId, userId]);
    run(
      'UPDATE money_transactions SET decided_by_parent_id = NULL, decided_at = NULL WHERE decided_by_parent_id = ?',
      [userId]
    );
    run(
      'DELETE FROM money_transactions WHERE kid_user_id = ? OR created_by_user_id = ?',
      [userId, userId]
    );
    run('DELETE FROM parent_invites WHERE invited_by_user_id = ?', [userId]);
    run('DELETE FROM parent_chat_messages WHERE sender_user_id = ?', [userId]);
    run('DELETE FROM users WHERE id = ?', [userId]);
  });
}
