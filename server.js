const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 8080;
const ROOT = __dirname;

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

const server = http.createServer((req, res) => {
  const urlPath = decodeURIComponent((req.url || "/").split("?")[0]);
  const relative = urlPath === "/" ? "index.html" : urlPath.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(ROOT, relative));

  // 프로젝트 폴더 바깥 파일은 열지 않음
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    res.end("Forbidden");
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("파일을 찾을 수 없습니다.");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.log(`급식 알리미 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    process.exit(0);
  }
  throw error;
});

server.listen(PORT, "127.0.0.1", () => {
  console.log(`급식 알리미 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
