// Correct answer is first. The app randomizes display order for every attempt.
export const HARD_OPTIONS = new Map([
  ['The existing step is already deterministic and reliable; agentic reasoning adds value only where uncertainty exists.', [
    'Keep the deterministic step; reserve the agent for decisions requiring interpretation of uncertain evidence.',
    'Replace the step with a schema-constrained model call so its output remains machine-readable and auditable.',
    'Run both approaches and require agreement, escalating any mismatch before the workflow may continue.',
    'Use the model for high-impact cases and retain the deterministic step only for routine low-risk cases.'
  ]],
  ['A safety budget is not a definition of done.', [
    'Define evidence-based completion criteria, keeping the turn limit only as a separate safety ceiling.',
    'Stop when confidence exceeds a calibrated threshold, unless the maximum-turn limit is reached first.',
    'Have the coordinator review a progress summary after every tool call and decide whether to continue.',
    'Terminate after two iterations without a changed answer, treating stability as evidence of completion.'
  ]],
  ['The failure is missing ownership of state and termination, not insufficient capability.', [
    'Introduce one orchestrator that owns task state, delegation, handoffs, and the final completion decision.',
    'Keep peer invocation but add correlation IDs and distributed tracing to identify cyclic execution afterward.',
    'Assign each specialist a local completion rule and let the final responding peer close the task.',
    'Add a routing specialist that selects the next peer while leaving task state distributed among agents.'
  ]],
  ['Bound intermediate context at the handoff rather than scaling the coordinator around unbounded outputs.', [
    'Require typed, bounded handoffs containing findings, provenance, unresolved items, and synthesis-relevant evidence.',
    'Let the coordinator compact raw transcripts after receiving them, preserving each specialist’s full output initially.',
    'Increase coordinator context and use prompt caching so complete specialist transcripts remain available for synthesis.',
    'Store transcripts externally and let the coordinator retrieve every source segment again during final synthesis.'
  ]],
  ['Subagents should be scoped to their assignment rather than inheriting unnecessary context and authority.', [
    'Give each subagent only its task, relevant evidence, constraints, and the capabilities it actually needs.',
    'Share the coordinator transcript but redact credentials, allowing each subagent to infer which context matters.',
    'Give every subagent the complete case state while restricting their output to a task-specific response schema.',
    'Pass only the user request, then let each subagent retrieve any additional context it considers necessary.'
  ]],
  ['Capability boundaries should follow the specialist role, not prompt restraint.', [
    'Expose only the specialist’s required read tools, keeping mutation authority at the coordinating boundary.',
    'Expose read and write tools but require the specialist to justify every mutation in its returned result.',
    'Allow writes in a sandbox and automatically promote them when the specialist reports high confidence.',
    'Retain broad tools but add stronger instructions separating analysis actions from implementation actions.'
  ]],
  ['Mandatory workflow transitions belong in deterministic orchestration.', [
    'Enforce allowed transitions in application code and expose only actions valid for the current workflow state.',
    'Describe every transition in the system prompt and reject outputs that do not mention the expected next state.',
    'Ask a verifier agent to approve the proposed next state before the original agent continues execution.',
    'Let the model choose transitions, then roll back any state that later fails deterministic validation.'
  ]],
  ['A handoff should explicitly carry the state the next component needs.', [
    'Use a versioned handoff with results, provenance, unresolved items, completion status, and next action.',
    'Forward the final specialist message plus a pointer to the transcript so the receiver can reconstruct state.',
    'Persist all messages in shared memory and instruct the receiving component to search for relevant details.',
    'Send only successful findings; let failures remain with the originating component for later reconciliation.'
  ]],
  ['The requirement is deterministic pre-execution enforcement.', [
    'Use a pre-action hook or trusted application guard that can reject the operation before it executes.',
    'Use a post-action hook to inspect the result and automatically reverse operations that violate policy.',
    'Require the model to emit a policy rationale, then allow execution when the rationale matches a schema.',
    'Run a second model as a policy judge before forwarding the original tool request unchanged.'
  ]],
  ['Hooks provide controls/observability, but they do not automatically define task completion.', [
    'Keep hooks for control and telemetry, but define success and termination in orchestration state.',
    'Treat a successful post-action hook as completion because it proves the last operation satisfied policy.',
    'End the task when no hook has blocked an action during the most recent agent iteration.',
    'Move completion logic into the hook and infer success from whether any additional tools are requested.'
  ]],
  ['Independent work can run in parallel; synthesis should happen after defined inputs are ready.', [
    'Fan out bounded investigations, then synthesize once every required result reaches a terminal state.',
    'Let the synthesis agent consume each result as it arrives and revise its conclusion after later results.',
    'Run investigations sequentially so each specialist can use every earlier finding before producing its own.',
    'Allow specialists to write directly into one shared report, then ask the coordinator to resolve conflicting edits.'
  ]],
  ['Parallelize independent work while preserving genuine data dependencies.', [
    'Run independent branches concurrently; release each dependent step only after its prerequisites finish.',
    'Start every step concurrently but attach retry logic to operations that execute before their inputs are ready.',
    'Run the entire graph sequentially because preserving dependencies is more important than reducing total latency.',
    'Let the model infer dependencies during execution and pause tasks whenever it notices missing upstream context.'
  ]],
  ['Resumption should preserve validated state while revalidating facts that can expire.', [
    'Restore validated state, then recheck expiring assumptions, permissions, and tool contracts before continuing.',
    'Replay the complete transcript from the beginning so the model can independently reconstruct the latest state.',
    'Resume from the last assistant message and trust previously validated facts until a tool call contradicts them.',
    'Discard prior state and rerun the task, using the old result only to compare the final outcome.'
  ]],
  ['Concurrent shared state needs versioning or merge semantics.', [
    'Use versioned or transactional updates with explicit conflict detection and domain-specific merge rules.',
    'Serialize all reads through the coordinator while allowing specialists to write shared state concurrently.',
    'Accept the last completed write and retain earlier versions solely for audit and rollback.',
    'Ask each specialist to reread shared state before writing, without enforcing a version precondition.'
  ]],
  ['Improve the interface semantics before adding another routing layer.', [
    'First distinguish the tools by name, purpose, parameter intent, and explicit use boundaries.',
    'Add representative routing examples to the coordinator while leaving the overlapping tool interfaces unchanged.',
    'Insert a lightweight classifier that selects between the existing tools before Claude receives the request.',
    'Expose one wrapper tool that accepts both schemas and decides internally which existing tool to invoke.'
  ]],
  ['Make invalid states hard to express rather than repairing them later.', [
    'Use an enum with operation-specific fields and reject invalid combinations at the interface boundary.',
    'Retain free text but normalize aliases before execution and return validation errors for unknown values.',
    'Describe the four accepted operations with examples and rely on structured-output retries for invalid requests.',
    'Accept the broad input schema and route ambiguous values to a model-based canonicalization step.'
  ]],
  ['Different failure classes need different recovery paths.', [
    'Return structured failure types and recovery fields separating retryable, terminal, and authorization errors.',
    'Return one stable error code plus a detailed natural-language message for the coordinator to interpret.',
    'Retry every failure once locally, then return a terminal error if the second attempt also fails.',
    'Convert tool failures into empty successful results and attach warning metadata for downstream consumers.'
  ]],
  ['Recovery should use deterministic error semantics and bounded retry policy.', [
    'Honor structured retry metadata with bounded backoff, then follow the declared degrade-or-escalate path.',
    'Retry whenever the model believes the error is transient, stopping when its confidence falls below threshold.',
    'Use a fixed retry count for every error category so recovery behavior remains operationally consistent.',
    'Return failures immediately to the coordinator and centralize all backoff and retry decisions there.'
  ]],
  ['A mandatory call should be encoded as a mandatory call, not a preference.', [
    'Require the validation tool through API tool choice, then verify its returned result before proceeding.',
    'State that validation is mandatory in the system prompt and add a few-shot example showing the expected call.',
    'Let Claude choose tools normally, but reject final answers that do not contain a validation result field.',
    'Call the validator automatically after Claude finishes and ask Claude to revise only when validation fails.'
  ]],
  ['Tool distribution should reflect the role and least-privilege boundary.', [
    'Expose only role-appropriate tools and enforce their authorization independently in trusted code.',
    'Expose the common tool catalog to every role but hide disallowed tools from their prompt descriptions.',
    'Give planning agents read and write tools while requiring an execution agent to approve each proposed mutation.',
    'Use one proxy tool for every role and let its model-generated rationale determine the permitted operation.'
  ]],
  ['Transport should follow deployment shape and trust boundary.', [
    'Use stdio for the local child process and authenticated network transport for the shared service.',
    'Use network transport for both services so logging, retries, and connection handling follow one standard.',
    'Use stdio for both services and access the remote server through a locally mounted command-line bridge.',
    'Select transport from expected request volume, using stdio for low traffic and HTTP for high traffic.'
  ]],
  ['Use MCP primitives according to readable context, reusable prompts, and callable operations.', [
    'Model reference data as a resource, reusable interaction guidance as a prompt, and side effects as a tool.',
    'Model both reference data and templates as resources, reserving tools for operations requiring user confirmation.',
    'Model templates as tools because they generate output, while exposing ticket creation as a reusable prompt.',
    'Model all three as tools so the model has one discovery and invocation mechanism for every capability.'
  ]],
  ['Glob is for filename/path patterns; Grep is for content search.', [
    'Use Glob to resolve candidate paths, then read only the files that require closer inspection.',
    'Use Grep with the filename pattern because it can return matching paths and nearby content together.',
    'Use a general shell search so path matching and content filtering happen in one command invocation.',
    'Read the repository index first and ask Claude to infer which paths match the requested pattern.'
  ]],
  ['Content search maps naturally to Grep.', [
    'Use Grep to locate the target content, then read the small set of matching files for context.',
    'Use Glob to identify likely source files, then scan every returned file inside the active context.',
    'Use repository-wide reads because search results may omit semantically related code with different wording.',
    'Delegate the search to a subagent that can choose between Glob, Grep, and shell commands dynamically.'
  ]],
  ['Repository-specific guidance should be versioned with the repository.', [
    'Commit repository guidance in project-scoped CLAUDE.md so changes follow the normal review lifecycle.',
    'Store the guidance in each developer’s user-level CLAUDE.md to keep repository files implementation-focused.',
    'Place the guidance in managed policy so every checkout receives identical instructions immediately.',
    'Publish the guidance as a Skill and rely on developers to invoke it before repository work.'
  ]],
  ['Managed policy is not a project-level preference.', [
    'Keep managed policy authoritative; change it only through the organization’s policy administration path.',
    'Add a narrower project rule that explicitly overrides the managed restriction for this repository.',
    'Move the exception into the user-level configuration of developers who require the additional capability.',
    'Encode the exception in a repository Skill so it applies only when the relevant workflow is invoked.'
  ]],
  ['Reusable instruction workflows belong in reusable workflow packaging.', [
    'Package the maintained workflow as a reusable Skill or command with explicit inputs and constraints.',
    'Copy the instructions into CLAUDE.md so Claude automatically follows the workflow on every repository task.',
    'Keep the procedure in documentation and ask users to paste its current version into each session.',
    'Implement the workflow as an MCP tool even though it coordinates instructions rather than external operations.'
  ]],
  ['The invocation surface and the maintained workflow content can be separated cleanly.', [
    'Expose a concise command or Skill entry point that references one maintained source of workflow instructions.',
    'Duplicate the complete workflow inside every command so each invocation remains independently understandable.',
    'Put the workflow only in CLAUDE.md and use command names as reminders without linking maintained content.',
    'Generate the workflow dynamically from the user request whenever the command is invoked.'
  ]],
  ['Path-specific rules keep context and behavior scoped to where the convention applies.', [
    'Attach the convention to a path-scoped rule that loads only when work touches matching files.',
    'Add the convention to the repository root instructions and tell Claude to ignore it outside the directory.',
    'Create a reusable Skill for the convention and require developers to invoke it for matching files.',
    'Place separate CLAUDE.md files in every matching subdirectory even when the rule content is identical.'
  ]],
  ['Scope conflicting rules to the code they govern.', [
    'Keep shared guidance common and place divergent conventions in their narrowest governing paths.',
    'Keep both conventions at repository scope and specify an ordering rule for resolving their conflicts.',
    'Move all instructions to the deepest directories so no guidance is inherited from a common parent.',
    'Replace the conflicting rules with a Skill that asks Claude to determine the applicable convention.'
  ]],
  ['Separate inspection/planning from mutation when execution is not yet authorized.', [
    'Inspect and plan read-only, then request authorization before applying any proposed mutation.',
    'Allow reversible edits during planning but require approval before tests or external commands execute.',
    'Grant the normal tool set and instruct Claude to stop immediately before the first destructive operation.',
    'Create a disposable branch for planning so mutations remain isolated until the plan is approved.'
  ]],
  ['Once execution is authorized, use a bounded execution path rather than remaining in planning indefinitely.', [
    'Switch to scoped execution, apply the approved plan, and verify outcomes against explicit completion criteria.',
    'Remain in planning while simulating each command, then ask for separate approval for every implementation step.',
    'Execute the plan but return to planning after each tool call to reconsider the entire approach.',
    'Delegate implementation to an unrestricted subagent while the coordinator stays in read-only planning mode.'
  ]],
  ['Concrete feedback should drive the next iteration.', [
    'Feed the specific failing assertion and current patch state into a bounded revision-and-retest loop.',
    'Ask Claude to reconsider the original request without showing the failure to avoid anchoring its next attempt.',
    'Revert the patch and regenerate independently until one candidate passes the complete test suite.',
    'Add more general implementation guidance to the system prompt before retrying the same unchanged task.'
  ]],
  ['Iterative refinement should update from the latest validated state.', [
    'Carry the current patch, validated successes, and newest failure evidence into the next iteration.',
    'Restart from the original code each time so earlier unsuccessful reasoning cannot bias later attempts.',
    'Keep the full transcript and let the model decide which observations remain current after every edit.',
    'Preserve only the latest model explanation, because tool outputs can be regenerated when required.'
  ]],
  ['Use the intended non-interactive interface and explicit turn/output controls.', [
    'Use print mode with explicit output, bounded turns, scoped permissions, and checked exit behavior.',
    'Run the interactive CLI in a pseudo-terminal so the automation can respond to clarification prompts.',
    'Use print mode without a turn limit and rely on the CI job timeout as the sole execution bound.',
    'Call the interactive CLI once per file so each invocation remains small enough for automation.'
  ]],
  ['Automation should not depend on hidden personal environment state.', [
    'Declare credentials, configuration, permissions, and tools explicitly in the isolated CI environment.',
    'Reuse a developer configuration directory in CI so local and automated behavior remain exactly aligned.',
    'Let Claude discover missing environment values and infer safe defaults from repository configuration files.',
    'Store the operator’s working configuration as a cache restored before each automated run.'
  ]],
  ['Ambiguous quality criteria should be made explicit before adding machinery.', [
    'Define measurable acceptance criteria and task trade-offs before changing models, tools, or orchestration.',
    'Add a reviewer agent that scores quality holistically and rejects outputs below its confidence threshold.',
    'Provide several examples of good output and let the model infer the unstated evaluation criteria.',
    'Increase the reasoning budget so the model can resolve conflicting quality goals from context.'
  ]],
  ['Positive acceptance criteria give the model a concrete target.', [
    'Specify observable acceptance tests and keep prohibitions only for material safety boundaries.',
    'List every known failure mode as a prohibition and allow the model to infer the desired positive behavior.',
    'Ask the model to critique its draft against broad quality goals before returning the final response.',
    'Use a negative example for each prohibited outcome without defining a separate acceptance test.'
  ]],
  ['Few-shot examples are most useful when they clarify the difficult boundary.', [
    'Add compact positive and negative examples around the cases the model currently confuses.',
    'Add many typical positive examples so the dominant pattern outweighs unusual boundary cases.',
    'Provide one ideal output covering every field, then strengthen instructions for cases that differ.',
    'Generate examples dynamically from each input and include those synthetic labels in the same request.'
  ]],
  ['Diversity and boundary coverage matter more than redundant demonstrations.', [
    'Replace repeated examples with varied edge cases and counterexamples near the decision boundary.',
    'Retain similar examples but reorder them so the model does not overfit to one presentation sequence.',
    'Add more examples from the highest-volume class because production accuracy matters most there.',
    'Summarize duplicate examples into one longer demonstration containing several related decisions.'
  ]],
  ['Machine-consumed output should use a machine-enforced structure where available.', [
    'Use API-enforced structured output and validate the object before downstream consumption.',
    'Request JSON in the prompt, parse it leniently, and retry only when parsing fails completely.',
    'Use XML tags around each field so missing values remain visible to downstream consumers.',
    'Ask Claude to call a formatting tool after drafting the response as unconstrained natural language.'
  ]],
  ['Schema validates shape; business semantics still need validation.', [
    'Apply deterministic business checks after schema validation and recover invalid values explicitly.',
    'Expand the schema description until it fully explains the business rule, then trust schema-conforming values.',
    'Use a second structured-output call to judge whether the first object is semantically valid.',
    'Accept schema-valid values and rely on downstream monitoring to identify business-rule violations.'
  ]],
  ['Targeted validation feedback gives the next attempt useful corrective information.', [
    'Return the exact failed rule, offending value, and expected constraint to a bounded corrective retry.',
    'Return only a stable error code so the retry is not biased toward one specific correction.',
    'Repeat the original prompt with higher temperature to obtain a more diverse candidate output.',
    'Append the entire validator implementation so the model can reason about every possible failure path.'
  ]],
  ['Retries should terminate when the failure is not recoverable from another generation.', [
    'Stop when evidence is unavailable and surface the unresolved gap through the workflow’s escalation policy.',
    'Continue with increasing backoff because a later generation may infer the missing information more accurately.',
    'Switch to a stronger model after bounded retries and allow it to provide the unavailable evidence from memory.',
    'Return the closest schema-valid value and mark the field with a low-confidence indicator.'
  ]],
  ['Independent asynchronous workloads are natural batch candidates.', [
    'Batch the independent, latency-tolerant jobs and correlate every result with its original input.',
    'Stream all jobs through one long-lived request so partial results become available as soon as possible.',
    'Use synchronous parallel requests because concurrency provides the same operational guarantees as batching.',
    'Combine all inputs into one prompt so the model can share reasoning and reduce duplicated context.'
  ]],
  ['Choose processing mode according to latency requirements rather than standardizing blindly.', [
    'Keep interactive traffic online or streaming and route latency-tolerant backfill work through batch processing.',
    'Use batch for both paths, assigning interactive requests a higher queue priority and smaller batch size.',
    'Use streaming for both paths so operators can observe progress even when no user is waiting.',
    'Use synchronous requests for both paths and scale concurrency separately for interactive and backfill workloads.'
  ]],
  ['Separate review can reduce self-confirmation, but deterministic policy checks remain external.', [
    'Use criteria-driven review for judgment and keep policy enforcement in deterministic code.',
    'Let the reviewing model perform both qualitative review and final policy authorization in one pass.',
    'Have the generator critique its own output before returning it, avoiding the cost of another context.',
    'Run two independent reviewers and accept the output whenever either reviewer approves it.'
  ]],
  ['Independent model agreement cannot substitute for missing evidence.', [
    'Verify the material claim against an authoritative source or deterministic check despite model agreement.',
    'Accept agreement from independent model contexts when both provide a confidence score above threshold.',
    'Use majority vote across three models and flag only claims for which all three answers differ.',
    'Ask one model to critique the other’s citations, then accept the claim if no contradiction is found.'
  ]],
  ['Compaction should preserve decision-relevant validated state rather than transcript volume.', [
    'Retain validated facts, provenance, governing instructions, open questions, and minimal continuation state.',
    'Summarize the conversation chronologically so the next model call preserves how every conclusion was reached.',
    'Keep all tool outputs and remove conversational messages because external observations are more reliable.',
    'Retain the latest answer and system instructions, retrieving any earlier evidence again if later needed.'
  ]],
  ['Manage the context proactively around future decision needs.', [
    'Compact validated state before pressure occurs and keep raw evidence addressable outside the active context.',
    'Wait for context-limit errors, then summarize the oldest half of the transcript in a recovery call.',
    'Increase the context window and retain all retrieved material so no potentially useful evidence is discarded.',
    'Periodically summarize every message while keeping the original text alongside each generated summary.'
  ]],
  ['Consequential unresolved ambiguity should be surfaced, not hidden behind model confidence.', [
    'Escalate with the unresolved ambiguity, supporting evidence, impact, and the blocked decision.',
    'Choose the most likely interpretation, record confidence, and proceed while the action remains reversible.',
    'Ask the same model to reconsider independently and proceed when both interpretations converge.',
    'Select the conservative interpretation and defer disclosure unless the downstream result fails validation.'
  ]],
  ['Clarification is appropriate when it cheaply resolves a material ambiguity.', [
    'Ask the smallest targeted question that resolves the material ambiguity, then continue from the answer.',
    'Present every plausible interpretation and ask the user to choose before performing any further analysis.',
    'Proceed with the most common interpretation and mention the assumption in the final response.',
    'Retrieve additional contextual data first, even when the user can resolve the ambiguity directly.'
  ]],
  ['Evidence status must survive agent boundaries.', [
    'Carry claim status and provenance through handoffs so downstream agents separate evidence from inference.',
    'Pass only normalized findings and keep provenance in the originating agent’s trace for later audit.',
    'Have the coordinator assign one confidence score to each specialist output before forwarding it.',
    'Let the synthesis agent infer evidence quality from source names included in the natural-language summaries.'
  ]],
  ['Partial failure should be represented explicitly rather than masquerading as successful emptiness.', [
    'Return partial-failure status with completed coverage, missing work, and permitted recovery paths.',
    'Return the successful subset as normal and place failure details in optional metadata for observability.',
    'Return an empty result with a retryable flag so downstream logic does not consume incomplete data.',
    'Fail the complete task whenever any requested source is unavailable, regardless of usable partial results.'
  ]],
  ['Selective exploration protects context quality and latency.', [
    'Use targeted search and selective reads so only decision-relevant code and conventions enter active context.',
    'Load complete candidate files after path filtering because surrounding code may contain hidden dependencies.',
    'Ask a repository subagent to summarize every top-level directory before narrowing the investigation.',
    'Read recent commit history first, then inspect files mentioned by changes related to the task keywords.'
  ]],
  ['Search-first exploration reduces unnecessary context while retaining coverage.', [
    'Search symbols, content, and paths first; read only the regions needed to test the hypothesis.',
    'Read architectural entry points first and use search only if the expected dependency is not visible there.',
    'Generate a repository map from every file header before selecting regions for detailed inspection.',
    'Delegate broad exploration to parallel agents and merge all summaries into the main context.'
  ]],
  ['Confidence is not evidence.', [
    'Treat unsupported material claims as validation failures regardless of reported confidence.',
    'Accept the claim when confidence is calibrated on similar tasks and exceeds the production threshold.',
    'Request an independent second answer and accept the claim if both confidence scores are sufficiently high.',
    'Allow the claim in low-impact output while adding a confidence label for downstream users.'
  ]],
  ['Review intensity should follow actual risk and evidence rather than model confidence or blanket rules.', [
    'Set review depth from consequence, reversibility, validation evidence, and measured workflow failure rates.',
    'Require the same human review for every AI-generated change so governance remains simple and consistent.',
    'Reduce review when model confidence is high and historical acceptance rates exceed the team threshold.',
    'Review only outputs that fail deterministic checks because passing checks demonstrate sufficient correctness.'
  ]],
  ['Provenance and authority should drive conflict resolution.', [
    'Record authority and version, prefer the current authoritative source, and preserve material conflicts.',
    'Prefer the newest source automatically because recency is the strongest indicator of current correctness.',
    'Use the value supported by the majority of sources and retain dissenting values only in internal notes.',
    'Ask the synthesis model to choose the most coherent value using the full report as contextual evidence.'
  ]],
  ['Provenance must remain attached to claims that influence the decision.', [
    'Preserve claim-level provenance through every handoff used by synthesis and conflict resolution.',
    'Store one source list for the final document because claim-level links consume unnecessary handoff context.',
    'Keep provenance in specialist traces and retrieve it only if the final reviewer challenges a conclusion.',
    'Attach provenance only to direct quotations while treating synthesized factual claims as model-generated analysis.'
  ]]
]);
