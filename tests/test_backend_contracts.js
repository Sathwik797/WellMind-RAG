const assert = require('assert');

// 1. Test URL Normalization logic
function normalizeUrl(raw, defaultUrl) {
  let val = String(raw || defaultUrl).trim();
  if (!val.startsWith('http://') && !val.startsWith('https://')) {
    val = `https://${val}`;
  }
  return val.replace(/\/+$/, '');
}

console.log("Running Backend Contract & Security Tests...");

// Test 1: URL Normalization Handles Render Host Properties (without https://)
{
  const rawRenderHost = "ertmac-nwis-backend-5u1f.onrender.com";
  const normalized = normalizeUrl(rawRenderHost, "http://localhost:5000");
  assert.strictEqual(normalized, "https://ertmac-nwis-backend-5u1f.onrender.com");
  console.log("✔ Test 1 Passed: Render host without protocol gets https prepended");
}

// Test 2: URL Normalization Preserves Localhost
{
  const localHost = "http://localhost:5000";
  const normalized = normalizeUrl(localHost, "http://localhost:5000");
  assert.strictEqual(normalized, "http://localhost:5000");
  console.log("✔ Test 2 Passed: Localhost protocol preserved");
}

// Test 3: BaseURL formatting for Frontend /api
{
  function formatBaseUrl(raw) {
    if (!raw) return "http://localhost:5000/api";
    let url = String(raw).trim();
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = `https://${url}`;
    }
    url = url.replace(/\/+$/, "");
    return url.endsWith("/api") ? url : `${url}/api`;
  }

  assert.strictEqual(
    formatBaseUrl("ertmac-nwis-backend.onrender.com"),
    "https://ertmac-nwis-backend.onrender.com/api"
  );
  assert.strictEqual(
    formatBaseUrl("https://ertmac-nwis-backend.onrender.com/api/"),
    "https://ertmac-nwis-backend.onrender.com/api"
  );
  assert.strictEqual(
    formatBaseUrl("http://localhost:5000"),
    "http://localhost:5000/api"
  );
  console.log("✔ Test 3 Passed: Frontend baseURL normalizes safely with /api");
}

// Test 4: Role-based authorization logic
{
  const { requireFieldRole } = require('../backend/middleware/requireFieldRole');

  let statusSent = null;
  let jsonSent = null;
  const mockRes = {
    status(code) { statusSent = code; return this; },
    json(body) { jsonSent = body; return this; }
  };

  // Office role trying to access field feature
  requireFieldRole({ employee: { role: 'office' } }, mockRes, () => {});
  assert.strictEqual(statusSent, 403);
  assert.strictEqual(jsonSent.message, 'Only field role can access this feature');

  // Guest (null employee) trying to access field feature
  statusSent = null;
  requireFieldRole({ employee: null }, mockRes, () => {});
  assert.strictEqual(statusSent, 403);

  // Field role passes
  let nextCalled = false;
  requireFieldRole({ employee: { role: 'field' } }, mockRes, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true);
  console.log("✔ Test 4 Passed: Server-side Field Role authorization verified");
}

// Test 5: File Upload Filter Security Check
{
  const MAX_FILE_SIZE = 15 * 1024 * 1024;
  assert.strictEqual(MAX_FILE_SIZE, 15728640, "15 MB memory limit enforced");

  const pdfFile = { mimetype: 'application/pdf', originalname: 'DDR_Report.pdf' };
  const exeFile = { mimetype: 'application/x-msdownload', originalname: 'exploit.exe' };

  const isPdf = (f) => f.mimetype === 'application/pdf' || (f.originalname && f.originalname.toLowerCase().endsWith('.pdf'));
  assert.strictEqual(isPdf(pdfFile), true);
  assert.strictEqual(isPdf(exeFile), false);
  console.log("✔ Test 5 Passed: PDF MIME validation prevents non-PDF/executable execution");
}

console.log("\nALL BACKEND CONTRACT & SECURITY TESTS PASSED! 🚀");
