const express = require('express');
const multer = require('multer');
const fs = require('fs');
const { google } = require('googleapis');
const path = require('path');
const cors = require('cors');
require('dotenv').config(); // Optional, for secrets in .env

const app = express();
const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.static('public')); // Serves index.html

// Google Drive API setup
const auth = new google.auth.GoogleAuth({
  keyFile: path.join(__dirname, 'service-account.json'),
  scopes: ['https://www.googleapis.com/auth/drive.file'],
});
const drive = google.drive({ version: 'v3', auth });

// Replace with your actual folder ID from Google Drive
const FOLDER_ID = '17MvhVrT8QcU7YcjQH9jT3GlL077So1n3';

app.post('/upload', upload.single('image'), async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  try {
    const fileMetadata = {
      name: req.file.originalname,
      parents: [FOLDER_ID],
    };

    const media = {
      mimeType: req.file.mimetype,
      body: fs.createReadStream(req.file.path),
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media,
      fields: 'id',
    });

    fs.unlinkSync(req.file.path); // Cleanup temp file
    res.json({ message: 'Uploaded to Drive with ID: ' + response.data.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Upload failed', error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
