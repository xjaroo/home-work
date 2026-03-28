import 'dotenv/config';
import { v4 as uuidv4 } from 'uuid';
import { hashSync } from '../lib/bcrypt.js';
import { migrate } from './migrate.js';
import * as families from './queries/families.js';
import * as users from './queries/users.js';
import * as tasks from './queries/tasks.js';
import * as money from './queries/money.js';

const SALT_ROUNDS = 10;

async function seed() {
  await migrate();

  const existingParent = users.getByEmail('parent@demo.local');
  if (existingParent && !users.getByEmail('admin@demo.local')) {
    const adminId = uuidv4();
    const adminHash = hashSync('admin123', SALT_ROUNDS);
    users.create({
      id: adminId,
      family_id: existingParent.family_id,
      role: 'parent',
      name: 'Demo Admin',
      email: 'admin@demo.local',
      password_hash: adminHash,
      is_admin: 1,
    });
    console.log('Added demo admin: admin@demo.local / admin123');
  }

  if (existingParent) {
    console.log('Seed already applied (parent@demo.local exists). Skipping.');
    return;
  }

  const familyId = uuidv4();
  families.create(familyId, 'Demo Family');

  const parentId = uuidv4();
  const parentHash = hashSync('parent123', SALT_ROUNDS);
  users.create({
    id: parentId,
    family_id: familyId,
    role: 'parent',
    name: 'Demo Parent',
    email: 'parent@demo.local',
    password_hash: parentHash,
  });

  if (!users.getByEmail('admin@demo.local')) {
    const adminId = uuidv4();
    const adminHash = hashSync('admin123', SALT_ROUNDS);
    users.create({
      id: adminId,
      family_id: familyId,
      role: 'parent',
      name: 'Demo Admin',
      email: 'admin@demo.local',
      password_hash: adminHash,
      is_admin: 1,
    });
  }

  const kidHash = hashSync('kid123', SALT_ROUNDS);
  const kidSpecs = [
    ['Alex', uuidv4()],
    ['Sam', uuidv4()],
    ['Jordan', uuidv4()],
  ];
  const kidIds = [];
  for (const [name, id] of kidSpecs) {
    const email = `${name.toLowerCase()}@demo.local`;
    const existingKid = users.getByEmail(email);
    if (existingKid) {
      kidIds.push(existingKid.id);
      continue;
    }
    users.create({
      id,
      family_id: familyId,
      role: 'kid',
      name,
      email,
      password_hash: kidHash,
    });
    kidIds.push(id);
  }
  const [kid1Id, kid2Id, kid3Id] = kidIds;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const tomorrow = new Date(now.getTime() + 86400000).toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  tasks.create({
    id: uuidv4(),
    family_id: familyId,
    kid_user_id: kid1Id,
    title: 'Math worksheet',
    description: 'Pages 1-5',
    due_date: today,
    status: 'todo',
    created_by_parent_id: parentId,
  });
  tasks.create({
    id: uuidv4(),
    family_id: familyId,
    kid_user_id: kid1Id,
    title: 'Reading log',
    due_date: tomorrow,
    status: 'in_progress',
    created_by_parent_id: parentId,
  });
  tasks.create({
    id: uuidv4(),
    family_id: familyId,
    kid_user_id: kid2Id,
    title: 'Science project',
    due_date: yesterday,
    status: 'done',
    created_by_parent_id: parentId,
  });

  money.create({
    id: uuidv4(),
    family_id: familyId,
    kid_user_id: kid1Id,
    type: 'allowance',
    amount_cents: 500,
    note: 'Weekly allowance',
    status: 'approved',
    created_by_user_id: parentId,
  });
  money.create({
    id: uuidv4(),
    family_id: familyId,
    kid_user_id: kid2Id,
    type: 'allowance',
    amount_cents: 500,
    note: 'Weekly allowance',
    status: 'approved',
    created_by_user_id: parentId,
  });

  console.log(
    'Seed complete. Parent: parent@demo.local / parent123. Admin: admin@demo.local / admin123. Kids: alex@demo.local, sam@demo.local, jordan@demo.local / kid123'
  );
}

seed().then(() => process.exit(0)).catch((err) => {
  console.error(err);
  process.exit(1);
});
