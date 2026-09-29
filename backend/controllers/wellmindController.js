const { uploadDocument, askQuestion } = require('../utils/wellmindService');
const WellDocument = require('../models/WellDocument');

// @route POST /api/wellmind/upload
exports.uploadPdf = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const result = await uploadDocument(req.file.buffer, req.file.originalname);

    await WellDocument.create({
      documentId: result.document_id,
      filename: result.filename,
      uploadedBy: req.employee?.employeeName || 'unknown',
    });

    res.status(200).json(result);
  } catch (error) {
     console.error("WellMind ask error:", error.response?.data || error.message);
    res.status(500).json({ message: 'Error uploading document', error: error.message });
  }
};

// @route POST /api/wellmind/ask
exports.ask = async (req, res) => {
  try {
    const { question, documentId } = req.body;
    if (!question || !question.trim()) {
      return res.status(400).json({ message: 'Question is required' });
    }

    const result = await askQuestion(question, documentId);
    res.status(200).json(result);
  // } catch (error) {
  //    console.error("WellMind error:", error.response?.data || error.message);
  //   res.status(500).json({ message: 'Error asking question', error: error.message });
  // }
  }catch (error) {
  console.error("❌ WellMind request failed:", {
    message: error.message,
    status: error.response?.status,
    data: error.response?.data,
    headers: error.response?.headers,
    url: error.config?.url,
  });

  throw error;
}
};

// @route GET /api/wellmind/documents
exports.listDocuments = async (req, res) => {
  try {
    const docs = await WellDocument.find().sort({ createdAt: -1 });
    res.status(200).json({ documents: docs });
  } catch (error) {
     console.error("WellMind  error:", error.response?.data || error.message);
    res.status(500).json({ message: 'Error listing documents', error: error.message });
  }
};