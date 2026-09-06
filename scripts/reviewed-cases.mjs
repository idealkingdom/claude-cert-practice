// Original application questions. Source IDs resolve to the primary documentation catalog.
export const NEW_CASES = [
  {
    id:'r5-stop-reason-dispatch',family:'agentic-loops',conceptId:'api-stop-dispatch',sourceIds:['stops'],
    stem:'A client implementing the Messages API loop treats every HTTP 200 response as a completed task. A trace contains a response with stop_reason: tool_use, followed later by one with stop_reason: max_tokens. Which TWO handling rules should replace that assumption?',
    options:[
      {text:'Execute authorized tool_use requests and return corresponding tool results to continue the conversation.',rationale:'A tool-use stop transfers control to the client; HTTP success alone does not complete the task.'},
      {text:'Treat max_tokens as interrupted generation and apply an explicit recovery policy before accepting output.',rationale:'A token-limit stop can leave the answer incomplete even though the request itself succeeded.'},
      {text:'Treat tool_use as completion when a text block appears before the tool request in the response.',rationale:'Accompanying text does not eliminate the outstanding tool request.'},
      {text:'Accept max_tokens as completion whenever the returned text can be parsed as valid JSON.',rationale:'Parseability does not establish that all required work or content was produced.'},
      {text:'Repeat every HTTP 200 request once with the original messages to confirm the completion state.',rationale:'Blind repetition neither dispatches tool requests nor recovers the interrupted state correctly.'}
    ],correctAnswers:[0,1],key:'Transport success, model stop reason, and application completion are separate signals.',trap:'An HTTP success or parseable fragment is not a task-completion check.'
  },
  {
    id:'r5-subagent-invocation',family:'subagent-context',conceptId:'subagent-invocation-contract',sourceIds:['subagents'],
    stem:'An SDK application defines a document-review specialist, but the main agent answers the task itself. The specialist also needs a policy exception recorded in the parent conversation. Which TWO changes address invocation and evidence transfer?',
    options:[
      {text:'Enable the Agent tool for delegation and give the specialist a description that identifies suitable tasks.',rationale:'The coordinator needs the delegation capability and a useful selection description.'},
      {text:'Include the relevant policy exception and its evidence explicitly in the delegated task prompt.',rationale:'A fresh specialist conversation should receive the task evidence it needs.'},
      {text:'Enable every mutation tool so the specialist can discover the missing parent conversation itself.',rationale:'More authority does not repair invocation or provide the missing evidence.'},
      {text:'Put the policy exception only in the specialist name so it appears during agent selection.',rationale:'A name is not a sufficient evidence handoff or instruction body.'},
      {text:'Increase the coordinator turn budget so the SDK is forced to call every registered specialist.',rationale:'A budget does not mandate delegation to each registered agent.'}
    ],correctAnswers:[0,1],key:'Configure the delegation interface and pass task-specific context deliberately.',trap:'Registering a specialist does not guarantee invocation or complete context transfer.'
  },
  {
    id:'r5-mcp-error-envelope',family:'structured-errors',conceptId:'mcp-protocol-vs-execution',sourceIds:['tools'],
    stem:'An MCP server receives a well-formed tools/call for an existing lookup tool. The backing service rejects an expired account credential. Which TWO response-design choices let the agent distinguish execution failure from a successful empty lookup?',
    options:[
      {text:'Return a tool result with isError set to true for the failed execution.',rationale:'The call reached a real tool but execution failed, which belongs in the tool-result error channel.'},
      {text:'Include a safe error category and a recovery action such as reauthorizing the account.',rationale:'Actionable details prevent the client from confusing the failure with absent records.'},
      {text:'Return a successful empty list and record the credential failure only in server logs.',rationale:'That makes a failed lookup indistinguishable from a valid lookup with no matches.'},
      {text:'Return an unknown-tool protocol error so the client refreshes its tool inventory.',rationale:'The tool exists; rediscovery does not repair the expired credential.'},
      {text:'Echo the rejected credential in the error text so the model can reconstruct authorization.',rationale:'Credentials should not be exposed, and a model cannot reconstruct valid authorization from them.'}
    ],correctAnswers:[0,1],key:'Use the execution error channel plus safe recovery information; reserve protocol errors for protocol-level failures.',trap:'A valid MCP request can still produce a failed tool execution.'
  },
  {
    id:'r5-team-mcp-configuration',family:'mcp-integration',conceptId:'project-mcp-secret-substitution',sourceIds:['mcp'],
    stem:'Eight developers need the same project MCP server definition. Each uses an individual token, and the repository must contain no token values. Which TWO configuration choices satisfy both team consistency and credential separation?',
    options:[
      {text:'Commit the project-scoped MCP definition with environment-variable references for credentials.',rationale:'The server definition can be shared while the secret value remains outside version control.'},
      {text:'Have each developer supply the referenced token variable through their own local environment.',rationale:'Per-user values preserve individual identity without editing the shared definition.'},
      {text:'Commit one encrypted token and its decryption key in separate repository configuration files.',rationale:'Keeping both in the repository does not establish credential separation.'},
      {text:'Store the token only in CLAUDE.md and ask Claude to substitute it when launching the server.',rationale:'Instruction files are not a credential store and may be committed or included in model context.'},
      {text:'Use only user-scoped server definitions and rely on developers to copy future changes manually.',rationale:'That can keep secrets local but does not meet the requirement for one versioned project definition.'}
    ],correctAnswers:[0,1],key:'Share server configuration, inject secret values locally, and keep credentials out of committed content.',trap:'Configuration scope and credential storage are separate decisions.'
  },
  {
    id:'r5-manual-skill-control',family:'skills-commands',conceptId:'skill-invocation-controls',sourceIds:['skills','security'],
    stem:'A repository has a release skill that engineers should invoke explicitly. Claude currently invokes it during unrelated cleanup work. Releases must also be rejected if the operator lacks production permission. Which TWO controls address these separate requirements?',
    options:[
      {text:'Set disable-model-invocation: true in the release skill frontmatter.',rationale:'This makes the skill an explicit user invocation rather than an automatically selected workflow.'},
      {text:'Enforce production authorization at the release service or trusted execution boundary.',rationale:'Invocation settings are not a substitute for authorization of the actual side effect.'},
      {text:'Set user-invocable: false so engineers retain exclusive control of the release command.',rationale:'This setting hides user invocation; it does not make the skill user-only.'},
      {text:'Move release permissions into the skill description and remove the service-side role check.',rationale:'A description guides selection and cannot replace enforcement.'},
      {text:'Grant all release tools through allowed-tools so permission checks no longer interrupt the workflow.',rationale:'Broad tool access does not satisfy the production authorization requirement.'}
    ],correctAnswers:[0,1],key:'Manual invocation controls when instructions run; trusted authorization controls whether a release is permitted.',trap:'user-invocable and disable-model-invocation affect different actors.'
  },
  {
    id:'r5-path-rules-frontmatter',family:'path-specific-rules',conceptId:'path-rules-loading',sourceIds:['memory'],
    stem:'A monorepo needs shared instructions for every task and API-specific instructions only when Claude reads matching API TypeScript files. Which TWO arrangements match Claude Code rule loading?',
    options:[
      {text:'Keep common conventions in project CLAUDE.md or an unscoped project rule.',rationale:'Common instructions belong in a scope that is loaded for all project work.'},
      {text:'Use paths frontmatter in an API rule with a pattern such as src/api/**/*.ts.',rationale:'The paths field selects which file reads activate the conditional rule.'},
      {text:'Put the API pattern in the rule filename and omit paths frontmatter.',rationale:'A descriptive filename alone does not make an otherwise unscoped rule conditional.'},
      {text:'Put all API instructions in root CLAUDE.md and expect them to stay outside non-API context.',rationale:'Root instructions are shared context; telling the model when to apply them does not avoid loading them.'},
      {text:'Use allowed-tools frontmatter to make the API rule load only after a TypeScript file is opened.',rationale:'Tool permissions do not define file-pattern activation for rules.'}
    ],correctAnswers:[0,1],key:'Shared instructions and file-triggered rules have different loading scopes.',trap:'A rule title or tool list does not replace paths frontmatter.'
  },
  {
    id:'r5-ci-result-contract',family:'ci-cd',conceptId:'ci-print-json-budget',sourceIds:['cli','cliFlags'],
    stem:'A CI runner invokes Claude Code to inspect a diff. The next pipeline step needs machine-readable output, and a stalled investigation must stop within a tool-turn budget. Which TWO changes belong in the invocation and result handling?',
    options:[
      {text:'Use print mode with an explicit JSON output format and parse the returned result envelope.',rationale:'Non-interactive execution and a declared output format support reliable pipeline consumption.'},
      {text:'Set a maximum-turn limit and treat budget exhaustion as incomplete work rather than success.',rationale:'A bounded run still needs explicit interpretation of an incomplete result.'},
      {text:'Run an interactive terminal and infer completion from the appearance of the command prompt.',rationale:'Terminal presentation is a fragile contract for unattended CI.'},
      {text:'Use only the CI job timeout and accept any output file produced before termination.',rationale:'A partial output file does not prove task completion or respect the requested turn budget.'},
      {text:'Ask for JSON in prose while leaving the CLI in its default interactive mode.',rationale:'Prompt wording alone does not establish the intended non-interactive interface.'}
    ],correctAnswers:[0,1],key:'Use an automation-oriented interface and distinguish a completed result from a stopped run.',trap:'A process that stops is not necessarily a task that succeeded.'
  },
  {
    id:'r5-batch-correlation',family:'batch-processing',conceptId:'batch-result-correlation',sourceIds:['batch'],
    stem:'A batch contains 12,000 independent classification requests. Completed result lines arrive in a different order than the input file, and some requests have individual errors. Which TWO consumer behaviors are required?',
    options:[
      {text:'Join each result to its original input through its custom_id rather than line position.',rationale:'Result ordering is not the correlation contract; the supplied identifier is.'},
      {text:'Inspect each result type and isolate retryable failures from successful classifications.',rationale:'Batch completion does not imply that every individual request succeeded.'},
      {text:'Zip result lines with input lines because the batch preserves request order.',rationale:'Positional joining can silently assign one record’s classification to another.'},
      {text:'Resubmit the entire batch whenever any one request has an individual error.',rationale:'That repeats successful work and ignores per-request outcomes.'},
      {text:'Treat the batch processing status as the success status for every returned item.',rationale:'Processing status describes the batch lifecycle, not each request’s result.'}
    ],correctAnswers:[0,1],key:'Correlate by custom_id and handle outcomes per request.',trap:'Batch lifecycle completion does not guarantee ordered or universally successful results.'
  },
  {
    id:'r5-schema-semantics',family:'structured-output-tool-use',conceptId:'schema-vs-cross-field-evidence',sourceIds:['outputs'],
    stem:'A document extractor uses schema-constrained output. A syntactically valid response has the expected fields, but its account ID is absent from the authorized customer database and its total conflicts with cited line items. Which TWO conclusions follow?',
    options:[
      {text:'Schema conformance alone does not establish that the account exists or the total is supported.',rationale:'A schema constrains structure; these claims require external and cross-field evidence.'},
      {text:'Validate these conditions deterministically and supply precise failures to a bounded correction path.',rationale:'The application can check the database and arithmetic before accepting the extracted record.'},
      {text:'Strict output guarantees that all field values are grounded in the source document.',rationale:'Constrained structure is not a factual-grounding guarantee.'},
      {text:'Accept the response because the API has already enforced all business constraints.',rationale:'The API cannot infer every application-specific database or cross-field rule from a shape alone.'},
      {text:'Remove output constraints so a longer explanation can replace the invalid structured fields.',rationale:'A prose explanation does not meet the consumer’s validated-record requirement.'}
    ],correctAnswers:[0,1],key:'Enforced shape and validated meaning are complementary layers.',trap:'Schema validity should not be promoted to factual correctness.'
  },
  {
    id:'r5-review-specialization',family:'multi-pass-review',conceptId:'review-objective-isolation',sourceIds:['agents','evals'],
    stem:'A single review prompt checks a large patch for security, correctness, and readability. Evaluation shows that style comments dominate while authorization defects are missed. Which TWO design changes directly address review coverage and evaluation?',
    options:[
      {text:'Give independent review passes narrow criteria, including a dedicated authorization check.',rationale:'Separating objectives reduces competition for attention within one broad review.'},
      {text:'Measure each review pass on labeled defect cases and reconcile findings before acceptance.',rationale:'Per-objective evaluation reveals whether the revised review catches the failures that matter.'},
      {text:'Increase the number of identical broad reviewers and accept the patch by majority vote.',rationale:'More copies can reproduce the same coverage weakness without evaluating it.'},
      {text:'Require longer review responses so each reviewer has space to discuss every possible concern.',rationale:'Output length does not establish systematic coverage of authorization defects.'},
      {text:'Let the patch generator choose which review criteria apply after seeing its own implementation.',rationale:'The generator should not remove inconvenient checks from the acceptance contract.'}
    ],correctAnswers:[0,1],key:'Specialize the review objective and measure defect detection, not comment volume.',trap:'Additional reviewers are not automatically additional coverage.'
  },
  {
    id:'r5-partial-source-coverage',family:'error-propagation',conceptId:'coverage-vs-empty-result',sourceIds:['subagents','tools'],
    stem:'A research specialist searches two of three required collections; the third times out after bounded retries. A useful partial report is allowed, but it must not imply complete coverage. Which TWO fields should the handoff make explicit?',
    options:[
      {text:'The completed collections and the unsearched collection, with an explicit partial status.',rationale:'The coordinator needs to distinguish missing coverage from a searched collection with no findings.'},
      {text:'The supported findings with their sources, plus the failed dependency and remaining recovery path.',rationale:'Usable evidence can survive alongside an actionable account of the failure.'},
      {text:'An empty findings list for the timed-out collection with a normal success status.',rationale:'That converts unavailable evidence into an unsupported claim that nothing was found.'},
      {text:'One overall confidence score in place of per-collection completion information.',rationale:'A confidence value cannot reconstruct what was and was not searched.'},
      {text:'Only the timeout message, discarding all completed findings from the other collections.',rationale:'The contract permits a partial report, so discarding supported work is unnecessary.'}
    ],correctAnswers:[0,1],key:'Preserve both usable evidence and the exact coverage gap.',trap:'Missing evidence and evidence of absence have different meanings.'
  },
  {
    id:'r5-provenance-conflict',family:'provenance-synthesis',conceptId:'unresolved-source-conflict',sourceIds:['citations','context'],
    stem:'Two approved policy sources give incompatible thresholds for the same effective date. Neither has an established precedence rule, and the threshold determines whether a transaction may proceed. Which TWO synthesis actions are justified?',
    options:[
      {text:'Retain both threshold claims with source identifiers, effective dates, and the unresolved conflict.',rationale:'The conflict must remain traceable instead of being flattened into one asserted fact.'},
      {text:'Block the threshold-dependent decision and route the conflict to the designated policy owner.',rationale:'Without a precedence rule, the model lacks evidence to authorize the consequential choice.'},
      {text:'Average the thresholds and label the result as a compromise supported by both sources.',rationale:'A computed compromise is not a policy authorized by either source.'},
      {text:'Choose the source retrieved last because retrieval order indicates the most current policy.',rationale:'Retrieval order provides no authority or effective-date precedence.'},
      {text:'Choose the higher-confidence model interpretation and omit the other threshold from the report.',rationale:'Model confidence does not resolve the documented contradiction.'}
    ],correctAnswers:[0,1],key:'Keep unresolved disagreement visible and require authority to resolve a consequential policy conflict.',trap:'Synthesis must not manufacture a precedence rule.'
  }
];
