# CartoBike login QA automation

Playwright Test + strict TypeScript + Page Object Model. The existing homepage smoke test is preserved. Login coverage and approved scope are recorded in fixtures/case-catalog.json and reports/verification/.

## Setup

Use Node.js 22.2+ (Node.js 24 tested), Java 17+ for Allure 2, installed Google Chrome, and Playwright Firefox. In Windows PowerShell use npm.cmd because npm.ps1 may be blocked.

1. Run npm.cmd ci.
2. Run npm.cmd run browsers:install to install Firefox and the video encoder. Install Google Chrome separately if absent.
3. Copy .env.example to .env and configure the authorized account, verified account display name, protected route, application URL, and environment.
4. Run npm.cmd run typecheck.
5. Run npm.cmd run test:list -- tests/login for discovery without report side effects.
6. Run npm.cmd run test:login (or test:login:headed). A network-restricted environment needs permitted application access.

The current development environment was inspected before application-specific tests were written. AUTH_ACCOUNT_NAME and PROTECTED_PATH must come from live inspection; do not guess them for a new environment. The protected route is read only. No account details, leads, subscriptions, or other business data are modified.

## Reports and packaging

Run npm.cmd run qa:sanitize. Investigate failed scenarios and record per-attempt decisions in reports/investigation/triage-decisions.json using the actual result UUID, classification, reviewedAt, reason, actual behavior, and existing evidence paths. Confirmed application bugs must reference a reviewed entry in config/bug-catalog.json; a test ID alone never confirms a bug. Then run npm.cmd run qa:report, npm.cmd run qa:sanitize, and npm.cmd run allure:generate. Generation saves ctbBugReport_YYYY-MM-DD_HH-mm-ss.md under reports/allure-report using Asia/Kolkata time, and preserves earlier timestamped copies for the same execution through Allure cleanup. The canonical report remains under reports/bug-reports. Evidence links are rebased for the timestamped copy. Use npx.cmd playwright show-trace path/to/trace.zip for a retained guest trace.

Double-click Open-Allure-Report.bat in the project root, or the copy inside reports/allure-report. The launcher starts a local HTTP server and opens your default browser after the report data is ready. Keep the server window open while viewing; closing it stops the server. Running the batch again reuses the server only when it serves the same report. The command-line equivalent is npm.cmd run report:allure. Do not double-click index.html: file:/// access prevents Allure from fetching its JSON data and can show "500 Failed to fetch" even though no HTTP server returned 500.

Extract the entire downloaded ZIP before opening reports/allure-report/Open-Allure-Report.bat. Viewing requires Node.js 22.2+ on PATH; the packaged viewer uses only Node built-ins, so npm install and Java are not required to open an already generated report. The default address is http://127.0.0.1:8765. To change the port in a terminal, set REPORT_PORT before launching. A port occupied by another service produces a visible error and no process is stopped. If Node.js or report files are missing, the batch keeps its error visible. Only report-generation commands require Java and installed project dependencies.

Generation omits Allure's optional Google Analytics scripts from the generated HTML so viewing does not depend on external services. Run npm.cmd run test:report-launcher for isolated launcher regression checks; these fixture checks do not contribute to application test results.

Run npm.cmd run qa:package after report verification. Four ZIP packages are written under deliverables/. Archives exclude .env, authentication state, node_modules, and the historical baseline backup. The packaging script scans known credentials, reads nested traces, and reopens every generated ZIP.

The execution report uses current-run outcomes only; previous executions remain in reports/runs/ and appear as history attachments. A full post-correction benchmark was completed on 20 November 2026 and compared with the initial full run. The comparison uses the same named scenario workload, but browser versions and network/server load may vary between dates. Automatic retries are zero. Source-case counts, scenario counts, derived LOGIN-038 coverage and explicit reruns are separate.

## Credentials and evidence

Process environment variables override .env. All required secret values are loaded at runtime, validated without printing them, and excluded from archives. Never commit .env or saved authentication state. Session state is reused in memory only for non-logout persistence checks. Logout cases establish fresh sessions.

Default settings capture failure screenshots, videos and traces. Credential-bearing tests override all automatic captures and detailed action reporting: safe masked failure screenshots and sanitized logs are retained; raw traces and video are omitted because their secret safety cannot be guaranteed. Guest failure traces are sanitized before review. Fixture teardown scrubs credential inputs before closing pages so automatic error snapshots cannot retain their values.

Do not run Playwright --trace on, UI mode recording, or DEBUG=pw:api for real-credential scenarios without an independently verified sanitization policy. Avoid changing the evidence overrides in login-auth.spec.ts.

## Coverage boundaries

Chrome and Firefox desktop: 1425 x 847. Mobile: Chrome at the installed iPhone 16 Pro Max preset dimensions, 440 x 763, with touch/mobile emulation. This is not real iOS Safari testing. Human visual review remains outstanding.

LOGIN-038 derives coverage from actual initial-state/render, blank-validation, masking and valid-login results in both browsers; it is not an invented standalone test. Every direct test retains its source case ID.

Thirteen cases remain blocked for missing rules/fixtures. Five are explicitly out of scope. The blocked spec records reasons without submitting invalid credentials, changing account state, attempting Google consent, or inventing expiry/length requirements. No API contract tests or backend modifications are included.

The supplied source documents remain under docs/specifications/. They are reference specifications; later stakeholder answers in the requirement catalog take precedence over their earlier pending statements. Source documents may contain older CARTOBIKE_QA variable names; the executable suite consistently uses LOGIN_EMAIL and LOGIN_PASSWORD.

## CI

Supply environment variables through the CI secret manager. Run npm.cmd ci, browser installation, typecheck and test:login. Archive reports even when the suite exits nonzero. A nonzero exit is expected while confirmed application bugs remain; do not weaken assertions to obtain a passing build. No CI provider-specific workflow has been added.

## Reporting checks

Run npm.cmd run test:report-model for the reporting regression checks. These are isolated unit fixtures and are not application execution evidence. The report generator will leave unreviewed failures unconfirmed. A passing independent investigation never replaces an earlier failed test outcome. Videos can be sampled using scripts/sample-videos.mjs; it selects the newest installed compatible native decoder. Human sign-off and real-device testing are separate from AI visual review.
