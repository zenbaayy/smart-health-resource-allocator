const fs = require('fs');
const path = require('path');

const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, c) => fs.writeFileSync(p, c);

// ---------- backups ----------
['src/landing.html', 'src/index.html', 'src/enhancements.js', 'src/additions.css', 'server/server.js']
  .forEach((f) => fs.copyFileSync(f, path.join('backup-' + path.basename(f))));

// ---------- 1. logo ----------
write('src/logo.svg', String.raw`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M24 44C10 33 3 26 3 16 3 9 8 4 14 4c4 0 8 2 10 6 2-4 6-6 10-6 6 0 11 5 11 12 0 10-7 17-21 28z" fill="#0f4c3a"/><path d="M6 24h10l3-7 5 14 4-9 3 2h11" fill="none" stroke="#fff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/></svg>`);

// ---------- 2. landing.html ----------
let L = read('src/landing.html');

const headScript = `<link rel="icon" type="image/svg+xml" href="/logo.svg">
<script>try{var t=localStorage.getItem('theme');if(t)document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>`;
if (!L.includes('href="/logo.svg"')) L = L.replace('</head>', () => headScript + '\n</head>');

const header = `<header>
  <div class="container nav">
    <a href="#home" class="logo" aria-label="Smart Health Resource Allocator">
      <img src="/logo.svg" alt="" width="42" height="42">
      <span><b>Smart Health</b><small>Resource Allocator</small></span>
    </a>
    <nav><ul>
      <li><a class="active" href="#home">Home</a></li>
      <li><a href="#features">Features</a></li>
      <li><a href="#about">About</a></li>
      <li><a href="#faq">FAQ</a></li>
      <li><a href="#contact">Contact</a></li>
    </ul></nav>
    <div class="nav-actions">
      <button id="theme-btn" type="button" class="icon-btn" aria-label="Toggle dark mode">🌙</button>
      <a id="login-btn" href="/app" class="btn btn-outline">Login</a>
      <a id="dash-btn" href="/app" class="btn btn-primary" hidden>Open Dashboard</a>
      <button id="logout-btn" type="button" class="btn btn-outline" hidden>Logout</button>
      <button id="menu-btn" type="button" class="icon-btn menu-btn" aria-label="Menu" aria-expanded="false">☰</button>
    </div>
  </div>
</header>`;
L = L.replace(/<header>[\s\S]*?<\/header>/, () => header);

const landingCss = `/* v2 */
.nav{position:relative}
.nav .nav-actions .btn{display:inline-flex}
[hidden]{display:none!important}
.logo img{width:42px;height:42px}
.icon-btn{width:40px;height:40px;border-radius:50%;border:1.5px solid var(--green-900);background:transparent;color:var(--green-900);font-size:1rem;cursor:pointer;display:grid;place-items:center}
.menu-btn{display:none}
.faq details{background:#fafaf7;border:1px solid var(--border);border-radius:8px;padding:16px 20px;margin-top:12px}
.faq summary{cursor:pointer;font-weight:600;color:var(--green-900)}
.faq details p{margin-top:10px;color:var(--muted);font-size:.9rem}
.tabs{display:flex;gap:8px;flex-wrap:wrap;margin:22px 0 16px}
.tab{padding:9px 18px;border-radius:999px;border:1.5px solid var(--green-900);background:transparent;color:var(--green-900);font:inherit;font-size:.85rem;cursor:pointer}
.tab.active{background:var(--green-900);color:#fff}
.contact-card{background:#fafaf7;border:1px solid var(--border);border-radius:8px;padding:24px;max-width:720px}
.contact-card form{display:grid;grid-template-columns:1fr 1fr;gap:14px}
.contact-card label{display:grid;gap:6px;font-size:.8rem;font-weight:500;color:var(--muted)}
.contact-card .full{grid-column:1/-1}
.contact-card input,.contact-card select,.contact-card textarea{font:inherit;padding:10px 12px;border:1px solid var(--border);border-radius:6px;background:var(--bg);color:var(--text)}
.contact-card textarea{min-height:90px;resize:vertical}
.hp{position:absolute;left:-9999px}
.form-msg{grid-column:1/-1;font-size:.88rem}
.form-msg.ok{color:var(--green-600)}
.form-msg.err{color:#b3261e}
@media(max-width:960px){
  .menu-btn{display:grid}
  .nav.open nav ul{display:flex;flex-direction:column;gap:0;position:absolute;top:70px;left:0;right:0;background:var(--bg);border-bottom:1px solid var(--border);padding:8px 4%;z-index:30}
  .nav.open nav ul a{padding:12px 0;display:block;border:0}
}
@media(max-width:560px){
  .logo small{display:none}
  .nav-actions{gap:6px}
  .nav-actions .btn{padding:8px 14px;font-size:.8rem}
  .contact-card form{grid-template-columns:1fr}
}
[data-theme="dark"]{--bg:#0f1a15;--bg-soft:#13221b;--text:#e6efe9;--muted:#a3b5ab;--border:#25382f;--green-900:#8fd6b0;--green-800:#a6e0c0;--green-600:#6cc79a;--green-200:#1f3a2e;--green-100:#18302a}
[data-theme="dark"] .hero{background:linear-gradient(180deg,#12211a,#0f1a15)}
[data-theme="dark"] .card,[data-theme="dark"] .faq details,[data-theme="dark"] .contact-card{background:#14231d}
[data-theme="dark"] .btn-primary,[data-theme="dark"] .tab.active{color:#0f1a15}
[data-theme="dark"] footer{background:#0b2a20}
[data-theme="dark"] .why-note{color:#a6e0c0}
[data-theme="dark"] .logo img{filter:brightness(1.6)}
`;
if (!L.includes('/* v2 */')) L = L.replace('</style>', () => landingCss + '</style>');

