import { createServer } from 'node:http';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';
const T = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png', '.xml': 'application/xml', '.txt': 'text/plain' };
import handler from './api/enquiry.mjs';
createServer((req, res) => {
  if (req.url.split('?')[0] === '/api/enquiry') return handler(req, res);
  let p = decodeURIComponent(req.url.split('?')[0]);
  let f = join('dist', p);
  if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
  if (!existsSync(f)) { res.writeHead(404, { 'Content-Type': T['.html'] }); return res.end(readFileSync('dist/404.html')); }
  res.writeHead(200, { 'Content-Type': T[extname(f)] || 'application/octet-stream' }); res.end(readFileSync(f));
}).listen(4173, () => console.log('http://localhost:4173'));
