# LegalOS Phase 2 QA Checklist

## 1. Authentication & Security
- [ ] Attempt to register a new user with a weak password (e.g., `123`). Ensure validation fails.
- [ ] Register a new user with a strong password (e.g., `LegalOS@2025!`). Ensure success.
- [ ] Attempt to login with an incorrect password 5 times in a row.
- [ ] On the 6th attempt, ensure the account is locked (Error 423) and the error message displays the remaining lockout time.
- [ ] Verify that changing a password revokes all other active sessions (force logout from other devices).
- [ ] Verify that suspending a user from the Admin panel instantly invalidates their session.

## 2. Document Storage & Uploads
- [ ] Upload a document to a case.
- [ ] Ensure the file URL is not directly exposed in the API response payload (check network tab).
- [ ] Download the document. It should generate a time-limited download token.
- [ ] Wait for the token to expire (or manipulate it) and attempt to access it. Ensure a 403 error is returned.

## 3. Team Management & Isolation
- [ ] Login as a firm member and navigate to the Team tab. Ensure only members of the same firm are visible.
- [ ] Verify that cross-firm users cannot be accessed via direct URL manipulation (e.g., `/team/[other-firm-user-id]`).

## 4. Reports & Workload
- [ ] Generate the advocate workload report. Verify that the stats only reflect the current firm's workload.
- [ ] Generate the transfers and appeals reports. Verify the same firm scoping applies.

## 5. Billing & Invoicing
- [ ] Create an invoice.
- [ ] Attempt to access another firm's invoice ID directly via URL. Ensure 403 or 404 is returned.
- [ ] Navigate to Billing Summary. Ensure the totals strictly reflect only the current firm's invoices and advance payments.

## 6. System Audit Logs
- [ ] As a firm admin, navigate to the system audit logs (if UI implemented) or query the DB.
- [ ] Verify that creating a client, uploading a document, and logging in/out all generated audit log entries under the firm's ID.

## 7. Performance (Staging)
- [ ] Run the `tests/load_test.py` script against the staging server.
- [ ] Verify that dashboard and search endpoints return in < 500ms under load.

## 8. Internationalization (Language)
- [ ] Switch the UI language to Marathi.
- [ ] Ensure the dashboard translations are loaded correctly.
- [ ] Switch the UI language to Gujarati.
- [ ] Ensure PDF templates are able to render non-Latin fonts correctly.
