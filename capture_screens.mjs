import { spawn } from "child_process";
import fs from "fs";

const chromePath = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const port = 9222;

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

  await sendSession("Page.navigate", { url: "http://localhost:5174/" });
  await new Promise((r) => setTimeout(r, 3000));

  // Click the Depth Track tab
  await sendSession("Runtime.evaluate", {
    expression: `
      const btns = Array.from(document.querySelectorAll('.stage-tab-btn'));
      const depthBtn = btns.find(b => b.textContent.includes('DEPTH-TRACK'));
      if (depthBtn) depthBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1000));

  const snapDepth = await sendSession("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("screenshot_depth_track.png", Buffer.from(snapDepth.data, "base64"));
  console.log("Saved screenshot_depth_track.png");

  // Open the Sandbox
  await sendSession("Runtime.evaluate", {
    expression: `
      const sandboxBtn = Array.from(document.querySelectorAll('button')).find(b => b.textContent.includes('SANDBOX'));
      if (sandboxBtn) sandboxBtn.click();
    `
  });
  await new Promise((r) => setTimeout(r, 1000));

  const snapSandbox = await sendSession("Page.captureScreenshot", { format: "png" });
  fs.writeFileSync("screenshot_sandbox.png", Buffer.from(snapSandbox.data, "base64"));
  console.log("Saved screenshot_sandbox.png");

  ws.close();
  chrome.kill();
}

run().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
