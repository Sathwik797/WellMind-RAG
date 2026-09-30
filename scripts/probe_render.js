async function probe() {
  const urls = [
    'https://ertmac-nwis-backend-5u1f.onrender.com/health',
    'https://ertmac-nwis-backend-5u1f.onrender.com/api/wells/search?q=W001',
    'https://ertmac-nwis-backend-5u1f.onrender.com/api/wells/W001',
    'https://ertmac-nwis-backend-5u1f.onrender.com/api/wells/nearby?lat=27.47&lng=94.91&radius=30',
    'https://ertmac-nwis-backend-5u1f.onrender.com/api/wells/similar/W001',
    'https://ertmac-nwis-backend-5u1f.onrender.com/api/wells/W001/events',
    'https://ertmac-nwis-backend-5u1f.onrender.com/api/risk/W001',
    'https://ertmac-nwis-backend-5u1f.onrender.com/api/alerts',
    'https://ertmac-nwis-ml.onrender.com/health',
    'https://ertmac-nwis-wellmind.onrender.com/health'
  ];

  console.log("=== BLACK-BOX PRODUCTION PROBE ===");
  for (const url of urls) {
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 12000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(id);
      const text = await res.text();
      let preview = text.slice(0, 120);
      console.log(`[HTTP ${res.status}] ${url} -> ${preview}`);
    } catch (err) {
      console.log(`[FAILED] ${url} -> ${err.message}`);
    }
  }
}

probe();