const sections = `<!-- ===== FAQ ===== -->
<section id="faq" class="faq">
  <div class="container">
    <div class="eyebrow">FAQ</div>
    <h2>Frequently Asked Questions</h2>
    <p class="sub">Quick answers about how the platform works.</p>
    <details><summary>What is Smart Health Resource Allocator?</summary><p>A decision-support dashboard for NGO field teams. It ranks villages by medical vulnerability so maternal, infant and child health camps can reach the highest-barrier areas first.</p></details>
    <details><summary>How is the priority score calculated?</summary><p>A transparent 0 to 100 weighted score: flood risk 40%, facility distance 25%, BHU absence 15%, road accessibility 10% and verified population 10%. Missing fields are excluded, never guessed.</p></details>
    <details><summary>Where does the data come from?</summary><p>From the supplied village dataset plus records your team adds through manual entry or CSV/Excel bulk upload. Live WHO indicators in the AI assistant are shown as reference only and never change the scores.</p></details>
    <details><summary>Does the tool replace field verification?</summary><p>No. It supports planning. The final allocation decision always remains with the NGO officer.</p></details>
    <details><summary>How do I add new villages?</summary><p>Log in, open Log field data, and either fill the form or upload a CSV/Excel file. Rankings update immediately.</p></details>
    <details><summary>Do I need an account?</summary><p>You can read this page without one. To use the dashboard, create an account from the login screen.</p></details>
  </div>
</section>

<!-- ===== CONTACT ===== -->
<section id="contact">
  <div class="container">
    <div class="eyebrow">Get in touch</div>
    <h2>Tell us who you are</h2>
    <p class="sub">Choose the option that fits you. No login needed.</p>
    <div class="tabs" id="form-tabs"></div>
    <div class="contact-card"><form id="contact-form"></form></div>
  </div>
</section>

`;
if (!L.includes('id="faq"')) L = L.replace('<!-- ===== FOOTER ===== -->', () => sections + '<!-- ===== FOOTER ===== -->');

