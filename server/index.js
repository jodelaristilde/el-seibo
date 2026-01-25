import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/guest_uploads', express.static(path.join(__dirname, 'guest_uploads')));

// Files Configuration
const uploadsDir = path.join(__dirname, 'uploads');
const guestUploadsDir = path.join(__dirname, 'guest_uploads');
const adminAuthFile = path.join(__dirname, 'auth.json');
const guestsAuthFile = path.join(__dirname, 'guests.json');
const guestMetadataFile = path.join(__dirname, 'guest_metadata.json');

// Ensure directories exist
[uploadsDir, guestUploadsDir].forEach(dir => {
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir);
    }
});

// Ensure config files exist
if (!fs.existsSync(guestsAuthFile)) fs.writeFileSync(guestsAuthFile, JSON.stringify({ users: [] }, null, 2));
if (!fs.existsSync(guestMetadataFile)) fs.writeFileSync(guestMetadataFile, JSON.stringify({ images: [] }, null, 2));

// Multer Storage Configuration
const createStorage = (targetDir) => multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  }
});

const adminUpload = multer({ storage: createStorage(uploadsDir) });
const guestUpload = multer({ storage: createStorage(guestUploadsDir) });

// Helpers
const getData = (file) => {
  if (!fs.existsSync(file)) return { users: [], images: [] };
  return JSON.parse(fs.readFileSync(file, 'utf8'));
};

const saveData = (file, data) => {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
};

// --- Routes ---

// Admin Image Routes
app.get('/api/images', (req, res) => {
  fs.readdir(uploadsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read uploads folder' });
    const imageUrls = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => `http://localhost:${PORT}/uploads/${file}`);
    res.json(imageUrls);
  });
});

app.post('/api/upload', adminUpload.array('images'), (req, res) => {
  const imageUrls = req.files.map(file => `http://localhost:${PORT}/uploads/${file.filename}`);
  res.json({ message: 'Upload successful', images: imageUrls });
});

// Guest Image Routes
app.get('/api/guest-images', (req, res) => {
  const meta = getData(guestMetadataFile);
  fs.readdir(guestUploadsDir, (err, files) => {
    if (err) return res.status(500).json({ error: 'Failed to read guest uploads folder' });
    
    const guestImages = files
      .filter(file => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
      .map(file => {
        const metadata = meta.images.find(m => m.filename === file);
        return {
          url: `http://localhost:${PORT}/guest_uploads/${file}`,
          filename: file,
          owner: metadata ? metadata.owner : 'unknown'
        };
      });
    res.json(guestImages);
  });
});

app.post('/api/guest-upload', guestUpload.array('images'), (req, res) => {
  const { owner } = req.body;
  const meta = getData(guestMetadataFile);
  
  const newImages = req.files.map(file => {
    meta.images.push({ filename: file.filename, owner: owner || 'anonymous' });
    return {
      url: `http://localhost:${PORT}/guest_uploads/${file.filename}`,
      filename: file.filename,
      owner: owner || 'anonymous'
    };
  });
  
  saveData(guestMetadataFile, meta);
  res.json({ message: 'Upload successful', images: newImages });
});

app.delete('/api/images/:type/:filename', (req, res) => {
  const { type, filename } = req.params;
  const targetDir = type === 'guest' ? guestUploadsDir : uploadsDir;
  const filePath = path.join(targetDir, filename);

  if (fs.existsSync(filePath)) {
    fs.unlink(filePath, (err) => {
      if (err) return res.status(500).json({ error: 'Failed to delete file' });
      
      // Remove metadata if it's a guest image
      if (type === 'guest') {
        const meta = getData(guestMetadataFile);
        meta.images = meta.images.filter(m => m.filename !== filename);
        saveData(guestMetadataFile, meta);
      }
      
      res.json({ message: 'Deleted successfully' });
    });
  } else {
    res.status(404).json({ error: 'File not found' });
  }
});

// Guest User Management Routes
app.get('/api/users', (req, res) => {
  const data = getData(guestsAuthFile);
  res.json(data.users);
});

app.post('/api/users', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });
  const data = getData(guestsAuthFile);
  if (data.users.find(u => u.username === username)) return res.status(400).json({ error: 'User already exists' });
  data.users.push({ username, password });
  saveData(guestsAuthFile, data);
  res.json({ message: 'Guest user created successfully', user: { username } });
});

app.delete('/api/users/:username', (req, res) => {
  const username = req.params.username;
  const data = getData(guestsAuthFile);
  const initialCount = data.users.length;
  data.users = data.users.filter(u => u.username !== username);
  if (data.users.length === initialCount) return res.status(404).json({ error: 'User not found' });
  saveData(guestsAuthFile, data);
  res.json({ message: 'Guest user deleted successfully' });
});

// Login Route
app.post('/api/login', (req, res) => {
  const { username, password, role } = req.body;
  if (role === 'admin') {
    const adminData = getData(adminAuthFile);
    const user = adminData.users.find(u => u.username === username && u.password === password);
    if (user) return res.json({ success: true, user: { username: user.username, role: 'admin' } });
  } else {
    const guestData = getData(guestsAuthFile);
    const guest = guestData.users.find(u => u.username === username && u.password === password);
    if (guest) return res.json({ success: true, user: { username: guest.username, role: 'guest' } });
    const adminData = getData(adminAuthFile);
    const admin = adminData.users.find(u => u.username === username && u.password === password);
    if (admin) return res.json({ success: true, user: { username: admin.username, role: 'admin' } });
  }
  res.status(401).json({ success: false, error: 'Invalid credentials' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
