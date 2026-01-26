import express from 'express';
import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client, ListObjectsV2Command, DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Redis } from '@upstash/redis';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import dotenv from 'dotenv';
import Stripe from 'stripe';

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const app = express();
const PORT = process.env.PORT || 5000;

// Upstash Redis Client
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Tigris / S3 Client
const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.TIGRIS_ENDPOINT,
  forcePathStyle: true, // Tigris usually prefers path-style for the SDK
  credentials: {
    accessKeyId: process.env.TIGRIS_ACCESS_KEY_ID,
    secretAccessKey: process.env.TIGRIS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.TIGRIS_BUCKET;

// Cache Keys
const CACHE_KEYS = {
  ADMIN_IMAGES: 'cache:admin_images',
  GUEST_IMAGES: 'cache:guest_images',
};
const CACHE_TTL = 3600; // 1 hour in seconds

// Middleware
app.use(cors());
app.use(express.json());

// Multer S3 Storage Configuration
const createS3Storage = (folder) => multerS3({
  s3: s3,
  bucket: BUCKET_NAME,
  acl: 'public-read', // Ensure files are public
  metadata: (req, file, cb) => {
    cb(null, { fieldName: file.fieldname });
  },
  key: (req, file, cb) => {
    const parts = file.originalname.split('.');
    const ext = parts.length > 1 ? parts.pop().toLowerCase() : 'jpg';
    cb(null, `${folder}/${uuidv4()}.${ext}`);
  }
});

const adminUpload = multer({ storage: createS3Storage('uploads') });
const guestUpload = multer({ storage: createS3Storage('guest_uploads') });

// Helpers for Redis
const getData = async (key) => {
  try {
    const data = await redis.get(key);
    if (data) return data;
    if (key === 'guest_passwords') return [];
    return key.includes('auth') ? { users: [] } : { images: [] };
  } catch (error) {
    console.error(`Redis get error (${key}):`, error);
    if (key === 'guest_passwords') return [];
    return key.includes('auth') ? { users: [] } : { images: [] };
  }
};

// One-time cleanup script for legacy key (will run on server start/reload)
const cleanupLegacyKeys = async () => {
  try {
    const legacy = await redis.get('guests_auth');
    if (legacy) {
      console.log('Detected legacy guests_auth key. Migrating to guest_passwords...');
      const passwords = await redis.get('guest_passwords') || [];
      const newPasswords = [...new Set([...passwords, ...legacy.users.map(u => u.password)])].filter(Boolean);
      await redis.set('guest_passwords', newPasswords);
      await redis.del('guests_auth');
      console.log('Migration and cleanup complete.');
    }
  } catch (err) {
    console.error('Cleanup error:', err);
  }
};
cleanupLegacyKeys();

const saveData = async (key, data) => {
  try {
    await redis.set(key, data);
  } catch (error) {
    console.error(`Redis set error (${key}):`, error);
  }
};

// --- Routes ---

// Helper to get public URL
const getPublicUrl = (key) => {
  // If endpoint is t3.storage.dev, use subdomain style for public URLs
  if (process.env.TIGRIS_ENDPOINT.includes('t3.storage.dev')) {
    return `https://${BUCKET_NAME}.t3.storage.dev/${key}`;
  }
  // Fallback to path style
  return `${process.env.TIGRIS_ENDPOINT}/${BUCKET_NAME}/${key}`;
};

// Admin Image Routes
app.get('/api/images', async (req, res) => {
  try {
    // Check Cache
    const cached = await redis.get(CACHE_KEYS.ADMIN_IMAGES);
    if (cached) return res.json(cached);

    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'uploads/',
    });
    const { Contents } = await s3.send(command);
    const imageUrls = (Contents || [])
      .filter(item => item.Key !== 'uploads/')
      .map(item => getPublicUrl(item.Key));
    
    // Set Cache
    await redis.set(CACHE_KEYS.ADMIN_IMAGES, imageUrls, { ex: CACHE_TTL });
    
    res.json(imageUrls);
  } catch (error) {
    console.error('S3 List error:', error);
    res.status(500).json({ error: 'Failed to list images' });
  }
});

app.post('/api/upload', adminUpload.array('images'), async (req, res) => {
  const imageUrls = req.files.map(file => file.location);
  // Clear Cache
  await redis.del(CACHE_KEYS.ADMIN_IMAGES);
  res.json({ message: 'Upload successful', images: imageUrls });
});

// Guest Image Routes
app.get('/api/guest-images', async (req, res) => {
  try {
    // Check Cache
    const cached = await redis.get(CACHE_KEYS.GUEST_IMAGES);
    if (cached) return res.json(cached);

    const meta = await getData('guest_metadata');
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: 'guest_uploads/',
    });
    const { Contents } = await s3.send(command);
    
    const guestImages = (Contents || [])
      .filter(item => item.Key !== 'guest_uploads/')
      .map(item => {
        const filename = item.Key.split('/').pop();
        const metadata = meta.images.find(m => m.filename === filename);
        return {
          url: getPublicUrl(item.Key),
          filename: filename,
          owner: metadata ? metadata.owner : 'unknown'
        };
      });

    // Set Cache
    await redis.set(CACHE_KEYS.GUEST_IMAGES, guestImages, { ex: CACHE_TTL });

    res.json(guestImages);
  } catch (error) {
    console.error('S3 List error:', error);
    res.status(500).json({ error: 'Failed to list guest images' });
  }
});

