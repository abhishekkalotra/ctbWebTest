# CartoBike Login — QA Requirement Clarifications

**Application:** CartoBike development website  
**Login URL:** https://cartobikedev.shop/en/login  
**Purpose:** Confirmed answers to QA questions for login-page manual and automated testing.  
**Source:** Product/QA stakeholder responses supplied on 19 November 2026.

## Instructions for the AI QA Tester

- Use the answers below as the approved expected behavior for the associated test cases.
- Observe actual behavior before reporting a bug. Do not assume unconfirmed behavior.
- Preserve the selected locale in locale-dependent routes; the URLs shown below are English examples.
- Treat **Skip** as out of scope for this testing pass, not as a passing test.
- Where an answer is ambiguous or insufficient to create a precise assertion, request clarification rather than inventing a rule.
- Do not expose credentials or authentication tokens in URLs, logs, screenshots, videos, or reports.

## Questions and Confirmed Answers

### 1. Application access — All test cases
**Question:** Is `https://cartobikedev.shop/en/login` the correct working login URL? Previous attempts encountered network denial or timeouts. Is there a replacement URL?

**Answer:** Yes, this is the correct URL. No replacement URL was provided.

### 2. Dialog closing — LOGIN-005
**Question:** Must both Close controls dismiss the language dialog without changing the selected language?

**Answer:** Yes.

### 3. Language changes — LOGIN-006
**Question:** Which languages are supported, and should the selected language persist after refreshing the page or while the browser remains open?

**Answer:** Supported languages are **EN, FR, NL, DE, and ES**. The selected language should remain after page refresh and while the browser remains open.

**Not specified:** Exact translated strings, behavior after a completely new browser session, and any mandatory automatic restoration to English.

### 4. Enter submission — LOGIN-008
**Question:** Should pressing Enter in the Password field submit the login form the same way as clicking Log in?

**Answer:** Yes.

### 5. Navigation destinations — LOGIN-009
**Question:** Where should Forgot Password, Register, and Home navigate?

**Answer:**
- **Forgot Password:** https://cartobikedev.shop/en/forgot
- **Register:** https://cartobikedev.shop/en/registration
- **Home:** https://cartobikedev.shop/

All destinations depend on the selected language. The listed paths are the provided English/default examples; verify locale-specific behavior rather than assuming exact translated paths.

### 6. Required email validation — LOGIN-012
**Question:** What validation message should appear when the email field is blank?

**Answer:** `This field is required`

**Not specified:** Exact placement and focus behavior.

### 7. Invalid email validation — LOGIN-013
**Question:** What message should appear for an invalid email address?

**Answer:** `The e-mail address must be a valid email address.`

**Not specified:** Whether browser-native validation is acceptable instead of this exact message.

### 8. Validation clearing — LOGIN-014
**Question:** Should validation errors disappear while typing, on blur, or on resubmission?

**Answer:** `No.`

**Clarification needed:** This answer does not identify when errors *should* clear. Do not assert a specific clearing trigger or accessibility-state behavior without clarification.

### 9. Email normalization — LOGIN-015
**Question:** Should leading and trailing spaces in an email address be removed automatically?

**Answer:** Yes.

**Not specified:** Treatment of internal spaces.

### 10. Password whitespace — LOGIN-016
**Question:** Are spaces in passwords significant, and should they be preserved without normalization?

**Answer:** Yes. Preserve password spaces as entered.

### 11. Accepted identifiers — LOGIN-017
**Question:** Can users log in with usernames or only email addresses? Is email matching case-sensitive?

**Answer:** Login is **email-only**, and email matching is **case-insensitive**.

**Not specified:** Internationalized email address support or alias-specific rules.

### 12. Length boundaries — LOGIN-018–019
**Question:** What are the minimum and maximum email/password lengths?

**Answer:** There are **no specified minimum or maximum length limits**.

**Testing note:** Do not invent arbitrary application-specific thresholds. Basic required-field and valid-email-format rules still apply.

### 13. Failed-login behavior — LOGIN-020–021
**Question:** What error should appear for an incorrect password or an unregistered email address?

**Answer:** `Invalid email or password.`

**Not specified:** Exact placement and field-retention behavior.

### 14. Restricted accounts — LOGIN-022
**Question:** What should happen for blocked and unverified accounts?

**Answer:**
- **Blocked account:** `You have been permanently banned for accessing your account. Please contact support.`
- **Unverified account:** `Your email is not verified. Click here To resend.`

**Testing note:** Verify the corresponding message for each account state. The expected destination/action of the resend link was not specified.

### 15. Credential exposure — LOGIN-026
**Question:** Are passwords allowed to appear in URLs, browser history, or visible UI text?

**Answer:** No. Passwords must **never** appear in URLs, browser history, or visible text.

