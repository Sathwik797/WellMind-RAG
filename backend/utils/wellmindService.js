const axios = require('axios');
const FormData = require('form-data');

const WELLMIND_BASE = process.env.WELLMIND_URL || 'http://localhost:8001';
const wellmindAxios = axios.create({ timeout: 320000 });

async function uploadDocument(fileBuffer, originalFilename) {
  const form = new FormData();
  form.append('file', fileBuffer, originalFilename);

  const response = await wellmindAxios.post(`${WELLMIND_BASE}/upload`, form, {
    headers: form.getHeaders(),
  });
  return response.data; // { message, document_id, filename }
}

async function askQuestion(question, documentId) {
  const response = await wellmindAxios.post(`${WELLMIND_BASE}/ask`, {
    question,
    document_id: documentId || null,
  });
  return response.data; // { answer, sources: [{ source, page, score }] }
}

module.exports = { uploadDocument, askQuestion };