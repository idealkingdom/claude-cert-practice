(()=>{
const DATA=window.CLAUDE_ACADEMY;
const {CERTS,buildBank}=window.CLAUDE_CERT;
const app=document.getElementById('academy-app');
const STORE='claude-cert-academy-v1', PRACTICE='claude-cert-practice-v4', THEME='claude-cert-theme';
const tracks=['associate','architectF','developerF','architectP'];
const defaultState=()=>({cert:'associate',progress:{},labs:{}});
function load(){try{return {...defaultState(),...JSON.parse(localStorage.getItem(STORE)||'{}')}}catch{return defaultState()}}
let state=load();
let sequenceState={};
function save(){localStorage.setItem(STORE,JSON.stringify(state))}
function esc(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function theme(){return localStorage.getItem(THEME)||'dark'}
function applyTheme(){document.documentElement.dataset.theme=theme();document.querySelector('meta[name="theme-color"]').content=theme()==='dark'?'#111310':'#f4f2ec'}
function toggleTheme(){localStorage.setItem(THEME,theme()==='dark'?'light':'dark');applyTheme();render()}
function trackLessons(cert=state.cert){return DATA.lessons.filter(x=>x.certs.includes(cert))}
function trackLabs(cert=state.cert){return DATA.labs.filter(x=>x.certs.includes(cert))}
function prog(id){return state.progress[id]||{attempts:0,correct:0,lastCorrect:null}}
function status(l){const p=prog(l.id);return p.correct>0?'covered':p.attempts>0?'weak':'new'}
function domainFor(l,cert=state.cert){return l.domains?.[cert]||'Core'}
function sourceLinks(keys=[]){return keys.map(k=>DATA.sources[k]).filter(Boolean).map(s=>`<a class="source-link" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label)} ↗</a>`).join('')}
function qCorrect(q,ans){
  const f=q?.format||'choice';
  if(f==='matrix')return !!ans&&q.rows.every((r,i)=>ans[i]===r.correct);
  if(f==='match')return !!ans&&q.rows.every((r,i)=>ans[i]===r.correct);
  const a=Array.isArray(ans)?ans.slice().sort((x,y)=>x-y):[],b=(q?.correct||[]).slice().sort((x,y)=>x-y);
  return a.length===b.length&&a.every((v,i)=>v===b[i]);
}
function practiceState(){try{return JSON.parse(localStorage.getItem(PRACTICE)||'{}')}catch{return {}}}
function hardEvidence(cert){
  const ps=practiceState(), history=(ps.history||[]).filter(r=>r.cert===cert&&(r.mode==='gate'||r.mode==='focus-hard')).slice(0,6);
  if(!history.length)return new Map();
  const mapQ=new Map(buildBank(cert).map(q=>[q.id,q])), out=new Map();
  for(const r of history){
    for(const qid of r.questionIds||[]){
      const q=mapQ.get(qid); if(!q)continue;
      const x=out.get(q.domain)||{correct:0,total:0};
      x.total++; if(qCorrect(q,r.answers?.[qid]))x.correct++; out.set(q.domain,x);
    }
  }
  for(const x of out.values())x.percent=Math.round(x.correct/x.total*100);
  return out;
}
function lessonCoverage(cert=state.cert){
  const ls=trackLessons(cert), done=ls.filter(l=>status(l)==='covered').length;
  return {done,total:ls.length,percent:ls.length?Math.round(done/ls.length*100):0};
}
function checkpointAccuracy(cert=state.cert){
  const ls=trackLessons(cert), ids=new Set(ls.map(x=>x.id));let a=0,c=0;
  for(const [id,p] of Object.entries(state.progress||{})){if(!ids.has(id))continue;a+=p.attempts||0;c+=p.correct||0}
  return {attempts:a,correct:c,percent:a?Math.round(c/a*100):0};
}
function weakLessons(cert=state.cert){return trackLessons(cert).filter(l=>status(l)==='weak')}
function nextLesson(cert=state.cert){return trackLessons(cert).find(l=>status(l)!=='covered')||trackLessons(cert)[0]}
function topbar(){return `<header class="topbar"><div class="topbar-inner"><a class="brand academy-brand" href="learn.html"><span class="mark">C</span><span>Claude Cert Academy</span></a><div class="top-actions"><a class="btn ghost desktop-exam-link" href="index.html">Exam simulator</a><button class="icon-btn" data-action="theme" aria-label="Toggle theme">${theme()==='dark'?'☼':'◐'}</button></div></div></header>`}
function nav(active='learn'){return `<nav class="bottom-nav academy-nav" aria-label="Primary"><a class="nav-btn ${active==='exams'?'active':''}" href="index.html"><span class="nav-icon">⌂</span><span>Exams</span></a><a class="nav-btn ${active==='learn'?'active':''}" href="learn.html"><span class="nav-icon">◫</span><span>Learn</span></a><a class="nav-btn ${active==='labs'?'active':''}" href="#labs"><span class="nav-icon">⌘</span><span>Labs</span></a></nav>`}
function trackTabs(){return `<div class="track-tabs" role="tablist">${tracks.map(k=>`<button class="track-tab ${state.cert===k?'active':''}" data-action="track" data-cert="${k}"><span>${esc(CERTS[k].code)}</span><b>${esc(CERTS[k].short)}</b></button>`).join('')}</div>`}
function evidenceForDomain(domain,evidence){const e=evidence.get(domain);if(!e||e.total<3)return `<span class="evidence none">No hard evidence</span>`;const cls=e.percent>=85?'good':e.percent>=75?'mid':'bad';return `<span class="evidence ${cls}">${e.percent}% hard evidence · ${e.total} q</span>`}
function dashboard(){
  const c=CERTS[state.cert],cov=lessonCoverage(),acc=checkpointAccuracy(),weak=weakLessons(),evidence=hardEvidence(state.cert);
  const mapped=[...new Set(trackLessons().map(l=>domainFor(l)))], proven=mapped.filter(d=>{const ls=trackLessons().filter(l=>domainFor(l)===d);const covered=ls.every(l=>status(l)==='covered');const e=evidence.get(d);return covered&&e&&e.total>=3&&e.percent>=85}).length;
  return `<section class="academy-hero"><div class="eyebrow">Source-backed compressed curriculum</div><h1>Learn the certification here. Prove it in the simulator.</h1><p>This path compresses the official objectives into decision rules, common traps, checkpoints, and hands-on labs. Official Anthropic documentation is linked inside every lesson so the material stays auditable.</p>
  <div class="academy-actions"><button class="btn primary" data-action="continue" data-id="${nextLesson()?.id||''}">Continue learning</button>${weak.length?`<button class="btn" data-action="weak">Review ${weak.length} weak topic${weak.length===1?'':'s'}</button>`:''}<a class="btn ghost" href="index.html">Open Readiness Gate</a></div></section>
  ${trackTabs()}
  <section class="stat-grid">
    <div class="stat-card"><span>Coverage</span><b>${cov.percent}%</b><small>${cov.done}/${cov.total} lessons passed</small></div>
    <div class="stat-card"><span>Checkpoint accuracy</span><b>${acc.attempts?acc.percent+'%':'—'}</b><small>${acc.attempts?`${acc.correct}/${acc.attempts} correct`:'No checkpoints yet'}</small></div>
    <div class="stat-card"><span>Weak topics</span><b>${weak.length}</b><small>Last checkpoint missed</small></div>
    <div class="stat-card"><span>Exam-proven domains</span><b>${proven}/${mapped.length}</b><small>Covered + ≥85% hard evidence</small></div>
  </section>`;
}
function roadmap(){
  const c=CERTS[state.cert], ls=trackLessons(), evidence=hardEvidence(state.cert);
  const domains=c.domains.map(x=>x[0]);
  const sections=domains.map(domain=>{
    const items=ls.filter(l=>domainFor(l)===domain);
    if(!items.length)return '';
    const done=items.filter(l=>status(l)==='covered').length;
    return `<section class="domain-section"><div class="domain-head"><div><div class="eyebrow">Official domain</div><h2>${esc(domain)}</h2></div><div class="domain-meta"><span>${done}/${items.length} covered</span>${evidenceForDomain(domain,evidence)}</div></div>
      <div class="lesson-list">${items.map(lessonRow).join('')}</div></section>`;
  }).join('');
  return `<div class="shell">${topbar()}${nav('learn')}<main class="main academy-main">${dashboard()}<div class="roadmap-intro"><h2>${esc(c.short)} roadmap</h2><p>Pass each checkpoint, then use hard drills and Readiness Gate to convert lesson coverage into exam evidence.</p></div>${sections}<section class="academy-endcap"><h2>When this roadmap is green</h2><p>Run hard focused batches on any domain without ≥85% evidence, then run full Readiness Gates. The academy teaches the material; the simulator tests whether you can choose the best answer under exam-like pressure.</p><a class="btn primary" href="index.html">Go to simulator</a><a class="btn ghost" href="#labs">Practice labs</a></section></main></div>`;
}
function lessonRow(l){
  const s=status(l),p=prog(l.id);
  const icon=s==='covered'?'✓':s==='weak'?'!':'○';
  return `<button class="lesson-row ${s}" data-action="lesson" data-id="${l.id}"><span class="lesson-state">${icon}</span><span class="lesson-copy"><b>${esc(l.title)}</b><small>${l.minutes} min · ${s==='covered'?'Checkpoint passed':s==='weak'?'Needs review':'Not started'}</small></span><span class="lesson-arrow">›</span></button>`;
}
function lessonDetail(id){
  const l=DATA.lessons.find(x=>x.id===id&&x.certs.includes(state.cert));if(!l){location.hash='';return ''}
  const p=prog(l.id),s=status(l),domain=domainFor(l),current=trackLessons(),idx=current.findIndex(x=>x.id===l.id),next=current[idx+1]||null;
  return `<div class="shell">${topbar()}${nav('learn')}<main class="main academy-main lesson-page">
    <div class="lesson-breadcrumb"><button class="text-btn" data-action="home">← Roadmap</button><span>${esc(CERTS[state.cert].code)} · ${esc(domain)}</span></div>
    <article class="lesson-article">
      <div class="lesson-titlebar"><div><div class="eyebrow">${l.minutes} minute lesson · ${s==='covered'?'covered':s==='weak'?'needs review':'new'}</div><h1>${esc(l.title)}</h1></div><span class="lesson-badge ${s}">${s==='covered'?'Checkpoint passed':s==='weak'?'Review':'Not started'}</span></div>
      <section class="learn-block"><h2>What you must know</h2><ul>${l.mustKnow.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>
      <section class="decision-rule"><span>Exam decision rule</span><strong>${esc(l.decisionRule)}</strong></section>
      <div class="two-col">
        <section class="learn-block trap-block"><h2>Common trap</h2><p>${esc(l.trap)}</p></section>
        <section class="learn-block"><h2>Concrete example</h2><p>${esc(l.example)}</p></section>
      </div>
      ${l.code?`<section class="learn-block"><h2>Pattern to recognize</h2><pre><code>${esc(l.code)}</code></pre></section>`:''}
      <section class="source-block"><div><b>Official sources</b><p>Use these when you want the full reference behind this compressed lesson.</p></div><div class="source-links">${sourceLinks(l.sources)}</div></section>
      <section class="checkpoint" id="checkpoint"><div class="eyebrow">Checkpoint</div><h2>${esc(l.quiz.question)}</h2><div class="checkpoint-options">${l.quiz.options.map((o,i)=>`<button class="checkpoint-option" data-action="checkpoint" data-id="${l.id}" data-index="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(o)}</button>`).join('')}</div><div id="checkpoint-feedback" class="checkpoint-feedback" aria-live="polite"></div></section>
      <div class="lesson-footer-actions"><button class="btn ghost" data-action="home">Roadmap</button>${next?`<button class="btn primary" data-action="lesson" data-id="${next.id}">Next lesson</button>`:`<a class="btn primary" href="index.html">Take Readiness Gate</a>`}</div>
    </article></main></div>`;
}
function weakPage(){
  const weak=trackLessons().filter(l=>status(l)!=='covered');
  return `<div class="shell">${topbar()}${nav('learn')}<main class="main academy-main"><div class="page-head"><div><div class="eyebrow">${esc(CERTS[state.cert].short)}</div><h1>Review queue</h1><p>Uncovered and missed concepts first.</p></div><button class="btn ghost" data-action="home">Roadmap</button></div><div class="lesson-list">${weak.length?weak.map(lessonRow).join(''):'<div class="empty"><strong>Everything is covered.</strong>Move to hard drills and Readiness Gate.</div>'}</div></main></div>`;
}
function labsPage(){
  const labs=trackLabs();
  return `<div class="shell">${topbar()}${nav('labs')}<main class="main academy-main"><section class="academy-hero compact"><div class="eyebrow">${esc(CERTS[state.cert].short)}</div><h1>Decision labs</h1><p>Short interactive exercises for the patterns that are easier to remember by doing than by reading.</p></section>${trackTabs()}<div class="lab-grid">${labs.map(l=>{const p=state.labs[l.id];return `<button class="lab-card ${p?.passed?'passed':''}" data-action="lab" data-id="${l.id}"><span class="lab-icon">${p?.passed?'✓':'⌘'}</span><span><b>${esc(l.title)}</b><small>${l.type==='sequence'?'Sequence exercise':'Decision scenario'}${p?.passed?' · passed':''}</small></span><span>›</span></button>`}).join('')}</div></main></div>`;
}
function labDetail(id){
  const l=DATA.labs.find(x=>x.id===id&&x.certs.includes(state.cert));if(!l){location.hash='labs';return ''}
  if(l.type==='sequence'&&!sequenceState[id])sequenceState[id]=[];
  const selected=sequenceState[id]||[];
  let body='';
  if(l.type==='choice')body=`<div class="checkpoint-options">${l.options.map((o,i)=>`<button class="checkpoint-option" data-action="lab-choice" data-id="${l.id}" data-index="${i}"><span>${String.fromCharCode(65+i)}</span>${esc(o)}</button>`).join('')}</div>`;
  else {
    const used=new Set(selected), remaining=l.steps.map((s,i)=>({s,i})).filter(x=>!used.has(x.i));
    body=`<div class="sequence-answer">${selected.map((i,pos)=>`<button class="sequence-picked" data-action="seq-remove" data-id="${l.id}" data-index="${i}"><span>${pos+1}</span>${esc(l.steps[i])}</button>`).join('')||'<div class="sequence-placeholder">Tap the steps below in the order you think is correct.</div>'}</div>
    <div class="sequence-pool">${remaining.map(x=>`<button class="sequence-option" data-action="seq-add" data-id="${l.id}" data-index="${x.i}">${esc(x.s)}</button>`).join('')}</div>
    <div class="card-actions"><button class="btn ghost" data-action="seq-reset" data-id="${l.id}">Reset</button><button class="btn primary" data-action="seq-check" data-id="${l.id}" ${selected.length===l.steps.length?'':'disabled'}>Check order</button></div>`;
  }
  return `<div class="shell">${topbar()}${nav('labs')}<main class="main academy-main"><div class="lesson-breadcrumb"><button class="text-btn" data-action="labs">← Labs</button><span>${esc(CERTS[state.cert].code)}</span></div><article class="lesson-article lab-detail"><div class="eyebrow">${l.type==='sequence'?'Sequence lab':'Decision lab'}</div><h1>${esc(l.title)}</h1><p class="lab-prompt">${esc(l.prompt)}</p>${body}<div id="lab-feedback" class="checkpoint-feedback"></div><section class="source-block"><div><b>Reference</b></div><div class="source-links">${sourceLinks(l.sources)}</div></section></article></main></div>`;
}
function checkpoint(id,index,button){
  const l=DATA.lessons.find(x=>x.id===id);if(!l)return;
  const ok=Number(index)===l.quiz.correct,p=prog(id);p.attempts=(p.attempts||0)+1;if(ok)p.correct=(p.correct||0)+1;p.lastCorrect=ok;p.updatedAt=new Date().toISOString();state.progress[id]=p;save();
  document.querySelectorAll('.checkpoint-option').forEach((el,i)=>{el.disabled=true;if(i===l.quiz.correct)el.classList.add('correct');else if(i===Number(index)&&!ok)el.classList.add('wrong')});
  const fb=document.getElementById('checkpoint-feedback');if(fb){fb.className=`checkpoint-feedback show ${ok?'correct':'wrong'}`;fb.innerHTML=`<strong>${ok?'Correct.':'Not quite.'}</strong> ${esc(l.quiz.why)}${ok?'<div class="feedback-next">This lesson now counts as covered. Use the simulator later to prove it under harder conditions.</div>':''}`}
}
function labChoice(id,index){
  const l=DATA.labs.find(x=>x.id===id);if(!l)return;const ok=Number(index)===l.correct;
  state.labs[id]={attempts:(state.labs[id]?.attempts||0)+1,passed:ok||state.labs[id]?.passed||false,updatedAt:new Date().toISOString()};save();
  document.querySelectorAll('.checkpoint-option').forEach((el,i)=>{el.disabled=true;if(i===l.correct)el.classList.add('correct');else if(i===Number(index)&&!ok)el.classList.add('wrong')});
  const fb=document.getElementById('lab-feedback');fb.className=`checkpoint-feedback show ${ok?'correct':'wrong'}`;fb.innerHTML=`<strong>${ok?'Correct.':'Try the principle again.'}</strong> ${esc(l.why)}`;
}
function seqAdd(id,i){const a=sequenceState[id]||(sequenceState[id]=[]);if(!a.includes(i))a.push(i);render()}
function seqRemove(id,i){sequenceState[id]=(sequenceState[id]||[]).filter(x=>x!==i);render()}
function seqReset(id){sequenceState[id]=[];render()}
function seqCheck(id){
  const l=DATA.labs.find(x=>x.id===id),a=sequenceState[id]||[];if(!l||a.length!==l.steps.length)return;
  const ok=a.every((v,i)=>v===i);state.labs[id]={attempts:(state.labs[id]?.attempts||0)+1,passed:ok||state.labs[id]?.passed||false,updatedAt:new Date().toISOString()};save();
  const fb=document.getElementById('lab-feedback');fb.className=`checkpoint-feedback show ${ok?'correct':'wrong'}`;fb.innerHTML=`<strong>${ok?'Correct order.':'Order is not quite right.'}</strong> ${esc(l.why)}${ok?'':' Reset and rebuild it from the system boundary outward.'}`;
}
function setTrack(cert){if(!tracks.includes(cert))return;state.cert=cert;save();const h=location.hash.replace(/^#/,'');if(h.startsWith('lesson/')&&!DATA.lessons.find(l=>l.id===h.split('/')[1]&&l.certs.includes(cert)))location.hash='';else if(h.startsWith('lab/')&&!DATA.labs.find(l=>l.id===h.split('/')[1]&&l.certs.includes(cert)))location.hash='labs';else render()}
function render(){
  const h=location.hash.replace(/^#/,'');
  if(h.startsWith('lesson/'))app.innerHTML=lessonDetail(h.split('/')[1]);
  else if(h==='labs')app.innerHTML=labsPage();
  else if(h.startsWith('lab/'))app.innerHTML=labDetail(h.split('/')[1]);
  else if(h==='weak')app.innerHTML=weakPage();
  else app.innerHTML=roadmap();
}
document.addEventListener('click',e=>{
  const el=e.target.closest('[data-action]');if(!el)return;const a=el.dataset.action;
  if(a==='theme')toggleTheme();
  else if(a==='track')setTrack(el.dataset.cert);
  else if(a==='lesson')location.hash=`lesson/${el.dataset.id}`;
  else if(a==='continue')location.hash=`lesson/${el.dataset.id}`;
  else if(a==='weak')location.hash='weak';
  else if(a==='home')location.hash='';
  else if(a==='labs')location.hash='labs';
  else if(a==='lab')location.hash=`lab/${el.dataset.id}`;
  else if(a==='checkpoint')checkpoint(el.dataset.id,el.dataset.index,el);
  else if(a==='lab-choice')labChoice(el.dataset.id,el.dataset.index);
  else if(a==='seq-add')seqAdd(el.dataset.id,Number(el.dataset.index));
  else if(a==='seq-remove')seqRemove(el.dataset.id,Number(el.dataset.index));
  else if(a==='seq-reset')seqReset(el.dataset.id);
  else if(a==='seq-check')seqCheck(el.dataset.id);
});
window.addEventListener('hashchange',render);
applyTheme();render();
})();
