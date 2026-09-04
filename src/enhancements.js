/* Extensions preserve the supplied records and scoring weights. */
function showToast(message, duration = 3000) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('show'));
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}
function logData(){
  const e = state.editing;
  return `<div class="card" style="max-width:650px"><p class="eyebrow">FIELD DATA ENTRY</p><h2>${e?tr('Edit area','علاقہ میں ترمیم کریں'):tr('Log field data','فیلڈ ڈیٹا درج کریں')}</h2><p>${e?tr('Update ground data for this area.','اس علاقے کا ڈیٹا اپ ڈیٹ کریں۔'):tr('Add ground data for a new area. It appears in the dashboard immediately.','نئے علاقے کا زمینی ڈیٹا شامل کریں۔')}</p>
  <form onsubmit="handleLogData(event)" style="display:grid;gap:14px;margin-top:16px">
  <label>${tr('Area name','علاقے کا نام')}<input id="fd-village" required placeholder="e.g. Bahrain" value="${e?esc(e.village):''}"></label>
  <label>${tr('District','ضلع')}<input id="fd-district" required placeholder="e.g. Swat" value="${e?esc(e.district):''}"></label>
  <label>${tr('Tehsil','تحصیل')}<input id="fd-tehsil" placeholder="e.g. Bahrain" value="${e?esc(e.tehsil):''}"></label>
  <label>${tr('Population','آبادی')}<input id="fd-population" type="number" placeholder="e.g. 3200" value="${e&&e.populationVerified?e.population:''}"></label>
  <label>${tr('Distance to nearest facility (km)','فاصلہ (کلومیٹر)')}<input id="fd-distance" type="number" step="0.1" placeholder="e.g. 28" value="${e&&typeof e.distance_km==='number'?e.distance_km:''}"></label>
  <label>${tr('Flood risk','سیلاب کا خطرہ')}<select id="fd-flood">${['Unknown','Low','Medium','Medium-High','High'].map(o=>`<option ${e&&e.flood_risk===o?'selected':''}>${o}</option>`).join('')}</select></label>
  <label>${tr('Accessibility','رسائی')}<select id="fd-access">${['Unknown','Good','Moderate','Difficult','Poor'].map(o=>`<option ${e&&e.accessibility===o?'selected':''}>${o}</option>`).join('')}</select></label>
  <label><input id="fd-bhu" type="checkbox" ${e&&e.has_bhu_on_site?'checked':''}> ${tr('BHU present on site','بی ایچ یو موجود ہے')}</label>
  <div id="fd-error" class="login-error"></div>
  <div style="display:flex;gap:10px">
  <button class="primary" type="submit">${e?tr('Save changes','محفوظ کریں'):tr('Add area','علاقہ شامل کریں')}</button>
  ${e?`<button class="outline" type="button" onclick="cancelEdit()">${tr('Cancel','منسوخ کریں')}</button>`:''}
  </div>
  </form></div>
  ${e?'':`<div class="card" style="max-width:650px;margin-top:18px"><p class="eyebrow">${tr('BULK IMPORT','بلک درآمد')}</p><h2>${tr('Upload data file','ڈیٹا فائل اپ لوڈ کریں')}</h2><p>${tr('Upload a CSV or Excel file with multiple areas at once. They will be added to the same dataset used across the dashboard.','ایک ساتھ کئی علاقے شامل کرنے کے لیے CSV یا Excel فائل اپ لوڈ کریں۔')}</p>
  <p style="font-size:12px;color:var(--muted);line-height:1.7"><b>${tr('Expected columns:','متوقع کالم:')}</b><br>Area Name, District, Tehsil, Population, Distance to Nearest Facility (km), Flood Risk, Accessibility, BHU Present on Site</p>
  <button class="outline" type="button" onclick="downloadTemplate()">${tr('Download template','نمونہ ڈاؤن لوڈ کریں')}</button>
  <div style="margin-top:14px"><input type="file" id="bulk-file" accept=".csv,.xlsx,.xls" onchange="handleBulkUpload(event)"></div>
  <div id="bulk-status" style="margin-top:14px"></div>
  </div>`}`;
}
function cancelEdit(){state.editing=null;go('rankings')}
async function handleLogData(event){
  event.preventDefault();
  const err=$('#fd-error'); err.textContent='';
  const body={village:$('#fd-village').value.trim(),district:$('#fd-district').value.trim(),tehsil:$('#fd-tehsil').value.trim(),population:$('#fd-population').value,distance_km:$('#fd-distance').value,flood_risk:$('#fd-flood').value,accessibility:$('#fd-access').value,has_bhu_on_site:$('#fd-bhu').checked};
  const editing = state.editing;
  try{
    const url = editing ? `/api/villages/${encodeURIComponent(editing.id)}` : '/api/villages';
    const method = editing ? 'PUT' : 'POST';
    const res=await fetch(url,{method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const data=await res.json();
    if(!res.ok){err.textContent=data.error||'Could not save area';return}
    showToast(editing?tr('Area updated successfully','علاقہ اپ ڈیٹ ہو گیا'):tr('Area added successfully','علاقہ شامل ہو گیا'));
    state.editing=null;
    await loadData();
    go('rankings');
  }catch(e){err.textContent='Network error. Please try again.'}
}
function editVillage(key){
  const v = state.data.find(x=>x.rowKey===key);
  if(!v) return;
  state.editing = v;
  go('logdata');
}
async function deleteVillage(key){
  const v = state.data.find(x=>x.rowKey===key);
  if(!v) return;
  if(!confirm(`Delete ${v.village}? This cannot be undone.`)) return;
  try{
    const res=await fetch(`/api/villages/${encodeURIComponent(v.id)}`,{method:'DELETE'});
    const data=await res.json();
    if(!res.ok){showToast(data.error||'Could not delete area');return}
    showToast(tr('Area deleted','علاقہ حذف ہو گیا'));
    await loadData();
    render();
  }catch(e){showToast('Network error. Please try again.')}
}
function downloadTemplate(){
  const headers=['Area Name','District','Tehsil','Population','Distance to Nearest Facility (km)','Flood Risk','Accessibility','BHU Present on Site'];
  const sample=['Bahrain','Swat','Bahrain','3200','28','Medium','Difficult','No'];
  const csv=[headers,sample].map(r=>r.map(x=>`"${String(x).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob=new Blob([csv],{type:'text/csv'}),a=document.createElement('a');
  a.href=URL.createObjectURL(blob);a.download='field-data-template.csv';a.click();URL.revokeObjectURL(a.href);
}
function parseCSVText(text){
  const rows=[];let row=[],field='',inQuotes=false;
  for(let i=0;i<text.length;i++){
    const c=text[i];
    if(inQuotes){
      if(c==='"'){ if(text[i+1]==='"'){field+='"';i++;} else inQuotes=false; }
      else field+=c;
    } else {
      if(c==='"') inQuotes=true;
      else if(c===','){row.push(field);field='';}
      else if(c==='\n'){row.push(field);rows.push(row);row=[];field='';}
      else if(c==='\r'){}
      else field+=c;
    }
  }
  if(field.length||row.length){row.push(field);rows.push(row);}
  return rows.filter(r=>r.some(x=>x.trim()!==''));
}
function normalizeRows(rawRows){
  if(!rawRows.length) return [];
  const headers=rawRows[0].map(h=>String(h).trim().toLowerCase());
  const idx={
    village: headers.findIndex(h=>h.includes('area')||h.includes('village')),
    district: headers.findIndex(h=>h.includes('district')),
    tehsil: headers.findIndex(h=>h.includes('tehsil')),
    population: headers.findIndex(h=>h.includes('population')),
    distance: headers.findIndex(h=>h.includes('distance')),
    flood: headers.findIndex(h=>h.includes('flood')),
    access: headers.findIndex(h=>h.includes('access')),
    bhu: headers.findIndex(h=>h.includes('bhu'))
  };
  const toBool=v=>{const s=String(v).trim().toLowerCase();return s==='yes'||s==='true'||s==='1';};
  const asNum=v=>{const s=String(v).trim();if(s==='')return '';const n=Number(s);return isNaN(n)?null:n;};
  return rawRows.slice(1).map(r=>{
    const pop=idx.population>-1?asNum(r[idx.population]):'';
    const dist=idx.distance>-1?asNum(r[idx.distance]):'';
    return {
      village: idx.village>-1?String(r[idx.village]||'').trim():'',
      district: idx.district>-1?String(r[idx.district]||'').trim():'',
      tehsil: idx.tehsil>-1?String(r[idx.tehsil]||'').trim():'',
      population: pop===null?'__invalid__':pop,
      distance_km: dist===null?'__invalid__':dist,
      flood_risk: idx.flood>-1?String(r[idx.flood]||'').trim():'',
      accessibility: idx.access>-1?String(r[idx.access]||'').trim():'',
      has_bhu_on_site: idx.bhu>-1?toBool(r[idx.bhu]):false
    };
  });
}
async function handleBulkUpload(event){
  const file=event.target.files[0];
  if(!file) return;
  const statusEl=$('#bulk-status');
  statusEl.innerHTML=`<p style="color:var(--muted)">${tr('Reading file…','فائل پڑھی جا رہی ہے…')}</p>`;
  try{
    let rawRows;
    if(file.name.toLowerCase().endsWith('.csv')){
      const text=await file.text();
      rawRows=parseCSVText(text);
    } else {
      if(!window.XLSX){statusEl.innerHTML=`<p class="login-error">${tr('Excel support failed to load. Please use a CSV file.','ایکسل سپورٹ لوڈ نہیں ہوا۔ براہ کرم CSV فائل استعمال کریں۔')}</p>`;return;}
      const buf=await file.arrayBuffer();
      const wb=XLSX.read(buf,{type:'array'});
      const sheet=wb.Sheets[wb.SheetNames[0]];
      rawRows=XLSX.utils.sheet_to_json(sheet,{header:1,raw:false,defval:''});
    }
    const rows=normalizeRows(rawRows);
    const preErrors=[];
    const validRows=[];
    rows.forEach((r,i)=>{
      const rowNum=i+2;
      if(!r.village||!r.district){preErrors.push(`Row ${rowNum}: Area name and district are required — skipped locally.`);return;}
      if(r.population==='__invalid__'){preErrors.push(`Row ${rowNum}: Population is not a valid number — sent as empty.`);r.population='';}
      if(r.distance_km==='__invalid__'){preErrors.push(`Row ${rowNum}: Distance is not a valid number — sent as empty.`);r.distance_km='';}
      validRows.push(r);
    });
    if(!validRows.length){
      statusEl.innerHTML=`<p class="login-error">${tr('No valid rows found in the file.','فائل میں کوئی درست قطار نہیں ملی۔')}</p>`;
      return;
    }
    const res=await fetch('/api/villages/bulk',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({rows:validRows})});
    const data=await res.json();
    if(!res.ok){statusEl.innerHTML=`<p class="login-error">${data.error||'Upload failed'}</p>`;return;}
    const allErrors=[...preErrors,...(data.errors||[])];
    statusEl.innerHTML=`<div class="notice"><b>${tr('Upload complete','اپ لوڈ مکمل')}</b><br>
      ${tr('Total rows','کل قطاریں')}: ${data.totalRows} · ${tr('Imported','درآمد شدہ')}: ${data.imported} · ${tr('Skipped (duplicates)','چھوڑی گئیں')}: ${data.skipped} · ${tr('Rejected','مسترد')}: ${data.rejected}
      ${allErrors.length?`<details style="margin-top:8px"><summary>${tr('View details','تفصیلات دیکھیں')} (${allErrors.length})</summary><ul style="margin:8px 0 0;padding-left:18px">${allErrors.map(e=>`<li>${esc(e)}</li>`).join('')}</ul></details>`:''}
    </div>`;
    if(data.imported>0){ showToast(tr(`${data.imported} area(s) imported successfully`,`${data.imported} علاقے درآمد ہو گئے`)); await loadData(); }
    event.target.value='';
  }catch(e){
    statusEl.innerHTML=`<p class="login-error">${tr('Could not read the file. Please check the format and try again.','فائل نہیں پڑھی جا سکی۔')}</p>`;
  }
}
function rankings(){let rows=[...list()].sort((a,b)=>{let x=a[state.sort.key],y=b[state.sort.key];if(x===null)x=-1;if(y===null)y=-1;return (typeof x==='number'?x-y:String(x).localeCompare(String(y)))*state.sort.dir});const cols=[['village','Location'],['id','ID'],['tehsil','Tehsil'],['district','District'],['score','Score'],['priority','Priority'],['confidence','Confidence'],['distance_km','Distance'],['population','Population']];return `${filters()}<div class="card"><div class="card-head"><div><h3>${tr('Ranked locations','درجہ بند مقامات')}</h3><p>${tr('Sortable results update with your filters.','فلٹر کے مطابق ترتیب شدہ نتائج۔')}</p></div><button class="primary" onclick="exportCsv()">${tr('Export CSV','CSV برآمد کریں')}</button></div><div class="table-wrap"><table class="table"><thead><tr><th>#</th>${cols.map(([k,l])=>`<th><button class="sort" onclick="sortBy('${k}')">${l}${state.sort.key===k?(state.sort.dir===1?' ↑':' ↓'):''}</button></th>`).join('')}<th></th></tr></thead><tbody>${rows.map((v,i)=>`<tr><td>${i+1}</td><td><b>${esc(v.village)}</b></td><td>${esc(v.id)}</td><td>${esc(v.tehsil)}</td><td>${esc(v.district)}</td><td><b>${v.score??'—'}</b></td><td>${badge(v.priority)}</td><td>${v.confidence} (${v.confidencePct}%)</td><td>${typeof v.distance_km==='number'?v.distance_km+' km':'Not Available'}</td><td>${v.populationVerified?v.population.toLocaleString():'Not Available'}</td><td style="white-space:nowrap"><button class="link" onclick="select('${v.rowKey}')">${tr('Details','تفصیل')} →</button> <button class="link" onclick="editVillage('${v.rowKey}')">${tr('Edit','ترمیم')}</button> <button class="link" style="color:#c83f34" onclick="deleteVillage('${v.rowKey}')">${tr('Delete','حذف کریں')}</button></td></tr>`).join('')||`<tr><td colspan="11" class="empty">${tr('No locations match these filters.','کوئی مقام فلٹر سے مطابقت نہیں رکھتا۔')}</td></tr>`}</tbody></table></div></div>`}
state.auth=false;state.filters.flood='All';
function qualityReport(){const d=state.data;return{duplicateIds:d.filter((v,i)=>d.some((x,j)=>j<i&&x.id===v.id)).length,missingCoords:d.filter(v=>typeof v.latitude!=='number'||typeof v.longitude!=='number').length,missingPop:d.filter(v=>!v.populationVerified).length,unknownFlood:d.filter(v=>v.flood_risk==='Unknown').length,unknownAccess:d.filter(v=>v.accessibility==='Unknown').length,missingDistance:d.filter(v=>typeof v.distance_km!=='number').length,adminPopulation:d.filter(v=>v.id==='RJ-09').length}}
function list(){return state.data.filter(v=>(state.filters.district==='All'||v.district===state.filters.district)&&(state.filters.tehsil==='All'||v.tehsil===state.filters.tehsil)&&(state.filters.priority==='All'||v.priority===state.filters.priority)&&(state.filters.confidence==='All'||v.confidence===state.filters.confidence)&&(state.filters.flood==='All'||v.flood_risk===state.filters.flood)&&(!state.filters.search||v.village.toLowerCase().includes(state.filters.search.toLowerCase())))}
function changeFilter(k,v){state.filters[k]=v;if(k==='district')state.filters.tehsil='All';render()}function clearFilters(){state.filters={district:'All',tehsil:'All',priority:'All',confidence:'All',flood:'All',search:''};render()}
function filters(){const ds=[...new Set(state.data.map(x=>x.district))],ts=[...new Set(state.data.filter(x=>state.filters.district==='All'||x.district===state.filters.district).map(x=>x.tehsil))];return `<div class="filters"><label>District<select onchange="changeFilter('district',this.value)">${options(ds,state.filters.district)}</select></label><label>Tehsil<select onchange="changeFilter('tehsil',this.value)">${options(ts,state.filters.tehsil)}</select></label><label>Priority<select onchange="changeFilter('priority',this.value)">${options(['Critical','High','Medium','Low','Survey Required'],state.filters.priority)}</select></label><label>Flood risk<select onchange="changeFilter('flood',this.value)">${options(['High','Medium-High','Medium','Low','Unknown'],state.filters.flood)}</select></label><label>Data confidence<select onchange="changeFilter('confidence',this.value)">${options(['High','Medium','Low'],state.filters.confidence)}</select></label><label>Search location<input value="${esc(state.filters.search)}" oninput="changeFilter('search',this.value)" placeholder="Village name"></label><button class="clear" onclick="clearFilters()">Clear filters</button></div>`}
async function renderLogin(){const box=$('#login-screen'),shell=$('#app-shell');shell.hidden=true;box.hidden=false;box.className='login-page';box.innerHTML=`<div class="login-card"><div class="brand"><span>✚</span><div>Alkhidmat<small>SMART HEALTH ALLOCATOR</small></div></div><p class="eyebrow">SECURE ACCESS</p><h1>Login</h1><p>Access the healthcare resource-allocation decision-support dashboard.</p><form onsubmit="handleLogin(event)"><label>Email<input id="login-email" type="email" autocomplete="username" required></label><label>Password<input id="login-password" type="password" autocomplete="current-password" required></label><div id="login-error" class="login-error"></div><button class="primary" type="submit">Login to dashboard</button></form><p style="margin-top:1rem;text-align:center"><button class="link" type="button" onclick="showSignup()">Create new account</button></p></div>`}
async function handleLogin(event){event.preventDefault();const email=$('#login-email').value.trim().toLowerCase(),password=$('#login-password').value,err=$('#login-error');err.textContent='';try{const res=await fetch('/api/auth/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const data=await res.json();if(!res.ok){err.textContent=data.error||'Login failed';return}state.auth=true;loadData()}catch(e){err.textContent='Network error. Please try again.'}}
function showSignup(){const box=$('#login-screen');box.innerHTML=`<div class="login-card"><div class="brand"><span>✚</span><div>Alkhidmat<small>SMART HEALTH ALLOCATOR</small></div></div><p class="eyebrow">CREATE ACCOUNT</p><h1>Create account</h1><form onsubmit="handleSignup(event)"><label>Email<input id="signup-email" type="email" autocomplete="username" required></label><label>Password<input id="signup-password" type="password" autocomplete="new-password" required minlength="8"></label><label>Confirm password<input id="signup-confirm" type="password" autocomplete="new-password" required minlength="8"></label><div id="signup-error" class="login-error"></div><button class="primary" type="submit">Create account</button></form><p style="margin-top:1rem;text-align:center"><button class="link" type="button" onclick="renderLogin()">Back to login</button></p></div>`}
async function handleSignup(event){event.preventDefault();const email=$('#signup-email').value.trim().toLowerCase(),password=$('#signup-password').value,confirm=$('#signup-confirm').value,err=$('#signup-error');err.textContent='';if(password!==confirm){err.textContent='Passwords do not match';return}try{const res=await fetch('/api/auth/signup',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});const data=await res.json();if(!res.ok){err.textContent=data.error||'Signup failed';return}showToast('Account created successfully. Please login.');renderLogin()}catch(e){err.textContent='Network error. Please try again.'}}
async function logout(){try{await fetch('/api/auth/logout',{method:'POST'})}catch(e){}state.auth=false;state.page='dashboard';render()}
async function checkAuth(){try{const res=await fetch('/api/auth/verify');if(res.ok){const data=await res.json();state.auth=data.authenticated;if(data.authenticated){loadData();return}}}catch(e){}render()}
checkAuth();
function quality(){const q=qualityReport(),rows=[['Duplicate source IDs',q.duplicateIds,'Verification required'],['Records without supplied GPS',q.missingCoords,'Field mapping required'],['Records without verified village population',q.missingPop,'Survey required'],['Administrative population values excluded',q.adminPopulation,'RJ-09 / Fazilpur Outskirts'],['Unknown flood risk',q.unknownFlood,'Data verification required'],['Unknown accessibility',q.unknownAccess,'Data verification required'],['Missing facility distance',q.missingDistance,'Data verification required']];return `<div class="card"><p class="eyebrow">BUILT · DATA VALIDATION</p><h2>Data quality and verification</h2><p>Checks run against the supplied dataset. They identify gaps; they do not replace missing values with assumptions.</p><div class="quality-list">${rows.map(r=>`<div class="quality-row"><span><b>${r[0]}</b><br><small>${r[2]}</small></span><b>${r[1]}</b></div>`).join('')}</div></div><div class="dashboard-grid"><div class="card"><h3>Responsible data handling</h3><p>Fazilpur Outskirts’ administrative population value is excluded from village-level display and scoring. The duplicate RJ-07 source ID remains visible for Tatarwala and Lalgarh until verified at source.</p></div><div class="card"><h3>Missing-data workflow</h3><p>Incomplete Data → Survey Required → Field Verification → Data Updated → Priority Recalculated</p><p>Final allocation decision remains with the NGO/program officer.</p></div></div>`}
function overview(){return `<div class="hero"><div><p class="eyebrow">HEALTHCARE RESOURCE ALLOCATION DECISION SUPPORT</p><h2>Given limited healthcare resources, which rural location should receive support first, and why?</h2><p>This system uses rule-based weighted scoring and transparent data validation. It supports planning; NGO officers make the final allocation decision.</p></div></div><div class="dashboard-grid"><div class="card"><h3>Implemented features</h3><p class="status-built">BUILT</p><p>Secure login, supplied location dataset, validation checks, weighted priority engine, confidence calculation, map, filters, rankings, detail view, CSV export, and a secure optional Grok server route.</p><h3>Planned production features</h3><p class="status-future">FUTURE</p><p>Role management, field-data updates, audit logs, organization separation, and production LLM explanation deployment.</p></div><div class="card"><h3>Role design</h3><div class="role-grid"><div><b>NGO Admin</b><p>Manage users, datasets, access, and exports.</p></div><div><b>Program Officer</b><p>Review priorities and export planning reports.</p></div><div><b>Field Officer</b><p>Review assigned areas and submit field verification.</p></div></div><p><small>Roles are architecture only; role-based access control is not currently enforced.</small></p></div></div>`}
function methodology(){return `<div class="card"><p class="eyebrow">BUILT · RULE-BASED WEIGHTED SCORING</p><h2>Transparent prioritisation framework</h2><p>Priority score is a weighted combination of available urgency and access indicators. It is not a prediction or a medical diagnosis.</p><div class="method-grid">${[['Flood risk','40%'],['Facility distance','25%'],['No BHU','15%'],['Road accessibility','10%'],['Verified population','10%']].map(([x,y])=>`<div class="weight"><strong>${y}</strong><br>${x}</div>`).join('')}</div></div><div class="dashboard-grid"><div class="card"><h3>Score and confidence are separate</h3><p>Missing fields are excluded from the score denominator rather than guessed. Confidence shows the available verified weighting: High ≥75%, Medium 45–74%, Low &lt;45%. A high priority score does not automatically mean high data confidence.</p><p><b>Priority tiers:</b> 80–100 Critical · 60–79 High · 40–59 Medium · 0–39 Low. Survey Required applies if a score cannot be calculated.</p></div><div class="card"><h3>Architecture</h3><pre>NGO User → Secure Login → Dashboard
                         ↓
Map / Ranking / Location Detail
                         ↓
Data Validation → Priority Engine
                         ↓
Priority Score + Data Confidence
                         ↓
Explanation / Action → NGO Final Decision</pre><p><small>FUTURE: Validated data → score + confidence → LLM explanation layer → NGO decision.</small></p></div></div>`}
function assistant(){return `<div class="chat"><div class="card"><p class="eyebrow">${tr('BUILT · DETERMINISTIC ENGINE + LIVE EXTERNAL SOURCES','تعمیر شدہ · یقینی انجن اور براہِ راست بیرونی ذرائع')}</p><h2>${tr('Ask about the dashboard data or approved external sources','ڈیش بورڈ ڈیٹا یا منظور شدہ بیرونی ذرائع کے بارے میں پوچھیں')}</h2><p>${tr('Questions about the 15 supplied locations are answered by the deterministic rule-based engine — scores are never changed or overridden. Questions about WHO indicators, NDMA alerts, the census, BHU listings, Rescue 1122, socio-economic data or mapped facilities are routed through the secure server for live retrieval from the approved source. External data is reference-only and never overwrites the internal dataset. Answers work in English, Urdu and Roman Urdu.','15 فراہم کردہ مقامات کے بارے میں سوالات یقینی اصول پر مبنی انجن جواب دیتا ہے — اسکورز کبھی تبدیل نہیں ہوتے۔ ڈبلیو ایچ او اشاریوں، این ڈی ایم اے الرٹس، مردم شماری، بی ایچ یو فہرستوں، ریسکیو 1122، معاشی و سماجی ڈیٹا یا نقشے کی سہولیات کے بارے میں سوالات محفوظ سرور کے ذریعے منظور شدہ ذریعے سے براہِ راست حاصل کیے جاتے ہیں۔ بیرونی ڈیٹا صرف حوالے کے لیے ہے اور اندرونی ڈیٹا کو کبھی تبدیل نہیں کرتا۔ جوابات انگریزی، اردو اور رومن اردو میں کام کرتے ہیں۔')}</p><div class="quick"><button onclick="quick('Which locations need immediate attention?')">${tr('Immediate attention','فوری توجہ')}</button><button onclick="quick('Which locations need field verification?')">${tr('Field verification','فیلڈ تصدیق')}</button><button onclick="quick('What is the maternal mortality ratio in Pakistan?')">${tr('WHO indicators','ڈبلیو ایچ او اشاریے')}</button><button onclick="quick('Are there any NDMA flood alerts?')">${tr('NDMA alerts','این ڈی ایم اے الرٹس')}</button><button onclick="quick('Show health facilities near Kotla Sher Muhammad on OpenStreetMap')">${tr('Nearby facilities (OSM)','قریبی سہولیات (OSM)')}</button></div><div id="chat-log" class="chat-log"><div class="message bot">${tr('Ask a question about the supplied locations or an approved external source. Every answer shows whether it uses internal or external data.','فراہم کردہ مقامات یا کسی منظور شدہ بیرونی ذریعے کے بارے میں سوال پوچھیں۔ ہر جواب واضح کرتا ہے کہ وہ اندرونی ڈیٹا استعمال کر رہا ہے یا بیرونی۔')}</div></div><form class="chat-form" onsubmit="sendChat(event)"><textarea id="question" required maxlength="1500" placeholder="${tr('e.g. Why is Kotla Sher Muhammad a priority?','مثلاً کوٹلہ شیر محمد ترجیح کیوں ہے؟')}"></textarea><button class="primary" id="send">${tr('Send','بھیجیں')}</button></form></div></div>`}
function renderNav(){const entries=[['overview',tr('Overview','جائزہ')],['dashboard',tr('Dashboard','ڈیش بورڈ')],['detail',tr('Location detail','مقام کی تفصیل')],['rankings',tr('Priority rankings','ترجیحی درجہ بندی')],['methodology',tr('Methodology','طریقۂ کار')],['quality',tr('Data quality','ڈیٹا کوالٹی')],['assistant',tr('AI assistant','اے آئی معاون')],['logdata',tr('Log field data','فیلڈ ڈیٹا درج کریں')]];$('#nav').innerHTML=entries.map(([p,l])=>`<button class="${state.page===p?'active':''}" onclick="go('${p}')">${l}</button>`).join('')}
function go(page){state.page=page;render()}function render(){if(!state.auth){renderLogin();return}$('#login-screen').hidden=true;$('#app-shell').hidden=false;document.documentElement.lang=state.lang==='ur'?'ur':'en';document.documentElement.dir=state.lang==='ur'?'rtl':'ltr';document.body.classList.toggle('urdu',state.lang==='ur');$('#language').textContent=state.lang==='en'?'اردو':'English';$('#language').onclick=()=>{state.lang=state.lang==='en'?'ur':'en';render()};$('#title').textContent=state.lang==='en'?'Resource allocation, made explainable.':'وسائل کی تقسیم، واضح بنیاد کے ساتھ۔';renderNav();const pages={overview,dashboard,detail,rankings,methodology,quality,assistant,logdata:logData};$('#app').innerHTML=pages[state.page]();if(state.page==='dashboard')initMap()}