### 16. Refresh persistence — LOGIN-027
**Question:** Should authentication survive a page refresh?

**Answer:** Yes.

### 17. Authenticated login route — LOGIN-028
**Question:** If an already authenticated user opens the login route, should they remain on it or be redirected?

**Answer:** Redirect the user to the **home page**.

### 18. Logout and protected routes — LOGIN-029
**Question:** Where should users be redirected after logout?

**Answer:** Redirect the user to the **login page**.

**Related access rule:** Protected pages must require login (see Question 19).

### 19. Browser Back after logout — LOGIN-030
**Question:** What should happen if the user presses Back after logging out?

**Answer:** Public pages may still be viewed. Any page requiring an authenticated account must redirect the user to the **login page**.

### 20. Multiple tabs — LOGIN-031
**Question:** If a user logs out in one tab, should other tabs also lose authentication?

**Answer:** Yes. Confirm by **refreshing the other tabs**. Protected pages must no longer be accessible after refresh.

### 21. Session expiry — LOGIN-032
**Question:** How long should a login session last?

**Answer:** Sessions are very long, **usually around one year**.

**Clarification needed for precise expiry testing:** Exact lifetime, idle vs. absolute expiration, renewal rules, and a controlled-expiry test method were not provided. Do not assert an exact one-year cutoff.

### 22. Accessible labels — LOGIN-033
**Question:** What should the accessible names of the email and password inputs be?

**Answer:**
- Email input: `E-mail`
- Password input: `Password`

**Not specified:** Accessibility conformance standard.

### 23. Keyboard accessibility — LOGIN-034, LOGIN-036
**Question:** What are the expected Tab order, focus appearance, dialog focus behavior, Escape-key behavior, and return-focus target?

**Answer:** `No.`

**Clarification needed:** This is not a usable keyboard-accessibility specification. Do not interpret it as a requirement to disable keyboard accessibility. Test observable behavior and ask for clarification before judging unspecified expectations.

### 24. Screen-reader coverage — LOGIN-035
**Question:** Which screen readers and browsers should be tested, and what announcements are expected?

**Answer:** **Skip** this test case for now.

### 25. Responsive coverage — LOGIN-037
**Question:** Which viewport or device should be used for responsive testing?

**Answer:** **iPhone 16 Pro Max**.

**Not specified:** Exact viewport dimensions and detailed layout acceptance criteria. Use the device preset available in the testing environment and record its actual viewport.

### 26. Browser coverage — LOGIN-038
**Question:** Which browsers are required?

**Answer:** **Chrome and Firefox**.

**Not specified:** Exact browser versions.

### 27. Google sign-in — LOGIN-039
**Question:** Which Google account is approved for QA, and where should the user land after signing in?

**Answer:**
- **Google QA account:** `abhishekkalotra.luminoguru@gmail.com`
- **Expected destination:** **Choose Your Profile Type** screen.

**Testing note:** No Google account password was provided here. Do not bypass provider authentication, invent credentials, or grant new consent beyond authorization.

### 28. Authentication API — LOGIN-040
**Question:** What is the approved authentication API contract (endpoint, method, fields, responses, and redirects)?

**Answer:** **Skip** this test case for now.

### 29. Session metadata — LOGIN-041
**Question:** What are the expected cookie/storage attributes, session mechanism, token lifetime, and logout invalidation rules?

**Answer:** **Skip** this test case for now.

### 30. Slow/error responses — LOGIN-042–043
**Question:** What should happen for slow, timed-out, or failed login API responses, and may test tooling simulate these conditions?

**Answer:** **Skip** these test cases for now.

---

## Scope and Handling Summary

**Approved browsers:** Chrome, Firefox  
**Approved responsive device:** iPhone 16 Pro Max  
**Supported locales:** EN, FR, NL, DE, ES  
**Approved Google QA identity:** `abhishekkalotra.luminoguru@gmail.com`  
**Explicitly skipped:** LOGIN-035, LOGIN-040, LOGIN-041, LOGIN-042, LOGIN-043.

### Remaining questions that should not be assumed

1. **LOGIN-014:** What exact event should clear validation errors?
2. **LOGIN-034/036:** What keyboard and dialog-focus behavior is required? The answer `No` is ambiguous.
3. **LOGIN-032:** What is the exact session expiration policy and how can it be tested safely?
4. **LOGIN-006:** Are language preferences expected to survive closing and reopening the browser, and what exact translations should be asserted?
5. **LOGIN-037:** What responsive acceptance criteria apply beyond the selected device?

These outstanding details should be treated as clarification items, not confirmed defects. Any test that cannot be executed because of access, unavailable test accounts, or missing specifications should be recorded as **Blocked** or **Not Tested**, with the reason.
