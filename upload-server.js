const http = require("http");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
const PORT = 9999;
const DIR = "/opt/backups-received";
fs.mkdirSync(DIR, { recursive: true });
function listFiles() {
  try { return fs.readdirSync(DIR).map(f => `<li><a href="/dl/${f}">${f}</a></li>`).join(""); } catch { return ""; }
}
const page = `<!DOCTYPE html><html><body><h2>Upload Backup Files</h2>
<form action="/upload" method="post" enctype="multipart/form-data">
<input type="file" name="files" multiple required><br><br>
<input type="submit" value="Upload All">
</form><hr><ul>${listFiles()}</ul></body></html>`;
http.createServer((req, res) => {
  const u = req.url;
  if (u === "/" && req.method === "GET") { res.writeHead(200, { "Content-Type": "text/html" }); res.end(page); return; }
  if (u.startsWith("/dl/") && req.method === "GET") {
    const f = path.join(DIR, path.basename(u.slice(4)));
    if (fs.existsSync(f)) { res.writeHead(200); fs.createReadStream(f).pipe(res); }
    else { res.writeHead(404); res.end("NF"); }
    return;
  }
  if (u === "/upload" && req.method === "POST") {
    const ct = req.headers["content-type"] || "";
    const boundary = Buffer.from("--" + ct.split("boundary=")[1]);
    const chunks = [];
    req.on("data", c => chunks.push(c));
    req.on("end", () => {
      const buf = Buffer.concat(chunks);
      let pos = 0; let saved = 0;
      while (true) {
        const start = buf.indexOf(boundary, pos);
        if (start === -1) break;
        const headerEnd = buf.indexOf("\r\n\r\n", start);
        if (headerEnd === -1) break;
        const dataStart = headerEnd + 4;
        const nextBoundary = buf.indexOf(boundary, dataStart);
        if (nextBoundary === -1) break;
        let fileEnd = buf.lastIndexOf("\r\n", nextBoundary - 2);
        if (fileEnd < dataStart) fileEnd = nextBoundary - 2;
        const fileData = buf.slice(dataStart, fileEnd);
        if (fileData.length > 0) {
          const name = "backup-" + crypto.randomBytes(4).toString("hex") + ".tar.gz";
          fs.writeFileSync(path.join(DIR, name), fileData);
          saved++;
        }
        pos = nextBoundary + boundary.length;
      }
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(`Saved ${saved} file(s)! <a href='/'>Back</a>`);
    });
    return;
  }
  res.writeHead(404); res.end();
}).listen(PORT, () => console.log("Ready on port", PORT));
