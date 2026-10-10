const fs = require('fs');
const path = require('path');

const LANDING = path.join('src', 'landing.html');
const SERVER = path.join('server', 'server.js');
const IMG_DIR = path.join('src', 'images');

let html = fs.readFileSync(LANDING, 'utf8');
fs.writeFileSync('landing.backup.html', html);

// 1. Header with Login / Open Dashboard / Logout
const header = `<header>
  <div class="container nav">
    <a href="#" class="logo" aria-label="Smart Health Resource Allocator">
      <svg viewBox="0 0 48 48"><path d="M24 44C10 33 3 26 3 16 3 9 8 4 14 4c4 0 8 2 10 6 2-4 6-6 10-6 6 0 11 5 11 12 0 10-7 17-21 28z" fill="#0f4c3a"/><path d="M6 24h10l3-7 5 14 4-9 3 2h11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
      <span><b>Smart Health</b><small>Resource Allocator</small></span>
    </a>
    <nav><ul>
      <li><a class="active" href="#home">Home</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#about">About</a></li>
    </ul></nav>
    <div class="nav-actions">
      <a id="login-btn" href="/app" class="btn btn-outline">Login</a>
      <a id="dash-btn" href="/app" class="btn btn-primary" hidden>Open Dashboard</a>
      <button id="logout-btn" type="button" class="btn btn-outline" hidden>Logout</button>
    </div>
  </div>
</header>`;
html = html.replace(/<header>[\s\S]*?<\/header>/, () => header);

// 2. CSS
const css = `.nav-actions{display:flex;gap:10px;align-items:center}
.nav .nav-actions .btn{display:inline-flex}
[hidden]{display:none!important}`;
if (!html.includes('.nav-actions{')) {
  html = html.replace('</style>', () => css + '\n</style>');
}

// 3. Login state script
const authScript = `<script>
(async function(){
  const login=document.getElementById('login-btn'),
        dash=document.getElementById('dash-btn'),
        logout=document.getElementById('logout-btn');
  try{
    const r=await fetch('/api/auth/verify');
    const d=r.ok?await r.json():{authenticated:false};
    if(d.authenticated){login.hidden=true;dash.hidden=false;logout.hidden=false;}
  }catch(e){}
  logout.addEventListener('click',async()=>{
    try{await fetch('/api/auth/logout',{method:'POST'});}catch(e){}
    location.reload();
  });
})();
</script>`;
if (!html.includes("/api/auth/verify")) {
  html = html.replace('</body>', () => authScript + '\n</body>');
}

// 4. Hero button, feature cards, footer
const swaps = [
  ['href="#dashboard"', 'href="/app"'],
  ['<h3>Resource Management</h3>', '<h3>Field Data Management</h3>'],
  ['<p>Track and manage beds, staff, equipment and other resources in real-time.</p>',
   '<p>Add villages manually or upload many at once with CSV or Excel. Edit or delete records and the rankings update instantly.</p>'],
  ['<p>Visualize data and gain valuable insights with easy-to-understand analytics and reports.</p>',
   '<p>Interactive priority map, filters, ranked tables and CSV export, plus a data quality report that flags missing information.</p>'],
  ['<p>Use defined criteria to ensure resources are allocated to those who need them most.</p>',
   '<p>A transparent 0 to 100 score built from flood risk, facility distance, BHU absence, road access and population, shown with data confidence.</p>'],
  ['<h3>Emergency Monitoring</h3>', '<h3>AI Assistant and Live Sources</h3>'],
  ['<p>Stay updated on urgent needs and available resources with real-time tracking.</p>',
   '<p>Ask questions in English, Urdu or Roman Urdu. Live WHO indicators and other approved sources appear as reference-only data.</p>'],
  ['\u00A9 2025', '\u00A9 2026']
];
swaps.forEach(([a, b]) => { html = html.split(a).join(b); });

// 5. Screenshots (only if all four images exist)
const shots = [
  ['dashboard.png', 'Dashboard'],
  ['rankings.png', 'Priority Rankings'],
  ['maternal.png', 'Maternal &amp; Child Health'],
  ['logdata.png', 'Log Field Data']
];
if (shots.every(s => fs.existsSync(path.join(IMG_DIR, s[0])))) {
  let i = 0;
  html = html.replace(/<img class="shot-img"[^>]*>/g, (orig) => {
    const s = shots[i++];
    return s ? `<img class="shot-img" src="/images/${s[0]}" alt="${s[1]} screenshot">` : orig;
  });
  const labels = [
    ['Resource Overview', shots[0][1]],
    ['Emergency Dashboard', shots[1][1]],
    ['Allocation Management', shots[2][1]],
    ['Data Upload', shots[3][1]]
  ];
  labels.forEach(([a, b]) => {
    html = html.split(`<figcaption class="shot-label">${a}</figcaption>`)
               .join(`<figcaption class="shot-label">${b}</figcaption>`);
  });
  console.log('Screenshots replaced.');
} else {
  console.log('Screenshots skipped: add the 4 images to src/images/ and run again.');
}

fs.writeFileSync(LANDING, html);

// 6. server.js: landing route, /app route, image types
let srv = fs.readFileSync(SERVER, 'utf8');
if (!srv.includes("'/landing.html'")) {
  srv = srv.replace(
    "if (pathname === '/') pathname = '/index.html';",
    "if (pathname === '/') pathname = '/landing.html';\n  else if (pathname === '/app') pathname = '/index.html';"
  );
}
if (!srv.includes("'.png'")) {
  srv = srv.replace(
    "'.json':'application/json; charset=utf-8' };",
    "'.json':'application/json; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };"
  );
}
fs.writeFileSync(SERVER, srv);

console.log('Done. landing.html and server.js updated.');