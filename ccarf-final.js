(()=>{
const DATA=window.CCARF_FINAL_BANK;
const app=document.getElementById('ccarf-final-app');
const KEY='ccarf-sealed-final-v1';
const THEME='claude-cert-theme';
const quotas=DATA.exam.quotas;
let tick=null, toastTimer=null;
const load=()=>{try{return JSON.parse(localStorage.getItem(KEY)||'{"history":[]}')}catch{return {history:[]}}};
let state=load(); if(!state.history)state.history=[];
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function rnd(n){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function fmt(sec){sec=Math.max(0,sec|0);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function theme(){return localStorage.getItem(THEME)||'dark'}
function applyTheme(){document.documentElement.dataset.theme=theme();document.querySelector('meta[name="theme-color"]').content=theme()==='dark'?'#111310':'#f4f2ec'}
function toast(t){let el=document.querySelector('.ccarf-toast');if(!el){el=document.createElement('div');el.className='ccarf-toast';document.body.appendChild(el)}el.textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),2200)}
const qmap=new Map(DATA.questions.map(q=>[q.id,q]));
const scen=DATA.scenarios;
function seenSet(){const s=new Set();for(const h of state.history)for(const id of h.questionIds||[])s.add(id);return s}
function buildForm(){
  const seen=seenSet(), selected=[];
  for(const [domain,count] of Object.entries(quotas)){
    let pool=DATA.questions.filter(q=>q.domain===domain);
    pool=shuffle(pool).sort((a,b)=>{
      const score=q=>(!seen.has(q.id)?100:0)+(q.scenario!=='standalone'?20:0);
      return score(b)-score(a)
    });
    selected.push(...pool.slice(0,count));
  }
  const ids=new Set(selected.map(q=>q.id));
  if(ids.size!==60)throw new Error('Final form did not resolve to 60 unique questions.');
  const blockOrder=shuffle(Object.keys(scen).filter(x=>x!=='standalone'));
  const stand=shuffle(selected.filter(q=>q.scenario==='standalone'));
  const ordered=[]; let si=0;
  for(const sid of blockOrder){
    const block=shuffle(selected.filter(q=>q.scenario===sid));
    ordered.push(...block);
    for(let k=0;k<2&&si<stand.length;k++)ordered.push(stand[si++]);
  }
  while(si<stand.length)ordered.push(stand[si++]);
  const optionOrders={};
  for(const q of selected) optionOrders[q.id]=shuffle([0,1,2,3]);
  return {questionIds:ordered.map(q=>q.id),optionOrders};
}
function newAttempt(){
  const form=buildForm();
  state.attempt={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),
    createdAt:new Date().toISOString(),remaining:7200,current:0,answers:{},confidence:{},flags:[],
    ...form};
  save(); exam();
}
function completeAnswer(a,qid){return Number.isInteger(a.answers?.[qid])}
function correctFor(a,q){return a.answers?.[q.id]===q.correct}
function answered(a){return a.questionIds.filter(id=>Number.isInteger(a.answers?.[id])).length}
function fresh(){return state.history.length===0}
function header(){
 return `<header class="ccarf-top"><a href="index.html" class="ccarf-back">← Practice</a><div><strong>CCAR-F Final Gate</strong><span>${fresh()?'SEALED':'SEAL BROKEN'}</span></div><button class="ccarf-icon" data-act="theme">${theme()==='dark'?'☼':'◐'}</button></header>`;
}
function landing(){
 if(tick){clearInterval(tick);tick=null}
 const old=state.history[0], has=!!state.attempt;
 app.innerHTML=`${header()}<main class="ccarf-shell"><section class="ccarf-hero">
 <div class="ccarf-kicker">Architect Foundations · first-exam hardening</div>
 <h1>${fresh()?'Do not open this until you want a real measurement.':'The seal is already broken. Use retakes for pressure training.'}</h1>
 <p>This is a separate 60-question gate built to punish shallow pattern recognition: long context, hidden decisive constraints, near-neighbor choices, shared scenario blocks, standalone context-heavy items, exact blueprint weighting, confidence tracking, and no rationale exposure until submission.</p>
 <div class="ccarf-callout"><strong>${fresh()?'Fresh-attempt rule':'Retest rule'}</strong><span>${fresh()?'Your first completed run is the only one treated as a sealed measurement. Learn and Readiness Gate do not expose these questions.':'You can retake it, but the score is no longer treated as unseen evidence. Use the main Readiness Gate for repeated full simulations.'}</span></div>
 <div class="ccarf-actions">
   ${has?'<button class="btn primary" data-act="resume">Resume sealed attempt</button>':''}
   ${!has?`<button class="btn primary" data-act="start">${fresh()?'Break seal and start':'Start retest'}</button>`:''}
   <a class="btn" href="ccarf-labs.html">Hands-on labs</a>
   <a class="btn ghost" href="learn.html?cert=architectF">Learn</a>
 </div>
 </section>
 <section class="ccarf-metrics">
   <article><b>60</b><span>questions</span></article><article><b>120m</b><span>hard timebox</span></article>
   <article><b>5</b><span>official domains</span></article><article><b>${DATA.questions.length}</b><span>sealed pool</span></article>
 </section>
 ${old?`<section class="ccarf-last"><div><span>First sealed result</span><strong>${old.percent}%</strong></div><div>${old.verdict}</div><button class="btn ghost" data-act="result" data-id="${old.id}">Review</button></section>`:''}
 <section class="ccarf-blueprint"><h2>Blueprint enforced per form</h2>${Object.entries(quotas).map(([d,n])=>`<div><span>${esc(d)}</span><b>${n}</b></div>`).join('')}</section>
 <p class="ccarf-note">Original practice material only. It is based on the public blueprint, current Claude documentation, and broad candidate-reported difficulty patterns—not reconstructed live exam questions.</p>
 </main>`;
}
function exam(){
 const a=state.attempt;if(!a)return landing();
 const q=qmap.get(a.questionIds[a.current]); const order=a.optionOrders[q.id];
 const block=q.scenario!=='standalone'?scen[q.scenario]:null;
 const ans=a.answers[q.id], conf=a.confidence[q.id]||'';
 const nums=a.questionIds.map((id,i)=>{
   const done=completeAnswer(a,id), flag=a.flags.includes(id);
   return `<button class="ccarf-navnum ${i===a.current?'current':''} ${done?'done':''} ${flag?'flag':''}" data-act="jump" data-i="${i}">${i+1}</button>`;
 }).join('');
 app.innerHTML=`${header()}<main class="ccarf-exam">
 <section class="ccarf-exam-head"><div><span>Question ${a.current+1} of 60</span><b>${esc(q.domain)}</b></div><div id="ccarf-timer">${fmt(a.remaining)}</div></section>
 ${block?`<article class="ccarf-scenario"><div>${esc(block.title)}</div><p>${esc(block.text)}</p></article>`:`<div class="ccarf-independent">Independent scenario</div>`}
 <article class="ccarf-question">
   <div class="ccarf-stem">${esc(q.stem)}</div>
   <div class="ccarf-options">${order.map((oi,di)=>`<button class="ccarf-option ${ans===oi?'selected':''}" data-act="answer" data-oi="${oi}"><span>${String.fromCharCode(65+di)}</span><p>${esc(q.options[oi].text)}</p></button>`).join('')}</div>
 </article>
 <section class="ccarf-confidence"><span>Confidence</span>${['Low','Medium','High'].map(x=>`<button class="${conf===x?'on':''}" data-act="confidence" data-v="${x}">${x}</button>`).join('')}<button class="${a.flags.includes(q.id)?'on':''}" data-act="flag">⚑ Flag</button></section>
 <section class="ccarf-controls"><button class="btn" data-act="prev" ${a.current===0?'disabled':''}>Previous</button><button class="btn" data-act="saveexit">Save & exit</button>${a.current<59?'<button class="btn primary" data-act="next">Next</button>':'<button class="btn primary" data-act="submit">Submit</button>'}</section>
 <details class="ccarf-navigator"><summary>${answered(a)}/60 answered · navigator</summary><div>${nums}</div></details>
 </main>`;
 startTick();
}
function startTick(){if(tick)clearInterval(tick);tick=setInterval(()=>{const a=state.attempt;if(!a){clearInterval(tick);tick=null;return}a.remaining=Math.max(0,a.remaining-1);if(a.remaining%5===0)save();const el=document.getElementById('ccarf-timer');if(el)el.textContent=fmt(a.remaining);if(a.remaining===0)submit(true)},1000)}
function submit(auto=false){
 const a=state.attempt;if(!a)return;
 const unanswered=60-answered(a);
 if(!auto&&unanswered&&!confirm(`${unanswered} question${unanswered===1?' is':'s are'} unanswered. Submit anyway?`))return;
 const rows=a.questionIds.map(id=>{const q=qmap.get(id);return {id,correct:correctFor(a,q),domain:q.domain,confidence:a.confidence[id]||'',selected:a.answers[id],flag:a.flags.includes(id)}})
 const correct=rows.filter(x=>x.correct).length, percent=Math.round(correct/60*1000)/10;
 const domains={};for(const [d] of Object.entries(quotas)){const rr=rows.filter(x=>x.domain===d);domains[d]={correct:rr.filter(x=>x.correct).length,total:rr.length,percent:Math.round(rr.filter(x=>x.correct).length/rr.length*100)}}
 const highMiss=rows.filter(x=>!x.correct&&x.confidence==='High').length, weakest=Math.min(...Object.values(domains).map(x=>x.percent));
 let verdict;
 if(percent>=90&&weakest>=80&&highMiss<=1)verdict='PASS CONFIDENTLY — strong final-gate signal';
 else if(percent>=85&&weakest>=75)verdict='LIKELY PASS — fix the misses before exam day';
 else verdict='DO NOT SIT YET — repair the weak domains first';
 const h={...a,completedAt:new Date().toISOString(),correctCount:correct,percent,domains,highMiss,verdict,rows,freshAttempt:state.history.length===0};
 state.history.unshift(h);state.history=state.history.slice(0,10);delete state.attempt;save();if(tick){clearInterval(tick);tick=null}result(h.id);
}
function result(id){
 const h=state.history.find(x=>x.id===id)||state.history[0];if(!h)return landing();
 const wrong=h.rows.filter(x=>!x.correct), trap={};
 for(const r of wrong){const q=qmap.get(r.id),o=q.options[r.selected];if(o)trap[o.tag]=(trap[o.tag]||0)+1}
 const traps=Object.entries(trap).sort((a,b)=>b[1]-a[1]).slice(0,6);
 app.innerHTML=`${header()}<main class="ccarf-shell"><section class="ccarf-result">
 <div class="ccarf-kicker">${h.freshAttempt?'First sealed measurement':'Retest'}</div><div class="ccarf-score">${h.percent}%</div><h1>${esc(h.verdict)}</h1>
 <p>${h.correctCount}/60 correct · ${wrong.length} misses · ${h.highMiss} high-confidence miss${h.highMiss===1?'':'es'}.</p>
 </section>
 <section class="ccarf-domain-grid">${Object.entries(h.domains).map(([d,x])=>`<article><span>${esc(d)}</span><b>${x.percent}%</b><small>${x.correct}/${x.total}</small></article>`).join('')}</section>
 <section class="ccarf-traps"><h2>What fooled you</h2>${traps.length?traps.map(([t,n])=>`<div><span>${esc(t)}</span><b>${n}</b></div>`).join(''):'<p>No wrong-answer trap pattern to report.</p>'}</section>
 <section class="ccarf-actions"><button class="btn primary" data-act="review" data-id="${h.id}">Review misses</button><button class="btn" data-act="home">Back</button><button class="btn ghost" data-act="start">Retake</button></section>
 </main>`;
}
function review(id){
 const h=state.history.find(x=>x.id===id)||state.history[0];if(!h)return;
 const wrong=h.rows.filter(x=>!x.correct);
 app.innerHTML=`${header()}<main class="ccarf-shell"><div class="ccarf-pagehead"><div><div class="ccarf-kicker">Post-submit review</div><h1>${wrong.length} misses</h1></div><button class="btn" data-act="result" data-id="${h.id}">Results</button></div>
 ${wrong.map((r,idx)=>{const q=qmap.get(r.id),sel=q.options[r.selected],cor=q.options[q.correct],block=q.scenario!=='standalone'?scen[q.scenario]:null;
 return `<article class="ccarf-review"><div class="ccarf-review-num">Miss ${idx+1} · ${esc(q.domain)} · ${esc(r.confidence||'No confidence')}</div>${block?`<div class="ccarf-mini-scenario">${esc(block.title)}</div>`:''}<h3>${esc(q.stem)}</h3>
 <div class="ccarf-review-answer wrong"><b>Your choice</b><span>${esc(sel?.text||'Unanswered')}</span>${sel?`<small>${esc(sel.why)}</small>`:''}</div>
 <div class="ccarf-review-answer right"><b>Best choice</b><span>${esc(cor.text)}</span><small>${esc(cor.why)}</small></div>
 <div class="ccarf-key"><b>Decisive clue</b>${esc(q.key)}</div><div class="ccarf-key"><b>Trap family</b>${esc(q.trap)}</div></article>`}).join('')}
 </main>`;
}
document.addEventListener('click',e=>{
 const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;
 if(a==='theme'){localStorage.setItem(THEME,theme()==='dark'?'light':'dark');applyTheme(); if(state.attempt)exam();else landing()}
 else if(a==='start'){newAttempt()}
 else if(a==='resume'){exam()}
 else if(a==='home'){landing()}
 else if(a==='result'){result(b.dataset.id)}
 else if(a==='review'){review(b.dataset.id)}
 else if(state.attempt){
   const at=state.attempt,q=qmap.get(at.questionIds[at.current]);
   if(a==='answer'){at.answers[q.id]=Number(b.dataset.oi);save();exam()}
   if(a==='confidence'){at.confidence[q.id]=b.dataset.v;save();exam()}
   if(a==='flag'){const i=at.flags.indexOf(q.id);i>=0?at.flags.splice(i,1):at.flags.push(q.id);save();exam()}
   if(a==='prev'){at.current=Math.max(0,at.current-1);save();exam()}
   if(a==='next'){at.current=Math.min(59,at.current+1);save();exam()}
   if(a==='jump'){at.current=Number(b.dataset.i);save();exam()}
   if(a==='saveexit'){save();landing();toast('Attempt saved locally')}
   if(a==='submit')submit(false)
 }
});
applyTheme(); landing();
})();