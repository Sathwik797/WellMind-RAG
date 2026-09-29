import { spawn } from "child_process";
import fs from "fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9222;

const routes = [
  { name: "operations", url: "http://localhost:5174/" },
  { name: "nearby", url: "http://localhost:5174/app/nearby" },
  { name: "similar", url: "http://localhost:5174/app/similar" },
  { name: "knowledge", url: "http://localhost:5174/app/knowledge" },
  { name: "decision_log", url: "http://localhost:5174/app/decision-log" },
];

async function run() {
  const chrome = spawn(chromePath, [
    "--headless=new",
    `--remote-debugging-port=${port}`,
    "--disable-gpu",
    "--no-first-run",
    "--no-default-browser-check",
    "--window-size=1920,1080",
    "about:blank"
  ]);

  let wsUrl = null;
  for (let i = 0; i < 30; i++) {
    await new Promise((r) => setTimeout(r, 200));
    try {
      const res = await fetch(`http://127.0.0.1:${port}/json/version`);
      const data = await res.json();
      wsUrl = data.webSocketDebuggerUrl;
      if (wsUrl) break;
    } catch {}
  }

  if (!wsUrl) {
    chrome.kill();
    process.exit(1);
  }

  const ws = new WebSocket(wsUrl);
  let id = 1;
  const callbacks = new Map();

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (callbacks.has(msg.id)) {
      callbacks.get(msg.id)(msg.result, msg.error);
      callbacks.delete(msg.id);
    }
  };

  const send = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      callbacks.set(curId, (res, err) => {
        if (err) reject(err);
        else resolve(res);
      });
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

  await new Promise((r) => (ws.onopen = r));

  const { targetId } = await send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await send("Target.attachToTarget", { targetId, flatten: true });

  const sendSession = (method, params = {}) =>
    new Promise((resolve, reject) => {
      const curId = id++;
      callbacks.set(curId, (res, err) => {
        if (err) reject(err);
        else resolve(res);
      });
      ws.send(JSON.stringify({ id: curId, sessionId, method, params }));
    });

  await sendSession("Page.enable");
  await sendSession("Runtime.enable");

  // Loop through routes at 1920x1080
  console.log("=== Capturing 1920x1080 screenshots ===");
  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1,
    mobile: false
  });

  for (const r of routes) {
    console.log(`Navigating to ${r.url} ...`);
    await sendSession("Page.navigate", { url: r.url });
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const snap = await sendSession("Page.captureScreenshot", { format: "png" });
    const filename = `screen_1920_${r.name}.png`;
    fs.writeFileSync(filename, Buffer.from(snap.data, "base64"));
    console.log(`Saved ${filename}`);
  }

  // Loop through routes at 1366x768
  console.log("=== Capturing 1366x768 screenshots ===");
  await sendSession("Emulation.setDeviceMetricsOverride", {
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
    mobile: false
  });

  for (const r of routes) {
    console.log(`Navigating (1366) to ${r.url} ...`);
    await sendSession("Page.navigate", { url: r.url });
    await new Promise((resolve) => setTimeout(resolve, 2500));
    const snap = await sendSession("Page.captureScreenshot", { format: "png" });
    const filename = `screen_1366_${r.name}.png`;
    fs.writeFileSync(filename, Buffer.from(snap.data, "base64"));
    console.log(`Saved ${filename}`);
  }

  ws.close();
  chrome.kill();
  console.log("All route screenshots captured successfully!");
}

run().catch((err) => {
  console.error("Error in capture script:", err);
  process.exit(1);
});
