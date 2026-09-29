const express = require('express');
const router = express.Router();
const multer = require('multer');
const optionalAuth = require('../middleware/optionalAuth');
const { uploadPdf, ask, listDocuments } = require('../controllers/wellmindController');

const upload = multer({ storage: multer.memoryStorage() });

// WellMind knowledge intelligence: Guest accessible
router.get('/documents', optionalAuth, listDocuments);
router.post('/ask', optionalAuth, ask);
router.post('/upload', optionalAuth, upload.single('file'), uploadPdf);

module.exports = router;