app.post('/api/guest-upload', guestUpload.array('images'), async (req, res) => {
  const { owner } = req.body;
  const meta = await getData('guest_metadata');
  
  const newImages = req.files.map(file => {
    const filename = file.key.split('/').pop();
    meta.images.push({ filename: filename, owner: owner || 'anonymous' });
    return {
      url: file.location,
      filename: filename,
      owner: owner || 'anonymous'
    };
  });
  
  await saveData('guest_metadata', meta);
  // Clear Cache
  await redis.del(CACHE_KEYS.GUEST_IMAGES);
  res.json({ message: 'Upload successful', images: newImages });
});

// Direct-to-S3 (Tigris) Presigned URL Generation
app.post('/api/generate-presigned-url', async (req, res) => {
  const { filename, contentType } = req.body;
  if (!filename) return res.status(400).json({ error: 'Filename is required' });

  const ext = filename.split('.').pop().toLowerCase();
  const key = `guest_uploads/${uuidv4()}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType || 'image/jpeg',
      ACL: 'public-read',
    });

    const url = await getSignedUrl(s3, command, { expiresIn: 3600 });
    res.json({ uploadUrl: url, key: key, publicUrl: getPublicUrl(key) });
  } catch (error) {
    console.error('Presigned URL error:', error);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// Finalize Guest Upload after Direct-to-S3
app.post('/api/finalize-guest-upload', async (req, res) => {
  const { key, owner } = req.body;
  if (!key) return res.status(400).json({ error: 'Key is required' });

  try {
    const meta = await getData('guest_metadata');
    const filename = key.split('/').pop();
    
    const newImage = { 
      filename: filename, 
      owner: owner || 'anonymous' 
    };
    
    meta.images.push(newImage);
    await saveData('guest_metadata', meta);
    await redis.del(CACHE_KEYS.GUEST_IMAGES);

    res.json({ 
      success: true, 
      image: {
        url: getPublicUrl(key),
        filename: filename,
        owner: newImage.owner
      }
    });
  } catch (error) {
    console.error('Finalize upload error:', error);
    res.status(500).json({ error: 'Failed to finalize upload' });
  }
});

app.delete('/api/images/:type/:filename', async (req, res) => {
  const { type, filename } = req.params;
  const prefix = type === 'guest' ? 'guest_uploads' : 'uploads';
  const key = `${prefix}/${filename}`;

  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });
    await s3.send(command);

    if (type === 'guest') {
      const meta = await getData('guest_metadata');
      if (meta && Array.isArray(meta.images)) {
        meta.images = meta.images.filter(m => m.filename !== filename);
        await saveData('guest_metadata', meta);
      }
      await redis.del(CACHE_KEYS.GUEST_IMAGES);
    } else {
      await redis.del(CACHE_KEYS.ADMIN_IMAGES);
    }
    
    res.json({ message: 'Deleted successfully' });
  } catch (error) {
    console.error('S3 Delete error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// Guest User (Password) Management Routes
app.get('/api/users', async (req, res) => {
  const data = await getData('guest_passwords');
  const list = Array.isArray(data) ? data : [];
  // Sanitize: ensure we only return strings. If legacy objects exist, extract the password.
  const sanitized = list.map(item => (item && typeof item === 'object') ? (item.password || item.username) : item).filter(Boolean);
  res.json(sanitized);
});

app.post('/api/users', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  const passwords = await getData('guest_passwords');
  const list = Array.isArray(passwords) ? passwords : [];
  if (list.includes(password)) return res.status(400).json({ error: 'Password already exists' });
  list.push(password);
  await saveData('guest_passwords', list);
  res.json({ message: 'Guest password added successfully' });
});

app.post('/api/users/delete', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password is required' });
  const passwords = await getData('guest_passwords');
  const list = Array.isArray(passwords) ? passwords : [];
  const initialLength = list.length;
  const newList = list.filter(p => p !== password);
  if (newList.length === initialLength) return res.status(404).json({ error: 'Password not found' });
  await saveData('guest_passwords', newList);
  res.json({ message: 'Guest password deleted successfully' });
});

// Login Route
app.post('/api/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (role === 'admin') {
    const adminData = await getData('admin_auth');
    const user = adminData.users.find(u => u.username === username && u.password === password);
    if (user) return res.json({ success: true, user: { username: user.username, role: 'admin' } });
  } else {
    // Guest validation: password must exist in guest_passwords list
    const passwords = await getData('guest_passwords');
    const list = Array.isArray(passwords) ? passwords : [];
    if (list.includes(password)) {
      return res.json({ success: true, user: { username: username || 'Guest', role: 'guest' } });
    }
    
    // Fallback: check admin for guest role login (original logic)
    const adminData = await getData('admin_auth');
    const admin = adminData.users.find(u => u.username === username && u.password === password);
    if (admin) return res.json({ success: true, user: { username: admin.username, role: 'admin' } });
  }
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

// Stripe Donation Checkout Route
app.post('/api/create-checkout-session', async (req, res) => {
  const { amount } = req.body;

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Donation to El Seibo Mission',
              description: 'Your generous contribution helps our medical mission efforts in the Dominican Republic.',
            },
            unit_amount: amount * 100, // Cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${req.headers.origin}/?success=true`,
      cancel_url: `${req.headers.origin}/?canceled=true`,
    });

    res.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe Session Error:', error);
    if (error.type === 'StripeAuthenticationError') {
      res.status(401).json({ error: 'Invalid Stripe API keys configured on server.' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Only listen if not running as a serverless function (e.g., on Vercel)
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

export default app;
