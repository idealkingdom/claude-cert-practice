(()=>{
'use strict';
const DATA=window.CCARF_FINAL_BANK,app=document.getElementById('ccarf-final-app');
if(!DATA||!app)return;
const KEY='ccarf-rotation-final-v4';
const allQuestions=[...(DATA.archive||[]),...(DATA.questions||[])];
const normalize=s=>String(s||'').replace(/`/g,'').replace(/\s+/g,' ').trim();
const byStem=new Map(allQuestions.map(q=>[normalize(q.stem),q]));
const esc=(s='')=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const targets=q=>q.correctAnswers||[q.correct];

function questionForStem(el){return el?byStem.get(normalize(el.textContent)):null;}
function scenarioMarkup(q){
 const s=q&&DATA.scenarios&&DATA.scenarios[q.scenario];
 if(!s)return '';
 return `<aside class="pearson-scenario" aria-label="Scenario"><div class="pearson-scenario-label">Scenario</div><h2>${esc(s.title)}</h2><p>${esc(s.text)}</p></aside>`;
}
function enhanceExam(){
 const main=app.querySelector('main.ccarf-exam'),question=main?.querySelector('.ccarf-question'),stem=question?.querySelector('.ccarf-stem');
 if(!main||!question||!stem)return;
 document.body.classList.add('pearson-exam-mode');
 document.body.classList.remove('pearson-review-mode');
 const q=questionForStem(stem);
 if(q){
   question.classList.toggle('pearson-multi',targets(q).length>1);
   if(!question.querySelector('.pearson-scenario'))question.insertAdjacentHTML('afterbegin',scenarioMarkup(q));
 }
 const head=main.querySelector('.ccarf-exam-head');
 if(head&&!head.querySelector('.pearson-test-name')){
   const left=head.firstElementChild;
   left?.insertAdjacentHTML('afterbegin','<strong class="pearson-test-name">Claude Certified Architect — Foundations</strong>');
 }
 const controls=question.querySelector('.ccarf-controls'),flag=question.querySelector('.ccarf-flag');
 if(controls&&flag&&!controls.contains(flag)){
   flag.classList.add('btn','pearson-flag-button');
   controls.insertBefore(flag,controls.firstElementChild);
 }
 if(controls&&!controls.querySelector('.pearson-review-button')){
   const next=controls.querySelector('[data-act="next"],[data-act="finish"]');
   const b=document.createElement('button');b.className='btn pearson-review-button';b.dataset.act='finish';b.textContent='Review';
   controls.insertBefore(b,next||null);
 }
 const confidence=question.querySelector('.ccarf-confidence');
 if(confidence&&!confidence.closest('.pearson-practice-tools')){
   const details=document.createElement('details');details.className='pearson-practice-tools';
   const summary=document.createElement('summary');summary.textContent='Practice tools';
   confidence.before(details);details.append(summary,confidence);
 }
}
function readAttempt(){
 try{return JSON.parse(localStorage.getItem(KEY)||'{}').attempt||null}catch{return null}
}
function isComplete(a,id){
 const q=allQuestions.find(x=>x.id===id);if(!q)return false;
 const v=Array.isArray(a.answers?.[id])?a.answers[id]:Number.isInteger(a.answers?.[id])?[a.answers[id]]:[];
 return v.length===targets(q).length;
}
function enhanceFinish(){
 const main=app.querySelector('main.ccarf-shell.narrow'),heading=main?.querySelector('h1');
 if(!main||normalize(heading?.textContent)!=='Review your attempt')return false;
 document.body.classList.remove('pearson-exam-mode');
 document.body.classList.add('pearson-review-mode');
 const card=main.querySelector('.ccarf-card'),a=readAttempt();
 if(!card||!a||card.querySelector('.pearson-item-review'))return true;
 const rows=a.questionIds.map((id,i)=>{
   const complete=isComplete(a,id),flag=(a.flags||[]).includes(id);
   return `<button class="pearson-review-row" data-act="jump" data-i="${i}"><span>Question ${i+1}</span><span class="${complete?'complete':'incomplete'}">${complete?'Complete':'Incomplete'}</span><span>${flag?'⚑ Flagged':'—'}</span></button>`;
 }).join('');
 const section=document.createElement('section');section.className='pearson-item-review';section.setAttribute('aria-label','Item review');
 section.innerHTML=`<div class="pearson-review-title"><span>Items Section</span><b>${a.total-a.questionIds.filter(id=>isComplete(a,id)).length} Incomplete</b></div><div class="pearson-review-columns"><span>Question</span><span>Status</span><span>Flagged</span></div><div class="pearson-review-list">${rows}</div>`;
 const actions=card.querySelector('.ccarf-actions');card.insertBefore(section,actions||null);
 return true;
}
function enhanceAnswerReview(){
 for(const article of app.querySelectorAll('.ccarf-review')){
   if(article.querySelector('.pearson-review-scenario'))continue;
   const q=questionForStem(article.querySelector('h2'));if(!q)continue;
   const s=DATA.scenarios?.[q.scenario];if(!s)continue;
   const box=document.createElement('div');box.className='pearson-review-scenario';box.innerHTML=`<b>${esc(s.title)}</b><span>${esc(s.text)}</span>`;
   article.querySelector('h2')?.before(box);
 }
}
function enhance(){
 if(app.querySelector('main.ccarf-exam'))enhanceExam();
 else if(!enhanceFinish()){
   document.body.classList.remove('pearson-exam-mode','pearson-review-mode');
   enhanceAnswerReview();
 }
}
let queued=false;
const queue=()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;enhance();});};
new MutationObserver(queue).observe(app,{childList:true,subtree:true});
queue();
})();
