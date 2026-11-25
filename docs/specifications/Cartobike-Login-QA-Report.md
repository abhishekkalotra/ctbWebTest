# Cartobike login QA report

**Page** [Cartobike sign-in](https://cartobikedev.shop/en/login) · **Review date** 19 November 2026 · **Environment** `cartobikedev.shop`, Chrome, English, 1425 × 847 CSS pixels.

## 1. Login page analysis

The main region contains a linked CartoBike logo, the “Sign in” heading, an email-and-password form, recovery and registration links, a Google sign-in option, and a language picker. Its supporting copy reads “Or sign up with,” “New to CartoBike?” and “Create your account for free.” The accessibility snapshot also exposed a page-title alert and an empty “Notifications Alt+T” region. These are potential announcement surfaces. Their behavior during an authentication response remains unverified.

| Element | Type, purpose, and observed initial state | Observed behavior |
|---|---|---|
| CartoBike Logo | Image link, visible and enabled | Link target `/en`. Navigation pending. |
| E-mail | Email input with an email icon, empty, enabled, placeholder `xx@domaine.com` | Accepts text entry. Visible “E-mail” text has no associated HTML label. No native `required` attribute was present in the inspected attributes. With both fields empty, the form remained open and showed a required-field message. A clean email-only required check remains pending. |
| Password | Password input with a password icon, empty, enabled, placeholder `Password` | Single-field submission with a populated email and empty password showed “This field is required” beside the password field. No native `required` attribute was present. The visible “Password” text has no associated HTML label. |
| Password visibility | Enabled button named “toggle password visibility,” initially showing a closed-eye image | With a dummy value, clicking switched the input type from `password` to `text`, and clicking again switched it back. Value retention and keyboard activation remain pending. |
| Log in | Enabled submit button, including when the inputs were empty | Blank submission stayed on `/en/login` and displayed “This field is required.” The initial output established one message, so behavior for each field in a clean simultaneous-blank scenario needs separate evidence. |
| Forgot password? | Enabled recovery link | Declares `/en/forgot`. Landing page and reset flow pending. |
| Google | Enabled provider button, accessible name “Google logo Google” | Provider launch and result pending. |
| Sign up here | Enabled registration link | Declares `/en/registration`. Landing page pending. |
| English / Switch language | Enabled button showing an English flag and “English” | Opens a “Choose Language” dialog. English was checked. Deutsch, Français, Nederlands, and Español were available, along with an icon Close button and a text Close button. |
| Field feedback | Empty paragraph slots were present in the initial snapshot | In a malformed-email probe, focus returned to the email input. A prior required message was still visible, so this probe did not establish the email-format error message. In the inspected validation snapshots, the inputs still exposed `aria-invalid="false"` and no `aria-describedby`, including when the password message was present. |
| Initial notification/loading state | No visible spinner or sign-in error appeared at initial inspection | In-flight submission, server errors and loading indicators remain unverified. |

The observed page contained no Remember Me control. The inputs’ inspected attributes did not include `minlength` or `maxlength`. That observation establishes the inspected markup only. Client-side JavaScript and server-side length rules are unknown.

Two accessibility findings warrant review. The visible field labels are unassociated, and the inspected required-message state lacks an input-to-error description link. Screen-reader announcements, focus visibility, dialog focus behavior and focus order need direct verification.

**Inspection limit** Chrome blocked further interaction with the selected tab after the initial probes because another extension UI was open. Successful login, redirect, session and logout were not observed. Request/response and cookie inspection were unavailable through the connected inspection surface. No password, token, or session cookie value is included in this report.

## 2. Verified locator repository

Expressions are locator references for future use. Browser inspection checked exact primary matches, visibility and enabled state on the English sign-in page. “Verified” means a unique target was observed. Click or fill is listed separately where performed. CSS alternatives are grounded in observed attributes, with global uniqueness still to be checked. Use the same assertions on the project’s Playwright version before committing a Page Object.

| ID | Element | Strategy | Actual locator | Count | Verified | Notes and alternatives |
|---|---|---|---|---:|---|---|
| L01 | E-mail | Role and exact accessible name | `getByRole('textbox', { name: 'xx@domaine.com', exact: true })` | 1 | Yes | Visible and enabled. Fill exercised via the verified alternative `getByPlaceholder('xx@domaine.com', { exact: true })` (1). Observed CSS ID `#login-email-field`. `getByLabel('E-mail', { exact: true })` returned 0. |
| L02 | Password | Exact placeholder | `getByPlaceholder('Password', { exact: true })` | 1 | Yes | Visible, enabled and filled. Works across the observed masking toggle because the placeholder stays the same. Observed CSS ID `#login-password-field`. `getByLabel('Password', { exact: true })` returned 0. |
| L03 | Log in | Role and exact name | `getByRole('button', { name: 'Log in', exact: true })` | 1 | Yes | Visible, enabled and clicked. Observed CSS ID `#login-button`. |
| L04 | Password visibility | Role and exact name | `getByRole('button', { name: 'toggle password visibility', exact: true })` | 1 | Yes | Visible, enabled and clicked. Observed CSS alternative `button[aria-label="toggle password visibility"]`. |
| L05 | Forgot password? | Role and exact name | `getByRole('link', { name: 'Forgot password?', exact: true })` | 1 | Yes | Visible and enabled. Observed CSS ID `#forgot-password-link`. |
| L06 | Sign up here | Role and exact name | `getByRole('link', { name: 'Sign up here', exact: true })` | 1 | Yes | Visible and enabled. Observed CSS ID `#sign-up-link`. |
| L07 | Google | Role and exact name | `getByRole('button', { name: 'Google logo Google', exact: true })` | 1 | Yes | Visible and enabled. Accessible name includes the image alt text. Observed CSS ID `#google-signin-button`. |
| L08 | CartoBike Logo | Role and exact name | `getByRole('link', { name: 'CartoBike Logo', exact: true })` | 1 | Yes | Visible and enabled. Observed target `/en`. |
| L09 | Switch language | Role and exact name | `getByRole('button', { name: 'Switch language', exact: true })` | 1 | Yes | Visible, enabled and clicked. Observed CSS alternative `button[aria-label="Switch language"]`. |
| L10 | Choose Language | Role | `getByRole('dialog')` | 1 in snapshot | Observed | Dialog appeared active. Query count, visibility and accessible name were not independently checked. |
| L11 | English choice | Dialog-scoped role and name | `getByRole('dialog').getByRole('button', { name: 'English English English', exact: true })` | 1 | Yes | Visible and enabled. Dialog-scoped exact radio name `English` also matched once, checked in snapshot. |
| L12 | Deutsch choice | Dialog-scoped role and name | `getByRole('dialog').getByRole('button', { name: 'Deutsch Deutsch Deutsch', exact: true })` | 1 | Yes | Visible and enabled. Dialog-scoped exact radio name `Deutsch` also matched once. |
| L13 | Français choice | Dialog-scoped role and name | `getByRole('dialog').getByRole('button', { name: 'Français Français Français', exact: true })` | 1 | Yes | Visible and enabled. Dialog-scoped exact radio name `Français` also matched once. |
| L14 | Nederlands choice | Dialog-scoped role and name | `getByRole('dialog').getByRole('button', { name: 'Nederlands Nederlands Nederlands', exact: true })` | 1 | Yes | Visible and enabled. Dialog-scoped exact radio name `Nederlands` also matched once. |
| L15 | Español choice | Dialog-scoped role and name | `getByRole('dialog').getByRole('button', { name: 'Español Español Español', exact: true })` | 1 | Yes | Visible and enabled. Dialog-scoped exact radio name `Español` also matched once. |
| L16 | Icon Close | Dialog-scoped role plus glyph | `getByRole('dialog').getByRole('button', { name: 'Close', exact: true }).filter({ hasText: '✕' })` | 1 | Partial | Unique and clicked. Closure was not confirmed in a post-click snapshot. Observed CSS alternative `button[aria-label="Close"]` within the dialog. |
| L17 | Text Close | Dialog-scoped text | `getByRole('dialog').getByText('Close', { exact: true })` | Pending | Observed | Text Close was present on one of two observed buttons named Close. Exact text query and actionability need checks. |
| L18 | Required feedback | Text with field scope | Pending | Pending | Observed | “This field is required” may recur. Verify a field wrapper or use an application-owned error ID before building per-field assertions. |
| L19 | Notification region | Role and exact name | `getByRole('region', { name: 'Notifications Alt+T', exact: true })` | 1 in snapshot | Observed | Initial snapshot only. Error and success notification locators pending. |
| L20 | Sign in heading | Role and exact name | `getByRole('heading', { name: 'Sign in', exact: true })` | 1 in snapshot | Observed | Useful readiness anchor. Query count pending. |

The dialog-scoped unfiltered Close role query returned two elements. The option buttons have repeated accessible names assembled from their content. Keep language-dependent locators scoped and reverify them after any locale or accessibility update. Direct radio interaction was not verified. No post-login controls were inspected.

## 3. Detailed test cases

Each case is a future execution record. All **Actual Result** and **Status** fields start at **Not Executed**. Earlier exploratory observations appear in the source or remarks and do not assign an execution outcome to a scripted test run. Priorities are proposed QA priorities. Use synthetic data for local validation and load the authorized account through `CARTOBIKE_QA_EMAIL` and `CARTOBIKE_QA_PASSWORD` for future authentication checks.

### LOGIN-001 · Render the English sign-in page

**Test Case ID** LOGIN-001  
**Module** Authentication — Login  
**Title** Render the English sign-in page  
**Category** UI  
**Priority** High  
**Preconditions** Guest on a fresh English sign-in page  
**Test Data** None

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Open the sign-in URL.
3. Inspect the main region, heading, form, recovery and registration controls, Google button, logo and language picker.

**Expected Result** The heading reads “Sign in” and the nine controls documented in Report 2 are present and visible.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L09, L20  
**Evidence/Requirement Source** Initial UI and accessibility snapshot  
**Remarks** Compare visible content independently of authentication.

### LOGIN-002 · Verify initial input and submit states

**Test Case ID** LOGIN-002  
**Module** Authentication — Login  
**Title** Verify initial input and submit states  
**Category** UI  
**Priority** High  
**Preconditions** Guest, autofill disabled in the test profile  
**Test Data** None

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Open the sign-in URL.
3. Inspect both inputs and Log in before typing.

**Expected Result** Both fields are empty and enabled. Both documented placeholders are present and Log in is enabled.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** Initial DOM and locator state  
**Remarks** Use a fresh browser context to control autofill.

### LOGIN-003 · Verify the language dialog and initial selection

**Test Case ID** LOGIN-003  
**Module** Authentication — Login  
**Title** Verify the language dialog and initial selection  
**Category** UI  
**Priority** Medium  
**Preconditions** Guest on English sign-in view  
**Test Data** None

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Click Switch language.
3. Inspect the dialog, option buttons and selection.

**Expected Result** The dialog displays “Choose Language” with five documented choices. English is checked.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L09–L15  
**Evidence/Requirement Source** Opened dialog snapshot and locator counts  
**Remarks** Keep queries dialog-scoped.

### LOGIN-004 · Verify brand and account navigation link targets

**Test Case ID** LOGIN-004  
**Module** Authentication — Login  
**Title** Verify brand and account navigation link targets  
**Category** UI  
**Priority** Low  
**Preconditions** Guest on the sign-in page  
**Test Data** None

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Inspect the link destinations for the logo, Forgot password? and Sign up here.

**Expected Result** Their link targets are /en, /en/forgot and /en/registration respectively.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L05, L06, L08  
**Evidence/Requirement Source** Observed DOM href attributes  
**Remarks** Destination rendering is covered separately.

### LOGIN-005 · Verify both language dialog close controls

**Test Case ID** LOGIN-005  
**Module** Authentication — Login  
**Title** Verify both language dialog close controls  
**Category** UI  
**Priority** Medium  
**Preconditions** Guest with language dialog open  
**Test Data** None

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Click the icon Close and observe.
3. Reopen the dialog.
4. Click text Close and observe.

**Expected Result** Pending confirmation that both controls dismiss the dialog without applying a language change.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L09, L10, L16, L17  
**Evidence/Requirement Source** Both controls observed. Close action result unverified.  
**Remarks** Confirm both close paths and verify L17 before implementation.

### LOGIN-006 · Verify changing and restoring the sign-in locale

**Test Case ID** LOGIN-006  
**Module** Authentication — Login  
**Title** Verify changing and restoring the sign-in locale  
**Category** UI  
**Priority** Medium  
**Preconditions** Guest in a disposable test browser context  
**Test Data** One supported non-English language

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Open the picker and select Français.
3. Record page language and route.
4. Reopen and select English.

**Expected Result** Pending locale route, translated labels, persistence and restoration requirements.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L09–L15  
**Evidence/Requirement Source** Language options observed  
**Remarks** Use a disposable context and established locale expectations.

### LOGIN-007 · Sign in using valid credentials and the Log in button

**Test Case ID** LOGIN-007  
**Module** Authentication — Login  
**Title** Sign in using valid credentials and the Log in button  
**Category** Positive  
**Priority** Critical  
**Preconditions** Guest and authorized active test account  
**Test Data** Authorized account from environment variables

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Fill both fields.
3. Click Log in.
4. Capture final route and an authenticated UI indicator.

**Expected Result** The authorized account signs in. The destination and reliable signed-in indicator are pending verification.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** User-supplied account and observed form  
**Remarks** Chrome access blocked the successful login observation.

### LOGIN-008 · Submit valid credentials with Enter

**Test Case ID** LOGIN-008  
**Module** Authentication — Login  
**Title** Submit valid credentials with Enter  
**Category** Positive  
**Priority** High  
**Preconditions** Guest and authorized active test account  
**Test Data** Authorized account from environment variables

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Fill both fields.
3. Focus Password.
4. Press Enter once.
5. Record the resulting route and UI.

**Expected Result** Pending confirmation that Enter submits and uses the same destination as clicking Log in.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** Observed form and submit button  
**Remarks** Run after verifying baseline login.

### LOGIN-009 · Verify the landing pages for recovery, registration and home

**Test Case ID** LOGIN-009  
**Module** Authentication — Login  
**Title** Verify the landing pages for recovery, registration and home  
**Category** Positive  
**Priority** High  
**Preconditions** Guest. Restart at the sign-in page for each link  
**Test Data** Three observed links

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Click one link.
3. Record its final URL and page heading.
4. Return to sign-in.
5. Repeat for each remaining link.

**Expected Result** The corresponding anchor targets are known. Final landing URLs, headings and any intended redirects remain pending.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L05, L06, L08  
**Evidence/Requirement Source** Observed link targets  
**Remarks** Navigation only. The case ends before submitting any form.

### LOGIN-010 · Submit both fields blank

**Test Case ID** LOGIN-010  
**Module** Authentication — Login  
**Title** Submit both fields blank  
**Category** Validation  
**Priority** High  
**Preconditions** Guest with an untouched, empty form  
**Test Data** Empty email and password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Click Log in.
3. Record the URL and visible inline validation.

**Expected Result** Sign-in remains at /en/login and at least one inline “This field is required” message appears.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18  
**Evidence/Requirement Source** Observed blank submission  
**Remarks** Exact per-field coverage is handled in the single-field cases.

### LOGIN-011 · Submit with password omitted

**Test Case ID** LOGIN-011  
**Module** Authentication — Login  
**Title** Submit with password omitted  
**Category** Validation  
**Priority** High  
**Preconditions** Guest on a fresh sign-in page  
**Test Data** qa@example.invalid and empty password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Fill E-mail.
3. Leave Password empty.
4. Click Log in.
5. Inspect the password wrapper and current URL.

**Expected Result** Sign-in remains open. The password field shows “This field is required”.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18  
**Evidence/Requirement Source** Observed single-field submission and password feedback  
**Remarks** Verify an exact field wrapper locator before asserting placement.

### LOGIN-012 · Submit with email omitted

**Test Case ID** LOGIN-012  
**Module** Authentication — Login  
**Title** Submit with email omitted  
**Category** Validation  
**Priority** High  
**Preconditions** Guest on a fresh sign-in page  
**Test Data** Blank email and synthetic non-secret password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Fill Password.
3. Leave E-mail empty.
4. Click Log in.
5. Inspect both field regions.

**Expected Result** Pending the email-only validation message, placement and focus behavior.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18  
**Evidence/Requirement Source** Blank submission showed a required message. Clean email-only probe was interrupted.  
**Remarks** Use a fresh form so prior messages cannot obscure the result.

### LOGIN-013 · Submit malformed email addresses

**Test Case ID** LOGIN-013  
**Module** Authentication — Login  
**Title** Submit malformed email addresses  
**Category** Validation  
**Priority** High  
**Preconditions** Guest on a fresh sign-in page for each input  
**Test Data** not-an-email, qa@, qa example@sample.invalid and qa@@sample.invalid, one at a time; dummy password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Fill one malformed email and dummy password.
3. Click Log in.
4. Observe focus, route and field feedback.
5. Repeat in a clean state.

**Expected Result** For the observed not-an-email probe, focus returned to E-mail and the sign-in route remained. Clean feedback and outcomes for the other variants are pending.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18  
**Evidence/Requirement Source** Malformed email exploratory probe  
**Remarks** Treat browser-native validation wording as browser and locale dependent.

### LOGIN-014 · Check when inline validation clears

**Test Case ID** LOGIN-014  
**Module** Authentication — Login  
**Title** Check when inline validation clears  
**Category** Validation  
**Priority** Medium  
**Preconditions** Guest with the password required message displayed  
**Test Data** Synthetic non-secret password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Enter a dummy password.
3. Inspect feedback while typing.
4. Blur the field.
5. Inspect again.

**Expected Result** Pending when field feedback and accessibility state should update after a correction.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L02, L18  
**Evidence/Requirement Source** Password required message observed  
**Remarks** This check can stop before credential submission.

### LOGIN-015 · Check email whitespace normalization

**Test Case ID** LOGIN-015  
**Module** Authentication — Login  
**Title** Check email whitespace normalization  
**Category** Validation  
**Priority** Medium  
**Preconditions** Guest and approved test account  
**Test Data** Account email with leading space, trailing space, or an internal space, one variant per test scenario

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Enter one variant.
3. Blur the input.
4. Inspect displayed value.
5. If approved for the fixture, attempt sign-in once.
6. Record result.

**Expected Result** Pending whitespace handling rules for each variant and expected feedback.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** Observed email input. Normalization rules unknown.  
**Remarks** Use an isolated fixture and approved attempt budget for submission.

### LOGIN-016 · Check password whitespace handling

**Test Case ID** LOGIN-016  
**Module** Authentication — Login  
**Title** Check password whitespace handling  
**Category** Validation  
**Priority** Medium  
**Preconditions** Guest and dedicated test fixture  
**Test Data** Fixture password with legitimate spaces or approved whitespace variants

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Enter one approved variant using a dedicated fixture.
3. Submit once.
4. Record whether the result matches the rule.

**Expected Result** Pending whether spaces are significant and whether any client normalization is intended.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** Observed password input. Normalization rules unknown.  
**Remarks** Requires a dedicated account. Never record the input value.

### LOGIN-017 · Check international characters and accepted identifiers

**Test Case ID** LOGIN-017  
**Module** Authentication — Login  
**Title** Check international characters and accepted identifiers  
**Category** Validation  
**Priority** Medium  
**Preconditions** Guest with approved fixture if submission is needed  
**Test Data** Plain username, approved email alias, and an internationalized email fixture if supported

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Check each configured identifier independently.
3. Inspect validation and, where applicable, submit using the matching test account.

**Expected Result** Pending whether only email identifiers are supported and whether aliases or internationalized addresses are accepted.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** Email input observed. Account identifier rules unknown.  
**Remarks** Use product-approved fixtures before submission.

### LOGIN-018 · Check documented email length boundaries

**Test Case ID** LOGIN-018  
**Module** Authentication — Login  
**Title** Check documented email length boundaries  
**Category** Boundary  
**Priority** Medium  
**Preconditions** Guest and agreed email length policy  
**Test Data** Valid-format email samples at each applicable limit minus one, at the limit, and plus one

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Enter and paste each sample.
3. Inspect acceptance, truncation and feedback.
4. Submit only where approved for the fixture.

**Expected Result** Pending the supported lengths and expected handling on either side of each limit.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01, L03, L18  
**Evidence/Requirement Source** No email length attributes in the inspected input  
**Remarks** Avoid inventing application-level lengths.

### LOGIN-019 · Check documented password length boundaries

**Test Case ID** LOGIN-019  
**Module** Authentication — Login  
**Title** Check documented password length boundaries  
**Category** Boundary  
**Priority** Medium  
**Preconditions** Guest and agreed password length policy  
**Test Data** Dedicated credentials at each applicable limit minus one, at the limit, and plus one

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Enter each fixture value.
3. Observe field behavior.
4. Where authorized, submit one fixture and inspect feedback.

**Expected Result** Pending login-specific length rules and any treatment of older credentials.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L02, L03, L18  
**Evidence/Requirement Source** No password length attributes in the inspected input  
**Remarks** Requires dedicated fixtures. Keep password values out of evidence.

### LOGIN-020 · Sign in with a known email and one incorrect password

**Test Case ID** LOGIN-020  
**Module** Authentication — Login  
**Title** Sign in with a known email and one incorrect password  
**Category** Negative  
**Priority** High  
**Preconditions** Guest and dedicated account with an approved attempt budget  
**Test Data** Authorized fixture email and a single invalid non-secret value

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Fill both fields.
3. Submit once.
4. Inspect route, visible error, and whether any authenticated UI appears.

**Expected Result** Expected error wording, placement and credential retention behavior require confirmation. The supplied input is intentionally invalid for the fixture.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18–L19  
**Evidence/Requirement Source** Observed sign-in form. Server behavior unverified.  
**Remarks** Requires test access and an approved attempt budget. No repeated failures.

### LOGIN-021 · Sign in with a nonexistent account fixture

**Test Case ID** LOGIN-021  
**Module** Authentication — Login  
**Title** Sign in with a nonexistent account fixture  
**Category** Negative  
**Priority** High  
**Preconditions** Guest and an approved, confirmed-unregistered email fixture  
**Test Data** Approved nonexistent account email and synthetic password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Submit once.
3. Record the visible outcome and whether any authenticated UI appears.

**Expected Result** Pending the intended UI message and whether it must match the incorrect-password response.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18–L19  
**Evidence/Requirement Source** Observed sign-in form. No nonexistent-account response observed.  
**Remarks** Requires approved fixture and budget. Use only the designated email.

### LOGIN-022 · Verify sign-in with a restricted account state

**Test Case ID** LOGIN-022  
**Module** Authentication — Login  
**Title** Verify sign-in with a restricted account state  
**Category** Negative  
**Priority** Medium  
**Preconditions** Guest and a dedicated account in a product-supported restricted state  
**Test Data** One approved fixture for each confirmed state

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Sign in once per supported fixture.
3. Record the UI, route and available next action.

**Expected Result** Pending which states exist and their required handling, e.g. unverified or disabled if applicable.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18–L19  
**Evidence/Requirement Source** No restricted account state observed  
**Remarks** Avoid changing the supplied account to create fixtures.

### LOGIN-023 · Verify password masking by default

**Test Case ID** LOGIN-023  
**Module** Authentication — Login  
**Title** Verify password masking by default  
**Category** Security  
**Priority** High  
**Preconditions** Guest on a fresh sign-in page  
**Test Data** Synthetic non-secret password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Enter a dummy value without activating the eye control.
3. Inspect the field type and visual masking.

**Expected Result** The password field is of type password by default and masks entry.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L02, L04  
**Evidence/Requirement Source** Initial DOM showed type=password and closed-eye image  
**Remarks** Use only a dummy value for any visual evidence.

### LOGIN-024 · Reveal and remask a synthetic password

**Test Case ID** LOGIN-024  
**Module** Authentication — Login  
**Title** Reveal and remask a synthetic password  
**Category** Security  
**Priority** High  
**Preconditions** Guest with an empty password field  
**Test Data** Synthetic non-secret password

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Fill the field.
3. Click the eye control.
4. Inspect the input type.
5. Click again and recheck.

**Expected Result** The input changes from password to text, then back to password.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L02, L04  
**Evidence/Requirement Source** Both transitions observed  
**Remarks** Selection/caret and value retention remain separate verification details.

### LOGIN-025 · Verify the inspected sign-in URL uses HTTPS

**Test Case ID** LOGIN-025  
**Module** Authentication — Login  
**Title** Verify the inspected sign-in URL uses HTTPS  
**Category** Security  
**Priority** High  
**Preconditions** Guest with the sign-in page open  
**Test Data** Observed sign-in URL

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Open the sign-in page.
3. Read the address and confirm the scheme.

**Expected Result** The observed sign-in URL uses HTTPS.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L20  
**Evidence/Requirement Source** Browser location  
**Remarks** Certificate policy and server transport controls are outside this UI assertion.

### LOGIN-026 · Verify credential handling in visible navigation

**Test Case ID** LOGIN-026  
**Module** Authentication — Login  
**Title** Verify credential handling in visible navigation  
**Category** Security  
**Priority** High  
**Preconditions** Guest and approved account or dummy validation data as appropriate  
**Test Data** Approved test credential references

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Sign in in the approved environment.
3. Inspect the resulting visible URL, history entry and UI for credential exposure.

**Expected Result** Pending the approved security requirements for visible navigation. Record findings without copying any credential.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** Observed HTTPS sign-in page  
**Remarks** Use redacted evidence and do not enable unsanitized tracing.

### LOGIN-027 · Refresh an authenticated page

**Test Case ID** LOGIN-027  
**Module** Authentication — Login  
**Title** Refresh an authenticated page  
**Category** Session  
**Priority** Critical  
**Preconditions** Successfully signed in on an observed authenticated route  
**Test Data** Authorized account from environment variables

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Refresh the authenticated page.
3. Inspect route and signed-in UI marker.

**Expected Result** Pending authenticated baseline observation and the approved refresh persistence behavior.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03; post-login marker pending  
**Evidence/Requirement Source** User-requested session coverage  
**Remarks** Chrome access blocked baseline login.

### LOGIN-028 · Revisit the sign-in route while signed in

**Test Case ID** LOGIN-028  
**Module** Authentication — Login  
**Title** Revisit the sign-in route while signed in  
**Category** Session  
**Priority** High  
**Preconditions** Successfully signed in  
**Test Data** Observed sign-in URL

**Steps to Reproduce**

1. Set up the stated preconditions.
2. In the same tab, open /en/login.
3. Observe final URL, page and session state.

**Expected Result** Pending whether signed-in users should see the form or be redirected, and to which destination.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L20; post-login marker pending  
**Evidence/Requirement Source** Observed login route  
**Remarks** Requires authenticated baseline and product confirmation.

### LOGIN-029 · Sign out and verify protected-route behavior

**Test Case ID** LOGIN-029  
**Module** Authentication — Login  
**Title** Sign out and verify protected-route behavior  
**Category** Session  
**Priority** Critical  
**Preconditions** Successfully signed in with a confirmed protected route and logout control  
**Test Data** Authorized account and observed protected route

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Click the confirmed logout control.
3. Observe the next page.
4. Revisit the identified protected route normally.

**Expected Result** Pending logout destination and guest handling for the confirmed protected route.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** Post-login and logout locators pending  
**Evidence/Requirement Source** Authenticated controls and route not observed  
**Remarks** Use only ordinary UI navigation and the designated account.

### LOGIN-030 · Use browser Back after sign-out

**Test Case ID** LOGIN-030  
**Module** Authentication — Login  
**Title** Use browser Back after sign-out  
**Category** Session  
**Priority** High  
**Preconditions** Signed out through the confirmed action after visiting a protected page  
**Test Data** Session established with authorized account

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Use browser Back once.
3. Inspect whether protected content or its shell appears.
4. Refresh and compare.

**Expected Result** Pending cache and navigation requirements for the signed-out state.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** Logout control and protected-page marker pending  
**Evidence/Requirement Source** User-requested session coverage  
**Remarks** Run after baseline logout is verified.

### LOGIN-031 · Verify session state across tabs

**Test Case ID** LOGIN-031  
**Module** Authentication — Login  
**Title** Verify session state across tabs  
**Category** Session  
**Priority** Medium  
**Preconditions** One authenticated tab and a second tab using the same browser profile  
**Test Data** Confirmed authenticated route

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Open the confirmed route in tab two.
3. Record its state.
4. Sign out in tab one.
5. Check tab two before and after refresh.

**Expected Result** Pending session sharing and whether logout changes other tabs immediately or on their next request.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** Logout control and protected-page marker pending  
**Evidence/Requirement Source** User-requested multiple-tab coverage  
**Remarks** Requires a verified protected page and approved expectations.

### LOGIN-032 · Verify idle or absolute session expiry

**Test Case ID** LOGIN-032  
**Module** Authentication — Login  
**Title** Verify idle or absolute session expiry  
**Category** Session  
**Priority** High  
**Preconditions** Authenticated fixture with documented expiry thresholds  
**Test Data** Approved timeout values

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Sign in.
3. Follow the agreed idle or elapsed-time procedure.
4. Revisit the confirmed protected page before and after expiry.

**Expected Result** Pending expiry timing, renewal rules, and expected UI at expiration.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** Post-login marker pending  
**Evidence/Requirement Source** No session expiry rules available  
**Remarks** Use a test environment with controlled timing if available.

### LOGIN-033 · Verify accessible association of credential field labels

**Test Case ID** LOGIN-033  
**Module** Authentication — Login  
**Title** Verify accessible association of credential field labels  
**Category** Accessibility  
**Priority** High  
**Preconditions** Guest on the English sign-in page  
**Test Data** None

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Inspect both input label associations and role/label locator results.

**Expected Result** A regression check for the recorded issue can assert that both visible labels are addressable through their associated input labels once the product requirement is confirmed and fixed.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01, L02  
**Evidence/Requirement Source** DOM labels arrays were empty and exact label queries both returned 0  
**Remarks** Automatable with current verified field locators. Target accessible names should be confirmed as part of remediation.

### LOGIN-034 · Verify full keyboard focus order and visible focus

**Test Case ID** LOGIN-034  
**Module** Authentication — Login  
**Title** Verify full keyboard focus order and visible focus  
**Category** Accessibility  
**Priority** High  
**Preconditions** Guest on the sign-in page with autofill popups closed  
**Test Data** Keyboard only

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Tab through the page and Shift+Tab backwards.
3. Record order, visibility of focus and keyboard activation of the eye control.

**Expected Result** Pending agreed tab sequence and focus styling. Open issues to record include a skipped control, missing visible focus, or an inoperable control.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L09  
**Evidence/Requirement Source** Observed focusable controls. Actual order unverified.  
**Remarks** Visual focus indicators need human review in supported browsers.

### LOGIN-035 · Verify screen-reader announcements of labels and field errors

**Test Case ID** LOGIN-035  
**Module** Authentication — Login  
**Title** Verify screen-reader announcements of labels and field errors  
**Category** Accessibility  
**Priority** High  
**Preconditions** Guest with an approved screen reader and browser combination  
**Test Data** Blank password and synthetic valid-format email

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Navigate to both inputs with a screen reader.
3. Trigger the required password message.
4. Listen for label and error announcements.

**Expected Result** Pending the agreed accessible behavior. Compare announcements with visible labels and feedback.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18–L19  
**Evidence/Requirement Source** Missing label associations and no error description link in inspected DOM  
**Remarks** Check real announcements. The DOM finding alone cannot establish what each screen reader announces.

### LOGIN-036 · Verify language dialog focus behavior

**Test Case ID** LOGIN-036  
**Module** Authentication — Login  
**Title** Verify language dialog focus behavior  
**Category** Accessibility  
**Priority** Medium  
**Preconditions** Guest on the sign-in page using keyboard only  
**Test Data** None

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Open the dialog using the keyboard.
3. Record initial focus.
4. Tab forwards and backwards.
5. Try Escape and the close controls.
6. Record where focus returns.

**Expected Result** The dialog was active when opened by click. Keyboard focus order, containment, Escape behavior and return target remain to be checked against requirements.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L09–L17  
**Evidence/Requirement Source** Opened dialog accessibility snapshot  
**Remarks** Close names coincide, so test each control independently.

### LOGIN-037 · Review sign-in layout on supported device widths

**Test Case ID** LOGIN-037  
**Module** Authentication — Login  
**Title** Review sign-in layout on supported device widths  
**Category** Responsive  
**Priority** Medium  
**Preconditions** Guest, approved viewport matrix available  
**Test Data** Desktop, tablet and mobile widths from the support matrix

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Open sign-in at each width.
3. Inspect the form, links, language picker and validation feedback.
4. Open the dialog and review scrolling.

**Expected Result** Desktop baseline controls are observed. Layout and fit expectations for the approved widths remain pending.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L19  
**Evidence/Requirement Source** Desktop Chrome only, 1425 × 847  
**Remarks** Capture browser and viewport per execution. Review placement visually.

### LOGIN-038 · Verify sign-in in supported browser engines

**Test Case ID** LOGIN-038  
**Module** Authentication — Login  
**Title** Verify sign-in in supported browser engines  
**Category** Cross-Browser  
**Priority** Medium  
**Preconditions** Supported browser/version matrix and matching fixtures available  
**Test Data** Approved browser profiles

**Steps to Reproduce**

1. Set up the stated preconditions.
2. For each browser, run initial-state, blank validation, masking, and valid-login checks.
3. Record browser and baseline differences.

**Expected Result** Pending browser support matrix and confirmed successful-login baseline. Current UI evidence covers Chrome.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L04, L18; post-login marker pending  
**Evidence/Requirement Source** Connected Chrome observations  
**Remarks** Native validation messages and accessible-name behavior may vary.

### LOGIN-039 · Verify Google sign-in launch and return flow

**Test Case ID** LOGIN-039  
**Module** Authentication — Login  
**Title** Verify Google sign-in launch and return flow  
**Category** Integration  
**Priority** High  
**Preconditions** Guest and authorized QA Google identity for this environment  
**Test Data** Approved QA provider account and test OAuth configuration

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Click Google.
3. Observe the expected provider destination.
4. Complete consent only with authorization.
5. Verify the return and signed-in indicator.

**Expected Result** The Google button exists. Provider destination, launch mode, return behavior and expected authenticated landing remain pending.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L07; post-login marker pending  
**Evidence/Requirement Source** Observed Google button only  
**Remarks** Requires QA OAuth configuration and approved account. Cancel before granting any unapproved access.

### LOGIN-040 · Verify sign-in request and response contract

**Test Case ID** LOGIN-040  
**Module** Authentication — Login  
**Title** Verify sign-in request and response contract  
**Category** Integration  
**Priority** High  
**Preconditions** Approved network inspection and login contract available  
**Test Data** Authorized account through protected configuration

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Submit valid credentials through the UI.
3. Inspect request metadata, response status and redirect.
4. Record a redacted comparison to contract.

**Expected Result** Pending documented endpoint, method, permitted payload fields, response and redirect contract.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03  
**Evidence/Requirement Source** Network inspection unavailable  
**Remarks** Capture field names only when allowed. Redact credentials, cookies and tokens.

### LOGIN-041 · Verify authenticated session metadata

**Test Case ID** LOGIN-041  
**Module** Authentication — Login  
**Title** Verify authenticated session metadata  
**Category** Integration  
**Priority** High  
**Preconditions** Approved browser or backend visibility and cookie/session requirements  
**Test Data** Authorized test account

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Sign in.
3. Inspect permitted session metadata and attributes.
4. Sign out.
5. Verify documented changes without copying values.

**Expected Result** Pending application session mechanism, cookie names/flags if applicable, lifetime and logout contract.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03; logout locator pending  
**Evidence/Requirement Source** Network and cookie inspection unavailable  
**Remarks** Use redacted metadata. This case stays within the normal login/logout flow.

### LOGIN-042 · Verify the UI state during a slow sign-in response

**Test Case ID** LOGIN-042  
**Module** Authentication — Login  
**Title** Verify the UI state during a slow sign-in response  
**Category** Integration  
**Priority** Medium  
**Preconditions** Controlled QA environment and confirmed sign-in contract  
**Test Data** Authorized account and approved slow-response condition

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Trigger one login attempt under the approved latency condition.
3. Observe button state, loading UI and final response.

**Expected Result** Pending spinner or progress behavior, submit state and timeout/retry UX.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L03, L19; loading locator pending  
**Evidence/Requirement Source** No initial spinner. In-flight state unverified.  
**Remarks** Use deterministic latency control when available.

### LOGIN-043 · Verify recoverable service-error behavior

**Test Case ID** LOGIN-043  
**Module** Authentication — Login  
**Title** Verify recoverable service-error behavior  
**Category** Integration  
**Priority** Medium  
**Preconditions** Controlled QA environment with approved error condition  
**Test Data** Authorized account and approved non-destructive service-error setup

**Steps to Reproduce**

1. Set up the stated preconditions.
2. Submit once under the controlled error condition.
3. Observe feedback and recovery options.
4. Retry normally only if allowed by the fixture.

**Expected Result** Pending expected feedback, form retention and recovery behavior for the documented error.  
**Actual Result** Not Executed  
**Status** Not Executed  
**Locator(s)** L01–L03, L18–L19  
**Evidence/Requirement Source** No service error response observed  
**Remarks** Requires approved environment control or a documented fixture.

## 4. Automation feasibility matrix

“Ready for Automation” identifies a case with enough observed behavior to implement once authorized. A case needing clarification can still have usable locators. “Blocked” identifies missing access, fixtures or inspection capability required to execute and verify the result.

| Test case | Scenario | Feasibility |
|---|---|---|
| LOGIN-001 | Render the English sign-in page | Ready for Automation |
| LOGIN-002 | Verify initial input and submit states | Ready for Automation |
| LOGIN-003 | Verify the language dialog and initial selection | Ready for Automation |
| LOGIN-004 | Verify brand and account navigation link targets | Ready for Automation |
| LOGIN-005 | Verify both language dialog close controls | Needs Clarification |
| LOGIN-006 | Verify changing and restoring the sign-in locale | Needs Clarification |
| LOGIN-007 | Sign in using valid credentials and the Log in button | Blocked |
| LOGIN-008 | Submit valid credentials with Enter | Needs Clarification |
| LOGIN-009 | Verify the landing pages for recovery, registration and home | Needs Clarification |
| LOGIN-010 | Submit both fields blank | Ready for Automation |
| LOGIN-011 | Submit with password omitted | Ready for Automation |
| LOGIN-012 | Submit with email omitted | Needs Clarification |
| LOGIN-013 | Submit malformed email addresses | Needs Clarification |
| LOGIN-014 | Check when inline validation clears | Needs Clarification |
| LOGIN-015 | Check email whitespace normalization | Needs Clarification |
| LOGIN-016 | Check password whitespace handling | Needs Clarification |
| LOGIN-017 | Check international characters and accepted identifiers | Needs Clarification |
| LOGIN-018 | Check documented email length boundaries | Needs Clarification |
| LOGIN-019 | Check documented password length boundaries | Needs Clarification |
| LOGIN-020 | Sign in with a known email and one incorrect password | Blocked |
| LOGIN-021 | Sign in with a nonexistent account fixture | Blocked |
| LOGIN-022 | Verify sign-in with a restricted account state | Needs Clarification |
| LOGIN-023 | Verify password masking by default | Ready for Automation |
| LOGIN-024 | Reveal and remask a synthetic password | Ready for Automation |
| LOGIN-025 | Verify the inspected sign-in URL uses HTTPS | Ready for Automation |
| LOGIN-026 | Verify credential handling in visible navigation | Needs Clarification |
| LOGIN-027 | Refresh an authenticated page | Blocked |
| LOGIN-028 | Revisit the sign-in route while signed in | Blocked |
| LOGIN-029 | Sign out and verify protected-route behavior | Blocked |
| LOGIN-030 | Use browser Back after sign-out | Needs Clarification |
| LOGIN-031 | Verify session state across tabs | Needs Clarification |
| LOGIN-032 | Verify idle or absolute session expiry | Needs Clarification |
| LOGIN-033 | Verify accessible association of credential field labels | Needs Clarification |
| LOGIN-034 | Verify full keyboard focus order and visible focus | Manual Testing Required |
| LOGIN-035 | Verify screen-reader announcements of labels and field errors | Manual Testing Required |
| LOGIN-036 | Verify language dialog focus behavior | Manual Testing Required |
| LOGIN-037 | Review sign-in layout on supported device widths | Manual Testing Required |
| LOGIN-038 | Verify sign-in in supported browser engines | Needs Clarification |
| LOGIN-039 | Verify Google sign-in launch and return flow | Blocked |
| LOGIN-040 | Verify sign-in request and response contract | Blocked |
| LOGIN-041 | Verify authenticated session metadata | Blocked |
| LOGIN-042 | Verify the UI state during a slow sign-in response | Needs Clarification |
| LOGIN-043 | Verify recoverable service-error behavior | Needs Clarification |

### Page Object Model readiness

- The login page object can use L01–L09. A language dialog component can use L10–L17, with independent verification of its two close controls. Confirm CSS fallback uniqueness in the project's Playwright runtime. Keep locator matches exact and scope error assertions to an individual field.
- Associate visible labels with the inputs, and link each field to its inline error using accessible markup. Stable test IDs would help for the two dialog close controls, locale options, and per-field errors if accessible role/name or existing IDs cannot provide a unique cross-language locator. The core login controls already have verified English locators.
- Keep credential fixtures in environment variables. Use a clean browser context per case to control autofill, locale, previous errors, and authentication state. Use dedicated negative and provider fixtures. Avoid recording secret values in traces, screenshots, console output, or network evidence.
- Authentication tests need a verified signed-in signal, final URL and logout control. Wait for the verified destination or UI signal from the triggering action. In-flight and service failure cases need controlled environment conditions. Authentication status in a second tab and timeout coverage need documented timing and state transitions.
- The request/response case requires permitted network inspection and an application contract. Session metadata or controlled expiry may need backend access or documented test controls. Responsive layout, visible focus and actual screen-reader announcements need manual review. Cross-browser coverage needs the approved support matrix.

## 5. Questions and missing requirements

1. **Authentication requirements.** Where are the approved rules for accepted identifiers, email and password normalization, sign-in-specific length limits, and applicable account states? Which dedicated fixtures exist for those states?
2. **Failed-login policy.** What user-facing outcomes are required for wrong passwords and nonexistent accounts? Are there approved test fixtures and a failed-attempt budget for QA? Provide any production-facing lockout or rate-limit rules from documentation.
3. **Session requirements.** What are the idle and absolute timeouts? Is multi-tab synchronization required? What are the intended signed-in login-page behavior, logout destination, and expectations for browser history and protected pages?
4. **Browser and accessibility support.** What browser versions, viewport/device sizes, and assistive technology combinations are in scope? Is there an approved reference for focus behavior and field error announcements?
5. **Integration and provider access.** Is an approved QA network capture or a redacted authentication contract available? Is a Google test identity approved for this environment? Are there supported fixtures for slow and failed responses?
6. **Locale rules.** What are the expected URL and persistence rules for a login-page language selection? Which translated labels and fallback behavior should be asserted?

Routine checks to complete when Chrome access returns include clean email-only and malformed-email validation, actual link landing pages, keyboard behavior, both dialog close results, the successful redirect, signed-in refresh, and logout. Google identity consent and any outbound password-reset submission require separate scope if needed. A password reset and account changes were outside this review.

## 6. Coverage summary

| Category | Total | Ready for Automation | Manual Testing Required | Needs Clarification | Blocked |
|---|---:|---:|---:|---:|---:|
| UI | 6 | 4 | 0 | 2 | 0 |
| Positive | 3 | 0 | 0 | 2 | 1 |
| Validation | 8 | 2 | 0 | 6 | 0 |
| Boundary | 2 | 0 | 0 | 2 | 0 |
| Negative | 3 | 0 | 0 | 1 | 2 |
| Security | 4 | 3 | 0 | 1 | 0 |
| Session | 6 | 0 | 0 | 3 | 3 |
| Accessibility | 4 | 0 | 3 | 1 | 0 |
| Responsive | 1 | 0 | 1 | 0 | 0 |
| Cross-Browser | 1 | 0 | 0 | 1 | 0 |
| Integration | 5 | 0 | 0 | 2 | 3 |
| **Total** | **43** | **9** | **4** | **21** | **9** |

All detailed cases are initialized to **Not Executed**. The exploratory checks establish the observations cited above. No formal pass/fail results or automation scripts were produced.

