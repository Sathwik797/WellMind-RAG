import api from "./client";

export async function uploadDocument(file) {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post('/wellmind/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data; // { message, document_id, filename }
}

export async function askKnowledgeRepository({ question, documentId }) {
  const { data } = await api.post('/wellmind/ask', { question, documentId });
  return data; // { answer, sources: [{ source, page, score }] }
}

export async function listDocuments() {
  const { data } = await api.get('/wellmind/documents');
  return data.documents;
}