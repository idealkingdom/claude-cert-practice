# Exam practice review — 6 September 2026

The active bank contains 90 original cases across all 30 task labels used by the two public study references. Twelve new cases require two selections and have explanations for each option. The bank is independent preparation, not official exam content. Its difficulty has not been calibrated against live exam results.

## Content changes

- Retired template clones from new forms. Retained 78 canonical or individually worded cases, revised ambiguous items, and added 12 multiple-response cases.
- Kept the 480 old entries in an archive solely to restore existing attempts and results. They are not counted as active questions and cannot be drawn in new forms.
- Kept domain quotas of 16/11/12/12/9 for full forms and 8/5/6/6/5 for shorter forms. Each form has distinct decision IDs and at least one multiple-response item in every domain.
- Replaced the shared scenario wrapper with self-contained question stems. The practice format does not claim to reproduce the live exam’s scenario blocks.
- Prioritized unseen questions and then least recently encountered cases. The small bank necessarily repeats material across attempts; no three-attempt exclusion guarantee is made.
- Added task mappings, technical reference links, and a review date. Public task lists agree across [Claude Certification Guide](https://claudecertificationguide.com/architect-foundations) and [paullarionov’s guide](https://github.com/paullarionov/claude-certified-architect). The latest official portal blueprint revision was not independently available for verification.
- Checked primary references for SDK delegation, hooks and sessions; API stop reasons, structured output and batch results; Claude Code memory, skills, CLI and settings; MCP interfaces; context, evaluation and provenance. The reference catalog is in `scripts/review-ccarf-bank.mjs` and the app’s Topics & sources page.
- Corrected the ambiguous page-concurrency item by specifying variable runtimes and memory constraints. Clarified tenant authorization, unsupported compatibility claims, cross-field validation and source-conflict reporting.
- Replaced a generic shared-state session item with session forking, and an overlapping hook-completion item with tool-result normalization.

## UI and reliability changes

- Dedicated responsive styling for exam practice, without modifying shared lab styles.
- Visible Settings/reset controls, explicit answer selection counts, clear-answer controls, question navigator filters and a pre-submit review screen.
- All-answer, missed and flagged review with source links; per-option rationale on the 12 new cases.
- Removed uncalibrated pass predictions and misleading question-pool claims.
- Timer uses a persisted deadline. Clicking, changing screens and reloading do not add time. Save & exit explicitly states that time continues.
- Theme changes preserve the current page. Answer changes preserve focus. Buttons expose selection state and the page includes keyboard shortcuts and a skip link.
- Reset uses an in-page confirmation with Cancel and explicit destructive-action text. Submission uses the pre-submit review screen without an additional blocking browser dialog.
- Existing attempts visibly identify when they use an earlier question-bank version, with instructions for starting reviewed cases.
- Validates saved attempts, retains a backup of unreadable data, reports unavailable storage and preserves old question versions for prior results.

## Automated verification

Run `node scripts/validate-ccarf-bank.mjs` and `node --check ccarf-final.js`.

The validator checks 90 active cases, 30 mapped topics, primary reference IDs, 12 multiple-response cases, 80 forms, domain quotas, distinct decisions, option permutations, exact-set scoring, selection caps, elapsed time, timer lifecycle, reload persistence, legacy restoration, reset cancellation, completed results, unreadable data, unavailable storage and theme navigation.

Single-answer length diagnostic: correct choices are uniquely longest by word count in 18/78 cases and uniquely shortest in 18/78 cases. This checks a visible cue, not psychometric difficulty. Deployment runs the validator before publishing.

## Maintenance

Edit `scripts/reviewed-cases.mjs` for new questions and `scripts/review-ccarf-bank.mjs` for canonical revisions and mappings, then run the review builder and validator. Keep previously shipped IDs and archived answers stable. Update a source-check date only after checking the linked documentation. Updates are editorial, not automatic online synchronization.
