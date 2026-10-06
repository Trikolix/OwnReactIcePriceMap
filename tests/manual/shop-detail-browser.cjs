// All API calls are isolated in the fixture; external network traffic is blocked.
const fs = require("node:fs"),
  path = require("node:path"),
  os = require("node:os"),
  http = require("node:http");
const { spawn } = require("node:child_process"),
  { buildSync } = require("esbuild");
const root = path.resolve(__dirname, "../.."),
  output = path.join(root, "build/shop-detail-browser");
fs.mkdirSync(output, { recursive: true });
fs.copyFileSync(
  path.join(__dirname, "fixtures/shop-detail-ice.svg"),
  path.join(output, "fixture-ice.svg"),
);
buildSync({
  entryPoints: [path.join(__dirname, "fixtures/shop-detail-browser.jsx")],
  bundle: true,
  outfile: path.join(output, "test.js"),
  jsx: "automatic",
  define: {
    "import.meta.env": JSON.stringify({
      VITE_API_BASE_URL: "https://test.invalid",
      VITE_ASSET_BASE_URL: "/",
    }),
    "process.env.NODE_ENV": '"production"',
  },
  loader: {
    ".png": "dataurl",
    ".jpg": "dataurl",
    ".webp": "dataurl",
    ".svg": "dataurl",
  },
});
fs.writeFileSync(
  path.join(output, "index.html"),
  '<!doctype html><html lang="de"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link rel="stylesheet" href="test.css"><style>body{margin:0}#results{display:none}</style></head><body><pre id="results" data-status="running"></pre><div id="app"></div><script src="test.js"></script></body></html>',
);
const server = http.createServer((request, response) => {
  const file = path.join(
    output,
    request.url.split("?")[0] === "/"
      ? "index.html"
      : request.url.split("?")[0],
  );
  if (!file.startsWith(output) || !fs.existsSync(file)) {
    response.writeHead(404);
    response.end();
    return;
  }
  response.setHeader(
    "Content-Type",
    file.endsWith(".js")
      ? "text/javascript"
      : file.endsWith(".css")
        ? "text/css"
        : file.endsWith(".svg")
          ? "image/svg+xml"
          : "text/html",
  );
  response.end(fs.readFileSync(file));
});
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function connect(url) {
  const socket = new WebSocket(url),
    pending = new Map();
  let sequence = 0;
  await new Promise((resolve, reject) => {
    socket.addEventListener("open", resolve, { once: true });
    socket.addEventListener("error", reject, { once: true });
  });
  socket.addEventListener("message", (event) => {
    const data = JSON.parse(event.data),
      item = pending.get(data.id);
    if (!item) return;
    pending.delete(data.id);
    clearTimeout(item.timer);
    data.error
      ? item.reject(new Error(JSON.stringify(data.error)))
      : item.resolve(data.result);
  });
  return {
    call(method, params = {}) {
      return new Promise((resolve, reject) => {
        const id = ++sequence,
          timer = setTimeout(() => {
            pending.delete(id);
            reject(new Error("CDP timeout " + method));
          }, 15000);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
      });
    },
    close() {
      socket.close();
    },
  };
}
(async () => {
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const profile = fs.mkdtempSync(
    path.join(os.tmpdir(), "ice-shop-detail-browser-"),
  );
  const chrome =
    process.env.CHROME_BIN ||
    "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
  const browser = spawn(chrome, [
    "--headless",
    "--no-first-run",
    "--disable-background-networking",
    "--disable-extensions",
    "--disable-gpu",
    "--remote-debugging-port=0",
    "--remote-allow-origins=*",
    "--user-data-dir=" + profile,
    "about:blank",
  ]);
  let stderr = "",
    cdp;
  browser.stderr.on("data", (data) => {
    stderr += data;
  });
  try {
    const start = Date.now();
    while (
      !stderr.includes("DevTools listening on ") &&
      Date.now() - start < 15000
    )
      await delay(50);
    const endpoint = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/)?.[1];
    if (!endpoint) throw new Error(stderr);
    const pages = await (
      await fetch("http://" + new URL(endpoint).host + "/json/list")
    ).json();
    cdp = await connect(
      pages.find((page) => page.type === "page").webSocketDebuggerUrl,
    );
    await cdp.call("Page.enable");
    await cdp.call("Network.enable");
    await cdp.call("Network.setBlockedURLs", {
      urls: ["https://*", "http://test.invalid/*"],
    });
    const evaluate = async (expression) => {
      const data = await cdp.call("Runtime.evaluate", {
        expression,
        returnByValue: true,
        awaitPromise: true,
      });
      if (data.exceptionDetails)
        throw new Error(JSON.stringify(data.exceptionDetails));
      return data.result.value;
    };
    const navigate = async (width, height, preview) => {
      await cdp.call("Emulation.setDeviceMetricsOverride", {
        width,
        height,
        deviceScaleFactor: 1,
        mobile: width < 768,
      });
      const query =
        "?run=" + Date.now() + (preview ? "&preview=" + preview : "");
      await cdp.call("Page.navigate", {
        url: `http://127.0.0.1:${server.address().port}/${query}`,
      });
      const deadline = Date.now() + 60000;
      while (Date.now() < deadline) {
        const data = await evaluate(
          '({query:location.search,status:document.getElementById("results")?.dataset.status,text:document.getElementById("results")?.textContent})',
        );
        if (
          data.query === query &&
          ["passed", "failed", "preview"].includes(data.status)
        ) {
          if (data.status === "failed")
            throw new Error(width + ": " + data.text);
          return data;
        }
        await delay(100);
      }
      throw new Error("Fixture timed out");
    };
    for (const [width, height] of [
      [320, 740],
      [390, 844],
      [768, 900],
      [1280, 900],
    ]) {
      const data = await navigate(width, height);
      const report = JSON.parse(data.text);
      console.log(
        JSON.stringify({ passed: report.passed, viewport: report.viewport }),
      );
      fs.writeFileSync(
        path.join(output, `report-${width}.json`),
        JSON.stringify(report, null, 2),
      );
      if (process.argv.includes("--screenshots"))
        for (const preview of [
          "overview",
          "checkins",
          "photos",
          "stats",
          "empty",
          "cards",
        ]) {
          await navigate(width, height, preview);
          const screenshot = await cdp.call("Page.captureScreenshot", {
            format: "png",
            captureBeyondViewport: preview !== "cards",
          });
          fs.writeFileSync(
            path.join(output, `${preview}-${width}.png`),
            Buffer.from(screenshot.data, "base64"),
          );
        }
    }
    await navigate(390, 844, "overview");
    const press = async (key, code, keyCode) => {
      await cdp.call("Input.dispatchKeyEvent", {
        type: "keyDown",
        key,
        code,
        windowsVirtualKeyCode: keyCode,
        ...(key === "Enter" ? { text: "\r" } : {}),
      });
      await cdp.call("Input.dispatchKeyEvent", {
        type: "keyUp",
        key,
        code,
        windowsVirtualKeyCode: keyCode,
      });
      await delay(120);
    };
    await evaluate(
      'document.querySelector("[role=tab][aria-selected=true]").focus()',
    );
    await press("ArrowRight", "ArrowRight", 39);
    if (
      !(await evaluate(
        'document.activeElement.id === "shopdetail-tab-community" && document.activeElement.getAttribute("aria-selected") === "true"',
      ))
    )
      throw new Error("Arrow key selects and focuses next tab");
    await evaluate(
      '[...document.querySelectorAll(".shopdetail-feed-card button")].find(button => button.title === "Kommentare einblenden").focus()',
    );
    await press("Enter", "Enter", 13);
    if (
      !(await evaluate(
        '!!document.querySelector(".shopdetail-feed-card textarea")',
      ))
    )
      throw new Error("Keyboard opens comments on visible card");
    await evaluate(
      'document.querySelector("#shopdetail-tab-community").focus()',
    );
    await press("End", "End", 35);
    if (
      !(await evaluate('document.activeElement.id === "shopdetail-tab-stats"'))
    )
      throw new Error("End selects last tab");
    await press("Home", "Home", 36);
    await evaluate(
      'document.querySelector(".shopdetail-disclosure summary").focus()',
    );
    await press("Enter", "Enter", 13);
    if (
      !(await evaluate('document.querySelector(".shopdetail-disclosure").open'))
    )
      throw new Error("Keyboard opens week details");
    await evaluate('document.querySelector("#shopdetail-tab-photos").click()');
    await delay(100);
    await evaluate(
      'document.querySelector(".shopdetail-photo-grid button").focus()',
    );
    await press("Enter", "Enter", 13);
    if (
      !(await evaluate(
        '!!document.querySelector("[role=dialog]") && document.querySelector("[role=dialog]").contains(document.activeElement)',
      ))
    )
      throw new Error("Keyboard opens focused photo dialog");
    for (let i = 0; i < 5; i++) await press("Tab", "Tab", 9);
    if (
      !(await evaluate(
        'document.querySelector("[role=dialog]").contains(document.activeElement)',
      ))
    )
      throw new Error("Photo dialog traps keyboard focus");
    await press("ArrowRight", "ArrowRight", 39);
    if (
      !(await evaluate(
        'document.querySelector("[role=dialog] footer p").textContent.startsWith("2 / 16")',
      ))
    )
      throw new Error("Arrow key navigates photos");
    await press("Escape", "Escape", 27);
    if (
      !(await evaluate(
        '!document.querySelector("[role=dialog]") && document.activeElement === document.querySelector(".shopdetail-photo-grid button")',
      ))
    )
      throw new Error("Escape restores photo trigger focus");
    console.log(
      JSON.stringify({
        passed: 9,
        checks: "Real keyboard tabs, details and photo dialog",
      }),
    );
  } finally {
    cdp?.close();
    browser.kill();
    server.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
  server.close();
});
