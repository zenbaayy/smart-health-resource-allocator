const http = require('http');
const fs = require('fs');
const path = require('path');
const chat = require('./chatEngine');
const { handleExternal } = require('./externalSources');
const auth = require('./database');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'src');
let villages = JSON.parse(fs.readFileSync(path.join(PUBLIC, 'data', 'villages.json'), 'utf8'));
if (fs.existsSync(path.join(ROOT, '.env'))) {
  for (const line of fs.readFileSync(path.join(ROOT, '.env'), 'utf8').split(/\r?\n/)) {
    const hit = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (hit && !process.env[hit[1]]) process.env[hit[1]] = hit[2].replace(/^['"]|['"]$/g, '');
  }
}

const flood = { High: 40, 'Medium-High': 30, Medium: 20, Low: 10 };
const access = { Poor: 10, Difficult: 10, Moderate: 5, Good: 0 };
function scored(v, i) {
  let got = 0, available = 15;
  if (flood[v.flood_risk] !== undefined) { got += flood[v.flood_risk]; available += 40; }
  if (typeof v.distance_km === 'number') { got += Math.min(v.distance_km / 40, 1) * 25; available += 25; }
  if (!v.has_bhu_on_site) got += 15;
  if (access[v.accessibility] !== undefined) { got += access[v.accessibility]; available += 10; }
  const populationVerified = typeof v.population === 'number' && v.id !== 'RJ-09';
  if (populationVerified) { got += Math.min(v.population / 20000, 1) * 10; available += 10; }
  const score = available ? Math.round(got / available * 100) : null;
  const confidence = available >= 75 ? 'High' : available >= 45 ? 'Medium' : 'Low';
  const level = score === null ? 'Survey Required' : score >= 80 ? 'Critical' : score >= 60 ? 'High' : score >= 40 ? 'Medium' : 'Low';
  return { ...v, rowKey: `${v.id}-${i}`, score, confidence, confidencePct: available, priority: level, populationVerified };
}
let dataset = villages.map(scored);
let context = dataset.map(v => ({ location: v.village, id: v.id, district: v.district, tehsil: v.tehsil, priorityScore: v.score, priorityLevel: v.priority, confidence: `${v.confidence} (${v.confidencePct}%)`, floodRisk: v.flood_risk, distanceKm: v.distance_km ?? 'Not Available', bhuOnSite: v.has_bhu_on_site, accessibility: v.accessibility, verifiedPopulation: v.populationVerified ? v.population : 'Not Available' }));

function rebuild() {
  dataset = villages.map(scored);
  context = dataset.map(v => ({ location: v.village, id: v.id, district: v.district, tehsil: v.tehsil, priorityScore: v.score, priorityLevel: v.priority, confidence: `${v.confidence} (${v.confidencePct}%)`, floodRisk: v.flood_risk, distanceKm: v.distance_km ?? 'Not Available', bhuOnSite: v.has_bhu_on_site, accessibility: v.accessibility, verifiedPopulation: v.populationVerified ? v.population : 'Not Available' }));
}

function json(res, code, body) { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(body)); }
function parseCookies(req) {
  const cookie = req.headers.cookie || '';
  const cookies = {};
  cookie.split(';').forEach(c => {
    const [name, ...rest] = c.trim().split('=');
    if (name) cookies[name.trim()] = decodeURIComponent(rest.join('='));
  });
  return cookies;
}
function readBody(req) {
  return new Promise((resolve) => {
    let raw = '';
    req.on('data', c => raw += c);
    req.on('end', () => resolve(raw));
  });
}
function serve(req, res) {
  let pathname = new URL(req.url, 'http://localhost').pathname;
  if (pathname === '/') pathname = '/index.html';
  const file = path.resolve(PUBLIC, '.' + pathname);
  if (!file.startsWith(PUBLIC) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) { res.writeHead(404); return res.end('Not found'); }
  const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8' };
  res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }); fs.createReadStream(file).pipe(res);
}
async function handler(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const pathname = url.pathname;

  if (req.method === 'POST' && pathname === '/api/auth/signup') {
    const raw = await readBody(req);
    let email, password;
    try { ({ email, password } = JSON.parse(raw)); } catch { return json(res, 400, { error: 'Invalid request.' }); }
    const result = auth.signup(email, password);
    if (result.error) return json(res, 400, result);
    return json(res, 201, { message: 'Account created successfully' });
  }

  if (req.method === 'POST' && pathname === '/api/auth/login') {
    const raw = await readBody(req);
    let email, password;
    try { ({ email, password } = JSON.parse(raw)); } catch { return json(res, 400, { error: 'Invalid request.' }); }
    const result = auth.login(email, password);
    if (result.error) return json(res, 401, result);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': `session=${result.token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`
    });
    return res.end(JSON.stringify({ message: 'Login successful', expiresAt: result.expiresAt }));
  }

  if (req.method === 'POST' && pathname === '/api/auth/logout') {
    const cookies = parseCookies(req);
    auth.logout(cookies.session);
    res.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Set-Cookie': 'session=; Path=/; HttpOnly; Max-Age=0'
    });
    return res.end(JSON.stringify({ message: 'Logged out' }));
  }

  if (req.method === 'GET' && pathname === '/api/auth/verify') {
    const cookies = parseCookies(req);
    const session = auth.verifySession(cookies.session);
    return json(res, session ? 200 : 401, { authenticated: !!session });
  }

  const cookies = parseCookies(req);
  const session = auth.verifySession(cookies.session);
  if (!session && (pathname === '/api/data' || pathname === '/api/chat' || pathname.startsWith('/api/villages'))) {
    return json(res, 401, { error: 'Authentication required' });
  }

  if (req.method === 'GET' && pathname.startsWith('/api/data')) return json(res, 200, dataset);

  if (req.method === 'POST' && pathname === '/api/villages') {
    const raw = await readBody(req);
    let body;
    try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid request.' }); }
    if (!body.village || !body.district) return json(res, 400, { error: 'Area name and district are required.' });
    const newVillage = {
      id: `FIELD-${Date.now()}`,
      village: body.village,
      district: body.district,
      tehsil: body.tehsil || body.district,
      population: body.population !== '' && body.population !== undefined ? Number(body.population) : undefined,
      distance_km: body.distance_km !== '' && body.distance_km !== undefined ? Number(body.distance_km) : undefined,
      flood_risk: body.flood_risk || 'Unknown',
      has_bhu_on_site: !!body.has_bhu_on_site,
      accessibility: body.accessibility || 'Unknown'
    };
    villages.push(newVillage);
    rebuild();
    try { fs.writeFileSync(path.join(PUBLIC, 'data', 'villages.json'), JSON.stringify(villages, null, 2)); } catch (e) {}
    return json(res, 201, { message: 'Area added successfully' });
  }
  if (req.method === 'PUT' && pathname.startsWith('/api/villages/')) {
    const id = decodeURIComponent(pathname.slice('/api/villages/'.length));
    const idx = villages.findIndex(v => v.id === id);
    if (idx === -1) return json(res, 404, { error: 'Area not found' });
    const raw = await readBody(req);
    let body;
    try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid request.' }); }
    if (!body.village || !body.district) return json(res, 400, { error: 'Area name and district are required.' });
    villages[idx] = {
      ...villages[idx],
      village: body.village,
      district: body.district,
      tehsil: body.tehsil || body.district,
      population: body.population !== '' && body.population !== undefined ? Number(body.population) : undefined,
      distance_km: body.distance_km !== '' && body.distance_km !== undefined ? Number(body.distance_km) : undefined,
      flood_risk: body.flood_risk || 'Unknown',
      has_bhu_on_site: !!body.has_bhu_on_site,
      accessibility: body.accessibility || 'Unknown'
    };
    rebuild();
    try { fs.writeFileSync(path.join(PUBLIC, 'data', 'villages.json'), JSON.stringify(villages, null, 2)); } catch (e) {}
    return json(res, 200, { message: 'Area updated successfully' });
  }

  if (req.method === 'DELETE' && pathname.startsWith('/api/villages/')) {
    const id = decodeURIComponent(pathname.slice('/api/villages/'.length));
    const idx = villages.findIndex(v => v.id === id);
    if (idx === -1) return json(res, 404, { error: 'Area not found' });
    villages.splice(idx, 1);
    rebuild();
    try { fs.writeFileSync(path.join(PUBLIC, 'data', 'villages.json'), JSON.stringify(villages, null, 2)); } catch (e) {}
    return json(res, 200, { message: 'Area deleted' });
  }
    if (req.method === 'POST' && pathname === '/api/villages/bulk') {
    const raw = await readBody(req);
    let body;
    try { body = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid request.' }); }
    if (!Array.isArray(body.rows)) return json(res, 400, { error: 'Expected a rows array.' });

    const existingKeys = new Set(villages.map(v => `${(v.village||'').trim().toLowerCase()}|${(v.district||'').trim().toLowerCase()}`));
    let imported = 0, skipped = 0, rejected = 0;
    const errors = [];

    for (let i = 0; i < body.rows.length; i++) {
      const r = body.rows[i];
      const rowNum = i + 2; // account for header row
      if (!r.village || !r.district) { rejected++; errors.push(`Row ${rowNum}: Area name and district are required.`); continue; }
      const key = `${r.village.trim().toLowerCase()}|${r.district.trim().toLowerCase()}`;
      if (existingKeys.has(key)) { skipped++; errors.push(`Row ${rowNum}: "${r.village}" in "${r.district}" already exists — skipped.`); continue; }

      const newVillage = {
        id: `FIELD-${Date.now()}-${i}`,
        village: r.village.trim(),
        district: r.district.trim(),
        tehsil: (r.tehsil || r.district).trim(),
        population: r.population !== '' && r.population !== undefined && r.population !== null ? Number(r.population) : undefined,
        distance_km: r.distance_km !== '' && r.distance_km !== undefined && r.distance_km !== null ? Number(r.distance_km) : undefined,
        flood_risk: ['High','Medium-High','Medium','Low'].includes(r.flood_risk) ? r.flood_risk : 'Unknown',
        has_bhu_on_site: !!r.has_bhu_on_site,
        accessibility: ['Good','Moderate','Difficult','Poor'].includes(r.accessibility) ? r.accessibility : 'Unknown'
      };
      villages.push(newVillage);
      existingKeys.add(key);
      imported++;
    }

    if (imported > 0) {
      rebuild();
      try { fs.writeFileSync(path.join(PUBLIC, 'data', 'villages.json'), JSON.stringify(villages, null, 2)); } catch (e) {}
    }
    return json(res, 200, { totalRows: body.rows.length, imported, skipped, rejected, errors });
  }
  if (req.method === 'POST' && pathname === '/api/chat') {
    const raw = await readBody(req);
    let question; try { question = JSON.parse(raw).question; } catch { return json(res, 400, { error: 'Invalid request.' }); }
    if (!question || typeof question !== 'string' || question.length > 1500) return json(res, 400, { error: 'Please enter a question (up to 1,500 characters).' });
    const analysis = chat.analyze(question, dataset);
    if (analysis.intent.startsWith('ext_')) {
      const ext = await handleExternal(analysis.intent, analysis, dataset);
      if (ext) return json(res, 200, ext);
    }
    const deterministic = chat.answer(analysis, dataset);
    if (analysis.intent !== 'fallback' || !process.env.GROK_API_KEY) return json(res, 200, deterministic);
    const controller = new AbortController(); const timer = setTimeout(() => controller.abort(), 20000);
    try {
      const response = await fetch('https://api.x.ai/v1/chat/completions', { method: 'POST', signal: controller.signal, headers: { 'Content-Type':'application/json', Authorization:`Bearer ${process.env.GROK_API_KEY}` }, body: JSON.stringify({ model:'grok-3-mini', temperature:0.2, max_tokens:450, messages:[
        { role:'system', content:'You are the Smart Health Resource Allocation Assistant for an NGO decision-support dashboard. Use ONLY the supplied dashboard data for factual claims. If a field is missing, say it is unavailable. Never invent facility names, populations, health outcomes, road facts, geographic facts, or statistics. Clearly separate data-supported findings, operational recommendations, and missing information. Do not diagnose patients or claim medical certainty. Keep answers concise and practical.' },
        { role:'system', content:`Verified dashboard dataset:\n${JSON.stringify(context)}` },
        { role:'user', content:question }
      ] }) });
      const body = await response.json();
      if (!response.ok || !body.choices?.[0]?.message?.content) return json(res, 200, deterministic);
      return json(res, 200, { answer: body.choices[0].message.content, lang: analysis.lang, intent: 'fallback', origin: 'internal-ai', meta: { source: 'Internal dashboard dataset (verified fields) — AI-assisted phrasing', url: '/api/data', retrievedAt: new Date().toISOString(), status: 'AI-assisted — grounded in the supplied dataset only; scores are never changed' } });
    } catch (error) { return json(res, 200, deterministic); }
    finally { clearTimeout(timer); }
  }
  serve(req, res);
}

module.exports = handler;

if (require.main === module) {
  http.createServer(handler).listen(process.env.PORT || 3000, () => console.log('Smart Health Resource Allocator: http://localhost:3000'));
}