// preview.mjs — static preview server for the film page (live preview environment).
// Listens on 0.0.0.0:33257; accepts any Host (proxied preview origins) and embeds in iframes.
// /@film/… → the project folder; everything else → the lemo-opuscar library (/core, /styles, /node_modules).
import http from 'http';
import fs from 'fs';
import path from 'path';

const PORT = +(process.env.PORT || 33257);
const FILM = '/home/user/lajawaab';
const LIB = '/home/user/lemo-opuscar';
const MOUNT = '/@film/';

const T = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif', '.webp': 'image/webp', '.svg': 'image/svg+xml',
  '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.mp4': 'video/mp4', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.wasm': 'application/wasm', '.map': 'application/json',
};

function resolve(url) {
  let u; try { u = decodeURIComponent(url.split('?')[0].split('#')[0]); } catch { return { status: 400 }; }
  if (u.includes('\0')) return { status: 400 };
  if (u === '/') return { redirect: MOUNT + 'index.html' };
  const [base, rest] = u.startsWith(MOUNT) ? [FILM, u.slice(MOUNT.length)] : [LIB, u.replace(/^\/+/, '')];
  const p = path.resolve(base, rest);
  if (p !== base && !p.startsWith(base + path.sep)) return { status: 403 };
  return { path: p };
}

http.createServer((q, r) => {
  const x = resolve(q.url);
  if (x.redirect) { r.writeHead(302, { Location: x.redirect }); return r.end(); }
  if (x.status) { r.writeHead(x.status, { 'Content-Type': 'text/plain' }); return r.end(x.status === 403 ? 'outside root' : 'bad request'); }
  fs.readFile(x.path, (e, d) => {
    if (e) { r.writeHead(404, { 'Content-Type': 'text/plain' }); return r.end('not found'); }
    r.writeHead(200, {
      'Content-Type': T[path.extname(x.path).toLowerCase()] || 'application/octet-stream',
      'Cache-Control': 'no-cache',
    });
    r.end(d);
  });
}).listen(PORT, '0.0.0.0', () => console.log(`preview: http://0.0.0.0:${PORT}${MOUNT}index.html`));
