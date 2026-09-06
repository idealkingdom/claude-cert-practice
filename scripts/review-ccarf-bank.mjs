import fs from 'node:fs';
import vm from 'node:vm';
import { NEW_CASES } from './reviewed-cases.mjs';
const root = new URL('../', import.meta.url);
const path = new URL('ccarf-final-bank.js', root);
const box = { window: {} };
vm.runInNewContext(fs.readFileSync(path, 'utf8'), box);
const bank = box.window.CCARF_FINAL_BANK;
const archive = bank.archive || bank.questions;
const sources = {
  agents: ['Agent architecture', 'https://www.anthropic.com/engineering/building-effective-agents'],
  subagents: ['SDK subagents', 'https://code.claude.com/docs/en/agent-sdk/subagents'],
  hooks: ['SDK hooks', 'https://code.claude.com/docs/en/agent-sdk/hooks'],
  sessions: ['SDK sessions', 'https://code.claude.com/docs/en/agent-sdk/sessions'],
  stops: ['API stop reasons', 'https://platform.claude.com/docs/en/build-with-claude/handling-stop-reasons'],
  tools: ['MCP tool specification', 'https://modelcontextprotocol.io/specification/2025-11-25/server/tools'],
  mcp: ['MCP integration', 'https://code.claude.com/docs/en/mcp'],
  resources: ['MCP resources', 'https://modelcontextprotocol.io/specification/2025-11-25/server/resources'],
  prompts: ['MCP prompts', 'https://modelcontextprotocol.io/specification/2025-11-25/server/prompts'],
  memory: ['Project memory and rules', 'https://code.claude.com/docs/en/memory'],
  settings: ['Managed settings', 'https://code.claude.com/docs/en/settings'],
  skills: ['Skills and invocation', 'https://code.claude.com/docs/en/skills'],
  practices: ['Claude Code practices', 'https://code.claude.com/docs/en/best-practices'],
  cli: ['Programmatic Claude Code', 'https://code.claude.com/docs/en/headless'],
  cliFlags: ['Claude Code CLI flags', 'https://code.claude.com/docs/en/cli-reference'],
  prompting: ['Prompt engineering', 'https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/overview'],
  outputs: ['Structured outputs', 'https://platform.claude.com/docs/en/build-with-claude/structured-outputs'],
  batch: ['Message batches', 'https://platform.claude.com/docs/en/build-with-claude/batch-processing'],
  context: ['Context engineering', 'https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents'],
  evals: ['Evaluation design', 'https://platform.claude.com/docs/en/test-and-evaluate/develop-tests'],
  citations: ['Citations and provenance', 'https://platform.claude.com/docs/en/build-with-claude/citations'],
  security: ['Agent deployment controls', 'https://code.claude.com/docs/en/agent-sdk/secure-deployment']
};
const families = [
  ['agentic-loops','1.1','Agentic loops','agents','stops'],
  ['multi-agent-orchestration','1.2','Multi-agent orchestration','agents','subagents'],
  ['subagent-context','1.3','Subagent invocation and context','subagents'],
  ['workflow-handoff','1.4','Workflow enforcement and handoff','agents','security'],
  ['agent-sdk-hooks','1.5','Agent SDK hooks','hooks'],
  ['task-decomposition','1.6','Task decomposition','agents','subagents'],
  ['session-state','1.7','Session state and resumption','sessions','security'],
  ['tool-interface','2.1','Tool interface design','tools'],
  ['structured-errors','2.2','Structured tool errors','tools'],
  ['tool-distribution-choice','2.3','Tool distribution and choice','subagents','outputs'],
  ['mcp-integration','2.4','MCP server integration','mcp','resources','prompts'],
  ['built-in-tools','2.5','Built-in tools','practices','subagents'],
  ['claude-md-hierarchy','3.1','CLAUDE.md and configuration scope','memory','settings'],
  ['skills-commands','3.2','Skills and commands','skills'],
  ['path-specific-rules','3.3','Path-specific rules','memory'],
  ['plan-vs-execute','3.4','Planning and execution','practices'],
  ['iterative-refinement','3.5','Iterative refinement','practices'],
  ['ci-cd','3.6','CI/CD integration','cli','cliFlags'],
  ['system-prompts','4.1','Explicit prompt criteria','prompting','evals'],
  ['few-shot','4.2','Few-shot examples','prompting'],
  ['structured-output-tool-use','4.3','Structured output','outputs'],
  ['validation-retry','4.4','Validation and corrective retry','outputs','evals'],
  ['batch-processing','4.5','Batch processing','batch'],
  ['multi-pass-review','4.6','Multi-pass review','agents','evals'],
  ['context-window','5.1','Context management','context'],
  ['ambiguity-escalation','5.2','Ambiguity and escalation','agents'],
  ['error-propagation','5.3','Error propagation','tools','subagents'],
  ['codebase-context','5.4','Codebase exploration','practices','context'],
  ['human-review-confidence','5.5','Human review and calibration','evals'],
  ['provenance-synthesis','5.6','Provenance and uncertainty','citations','context']
];
const topicMap = new Map(families.map(([family,task,title,...refs]) => [family,{task,title,refs}]));
topicMap.set('dependency-aware-scheduling',topicMap.get('task-decomposition'));
topicMap.set('evidence-based-escalation',topicMap.get('workflow-handoff'));
topicMap.set('server-side-authorization',{task:'2.3',title:'Tool authority boundaries',refs:['security','tools']});
const seen = new Set();
const canonical = archive.filter(q => q.id.startsWith('v4-') || (!seen.has(q.conceptId) && seen.add(q.conceptId)));
const questions = canonical.map(q => ({...q, id:`r5-${q.id}`, options:q.options.map(o=>({...o})), reviewedOn:'2026-09-06'}));
function patch(id, changes) { Object.assign(questions.find(q=>q.id===`r5-${id}`), changes); }
// Fix ambiguous alternatives and claims that implied a stronger guarantee than the scenario establishes.
patch('v4-dependency-aware-scheduling-06', {
  stem:'An extraction service processes 400 independent pages. Page runtimes vary twentyfold, each in-flight request uses significant memory, and the merger requires document order. Which scheduling plan best controls memory and avoids idle workers?',
  options:[
    {text:'Use a bounded worker queue, tag each result with its page index, and merge by index.'},
    {text:'Assign equal contiguous page ranges to fixed workers, then wait for all ranges to finish.'},
    {text:'Start all page requests together and stream each completed result into the ordered merger.'},
    {text:'Process pages in document order with one worker and cache the output before merging.'}
  ]
});
patch('v4-server-side-authorization-06', {
  stem:'An MCP extraction tool queries a multi-tenant database. The service must never read rows outside the authenticated tenant, including intermediate results. It currently trusts a model-supplied tenant_id. Which change satisfies that requirement?',
  options:[
    {text:'Require the model to copy tenant_id from a signed context block before building the query.'},
    {text:'Bind the query tenant to verified session identity and restrict all reads to that scope.'},
    {text:'Compare the supplied tenant_id with the document header before executing the query.'},
    {text:'Query using tenant_id, then apply a server-side authorization filter to returned rows.'}
  ]
});
patch('v4-evidence-based-escalation-03', {stem:'A research agent must explicitly report whether a critical safety claim is verified from primary evidence. It retrieves several summaries but cannot access the cited study. The workflow has a human evidence-review queue. Which response satisfies the reporting contract?'});
patch('v3-session-state-02', {
  stem:'An Agent SDK investigation has a useful conversation history. An engineer wants to explore an alternative hypothesis while retaining the original session for independent continuation. Which session operation fits?',
  options:[{text:'Resume the saved session with fork enabled, recording the new session ID for the alternative.'},{text:'Continue the most recent session and append a marker identifying the alternative investigation.'},{text:'Resume the original session ID twice, treating the two query calls as independent branches.'},{text:'Start a fresh session and supply only the final answer from the original investigation.'}],
  key:'Forking creates a separate conversation branch; resuming alone continues the existing session. File isolation is a separate concern.',
  trap:'Conversation branching does not create an isolated working tree.'
});
patch('v3-agent-sdk-hooks-02', {
  stem:'Two MCP tools return equivalent date fields in different formats. The agent frequently compares them incorrectly. Calls already pass authorization checks, and raw responses must remain available in the audit log. Where should normalization happen?',
  options:[{text:'Normalize tool results in the post-tool processing layer and preserve raw values alongside them.'},{text:'Normalize model arguments in the pre-tool layer and leave returned date strings unchanged.'},{text:'Add date-format examples to the system prompt and let each reasoning step parse the values.'},{text:'Normalize only the final report after the agent has finished comparing the tool results.'}],
  key:'The mismatch is in returned data, so normalize it at the result boundary before reasoning consumes it; retain originals for audit.',
  trap:'Input validation and final presentation occur on different sides of the faulty comparison.'
});
patch('v3-batch-processing-01', {stem:'An overnight service must classify 40,000 independent support transcripts by the next business day. Users do not await individual results, and each classification needs its own input identifier. Which API processing design should be evaluated?'});
patch('v3-structured-output-tool-use-02', {stem:'An extraction response satisfies its JSON schema, including the permitted numeric ranges. However, its invoice total does not equal the sum of its line items. What should the application do before accepting the record?'});
patch('v3-human-review-confidence-01', {stem:'A CI assistant recommends a dependency upgrade. Its confidence is high, but the required compatibility claim has no release-note citation or passing compatibility test. The release policy requires one of these checks. How should validation handle the recommendation?'});
patch('v3-built-in-tools-02', {stem:'Claude Code needs to locate textual calls to refreshToken across source files, excluding generated files. The investigation does not yet require semantic call-graph analysis. Which built-in capability is the most direct starting point?'});
patch('v4-dependency-aware-scheduling-05', {stem:'Two agents update the same generated dependency lockfile from an old snapshot. Text merges can succeed while producing an invalid dependency graph. Policy requires each generated lockfile to reflect the latest accepted state. Which correction addresses the observed lost updates?'});
// Natural rewrites retain the operational distinction without creating a shortest-answer cue.
const answerRevisions = {
  'v3-multi-agent-orchestration-02':'Require bounded, structured handoffs with the findings, source identifiers, unresolved items, and evidence the coordinator needs.',
  'v3-task-decomposition-02':'Run the independent branches concurrently and start the fourth call after the first returns its required identifier.',
  'v3-session-state-01':'Restore the saved task state and revalidate time-sensitive evidence, current permissions, and tool contracts before taking further action.',
  'v3-structured-errors-01':'Return distinct error categories with recovery metadata so the caller can separate transient failures from invalid or unauthorized requests.',
  'v3-tool-distribution-choice-02':'Limit the planner to the read tools its assignment requires, with authorization checks enforced by the tool service.',
  'v3-claude-md-hierarchy-02':'Treat managed security settings as authoritative and request any exception through the organization’s policy administration process.',
  'v3-path-specific-rules-02':'Keep common instructions at the root and scope frontend and infrastructure conventions to the files they govern.',
  'v3-plan-vs-execute-01':'Start in read-only Plan Mode to inspect the migration and propose changes for review before enabling execution.',
  'v3-ci-cd-02':'Provision the CI environment with explicit service credentials, settings, tool access, and permissions required for the job.',
  'v3-system-prompts-01':'Define the expected output and measurable acceptance criteria, resolving quality trade-offs before changing the model or architecture.',
  'v3-structured-output-tool-use-01':'Use the API’s schema-constrained output mechanism, then validate the returned object before handing it to downstream code.',
  'v3-context-window-01':'Preserve the validated facts and their sources, governing constraints, unresolved questions, and state required to continue the task.',
  'v3-error-propagation-02':'Return an explicit partial status with completed coverage, missing fields, failure details, and the available recovery actions.',
  'v3-human-review-confidence-01':'Reject the unsupported compatibility claim until a required source citation or passing test is available, regardless of model confidence.',
  'v3-provenance-synthesis-02':'Carry a source identifier with each material claim through specialist handoffs, synthesis, and the final recommendation.'
};
for (const [id,text] of Object.entries(answerRevisions)) {
  const q=questions.find(q=>q.id===`r5-${id}`);q.options[q.correct].text=text;
}
for (const q of questions) {
  delete q.authored; delete q.difficulty;
  q.correctAnswers=[q.correct];
  q.selectCount=1;
  const t=topicMap.get(q.family); if(!t)throw Error(`Unmapped family: ${q.family}`);
  q.task=t.task; q.topic=t.title; q.sourceIds=t.refs;
}
for (const c of NEW_CASES) {
  const t=topicMap.get(c.family);
  questions.push({...c,domain:Object.keys(bank.exam.quotas60)[Number(t.task[0])-1],task:t.task,topic:t.title,sourceIds:c.sourceIds||t.refs,selectCount:c.correctAnswers.length,reviewedOn:'2026-09-06'});
}
bank.version='2026-09-06-reviewed-v5';
bank.reviewedOn='2026-09-06';
bank.archive=archive;
bank.questions=questions;
bank.sources=Object.fromEntries(Object.entries(sources).map(([id,[title,url]])=>[id,{title,url,checkedOn:'2026-09-06',kind:'primary'}]));
bank.topics=families.map(([family,task,title,...sourceIds])=>({family,task,title,sourceIds}));
bank.blueprint={url:'https://claudecertificationguide.com/architect-foundations',guide:'https://github.com/paullarionov/claude-certified-architect',status:'Cross-checked against public study-guide task lists; official portal revisions are not independently verified.'};
bank.exam.pool=questions.length;
bank.exam.avoidAttempts=0;
fs.writeFileSync(path,`window.CCARF_FINAL_BANK=${JSON.stringify(bank)};\n`);
console.log(`Built ${questions.length} active cases; ${archive.length} legacy entries retained only for existing attempts and results.`);
