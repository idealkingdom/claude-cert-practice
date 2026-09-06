import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import { webcrypto } from 'node:crypto';
const root=new URL('../',import.meta.url),box={window:{}};
vm.runInNewContext(fs.readFileSync(new URL('ccarf-final-bank.js',root),'utf8'),box);
const bank=box.window.CCARF_FINAL_BANK;
const appSource=fs.readFileSync(new URL('ccarf-final.js',root),'utf8');
const instrumented=appSource.replace('applyTheme();landing();','window.__test={buildForm,validAttempt,load,save,choose,submit,resetCurrent,resetAll,syncClock,startTick,exam,landing,review,settings,newAttempt,targets,correctFor,completeAnswer,getState:()=>state,setState:v=>{state=v},getScreen:()=>screen};');
const key='ccarf-rotation-final-v4';
function harness(initial=new Map()){
 const storage=new Map(initial),events={},windowEvents={},intervals=new Map(),app={innerHTML:''};let now=1_800_000_000_000,serial=0,approved=true,blocked=false;
 const node={hidden:true,content:'',setAttribute(){},focus(){},scrollIntoView(){},classList:{toggle(){}}};
 const sandbox={window:{CCARF_FINAL_BANK:bank,addEventListener:(name,fn)=>{windowEvents[name]=fn}},document:{getElementById:id=>id==='ccarf-final-app'?app:node,querySelector:s=>s.startsWith('meta')?node:null,querySelectorAll:()=>[],documentElement:{dataset:{}},addEventListener:(n,fn)=>{events[n]=fn},hidden:false},localStorage:{getItem:k=>{if(blocked)throw Error('blocked');return storage.get(k)||null},setItem:(k,v)=>{if(blocked)throw Error('blocked');storage.set(k,v)},removeItem:k=>{if(blocked)throw Error('blocked');storage.delete(k)}},crypto:webcrypto,Uint32Array,console,Math,Date:class extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now}},setInterval:fn=>{intervals.set(++serial,fn);return serial},clearInterval:id=>intervals.delete(id),setTimeout:()=>1,clearTimeout(){},confirm:()=>approved};
 vm.runInNewContext(instrumented,sandbox);
 return {test:sandbox.window.__test,storage,app,events,windowEvents,intervals,advance:ms=>{now+=ms},confirm:v=>{approved=v},blockStorage:v=>{blocked=v},click:(act,extra={})=>events.click({target:{closest:()=>({dataset:{act,...extra},disabled:false})}})};
}
assert.equal(bank.questions.length,90);
assert.equal(bank.topics.length,30);
assert.equal(new Set(bank.questions.map(q=>q.id)).size,90);
assert.equal(new Set(bank.questions.map(q=>q.stem.toLowerCase())).size,90,'Identical active stems');
assert.equal(bank.questions.filter(q=>q.selectCount===2).length,12);
let longest=0,shortest=0,single=0;
for(const q of bank.questions){
 assert(bank.topics.some(t=>t.task===q.task),`${q.id}: unmapped topic`);
 assert.equal(Number(q.task[0])-1,Object.keys(bank.exam.quotas60).indexOf(q.domain),`${q.id}: wrong domain`);
 assert(q.sourceIds.length&&q.sourceIds.every(s=>bank.sources[s]?.url.startsWith('https://')),`${q.id}: missing primary references`);
 assert(q.key&&q.reviewedOn===bank.reviewedOn);
 assert(q.options.length>=4&&q.options.length<=5);
 assert.equal(new Set(q.options.map(o=>o.text.toLowerCase())).size,q.options.length);
 assert(q.correctAnswers.length===q.selectCount&&new Set(q.correctAnswers).size===q.selectCount);
 assert(q.correctAnswers.every(i=>Number.isInteger(i)&&i>=0&&i<q.options.length));
 assert(!/while preserving the current|under the stated latency and cost|using the current model and approved/i.test(q.options.map(o=>o.text).join(' ')));
 if(q.selectCount>1)assert(q.options.every(o=>o.rationale?.length>20));
 else{single++;const lens=q.options.map(o=>o.text.trim().split(/\s+/).length),n=lens[q.correctAnswers[0]];longest+=n===Math.max(...lens)&&lens.filter(v=>v===n).length===1;shortest+=n===Math.min(...lens)&&lens.filter(v=>v===n).length===1;}
}
assert(longest/single<=.35,`Correct choice uniquely longest in ${longest}/${single}`);
assert(shortest/single<=.35,`Correct choice uniquely shortest in ${shortest}/${single}`);
for(const t of bank.topics)assert(bank.questions.some(q=>q.task===t.task),`${t.task}: no questions`);
const h=harness(),t=h.test;
for(const total of [30,60]){
 const history=[];
 for(let run=0;run<40;run++){
 t.setState({history,attempt:null});const form=t.buildForm(total),qs=form.questionIds.map(id=>bank.questions.find(q=>q.id===id));
 assert.equal(qs.length,total);assert.equal(new Set(qs.map(q=>q.conceptId)).size,total);
 for(const [domain,n] of Object.entries(total===60?bank.exam.quotas60:bank.exam.quotas30)){assert.equal(qs.filter(q=>q.domain===domain).length,n);assert(qs.some(q=>q.domain===domain&&q.selectCount===2));}
 for(const q of qs)assert.deepEqual([...form.optionOrders[q.id]].sort(),Array.from(q.options,(_,i)=>i));
 assert.equal(form.repeatedCount,qs.filter(q=>history.some(p=>p.questionIds.includes(q.id))).length);
 history.unshift({id:`run-${total}-${run}`,questionIds:form.questionIds});history.splice(30);
 }
}
t.setState({history:[],attempt:null});t.newAttempt(30);const a=t.getState().attempt;
assert(t.validAttempt(a));assert.equal(h.intervals.size,1);
const deadline=a.deadline;h.advance(25_500);t.syncClock();assert.equal(a.remaining,3575,'Timer must use elapsed wall time');
t.exam();t.exam();t.startTick();assert.equal(h.intervals.size,1,'Rerenders must not restart timers');assert.equal(a.deadline,deadline);
t.landing();h.advance(14_500);t.syncClock();assert.equal(a.remaining,3560,'Timer must continue off the exam screen');
const multi=bank.questions.find(q=>a.questionIds.includes(q.id)&&q.selectCount===2);a.current=a.questionIds.indexOf(multi.id);
t.choose(multi.correctAnswers[0]);assert(!t.completeAnswer(a,multi.id));assert(!t.correctFor(a,multi));
t.choose(multi.correctAnswers[1]);assert(t.completeAnswer(a,multi.id));assert(t.correctFor(a,multi));
const wrong=multi.options.findIndex((_,i)=>!multi.correctAnswers.includes(i));t.choose(wrong);assert.equal(a.answers[multi.id].length,2,'Selection cap');
t.choose(multi.correctAnswers[1]);t.choose(wrong);assert(t.completeAnswer(a,multi.id));assert(!t.correctFor(a,multi),'No partial credit');
assert.equal(t.validAttempt({...a,current:999}).current,29);
assert.equal(t.validAttempt({...a,questionIds:['missing']}),null);
assert.equal(t.validAttempt({...a,optionOrders:{}}),null);
assert.equal(t.validAttempt({...a,remaining:NaN}),null);
t.save();const restored=harness(h.storage);assert.equal(restored.test.getState().attempt.deadline,deadline);assert.equal(restored.test.getState().attempt.answers[multi.id].length,2);
t.submit();assert(t.getState().attempt,'Opening submission review must preserve attempt');assert.equal(t.getScreen().name,'finish');t.exam();assert(t.getState().attempt,'Returning from submission review must preserve answers');
for(const id of a.questionIds){const q=bank.questions.find(q=>q.id===id);a.answers[id]=[...q.correctAnswers];}
t.submit();t.submit();assert.equal(t.getState().history[0].percent,100);assert.equal(t.getState().attempt,null);assert.equal(h.intervals.size,0);
t.review(t.getState().history[0].id,'all');const html=h.app.innerHTML;h.click('theme');assert.equal(t.getScreen().name,'review');assert.equal(h.app.innerHTML,html,'Theme toggle must not navigate away');
const completed=harness(h.storage);assert.equal(completed.test.getState().history.length,1,'Completed results must survive reload');
t.newAttempt(30);h.advance(3_601_000);t.syncClock();for(const fn of [...h.intervals.values()])fn();assert.equal(t.getState().attempt,null);assert(t.getState().history[0].autoSubmitted);assert.equal(t.getState().history.length,2);t.submit(true);assert.equal(t.getState().history.length,2,'Do not submit twice');
t.resetAll();assert.equal(t.getState().history.length,2,'Opening reset confirmation must preserve history');h.click('settings');assert.equal(t.getState().history.length,2,'Cancelling reset must preserve history');
h.storage.set(THEME_KEY(),'light');for(const k of ['ccarf-rotation-final-v3','ccarf-rotation-final-v2','ccarf-sealed-final-v1',`${key}-recovery`])h.storage.set(k,'old');
t.resetAll();h.click('confirm-reset',{kind:'all'});assert.equal(t.getState().history.length,0);assert.equal(h.storage.get(THEME_KEY()),'light');assert(!h.storage.has('ccarf-rotation-final-v3'));assert(!h.storage.has(`${key}-recovery`));
const corrupt=harness(new Map([[key,'{bad json']]));assert.equal(corrupt.test.getState().attempt,null);assert.equal(corrupt.storage.get(`${key}-recovery`),'{bad json');
const malformed=harness(new Map([[key,JSON.stringify({attempt:{id:'bad'},history:{not:'array'}})]]));assert.equal(malformed.test.getState().history.length,0);assert.equal(malformed.test.getState().attempt,null);
h.blockStorage(true);assert.doesNotThrow(()=>t.landing());assert.equal(t.save(),false);h.blockStorage(false);
// Old IDs, numeric selections and option orders remain valid for existing V4 attempts.
const old=bank.archive.slice(0,30),legacy={id:'legacy',total:30,remaining:120,current:0,questionIds:old.map(q=>q.id),optionOrders:Object.fromEntries(old.map(q=>[q.id,[0,1,2,3]])),answers:{[old[0].id]:old[0].correct},confidence:{},flags:[]};
assert(t.validAttempt(legacy));assert(t.correctFor(t.validAttempt(legacy),old[0]));
function THEME_KEY(){return 'claude-cert-theme';}
console.log(`PASS: 90 cases, 30 mapped topics, 12 multiple-response cases, 80 forms, scoring, timer, persistence, legacy restoration, reset and theme regressions.`);
console.log(`Single-choice answer-length audit: uniquely longest ${longest}/${single}; uniquely shortest ${shortest}/${single}.`);
