# Tango Backend Server

This is the backend server for the Tango Live Streaming Platform that handles image uploads and form data.

## Features

- ✅ Image upload handling with multer
- ✅ Form data processing (email, password, phone)
- ✅ Ngrok integration for public URL access
- ✅ Terminal logging of all inputs
- ✅ CORS enabled for frontend communication
- ✅ File validation (images only)
- ✅ 5MB file size limit

## Setup Instructions

1. **Install dependencies:**
   ```bash
   cd server
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```
   
   Or for development with auto-restart:
   ```bash
   npm run dev
   ```

3. **The server will:**
   - Start on `http://localhost:3001`
   - Create an Ngrok tunnel with a public URL
   - Log all form submissions to the terminal
   - Store uploaded images in the `uploads/` directory

## API Endpoints

- `POST /api/upload` - Handle form submission with image upload
- `GET /api/health` - Health check endpoint
- `GET /uploads/:filename` - Serve uploaded images

## Ngrok Configuration

The server automatically starts an Ngrok tunnel when it starts. The public URL will be displayed in the terminal.

If you need to configure Ngrok differently, you can modify the `ngrok.connect()` options in `server.js`.

## File Storage

Uploaded images are stored in the `server/uploads/` directory with unique filenames to prevent conflicts.

## Terminal Output

All form submissions are logged to the terminal with the following information:
- Timestamp
- Email/Phone data
- File information (if uploaded)
- File size and type
