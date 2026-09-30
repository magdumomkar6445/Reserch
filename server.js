// Tech_Titansss Research Links — zero-dependency Node.js server
// Run:  node server.js   (then open http://localhost:3000)
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'links.json');
const CATS = ['General', 'Offline-First Sync', 'Cold-Chain IoT Tags', 'AI Route & Risk Planner',
  'Unified Command Dashboard', 'SOS Mesh Network', 'Polar Logistics', 'Hackathon / SIH'];
const MIME = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript',
  '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.ico': 'image/x-icon' };

fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(DATA_FILE)) fs.writeFileSync(DATA_FILE, '[]');

function readLinks() {
  try { const a = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); return Array.isArray(a) ? a : []; }
  catch { return []; }
}
function writeLinks(list) {
  const tmp = DATA_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(list, null, 2));
  fs.renameSync(tmp, DATA_FILE); // atomic replace
}
function safeUrl(u) {
  try { const x = new URL(u); return (x.protocol === 'http:' || x.protocol === 'https:') ? x.href : null; }
  catch { return null; }
}
function clean(b) {
  if (!b || typeof b !== 'object') return null;
  const url = safeUrl(String(b.url || '').trim());
  const title = String(b.title || '').trim().slice(0, 150);
  if (!url || !title) return null;
  return {
    title, url,
    cat: CATS.includes(b.cat) ? b.cat : 'General',
    src: String(b.src || 'Other').slice(0, 30),
    note: String(b.note || '').trim().slice(0, 400),
  };
}
const newId = () => 'l' + crypto.randomBytes(6).toString('hex');

function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}
function body(req) {
  return new Promise((resolve, reject) => {
    let s = '';
    req.on('data', c => { s += c; if (s.length > 1e6) { reject(new Error('Body too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(s ? JSON.parse(s) : null); } catch (e) { reject(e); } });
    req.on('error', reject);
  });
}

async function api(req, res, pathname) {
  const parts = pathname.split('/').filter(Boolean); // ['api','links',id?]
  try {
    if (parts[1] !== 'links') return send(res, 404, { error: 'Not found' });
    const id = parts[2];

    if (req.method === 'GET' && !id) return send(res, 200, readLinks());

    if (req.method === 'POST' && id === 'import') {
      const arr = await body(req);
      if (!Array.isArray(arr)) return send(res, 400, { error: 'Expected an array' });
      const list = readLinks(); let added = 0;
      for (const x of arr) {
        const c = clean(x);
        if (!c || list.some(l => l.url === c.url)) continue;
        list.push({ id: newId(), t: Number(x.t) || Date.now(), ...c }); added++;
      }
      writeLinks(list);
      return send(res, 200, { added, links: list });
    }

    if (req.method === 'POST' && !id) {
      const c = clean(await body(req));
      if (!c) return send(res, 400, { error: 'A title and a valid http(s) URL are required' });
      const list = readLinks();
      const item = { id: newId(), t: Date.now(), ...c };
      list.push(item); writeLinks(list);
      return send(res, 201, item);
    }

    if (req.method === 'PUT' && id) {
      const c = clean(await body(req));
      if (!c) return send(res, 400, { error: 'A title and a valid http(s) URL are required' });
      const list = readLinks(); const i = list.findIndex(l => l.id === id);
      if (i < 0) return send(res, 404, { error: 'Link not found' });
      list[i] = { ...list[i], ...c }; writeLinks(list);
      return send(res, 200, list[i]);
    }

    if (req.method === 'DELETE' && id) {
      const list = readLinks(); const next = list.filter(l => l.id !== id);
      if (next.length === list.length) return send(res, 404, { error: 'Link not found' });
      writeLinks(next);
      return send(res, 200, { deleted: id });
    }

    send(res, 405, { error: 'Method not allowed' });
  } catch (e) {
    send(res, 400, { error: e.message || 'Bad request' });
  }
}

function serveStatic(req, res, pathname) {
  let rel = decodeURIComponent(pathname);
  if (rel === '/') rel = '/index.html';
  const file = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!file.startsWith(PUBLIC_DIR)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404, { 'Content-Type': 'text/plain' }); return res.end('Not found'); }
    res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'application/octet-stream' });
    res.end(data);
  });
}

http.createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost');
  if (pathname.startsWith('/api/')) return api(req, res, pathname);
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  serveStatic(req, res, pathname);
}).listen(PORT, () => {
  console.log(`Tech_Titansss Research Links running at http://localhost:${PORT}`);
});
