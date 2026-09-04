import fs from 'node:fs';
import vm from 'node:vm';
import { HARD_OPTIONS } from './hard-mode-options.mjs';

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
          'Run the checks concurrently with bounded results, then let the coordinator synthesize after all three finish.',
          'Run policy lookup first, then use its result to decide whether account and outage checks are necessary.',
          'Expose one composite check tool that performs the three integrations internally in a fixed sequence.',
          'Start all checks together, but let the first successful result cancel the remaining two requests.'
        ],
        correct: 0
      },
      {
        scenario: 'migration',
        stem: 'A migration coordinator analyzes repositories sequentially even though each repository has a separate owner and no shared working tree. The final rollout plan is the only step that needs all findings. Which execution model is strongest?',
        options: [
          'Let repository agents update a shared rollout plan as they finish, using version checks for conflicts.',
          'Fan out bounded repository analyses, then synthesize one rollout plan from their structured findings.',
          'Group repositories by owner and process each group sequentially before combining the group reports.',
          'Build the rollout plan incrementally, allowing later repository agents to revise earlier conclusions.'
        ],
        correct: 1
      },
      {
        scenario: 'research',
        stem: 'Three research agents can search independent source collections, but they currently read and rewrite the same scratchpad while searching. Early claims anchor later searches and conflicting edits are lost. What should change?',
        options: [
          'Keep the shared scratchpad but require source attribution and optimistic locking for every proposed edit.',
          'Run researchers sequentially so each can challenge the claims and citations produced by earlier work.',
          'Give each researcher an isolated evidence ledger, then reconcile cited claims during dedicated synthesis.',
          'Let researchers share only accepted claims while keeping rejected evidence isolated in their local traces.'
        ],
        correct: 2
      },
      {
        scenario: 'productivity',
        stem: 'A developer assistant waits for linting to finish before starting type checks and unit tests. The three commands are read-only and independent, but a patch may be proposed only after all results are known. What is the BEST orchestration?',
        options: [
          'Use one subagent to run the checks serially and return a compact failure summary rather than transcripts.',
          'Begin patch generation from lint results while tests continue, discarding the patch if later checks fail.',
          'Run checkers concurrently and allow each to propose an isolated patch for its detected failures.',
          'Run the checks concurrently, collect bounded results, and gate patch generation on their combined outcome.'
        ],
        correct: 3
      },
      {
        scenario: 'ci',
        stem: 'Two remediation agents propose changes to the same dependency lockfile. Their tasks looked independent, but each patch is computed from the original file and the second application silently overwrites the first. What is the strongest correction?',
        options: [
          'Keep parallel generation but apply both patches through a three-way merge before running the test suite.',
          'Treat the lockfile as shared state, serialize its mutations, and recompute the second patch afterward.',
          'Assign disjoint dependency sections to each agent and merge their original patches in completion order.',
          'Let both agents propose changes, then ask a reviewer agent to select one complete lockfile patch.'
        ],
        correct: 1
      },
      {
        scenario: 'extract',
        stem: 'A document service extracts 400 independent pages serially and merges their fields at the end. Memory is bounded, page order is known, and no page depends on another. Which change improves throughput without weakening determinism?',
        options: [
          'Process pages with bounded concurrency, preserve page identifiers, and merge results in document order.',
          'Split the document into contiguous page ranges and process each range sequentially in parallel workers.',
          'Stream page results into the merger immediately, allowing arrival order to determine conflicting field priority.',
          'Process every page independently, then ask a synthesis model to reconstruct page order from extracted content.'
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
          'Approve the exception provisionally because the transaction remains reversible during the settlement window.',
          'Request an independent assessment and approve only if both models recommend the same exception amount.',
          'Stop at the credit threshold and send the evidence, uncertainty, and requested action to an authorized reviewer.',
          'Issue the maximum automatic credit now and defer only the remaining amount for manager review.'
        ],
        correct: 2
      },
      {
        scenario: 'migration',
        stem: 'During a database migration, an agent detects that the production schema differs from the signed migration plan. The next step is reversible, but continuing would make later destructive steps appear valid. What is the BEST behavior?',
        options: [
          'Pause the run, preserve observed state, and require approval of a revised plan before continuing.',
          'Complete the reversible step, then require approval immediately before the first destructive command.',
          'Generate a new plan from the live schema and continue if deterministic validation succeeds.',
          'Restore the expected schema from the signed plan before resuming the unchanged migration sequence.'
        ],
        correct: 0
      },
      {
        scenario: 'research',
        stem: 'A research agent must answer a safety question from primary sources. It finds several summaries but cannot retrieve the cited study, and the deadline is near. Which response policy is strongest?',
        options: [
          'Use the consensus of independent summaries but label the resulting claim as secondary-source evidence.',
          'Return supported findings, mark the claim unverified, and escalate the missing primary evidence.',
          'Use the most recent summary while preserving its citation chain and lowering the claim confidence.',
          'Omit the unresolved claim from the answer and report only conclusions backed by retrieved primary sources.'
        ],
        correct: 1
      },
      {
        scenario: 'productivity',
        stem: 'A coding agent is authorized to modify one service. Its proposed fix requires changing a shared package owned by another team, and the local tests would pass with that change. What should happen next?',
        options: [
          'Prepare the shared-package patch because tests establish feasibility, but leave it uncommitted for later review.',
          'Vendor the required shared code into the authorized service and document the temporary divergence.',
          'Delegate the shared-package change to a specialist operating under the original task authorization.',
          'Stop before the shared edit and request the owning team’s approval with the proposed change.'
        ],
        correct: 3
      },
      {
        scenario: 'ci',
        stem: 'A CI repair agent sees a new install script making an unexpected outbound request while using a release credential. Tests still pass and the change came from a trusted maintainer. What is the BEST next action?',
        options: [
          'Quarantine the run, preserve evidence, and escalate through the security incident path before release.',
          'Disable outbound access, rerun the trusted commit, and release if the isolated build reproduces successfully.',
          'Remove the outbound request automatically and proceed when tests and artifact checks remain green.',
          'Rotate the release credential immediately, then restart the same workflow from its last successful stage.'
        ],
        correct: 0
      },
      {
        scenario: 'extract',
        stem: 'An extraction agent cannot distinguish two handwritten values in a legally binding field. Both values satisfy the schema, but choosing the wrong one changes the payment obligation. What is the correct handling?',
        options: [
          'Select the higher-probability value and preserve both candidates in field-level audit metadata.',
          'Use independent extraction passes and accept a value only when a calibrated majority agrees.',
          'Return the field as unresolved with its source location and require authorized human verification.',
          'Leave the field null and lower the document-level confidence so downstream review is triggered.'
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
          'Add manager-only refund examples and require a structured authorization rationale in every tool request.',
          'Require the model to provide the operator role and confidence as signed request parameters.',
          'Enforce amount and role policy in the refund service using verified identity claims.',
          'Split high-value refunds into a separate tool exposed only in manager-oriented agent sessions.'
        ],
        correct: 2
      },
      {
        scenario: 'migration',
        stem: 'A deployment tool takes an `environment` string supplied by the model. A staging operator can ask the agent to send `production`, and the tool executes with a shared credential. Which design closes the authorization gap?',
        options: [
          'Constrain `environment` to an enum and document which operator roles may select each value.',
          'Bind allowed environments to the authenticated principal and reject unauthorized targets server-side.',
          'Require a second model to verify the operator’s intended environment before tool execution.',
          'Accept the requested environment but require an immutable audit event before production execution.'
        ],
        correct: 1
      },
      {
        scenario: 'research',
        stem: 'A research connector is intended for public documents, but its service credential can also read private workspaces. Prompt instructions say not to access private data. What is the strongest control?',
        options: [
          'Use a public-collection credential and enforce that collection allowlist inside the connector.',
          'Keep the broad credential but apply deterministic classification and redaction before results reach Claude.',
          'Require the model to justify public relevance before the connector retrieves each requested document.',
          'Filter private workspace identifiers from discovery results while retaining broad read access for retrieval.'
        ],
        correct: 0
      },
      {
        scenario: 'productivity',
        stem: 'A file-editing tool checks that a requested path starts with the repository directory, but it does not resolve `..` segments or symlinks. What should be changed FIRST?',
        options: [
          'Reject relative segments in model arguments while continuing to permit validated absolute repository paths.',
          'Resolve symlinks during planning and require the model to return the resulting canonical target path.',
          'Use a policy-review model to approve any write whose raw path does not begin with the repository root.',
          'Canonicalize server-side and enforce containment within the authorized root immediately before writing.'
        ],
        correct: 3
      },
      {
        scenario: 'ci',
        stem: 'A release tool lets the model supply the repository and commit SHA. The workflow identity is authorized for one repository, but the tool never checks that the requested SHA belongs to that repository. What is the BEST fix?',
        options: [
          'Verify workflow identity, repository scope, and commit provenance server-side before release creation.',
          'Require the workflow URL and repository name as signed parameters in each model-generated request.',
          'Allow any tested commit when its artifact digest matches the build output from the authorized repository.',
          'Replace the shared release token with repository tokens while trusting the model-supplied commit SHA.'
        ],
        correct: 0
      },
      {
        scenario: 'extract',
        stem: 'A multi-tenant extraction tool accepts `tenant_id` from the model and uses it directly in a database query. Authentication occurs upstream, but the tool receives no verified tenant binding. What is the correct architecture?',
        options: [
          'Keep `tenant_id` but require Claude to copy it from a signed context block in the system prompt.',
          'Derive tenant scope from the authenticated session and constrain model input within that scope.',
          'Compare the model-supplied tenant with a document header before constructing the database query.',
          'Query by tenant ID, then apply a server-side authorization filter to the returned rows.'
        ],
        correct: 1
      }
    ]
  )
];

const base = bank.questions
  .filter(question => !retiredIds.has(question.id) && !question.id.startsWith('v4-'))
  .map(question => {
    const hardOptions = HARD_OPTIONS.get(question.key);
    return {
      ...question,
      stem: cleanSentence(question.stem),
      options: hardOptions
        ? hardOptions.map(text => ({ text }))
        : question.options.map((option, index) => ({
            ...option,
            text: index === question.correct && conciseAnswers.has(question.key)
              ? conciseAnswers.get(question.key)
              : cleanSentence(option.text)
          })),
      correct: hardOptions ? 0 : question.correct,
      conceptId: `${question.family}:${Buffer.from(question.key).toString('base64url').slice(0, 18)}`,
      difficulty: hardOptions ? 'adversarial' : 'standard',
      authored: true
    };
  });

bank.version = '2026-09-04-hard-v4';
bank.questions = [...base, ...additions];

fs.writeFileSync(bankPath, `window.CCARF_FINAL_BANK=${JSON.stringify(bank)};\n`);
console.log(`Rebuilt ${bank.questions.length} questions (${base.length} retained, ${additions.length} newly authored).`);
