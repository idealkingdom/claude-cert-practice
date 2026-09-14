(()=>{
'use strict';
const previous=window.CLAUDE_CERT.buildBank;
const F={
'v6-architectP-s01':[3,'Automate the final claim decision first, but require adjuster review for exceptions and measure cycle time and decision quality before expanding autonomy'],
'v6-architectP-s02':[0,'Treat retrieval freshness and write confirmation as prompt-engineering concerns, adding explicit instructions and a verifier step before the model responds'],
'v6-architectP-s04':[0,'Keep the four specialists because role separation improves auditability, then add coordinator telemetry to detect duplicate work and cyclic delegation'],
'v6-architectP-s05':[3,'Let each evidence-checking specialist edit a shared final document and use deterministic conflict resolution after all specialists finish'],
'v6-architectP-s06':[0,'Adopt it because unchanged quality and lower cost improve unit economics, then document the slower response as an accepted implementation trade-off'],
'v6-architectP-m01':[0,'Route all traffic to the stronger model to eliminate routing misses, then recover the added cost through prompt caching and shorter outputs'],
'v6-architectP-i03':[3,'Increase retrieval to 200 candidates and process them in parallel so the reranker has more evidence without changing the ranking model'],
'v6-architectP-i04':[1,'Add detailed final-answer diagnostics and require operators to infer which retrieval, tool, or model stage caused the outlier from the response itself'],
'v6-architectP-i05':[3,'Index the same small chunks under clause and document identifiers, keeping the chunk boundaries unchanged while widening the available lookup paths'],
'v6-architectP-i06':[2,'Use keyword search for the structured fields and complaint notes alike, adding synonyms so exact filters and semantic language share one retrieval index'],
'v6-architectP-i07':[0,'Wrap it in MCP even for the single backend service so future model clients can discover the capability without application changes later'],
'v6-architectP-i08':[3,'Divide the catalog across four specialist agents and invoke the relevant agent set on every request, keeping detailed schemas preloaded inside each agent'],
'v6-architectP-e03':[3,'Alternate routing by hour with fixed experiment windows and compare quality, latency, cost, and abandonment across matched time periods'],
'v6-architectP-e04':[0,'Attribute the failure to the model first because nonexistent citations are generated text, then revert retrieval only if model rollback does not help'],
'v6-architectP-e05':[0,'Adopt the fallback because a four-point success-rate gain materially improves quality, then optimize the added latency and cost after rollout'],
'v6-architectP-e06':[1,'Run the original offline evaluation on every deployment and every day, keeping the dataset fixed so production quality has one comparable baseline'],
'v6-architectP-g01':[3,'Use a second independent model to approve ordering attempts, recording both models’ rationales before the application forwards any requested action'],
'v6-architectP-g02':[2,'Expand the register to list known LLM limitations, each with a severity label and mitigation note, while keeping ownership and detection outside the register'],
'v6-architectP-g03':[3,'Remove the gate and replace it with random audit sampling because the near-universal approval rate shows manual review is operationally redundant'],
'v6-architectP-g04':[3,'Use an architecture diagram that maps encrypted paths, identity boundaries, and regulated data stores, with the relevant compliance text attached as design notes'],
'v6-architectP-g05':[3,'Raise a single global confidence threshold and monitor subgroup false negatives after release, intervening only if the measured disparity persists'],
'v6-architectP-l02':[3,'Document both requirements and let delivery teams choose the implementation per service, escalating only if latency or review obligations are later missed'],
'v6-architectP-l03':[0,'Guarantee correctness only when retrieval returns enough corroborating sources and the model’s reported confidence exceeds the agreed threshold'],
'v6-architectP-l04':[3,'Treat the handoff as incomplete only until rollback and alert procedures are added; ownership, known limits, and evaluation can mature after launch'],
'v6-architectP-l05':[3,'Scale under the existing approval and rely on production monitoring plus incident response to discover jurisdiction-specific control gaps as traffic grows'],
'v6-architectP-d01':[2,'Let every repository own its own policy copy, but require periodic automated diff checks against a central reference before changes can merge'],
'v6-architectP-d02':[3,'Ask developers to accept generated changes in larger batches and measure throughput per session, using review and rework time as secondary metrics'],
'v6-architectP-d03':[2,'Increase the agent turn budget and add an explicit prompt check for suspicious empty results, while leaving tool semantics and recovery behavior unchanged'],
'v6-architectP-d04':[2,'Grant broad shell access but require repository rules to distinguish safe inspection from privileged commands and flag violations during code review'],

'v6-developerF-a02':[3,'Require every turn to call at least one tool and stop after two consecutive turns with no new evidence, using max-turns only as the final ceiling'],
'v6-developerF-a03':[2,'Let specialists retrieve any missing context themselves but restrict mutations, then require structured summaries before coordinator synthesis'],
'v6-developerF-a04':[3,'Let the model start all branches from its inferred dependencies, pausing only when a tool reports that an upstream identifier is missing'],
'v6-developerF-i01':[3,'Use streaming for requests above 1.5 seconds and retry transient errors until the user receives a response, then report monthly latency averages'],
'v6-developerF-i02':[3,'Move it to a larger model in staging and release if manual spot checks improve, treating model capability as the primary regression control'],
'v6-developerF-i03':[0,'Treat the response as final HTTP success, but log the requested tool call and defer tool execution to a background worker after answering the user'],
'v6-developerF-i04':[2,'Send the partial object to downstream validation with an incomplete flag and let each consumer decide whether missing fields can be tolerated'],
'v6-developerF-i07':[0,'Use a unit test around the new client constructor and assert the same methods and configuration values are present, avoiding boundary-level simulation'],
'v6-developerF-i08':[0,'Keep one function but centralize exception mapping and add mocks for database, email, and UI dependencies so subsystem failures remain testable'],
'v6-developerF-i09':[1,'Poll a durable job endpoint that buffers the full model response, then reveal buffered text to the browser in timed chunks to simulate streaming'],
'v6-developerF-i10':[0,'Use one long streaming request and emit one classification event per record so the entire nightly workload requires only one API connection'],
'v6-developerF-i11':[3,'Restart the work as a background job after cancellation so the tool call can finish, then persist the result without updating the cancelled UI'],
'v6-developerF-i12':[1,'Keep the constants in source but consolidate them into one shared module with environment branches selected at startup and reviewed per release'],
'v6-developerF-i13':[3,'Store the current prompt and configuration in deployment documentation and tag releases with a version, while request logs keep only model and request IDs'],
'v6-developerF-e01':[1,'Log complete generated responses with timestamps and stack traces, then compare failures manually against the model currently deployed in production'],
'v6-developerF-e02':[0,'Retry both 429 and 400 responses with bounded exponential backoff because temporary client or proxy conditions can surface either status'],
'v6-developerF-m03':[3,'Ask a second Claude call to verify policy constraints and reject the object if that verifier reports a violation, keeping schema validation unchanged'],
'v6-developerF-m06':[2,'Drop tool results first because they are often verbose, while preserving all user and assistant prose so conversational intent remains intact'],
'v6-developerF-s01':[0,'Strengthen the system prompt with explicit injection examples and refuse mutation tools whenever retrieved text contains instruction-like language'],
'v6-developerF-s02':[0,'Keep the tool available but add explicit refusal rules and a confidence threshold, logging each high-impact call for later governance review'],
'v6-developerF-s04':[2,'Base64-encode the key and fetch it from runtime configuration only after the user signs in, so unauthenticated clients never receive credentials'],
'v6-developerF-t01':[2,'Increase reasoning effort and add a pre-tool checklist requiring Claude to verify both account ID and date range before submitting the tool call'],
'v6-developerF-t02':[0,'Return the full provider payload but annotate the four important fields in the tool description so Claude can ignore irrelevant keys during reasoning']
};
window.CLAUDE_CERT.buildBank=key=>previous(key).map(q=>{
 const fix=F[q.id];
 if(!fix||!Array.isArray(q.options))return q;
 const options=q.options.slice();options[fix[0]]=fix[1];
 return {...q,options,answerCueBalanced:true};
});
})();
