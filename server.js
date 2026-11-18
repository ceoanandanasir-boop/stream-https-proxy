
const http = require("http");

const PORT = process.env.PORT || 10000;
const TARGET = "http://178.32.146.184:7292/stream";

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range, Origin, Accept");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }

  if (req.url !== "/stream" && !req.url.startsWith("/stream?")) {
    res.writeHead(404);
    return res.end("Use /stream");
  }

  const headers = {
    "User-Agent": req.headers["user-agent"] || "Mozilla/5.0",
    "Accept": req.headers.accept || "*/*"
  };

  if (req.headers.range) {
    headers.Range = req.headers.range;
  }

  const proxy = http.request(
    TARGET + req.url,
    { method: req.method, headers },
    (upstream) => {
      res.writeHead(upstream.statusCode || 502, upstream.headers);
      upstream.pipe(res);
    }
  );

  proxy.on("error", () => {
    if (!res.headersSent) {
      res.writeHead(502);
    }
    res.end("Upstream stream unavailable");
  });

  proxy.setTimeout(0);
  req.pipe(proxy);

  res.on("close", () => proxy.destroy());
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Proxy running on port ${PORT}`);
});
