const express = require('express');
const router = express.Router();
const multer = require('multer');
const optionalAuth = require('../middleware/optionalAuth');
const { uploadPdf, ask, listDocuments } = require('../controllers/wellmindController');

const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15 MB limit to protect memory

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (req, file, cb) => {
    const isPdf =
      file.mimetype === 'application/pdf' ||
      (file.originalname && file.originalname.toLowerCase().endsWith('.pdf'));
    if (isPdf) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type: Only PDF documents are supported'));
    }
  },
});

const handleUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ message: 'File too large. Maximum supported size is 15MB.' });
      }
      return res.status(400).json({ message: err.message || 'File upload validation failed' });
    }
    next();
  });
};

// WellMind knowledge intelligence: Guest accessible
router.get('/documents', optionalAuth, listDocuments);
router.post('/ask', optionalAuth, ask);
router.post('/upload', optionalAuth, handleUpload, uploadPdf);

module.exports = router;