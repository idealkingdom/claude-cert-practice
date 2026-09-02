(()=>{
const DATA=window.CCARF_FINAL_BANK;
const app=document.getElementById('ccarf-final-app');
const KEY='ccarf-rotation-final-v2', OLD='ccarf-sealed-final-v1', THEME='claude-cert-theme';
const D=Object.keys(DATA.exam.quotas60), qmap=new Map(DATA.questions.map(q=>[q.id,q])), scen=DATA.scenarios;
let tick=null,toastTimer=null;
function load(){
  try{
    const now=JSON.parse(localStorage.getItem(KEY)||'null'); if(now)return {...now,history:now.history||[]};
    const old=JSON.parse(localStorage.getItem(OLD)||'null');
    return {history:old?.history||[],attempt:null};
  }catch{return {history:[],attempt:null}}
}
let state=load();
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const esc=(s='')=>String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
function rnd(n){const a=new Uint32Array(1);crypto.getRandomValues(a);return a[0]%n}
function shuffle(a){a=a.slice();for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function fmt(sec){sec=Math.max(0,sec|0);const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`}
function theme(){return localStorage.getItem(THEME)||'dark'}
function applyTheme(){document.documentElement.dataset.theme=theme();document.querySelector('meta[name="theme-color"]').content=theme()==='dark'?'#111310':'#f4f2ec'}
function toast(t){let el=document.querySelector('.ccarf-toast');if(!el){el=document.createElement('div');el.className='ccarf-toast';document.body.appendChild(el)}el.textContent=t;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.remove(),2200)}
function recent(n=3){return (state.history||[]).filter(h=>Array.isArray(h.questionIds)&&h.questionIds.some(id=>qmap.has(id))).slice(0,n)}
function recentIds(){const s=new Set();for(const h of recent(3))for(const id of h.questionIds||[])if(qmap.has(id))s.add(id);return s}
function recentFamilies(){const m=new Map();for(const h of recent(3))for(const id of h.questionIds||[]){const q=qmap.get(id);if(q)m.set(q.family,(m.get(q.family)||0)+1)}return m}
function scenarioUse(){const m=new Map(Object.keys(scen).map(x=>[x,0]));for(const h of recent(3))for(const sid of h.scenarioIds||[])m.set(sid,(m.get(sid)||0)+1);return m}
const ROW_A={[D[0]]:4,[D[1]]:3,[D[2]]:3,[D[3]]:3,[D[4]]:2};
const ROW_B={[D[0]]:4,[D[1]]:2,[D[2]]:3,[D[3]]:3,[D[4]]:3};
function chooseScenarios(total){
  const count=total===60?4:2, use=scenarioUse();
  return shuffle(Object.keys(scen)).sort((a,b)=>(use.get(a)||0)-(use.get(b)||0)).slice(0,count);
}
function pickPool(sid,domain,need,excluded,famUse,usedNow){
  let pool=DATA.questions.filter(q=>q.scenario===sid&&q.domain===domain&&!excluded.has(q.id));
  pool=shuffle(pool).sort((a,b)=>{
    const sa=(usedNow.has(a.family)?20:0)+(famUse.get(a.family)||0), sb=(usedNow.has(b.family)?20:0)+(famUse.get(b.family)||0);
    return sa-sb;
  });
  if(pool.length<need)throw new Error(`Rotation pool exhausted for ${sid} / ${domain}.`);
  const out=pool.slice(0,need);out.forEach(q=>usedNow.add(q.family));return out;
}
function buildForm(total){
  const excluded=recentIds(), famUse=recentFamilies(), sids=chooseScenarios(total), rows=total===60?[ROW_A,ROW_A,ROW_A,ROW_B]:[ROW_A,ROW_B];
  const selected=[],usedNow=new Set();
  for(let si=0;si<sids.length;si++){
    const sid=sids[si], row=rows[si], block=[];
    for(const domain of D)block.push(...pickPool(sid,domain,row[domain],excluded,famUse,usedNow));
    if(block.length!==15)throw new Error('Scenario block did not resolve to 15 questions.');
    selected.push(...shuffle(block));
  }
  if(selected.length!==total||new Set(selected.map(q=>q.id)).size!==total)throw new Error('Form generation failed uniqueness check.');
  const optionOrders={};for(const q of selected)optionOrders[q.id]=shuffle([0,1,2,3]);
  return {questionIds:selected.map(q=>q.id),optionOrders,scenarioIds:sids};
}
function newAttempt(total){
  try{
    const form=buildForm(total);
    state.attempt={id:Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7),createdAt:new Date().toISOString(),total,remaining:total*120,current:0,answers:{},confidence:{},flags:[],...form};
    save();exam();
  }catch(e){console.error(e);toast('Could not build a fresh form. Clear old rotation history if this persists.')}
}
const completeAnswer=(a,id)=>Number.isInteger(a.answers?.[id]);
const correctFor=(a,q)=>a.answers?.[q.id]===q.correct;
const answered=a=>a.questionIds.filter(id=>completeAnswer(a,id)).length;
function header(){return `<header class="ccarf-top"><a href="index.html" class="ccarf-back">← Practice</a><div><strong>CCAR-F Exam-Level Rotation</strong><span>480-QUESTION POOL</span></div><button class="ccarf-icon" data-act="theme">${theme()==='dark'?'☼':'◐'}</button></header>`}
function landing(){
 if(tick){clearInterval(tick);tick=null}
 const has=!!state.attempt,last=recent(1)[0],excluded=recentIds().size;
 app.innerHTML=`${header()}<main class="ccarf-shell"><section class="ccarf-hero">
 <div class="ccarf-kicker">Architect Foundations · hard rotating simulation</div>
 <h1>Fresh questions, same blueprint, less memorisation.</h1>
 <p>Original scenario-heavy questions built around all 30 CCAR-F task statements. Each new form excludes every exact question from your previous three completed rotation attempts, then rebalances by the official domains and shared scenarios.</p>
 <div class="ccarf-callout"><strong>Rotation rule</strong><span>${excluded?`${excluded} questions from your last ${recent(3).length} attempt${recent(3).length===1?' is':'s are'} currently locked out.`:'No v3 rotation history yet. Your first form draws from the full 480-question pool.'}</span></div>
 <div class="ccarf-actions">
   ${has?'<button class="btn primary" data-act="resume">Resume current attempt</button>':''}
   ${!has?'<button class="btn primary" data-act="start" data-total="60">60 questions · 120 min</button><button class="btn" data-act="start" data-total="30">30 questions · 60 min</button>':''}
   <a class="btn ghost" href="ccarf-labs.html">Hands-on labs</a><a class="btn ghost" href="learn.html?cert=architectF">Learn</a>
 </div></section>
 <section class="ccarf-metrics"><article><b>480</b><span>rotation pool</span></article><article><b>3</b><span>prior attempts excluded</span></article><article><b>30/60</b><span>question modes</span></article><article><b>6</b><span>shared scenarios</span></article></section>
 ${last?`<section class="ccarf-last"><div><span>Latest rotation result</span><strong>${last.percent}%</strong></div><div>${esc(last.verdict)}</div><button class="btn ghost" data-act="result" data-id="${last.id}">Review</button></section>`:''}
 <section class="ccarf-blueprint"><h2>Blueprint per form</h2>${D.map(d=>`<div><span>${esc(d)}</span><b>${DATA.exam.quotas60[d]} / ${DATA.exam.quotas30[d]}</b></div>`).join('')}<small>Values show 60-question / 30-question quotas.</small></section>
 <p class="ccarf-note">Question text is original. Difficulty construction is informed by the public CCAR-F blueprint, current Claude documentation, and broad candidate reports; no live exam questions are reproduced.</p></main>`;
}
function exam(){
 const a=state.attempt;if(!a)return landing();const q=qmap.get(a.questionIds[a.current]);if(!q)return landing();
 const order=a.optionOrders[q.id],block=scen[q.scenario],ans=a.answers[q.id],conf=a.confidence[q.id]||'',n=a.total;
 const nums=a.questionIds.map((id,i)=>`<button class="ccarf-navnum ${i===a.current?'current':''} ${completeAnswer(a,id)?'done':''} ${a.flags.includes(id)?'flag':''}" data-act="jump" data-i="${i}">${i+1}</button>`).join('');
 app.innerHTML=`${header()}<main class="ccarf-exam"><section class="ccarf-exam-head"><div><span>Question ${a.current+1} of ${n}</span><b>${esc(q.domain)}</b></div><div id="ccarf-timer">${fmt(a.remaining)}</div></section>
 <article class="ccarf-scenario"><div>${esc(block.title)}</div><p>${esc(block.text)}</p></article>
 <article class="ccarf-question"><div class="ccarf-stem">${esc(q.stem)}</div><div class="ccarf-options">${order.map((oi,di)=>`<button class="ccarf-option ${ans===oi?'selected':''}" data-act="answer" data-oi="${oi}"><span>${String.fromCharCode(65+di)}</span><p>${esc(q.options[oi].text)}</p></button>`).join('')}</div></article>
 <section class="ccarf-confidence"><span>Confidence</span>${['Low','Medium','High'].map(x=>`<button class="${conf===x?'on':''}" data-act="confidence" data-v="${x}">${x}</button>`).join('')}<button class="${a.flags.includes(q.id)?'on':''}" data-act="flag">⚑ Flag</button></section>
 <section class="ccarf-controls"><button class="btn" data-act="prev" ${a.current===0?'disabled':''}>Previous</button><button class="btn" data-act="saveexit">Save & exit</button>${a.current<n-1?'<button class="btn primary" data-act="next">Next</button>':'<button class="btn primary" data-act="submit">Submit</button>'}</section>
 <details class="ccarf-navigator"><summary>${answered(a)}/${n} answered · navigator</summary><div>${nums}</div></details></main>`;startTick();
}
function startTick(){if(tick)clearInterval(tick);tick=setInterval(()=>{const a=state.attempt;if(!a){clearInterval(tick);tick=null;return}a.remaining=Math.max(0,a.remaining-1);if(a.remaining%5===0)save();const el=document.getElementById('ccarf-timer');if(el)el.textContent=fmt(a.remaining);if(a.remaining===0)submit(true)},1000)}
function submit(auto=false){
 const a=state.attempt;if(!a)return;const n=a.total,unanswered=n-answered(a);if(!auto&&unanswered&&!confirm(`${unanswered} question${unanswered===1?' is':'s are'} unanswered. Submit anyway?`))return;
 const rows=a.questionIds.map(id=>{const q=qmap.get(id);return {id,correct:correctFor(a,q),domain:q.domain,confidence:a.confidence[id]||'',selected:a.answers[id],flag:a.flags.includes(id)}});
 const correct=rows.filter(x=>x.correct).length,percent=Math.round(correct/n*1000)/10,domains={};
 const quotas=n===60?DATA.exam.quotas60:DATA.exam.quotas30;
 for(const d of D){const rr=rows.filter(x=>x.domain===d);domains[d]={correct:rr.filter(x=>x.correct).length,total:rr.length,percent:Math.round(rr.filter(x=>x.correct).length/rr.length*100)}}
 const highMiss=rows.filter(x=>!x.correct&&x.confidence==='High').length,weakest=Math.min(...Object.values(domains).map(x=>x.percent));let verdict;
 if(percent>=90&&weakest>=80&&highMiss<=1)verdict='PASS CONFIDENTLY — exam-level rotation signal';else if(percent>=82&&weakest>=70)verdict='LIKELY PASS — repair the misses before exam day';else verdict='KEEP HARDENING — this form exposed real gaps';
 const h={...a,completedAt:new Date().toISOString(),correctCount:correct,percent,domains,highMiss,verdict,rows};state.history.unshift(h);state.history=state.history.slice(0,30);delete state.attempt;save();if(tick){clearInterval(tick);tick=null}result(h.id);
}
function result(id){
 const h=state.history.find(x=>x.id===id)||state.history[0];if(!h)return landing();const wrong=h.rows.filter(x=>!x.correct),tr={};for(const r of wrong){const q=qmap.get(r.id);if(q)tr[q.trap]=(tr[q.trap]||0)+1}const traps=Object.entries(tr).sort((a,b)=>b[1]-a[1]).slice(0,6);
 app.innerHTML=`${header()}<main class="ccarf-shell"><section class="ccarf-result"><div class="ccarf-kicker">${h.total}-question rotation</div><div class="ccarf-score">${h.percent}%</div><h1>${esc(h.verdict)}</h1><p>${h.correctCount}/${h.total} correct · ${wrong.length} misses · ${h.highMiss} high-confidence miss${h.highMiss===1?'':'es'}.</p></section>
 <section class="ccarf-domain-grid">${Object.entries(h.domains).map(([d,x])=>`<article><span>${esc(d)}</span><b>${x.percent}%</b><small>${x.correct}/${x.total}</small></article>`).join('')}</section>
 <section class="ccarf-traps"><h2>What fooled you</h2>${traps.length?traps.map(([t,n])=>`<div><span>${esc(t)}</span><b>${n}</b></div>`).join(''):'<p>No wrong-answer trap pattern to report.</p>'}</section>
 <section class="ccarf-actions"><button class="btn primary" data-act="review" data-id="${h.id}">Review misses</button><button class="btn" data-act="home">Back</button><button class="btn ghost" data-act="start" data-total="${h.total}">Fresh ${h.total}</button></section></main>`;
}
function review(id){
 const h=state.history.find(x=>x.id===id)||state.history[0];if(!h)return;const wrong=h.rows.filter(x=>!x.correct);
 app.innerHTML=`${header()}<main class="ccarf-shell"><div class="ccarf-pagehead"><div><div class="ccarf-kicker">Post-submit review</div><h1>${wrong.length} misses</h1></div><button class="btn" data-act="result" data-id="${h.id}">Results</button></div>${wrong.map((r,idx)=>{const q=qmap.get(r.id);if(!q)return'';const sel=q.options[r.selected],cor=q.options[q.correct];return `<article class="ccarf-review"><div class="ccarf-review-num">Miss ${idx+1} · ${esc(q.domain)} · ${esc(r.confidence||'No confidence')}</div><div class="ccarf-mini-scenario">${esc(scen[q.scenario].title)}</div><h3>${esc(q.stem)}</h3><div class="ccarf-review-answer wrong"><b>Your choice</b><span>${esc(sel?.text||'Unanswered')}</span></div><div class="ccarf-review-answer right"><b>Best choice</b><span>${esc(cor.text)}</span></div><div class="ccarf-key"><b>Decisive clue</b>${esc(q.key)}</div><div class="ccarf-key"><b>Trap family</b>${esc(q.trap)}</div></article>`}).join('')}</main>`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const x=b.dataset.act;if(x==='theme'){localStorage.setItem(THEME,theme()==='dark'?'light':'dark');applyTheme();state.attempt?exam():landing()}else if(x==='start')newAttempt(Number(b.dataset.total)||60);else if(x==='resume')exam();else if(x==='home')landing();else if(x==='result')result(b.dataset.id);else if(x==='review')review(b.dataset.id);else if(state.attempt){const a=state.attempt,q=qmap.get(a.questionIds[a.current]);if(x==='answer'){a.answers[q.id]=Number(b.dataset.oi);save();exam()}if(x==='confidence'){a.confidence[q.id]=b.dataset.v;save();exam()}if(x==='flag'){const i=a.flags.indexOf(q.id);i>=0?a.flags.splice(i,1):a.flags.push(q.id);save();exam()}if(x==='prev'){a.current=Math.max(0,a.current-1);save();exam()}if(x==='next'){a.current=Math.min(a.total-1,a.current+1);save();exam()}if(x==='jump'){a.current=Number(b.dataset.i);save();exam()}if(x==='saveexit'){save();landing();toast('Attempt saved')}if(x==='submit')submit(false)}});
applyTheme();landing();
})();
