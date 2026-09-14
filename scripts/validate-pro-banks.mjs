import fs from 'node:fs';
import vm from 'node:vm';

globalThis.window={};
for(const file of ['questions.js','extras-developerF.js','extras-architectP.js','hard-questions.js','exam-hardening-20260915.js','exam-bank-active.js']){
  vm.runInThisContext(fs.readFileSync(file,'utf8'),{filename:file});
}

const {CERTS,buildBank}=window.CLAUDE_CERT;
const targets=['architectP','developerF'];
let failed=false;
const die=msg=>{failed=true;console.error(`ERROR: ${msg}`)};
const quota=(domains,total)=>{
  const raw=domains.map(([name,w])=>({name,raw:w/100*total,n:Math.floor(w/100*total)}));
  let left=total-raw.reduce((sum,x)=>sum+x.n,0);
  raw.sort((a,b)=>(b.raw-b.n)-(a.raw-a.n));
  for(let i=0;i<left;i++)raw[i%raw.length].n++;
  return Object.fromEntries(raw.map(x=>[x.name,x.n]));
};
const norm=s=>String(s||'').toLowerCase().replace(/[`“”‘’]/g,'').replace(/[^a-z0-9]+/g,' ').trim();
const cueRisk=q=>{
  if((q.format||'choice')!=='choice'||q.select!==1||!q.options?.length)return false;
  const ci=q.correct?.[0];if(!Number.isInteger(ci)||!q.options[ci])return false;
  const lens=q.options.map(o=>String(o).length),correct=lens[ci],others=lens.filter((_,i)=>i!==ci);
  return correct>Math.max(...others)*1.12&&correct>others.reduce((a,b)=>a+b,0)/others.length+18;
};

for(const key of targets){
  const bank=buildBank(key);
  // Simulate app.js's first map call. The compatibility shim includes archived
  // questions in this one lookup so saved pre-hardening attempts remain readable.
  const lookupRows=bank.map(q=>[q.id,q]);
  const lookup=new Map(lookupRows);
  const active=Array.from(bank);
  const cfg=CERTS[key],expected=quota(cfg.domains,cfg.count);
  console.log(`\n${cfg.code}: ${active.length} active / ${lookup.size-active.length} archived compatibility questions`);
  if(active.some(q=>q.retired))die(`${key} exposes retired template clones in the active pool`);
  if(active.length<cfg.count)die(`${key} has only ${active.length} active questions for a ${cfg.count}-item exam`);
  const ids=new Set();const stems=new Map();
  for(const q of active){
    if(ids.has(q.id))die(`${key} duplicate id ${q.id}`);ids.add(q.id);
    if(!cfg.domains.some(([d])=>d===q.domain))die(`${q.id} uses unknown domain ${q.domain}`);
    const f=q.format||'choice';
    if(f==='choice'){
      if(!Array.isArray(q.options)||q.options.length!==4)die(`${q.id} must have four answer choices`);
      if(!Array.isArray(q.correct)||q.correct.length!==q.select)die(`${q.id} correct/select count mismatch`);
      if(new Set(q.correct).size!==q.correct.length||q.correct.some(i=>!Number.isInteger(i)||i<0||i>=q.options.length))die(`${q.id} has invalid correct indexes`);
    }else if(!['matrix','match'].includes(f))die(`${q.id} has unsupported format ${f}`);
    const s=norm(q.stem);if(stems.has(s))die(`${key} duplicate stem: ${q.id} and ${stems.get(s)}`);else stems.set(s,q.id);
  }
  for(const [domain,need] of Object.entries(expected)){
    const have=active.filter(q=>q.domain===domain&&(q.format||'choice')==='choice').length;
    console.log(`  ${domain}: ${have} choice questions; full-form quota ${need}`);
    if(have<need)die(`${key} ${domain} has ${have}, needs at least ${need}`);
  }
  const v6=active.filter(q=>q.id.startsWith(`v6-${key}-`));
  const objectives=new Set(v6.map(q=>q.objective).filter(Boolean));
  console.log(`  v6 task-mapped: ${v6.length}; objective labels: ${objectives.size}; length-cue flags: ${v6.filter(cueRisk).length}`);
  if(key==='architectP'&&v6.length<38)die('architectP needs at least one new case per published task area');
  if(key==='developerF'&&objectives.size<25)die('developerF needs all 25 published sub-skills represented');
}

if(failed)process.exit(1);
console.log('\nProfessional/developer bank validation passed.');