const landingJs = String.raw`<script>
/* v2-script */
(function(){
  var root=document.documentElement,tb=document.getElementById('theme-btn');
  function setT(t){root.setAttribute('data-theme',t);try{localStorage.setItem('theme',t)}catch(e){}if(tb)tb.textContent=t==='dark'?'☀️':'🌙'}
  var t0='light';try{t0=localStorage.getItem('theme')||'light'}catch(e){}
  setT(t0);
  if(tb)tb.addEventListener('click',function(){setT(root.getAttribute('data-theme')==='dark'?'light':'dark')});

  var nav=document.querySelector('.nav'),mb=document.getElementById('menu-btn');
  if(mb)mb.addEventListener('click',function(){var o=nav.classList.toggle('open');mb.setAttribute('aria-expanded',o)});
  document.querySelectorAll('.nav nav a').forEach(function(a){a.addEventListener('click',function(){nav.classList.remove('open')})});

  var FORMS={
    ngo:{label:'NGO / Program Officer',fields:[['name','Contact person','text'],['email','Email','email'],['org','Organization','text'],['district','District(s) of interest','text'],['message','How can we help?','textarea']]},
    field:{label:'Field Officer',fields:[['name','Your name','text'],['email','Email','email'],['village','Village / area name','text'],['topic','Topic','select',['Data correction','New area to add','Access problem','Other']],['message','Details','textarea']]},
    volunteer:{label:'Volunteer',fields:[['name','Your name','text'],['email','Email','email'],['skill','Skill','select',['Medical','Data entry','Translation','Logistics','Other']],['availability','Availability','select',['Weekdays','Weekends','Flexible']],['message','Why would you like to help?','textarea']]},
    general:{label:'General question',fields:[['name','Your name','text'],['email','Email','email'],['message','Your question','textarea']]}
  };
  var tabsEl=document.getElementById('form-tabs'),formEl=document.getElementById('contact-form');
  if(!tabsEl||!formEl)return;
  function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;')}
  function show(type){
    var f=FORMS[type],h='';
    f.fields.forEach(function(x){
      h+='<label'+(x[2]==='textarea'?' class="full"':'')+'>'+esc(x[1]);
      if(x[2]==='textarea')h+='<textarea name="'+x[0]+'" required></textarea>';
      else if(x[2]==='select'){h+='<select name="'+x[0]+'">';x[3].forEach(function(o){h+='<option>'+esc(o)+'</option>'});h+='</select>'}
      else h+='<input name="'+x[0]+'" type="'+x[2]+'" required>';
      h+='</label>';
    });
    h+='<input class="hp" name="hp" tabindex="-1" autocomplete="off" aria-hidden="true">';
    h+='<div class="full"><button class="btn btn-primary" type="submit">Send</button></div><div class="form-msg" id="form-msg"></div>';
    formEl.innerHTML=h;formEl.dataset.type=type;
    Array.prototype.forEach.call(tabsEl.children,function(b){b.classList.toggle('active',b.dataset.type===type)});
  }
  Object.keys(FORMS).forEach(function(k){
    var b=document.createElement('button');b.type='button';b.className='tab';b.dataset.type=k;b.textContent=FORMS[k].label;
    b.addEventListener('click',function(){show(k)});tabsEl.appendChild(b);
  });
  formEl.addEventListener('submit',function(e){
    e.preventDefault();
    var fd=new FormData(formEl),fields={},hp='';
    fd.forEach(function(v,k){if(k==='hp')hp=v;else fields[k]=v});
    var msg=document.getElementById('form-msg');msg.className='form-msg';msg.textContent='Sending...';
    fetch('/api/inquiries',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:formEl.dataset.type,fields:fields,hp:hp})})
      .then(function(r){return r.json().then(function(d){return {ok:r.ok,d:d}})})
      .then(function(res){
        if(res.ok){var m=document.getElementById('form-msg');formEl.reset();m.className='form-msg ok';m.textContent=res.d.message+' Reference: '+res.d.ref}
        else{msg.className='form-msg err';msg.textContent=res.d.error||'Could not send.'}
      }).catch(function(){msg.className='form-msg err';msg.textContent='Network error. Please try again.'});
  });
  show('ngo');
})();
</script>`;
if (!L.includes('/* v2-script */')) L = L.replace('</body>', () => landingJs + '\n</body>');
write('src/landing.html', L);

// ---------- 3. index.html (app) ----------
let I = read('src/index.html');
if (!I.includes('href="/logo.svg"')) I = I.replace('</head>', () => '<link rel="icon" type="image/svg+xml" href="/logo.svg">\n</head>');
if (!I.includes('id="theme"')) I = I.replace('<button id="language"', () => '<button id="theme" class="outline" onclick="toggleTheme()" aria-label="Toggle dark mode">🌙</button><button id="language"');
write('src/index.html', I);

// ---------- 4. enhancements.js (login eye, back link, logo, theme) ----------
let E = read('src/enhancements.js');
if (!E.includes('pw-wrap')) {
  E = E.replace(/<input id="(login-password|signup-password|signup-confirm)" type="password"([^>]*)>/g,
    (m, id, rest) => '<span class="pw-wrap"><input id="' + id + '" type="password"' + rest + '><button type="button" class="eye" onclick="togglePw(\'' + id + '\',this)" aria-label="Show password">👁</button></span>');
}
E = E.split('<div class="login-card"><div class="brand"><span>✚</span>')
  .join('<div class="login-card"><a href="/" class="back-home">← Back to home</a><div class="brand"><img class="login-logo" src="/logo.svg" alt="Logo">');
