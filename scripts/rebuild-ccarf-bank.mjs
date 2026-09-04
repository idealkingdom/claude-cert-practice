import fs from 'node:fs';
import vm from 'node:vm';

const bankPath = new URL('../ccarf-final-bank.js', import.meta.url);
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(bankPath, 'utf8'), sandbox);

const bank = sandbox.window.CCARF_FINAL_BANK;
const boilerplate = [
  'under the stated latency and cost constraints',
  'using the current model and approved tool inventory',
  'while keeping unrelated service boundaries unchanged',
  'while retaining existing monitoring and rollback controls',
  'while preserving the current audit path',
  'without weakening the existing authorization policy',
  'while keeping the existing service boundary',
  'with the current latency target unchanged',
  'without adding another model call'
];
const reviewLead = /^(During a design review|After a pilot exposes the issue|Following an incident|While tightening the production design|During a reliability review),\s*/;

function cleanSentence(value) {
  let text = String(value).replace(reviewLead, '');
  for (const phrase of boilerplate) {
    text = text.replace(new RegExp(`\\.?\\s*${phrase.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\.?`, 'gi'), '');
  }
  text = text.replace(/\s+([,.;:?])/g, '$1').replace(/\.{2,}/g, '.').replace(/\s{2,}/g, ' ').trim();
  text = text.replace(/^([a-z])/, (_, c) => c.toUpperCase());
  if (text && !/[.!?`]$/.test(text)) text += '.';
  return text;
}

const retiredIds = new Set([
  'v3-agentic-loops-19',
  'v3-multi-agent-orchestration-19',
  'v3-subagent-context-19',
  'v3-workflow-handoff-19',
  'v3-agent-sdk-hooks-19',
  'v3-task-decomposition-19',
  'v3-session-state-18',
  'v3-tool-interface-17',
  'v3-structured-errors-17',
  'v3-tool-distribution-choice-17',
  'v3-mcp-integration-17',
  'v3-built-in-tools-16',
  'v3-system-prompts-16',
  'v3-few-shot-16',
  'v3-structured-output-tool-use-16',
  'v3-validation-retry-16',
  'v3-batch-processing-16',
  'v3-multi-pass-review-16'
]);

const AGENTIC = 'Agentic Architecture & Orchestration';
const TOOLS = 'Tool Design & MCP Integration';

const conciseAnswers = new Map([
  ['Capability boundaries should follow the specialist role, not prompt restraint.', 'Give the specialist only its required read capability; keep write access outside that role.'],
  ['Mandatory workflow transitions belong in deterministic orchestration.', 'Enforce allowed state transitions outside the model and expose only state-valid capabilities.'],
  ['Parallelize independent work while preserving genuine data dependencies.', 'Run independent calls concurrently; start a dependent call only after its prerequisite arrives.'],
  ['Improve the interface semantics before adding another routing layer.', 'Differentiate each tool’s name, purpose, parameters, and appropriate use cases.'],
  ['Make invalid states hard to express rather than repairing them later.', 'Use an enum with operation-specific required fields; reject unsupported values at the boundary.'],
  ['Recovery should use deterministic error semantics and bounded retry policy.', 'Honor structured retry metadata with bounded backoff, then escalate or degrade.'],
  ['A mandatory call should be encoded as a mandatory call, not a preference.', 'Require the validation tool through API tool choice, then validate its result.'],
  ['Tool distribution should reflect the role and least-privilege boundary.', 'Expose only planning capabilities and enforce their authorization in trusted code.'],
  ['Transport should follow deployment shape and trust boundary.', 'Use stdio locally and authenticated network transport for the shared service.'],
  ['Use MCP primitives according to readable context, reusable prompts, and callable operations.', 'Use a resource for reference, prompt for reuse, and tool for ticket creation.'],
  ['Repository-specific guidance should be versioned with the repository.', 'Commit repository-specific guidance in a repository-scoped CLAUDE.md.'],
  ['Managed policy is not a project-level preference.', 'Keep the managed security restriction authoritative over project preferences.'],
  ['Reusable instruction workflows belong in reusable workflow packaging.', 'Package the workflow as a reusable Claude Code Skill or command.'],
  ['Scope conflicting rules to the code they govern.', 'Keep shared guidance common and move directory conventions into path-scoped rules.'],
  ['Concrete feedback should drive the next iteration.', 'Feed the test failure back and revise within a bounded loop.'],
  ['Iterative refinement should update from the latest validated state.', 'Carry the current patch and validated failure evidence into each iteration.'],
  ['Use the intended non-interactive interface and explicit turn/output controls.', 'Use `claude -p` with explicit output format and a supported turn bound.'],
  ['Ambiguous quality criteria should be made explicit before adding machinery.', 'Define measurable success criteria and the task’s relevant trade-offs.'],
  ['Machine-consumed output should use a machine-enforced structure where available.', 'Use API-enforced structured output and validate it before consumption.'],
  ['Separate review can reduce self-confirmation, but deterministic policy checks remain external.', 'Separate generation from criteria-based review; keep deterministic checks external.']
]);

function cases(family, domain, key, trap, rows) {
  return rows.map((row, index) => ({
    id: `v4-${family}-${String(index + 1).padStart(2, '0')}`,
    family,
    domain,
    scenario: row.scenario,
    stem: row.stem,
    options: row.options.map(text => ({ text })),
    correct: row.correct,
    key,
    trap,
    conceptId: `v4:${family}`,
    authored: true
  }));
}

const additions = [
  ...cases(
    'dependency-aware-scheduling',
    AGENTIC,
    'Concurrency follows the dependency graph: independent work can fan out, but shared-state or dependent work must remain ordered.',
    'Treating every subtask as either fully serial or safely parallel',
    [
      {
        scenario: 'support',
        stem: 'A support workflow runs policy lookup, account-history retrieval, and outage-status checks one after another. None consumes another check\'s output, and the serial latency breaches the response SLO. What is the BEST redesign?',
        options: [
          'Run the three independent checks concurrently, give each a bounded result contract, and let the coordinator synthesize after all required results arrive.',
          'Let the first check decide which of the other checks may run so the workflow always has a single reasoning path.',
          'Combine all three integrations into one unrestricted tool so Claude can choose an internal order.',
          'Increase the turn budget so the serial workflow has enough time to finish.'
        ],
        correct: 0
      },
      {
        scenario: 'migration',
        stem: 'A migration coordinator analyzes repositories sequentially even though each repository has a separate owner and no shared working tree. The final rollout plan is the only step that needs all findings. Which execution model is strongest?',
        options: [
          'Have every repository agent update the rollout plan as soon as it finishes.',
          'Fan out bounded repository analyses, then perform one synthesis step over their structured findings.',
          'Use one agent with a larger context window to inspect all repositories in order.',
          'Allow repository agents to delegate recursively until every dependency is resolved.'
        ],
        correct: 1
      },
      {
        scenario: 'research',
        stem: 'Three research agents can search independent source collections, but they currently read and rewrite the same scratchpad while searching. Early claims anchor later searches and conflicting edits are lost. What should change?',
        options: [
          'Keep the shared scratchpad and ask every agent to include a confidence score with each edit.',
          'Run the agents sequentially so later agents can inherit the full transcript.',
          'Give each researcher an isolated evidence ledger, then reconcile cited claims in a dedicated synthesis pass.',
          'Ask the fastest researcher to act as the permanent source of truth for the others.'
        ],
        correct: 2
      },
      {
        scenario: 'productivity',
        stem: 'A developer assistant waits for linting to finish before starting type checks and unit tests. The three commands are read-only and independent, but a patch may be proposed only after all results are known. What is the BEST orchestration?',
        options: [
          'Ask one subagent to run all commands serially and return its complete terminal transcript.',
          'Start patch generation immediately and cancel it if a later check fails.',
          'Let each checker edit the same branch when it detects a problem.',
          'Run the checks concurrently, collect compact results, and gate patch generation on the combined outcome.'
        ],
        correct: 3
      },
      {
        scenario: 'ci',
        stem: 'Two remediation agents propose changes to the same dependency lockfile. Their tasks looked independent, but each patch is computed from the original file and the second application silently overwrites the first. What is the strongest correction?',
        options: [
          'Increase parallelism and rely on the test suite to catch overwritten changes.',
          'Declare the lockfile a shared dependency, serialize its mutations, and recompute the later patch from the updated state.',
          'Give both agents write access to the default branch so merges happen sooner.',
          'Choose whichever patch was produced with the higher self-reported confidence.'
        ],
        correct: 1
      },
      {
        scenario: 'extract',
        stem: 'A document service extracts 400 independent pages serially and merges their fields at the end. Memory is bounded, page order is known, and no page depends on another. Which change improves throughput without weakening determinism?',
        options: [
          'Process pages with bounded concurrency, preserve page identifiers, and merge results in document order.',
          'Send the entire document to several agents and keep the longest response.',
          'Allow each page agent to revise fields extracted by earlier agents.',
          'Remove page identifiers so the merger has fewer tokens to process.'
        ],
        correct: 0
      }
    ]
  ),
  ...cases(
    'evidence-based-escalation',
    AGENTIC,
    'Escalation must be triggered by explicit evidence and impact thresholds; confidence or a turn limit alone is not authority to continue.',
    'Using more inference or more turns where an explicit human boundary is required',
    [
      {
        scenario: 'support',
        stem: 'A support agent may issue small credits automatically. A customer requests a much larger exception, and the account evidence is contradictory. The agent is highly confident that approval would retain the customer. What should the workflow do?',
        options: [
          'Approve because high model confidence offsets incomplete evidence.',
          'Ask the model to reconsider until two consecutive answers agree.',
          'Stop at the credit threshold and route the evidence, uncertainty, and requested action to an authorized reviewer.',
          'Split the credit into several automatic transactions below the threshold.'
        ],
        correct: 2
      },
      {
        scenario: 'migration',
        stem: 'During a database migration, an agent detects that the production schema differs from the signed migration plan. The next step is reversible, but continuing would make later destructive steps appear valid. What is the BEST behavior?',
        options: [
          'Pause the run, preserve the observed state, and require approval of a revised plan before continuing.',
          'Continue through the reversible step and escalate only before the first destructive command.',
          'Regenerate the signed plan automatically from the live schema.',
          'Increase the validation retry count in case the schema difference is transient.'
        ],
        correct: 0
      },
      {
        scenario: 'research',
        stem: 'A research agent must answer a safety question from primary sources. It finds several summaries but cannot retrieve the cited study, and the deadline is near. Which response policy is strongest?',
        options: [
          'Infer the study result from agreement among the summaries.',
          'Return the supported findings, mark the unresolved claim as unverified, and escalate the evidence gap rather than completing it speculatively.',
          'Use the most recent summary as a substitute for the primary source.',
          'Continue searching until the turn budget expires, then omit all provenance.'
        ],
        correct: 1
      },
      {
        scenario: 'productivity',
        stem: 'A coding agent is authorized to modify one service. Its proposed fix requires changing a shared package owned by another team, and the local tests would pass with that change. What should happen next?',
        options: [
          'Modify the shared package because passing tests demonstrate safety.',
          'Copy the shared package into the authorized service and edit the copy.',
          'Ask a subagent to make the shared change so the original agent stays within scope.',
          'Stop before the out-of-scope edit and request the owning team\'s review with the proposed dependency change.'
        ],
        correct: 3
      },
      {
        scenario: 'ci',
        stem: 'A CI repair agent sees a new install script making an unexpected outbound request while using a release credential. Tests still pass and the change came from a trusted maintainer. What is the BEST next action?',
        options: [
          'Quarantine the run, preserve evidence, and escalate through the security incident path before any automated repair or release.',
          'Allow the release because repository trust is stronger evidence than network behavior.',
          'Ask the agent to rewrite the script and proceed if tests remain green.',
          'Rotate the credential after release so the pipeline is not delayed.'
        ],
        correct: 0
      },
      {
        scenario: 'extract',
        stem: 'An extraction agent cannot distinguish two handwritten values in a legally binding field. Both values satisfy the schema, but choosing the wrong one changes the payment obligation. What is the correct handling?',
        options: [
          'Select the value with the higher token probability and record confidence.',
          'Run the same image through the model repeatedly and use majority vote.',
          'Return an explicit unresolved field with the source location and require human verification.',
          'Leave the field empty without identifying why it was omitted.'
        ],
        correct: 2
      }
    ]
  ),
  ...cases(
    'server-side-authorization',
    TOOLS,
    'Authorization belongs at the tool boundary and must be derived from authenticated identity and server-side policy, not model-supplied arguments or prompt instructions.',
    'Mistaking prompt guidance or a model-provided identifier for an authorization control',
    [
      {
        scenario: 'support',
        stem: 'An MCP refund tool accepts any authenticated employee token. The system prompt tells Claude that only managers may approve refunds above $200, but the server does not inspect role claims. What is the required fix?',
        options: [
          'Add more examples of forbidden refunds to the system prompt.',
          'Require Claude to include its confidence in the refund request.',
          'Enforce the amount and role policy in the refund service using verified identity claims.',
          'Rename the tool so the restriction is more visible during tool selection.'
        ],
        correct: 2
      },
      {
        scenario: 'migration',
        stem: 'A deployment tool takes an `environment` string supplied by the model. A staging operator can ask the agent to send `production`, and the tool executes with a shared credential. Which design closes the authorization gap?',
        options: [
          'Describe the allowed environment more forcefully in the parameter documentation.',
          'Bind permitted environments to the authenticated principal on the server and reject unauthorized targets.',
          'Ask a second model to verify the environment string before execution.',
          'Log production requests so misuse can be investigated later.'
        ],
        correct: 1
      },
      {
        scenario: 'research',
        stem: 'A research connector is intended for public documents, but its service credential can also read private workspaces. Prompt instructions say not to access private data. What is the strongest control?',
        options: [
          'Use a credential restricted to the public collection and enforce that collection allowlist in the connector.',
          'Keep the broad credential and redact private results after retrieval.',
          'Require the model to explain why each document is public before opening it.',
          'Hide private workspace names from the tool description.'
        ],
        correct: 0
      },
      {
        scenario: 'productivity',
        stem: 'A file-editing tool checks that a requested path starts with the repository directory, but it does not resolve `..` segments or symlinks. What should be changed FIRST?',
        options: [
          'Tell Claude never to use relative path segments.',
          'Reject filenames longer than a fixed token count.',
          'Run a second agent to review paths before every write.',
          'Canonicalize the target on the server and enforce containment within the authorized root before writing.'
        ],
        correct: 3
      },
      {
        scenario: 'ci',
        stem: 'A release tool lets the model supply the repository and commit SHA. The workflow identity is authorized for one repository, but the tool never checks that the requested SHA belongs to that repository. What is the BEST fix?',
        options: [
          'Verify workflow identity, repository scope, and commit provenance server-side before creating a release.',
          'Ask Claude to quote the workflow URL in every release request.',
          'Permit any SHA when the test suite passes.',
          'Add the repository name to the system prompt and keep the shared release token.'
        ],
        correct: 0
      },
      {
        scenario: 'extract',
        stem: 'A multi-tenant extraction tool accepts `tenant_id` from the model and uses it directly in a database query. Authentication occurs upstream, but the tool receives no verified tenant binding. What is the correct architecture?',
        options: [
          'Keep the argument and add a prompt example showing the right tenant ID.',
          'Derive tenant scope from the authenticated session at the tool boundary and treat model input only as data within that scope.',
          'Let the model compare the tenant ID with the document header.',
          'Return all matching tenants and ask Claude to discard the unauthorized rows.'
        ],
        correct: 1
      }
    ]
  )
];

const base = bank.questions
  .filter(question => !retiredIds.has(question.id) && !question.id.startsWith('v4-'))
  .map(question => ({
    ...question,
    stem: cleanSentence(question.stem),
    options: question.options.map((option, index) => ({
      ...option,
      text: index === question.correct && conciseAnswers.has(question.key)
        ? conciseAnswers.get(question.key)
        : cleanSentence(option.text)
    })),
    conceptId: `${question.family}:${Buffer.from(question.key).toString('base64url').slice(0, 18)}`,
    authored: true
  }));

bank.version = '2026-09-04';
bank.questions = [...base, ...additions];

fs.writeFileSync(bankPath, `window.CCARF_FINAL_BANK=${JSON.stringify(bank)};\n`);
console.log(`Rebuilt ${bank.questions.length} questions (${base.length} retained, ${additions.length} newly authored).`);
