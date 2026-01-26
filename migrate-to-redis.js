import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

const migrateFile = async (filePath, redisKey) => {
  if (fs.existsSync(filePath)) {
    console.log(`Migrating ${path.basename(filePath)} to Redis key "${redisKey}"...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    await redis.set(redisKey, data);
    console.log(`Successfully migrated ${path.basename(filePath)}.`);
  } else {
    console.log(`File ${path.basename(filePath)} not found, skipping.`);
  }
};

const runMigration = async () => {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    console.error('Error: UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set in .env');
    return;
  }

  try {
    await migrateFile(path.join(__dirname, 'server', 'auth.json'), 'admin_auth');
    await migrateFile(path.join(__dirname, 'server', 'guests.json'), 'guests_auth');
    await migrateFile(path.join(__dirname, 'server', 'guest_metadata.json'), 'guest_metadata');
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  }
};

runMigration();