if (!E.includes('function togglePw')) {
  E += String.raw`

/* v2: password eye + theme */
function togglePw(id,btn){var i=document.getElementById(id);var show=i.type==='password';i.type=show?'text':'password';btn.textContent=show?'🙈':'👁';btn.setAttribute('aria-label',show?'Hide password':'Show password')}
function applyTheme(t){document.documentElement.setAttribute('data-theme',t);try{localStorage.setItem('theme',t)}catch(e){}var b=document.getElementById('theme');if(b)b.textContent=t==='dark'?'☀️':'🌙'}
function toggleTheme(){applyTheme(document.documentElement.getAttribute('data-theme')==='dark'?'light':'dark')}
(function(){var t='light';try{t=localStorage.getItem('theme')||'light'}catch(e){}applyTheme(t)})();
`;
}
write('src/enhancements.js', E);

// ---------- 5. additions.css ----------
let C = read('src/additions.css');
if (!C.includes('/* v2 */')) {
  C += String.raw`
/* v2 */
.pw-wrap{position:relative;display:block}
.pw-wrap input{width:100%;padding-right:44px}
.eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;font-size:18px;cursor:pointer;padding:4px}
.back-home{display:inline-block;margin-bottom:14px;font-size:13px;font-weight:700;color:var(--emerald);text-decoration:none}
.login-logo{width:40px;height:40px}
.login-card{width:100%;max-width:420px}
.login-page{padding:16px}
[data-theme="dark"]{--cream:#0e1814;--card:#14231d;--ink:#e6efe9;--muted:#9fb3a8;--line:#25382f}
[data-theme="dark"] header{background:#0f1c17}
[data-theme="dark"] select,[data-theme="dark"] input,[data-theme="dark"] textarea{background:#0f1c17;color:var(--ink);border-color:var(--line)}
[data-theme="dark"] .outline{background:#14231d;color:#8fd6b0;border-color:#2b4a3c}
[data-theme="dark"] .chat-log,[data-theme="dark"] .weight,[data-theme="dark"] .login-card{background:#14231d}
[data-theme="dark"] .message.bot{background:#1a2f26}
[data-theme="dark"] .quick button{background:#14231d;color:#8fd6b0}
[data-theme="dark"] .login-logo{filter:brightness(1.6)}
`;
}
write('src/additions.css', C);

// ---------- 6. server.js ----------
let S = read('server/server.js');
if (!S.includes('/api/inquiries')) {
  const route = String.raw`if (req.method === 'POST' && pathname === '/api/inquiries') {
    const raw = await readBody(req);
    let b; try { b = JSON.parse(raw); } catch { return json(res, 400, { error: 'Invalid request.' }); }
    if (b.hp) return json(res, 201, { message: 'Thank you! We received your request.', ref: 'SH-OK' });
    if (!['ngo','field','volunteer','general'].includes(b.type) || !b.fields || typeof b.fields !== 'object') return json(res, 400, { error: 'Invalid form.' });
    const clean = {};
    for (const [k, v] of Object.entries(b.fields).slice(0, 12)) clean[String(k).slice(0, 40)] = String(v == null ? '' : v).slice(0, 1000);
    if (!clean.name || !clean.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean.email)) return json(res, 400, { error: 'Name and a valid email are required.' });
    const entry = { ref: 'SH-' + Date.now().toString(36).toUpperCase(), type: b.type, fields: clean, at: new Date().toISOString() };
    console.log('INQUIRY', JSON.stringify(entry));
    try { fs.appendFileSync(path.join(require('os').tmpdir(), 'inquiries.jsonl'), JSON.stringify(entry) + '\n'); } catch (e) {}
    return json(res, 201, { message: 'Thank you! We received your request.', ref: entry.ref });
  }

  `;
  const marker = "if (req.method === 'GET' && pathname === '/api/auth/verify') {";
  if (S.includes(marker)) S = S.replace(marker, () => route + marker);
  else console.log('WARNING: could not find the verify route in server.js; inquiries route not added.');
}
if (!S.includes("'.svg'")) console.log("WARNING: '.svg' is missing from the content types in server.js serve(). Add: '.svg':'image/svg+xml'");
write('server/server.js', S);

console.log('Done. Backups saved as backup-*.html/js/css in the project root.');