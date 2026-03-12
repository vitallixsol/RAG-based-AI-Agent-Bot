/**
 * db/seed.ts  — npm run db:seed
 * Creates the default AppConfig document if it doesn't exist.
 */
import dotenv from 'dotenv';
dotenv.config();

import { connectDB, disconnectDB } from './connection';
import { AppConfigModel } from './models';

async function seed() {
  await connectDB();
  const existing = await AppConfigModel.findOne();
  if (!existing) {
    await AppConfigModel.create({});
    console.log('✅ Default config seeded');
  } else {
    console.log('ℹ️  Config already exists — skipping seed');
  }
  await disconnectDB();
}

seed().catch(err => { console.error(err); process.exit(1); });
