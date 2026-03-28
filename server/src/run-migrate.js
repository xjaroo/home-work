import 'dotenv/config';
import { migrate } from './db/migrate.js';

migrate().then(() => {
  console.log('Migrations complete');
  process.exit(0);
}).catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
