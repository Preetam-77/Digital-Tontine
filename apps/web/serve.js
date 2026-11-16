import http from "node:http"; import { readFileSync } from "node:fs";
const html = readFileSync(new URL("./index.html", import.meta.url));
http.createServer((_, r) => { r.writeHead(200, { "content-type": "text/html; charset=utf-8" }); r.end(html); })
  .listen(8080, () => console.log("Tontine demo on http://localhost:8080"));
