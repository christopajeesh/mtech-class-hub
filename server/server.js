import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import apiRouter from './routes/api.js';
import { getStore } from './data/store.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for frontend development
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  const store = getStore();
  res.json({
    status: 'ok',
    app: 'MTech Class Hub API',
    institution: store.settings.institution,
    activeSemester: store.settings.activeSemester,
    timestamp: new Date().toISOString()
  });
});

// Serve frontend build in production
const clientDistPath = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  const store = getStore();
  console.log('====================================================');
  console.log(`🎓 MTech Class Hub API Server`);
  console.log(`📍 Port: http://localhost:${PORT}`);
  console.log(`🏫 Institution: ${store.settings.institution}`);
  console.log(`📅 Active Semester: ${store.settings.activeSemester} (${store.settings.academicYear})`);
  console.log(`👥 Predefined Members: ${store.settings.members.join(', ')}`);
  console.log('====================================================');
});
