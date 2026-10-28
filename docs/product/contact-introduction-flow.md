# Contact introduction flow

Owner direction, 2026-10-28: consumers do not browse preferred movers, select individual
companies, or see company names while requesting quotes. Each moving company introduces
itself when it contacts the consumer. This replaces the earlier named-before-send UX.

- The central survey checks availability before collecting contact details.
- The consumer actively chooses the maximum number of companies and allowed contact channels.
- The review step displays the move, contact preferences, channel-scoped contact permission,
  and a separate Terms/privacy control. Neither checkbox is preselected.
- Matching responses, stale-match responses, confirmations, management pages, and request and
  purchase emails do not expose company identities, registration numbers, or profile URLs.
- The server still re-matches, validates the selected count, records eligible recipient IDs,
  and enforces purchase limits, channel restrictions, deduplication and withdrawal.
- Existing consent records and historical text versions stay unchanged. Migration 200 adds
  `contact-introduction-v1-draft` and `recipient_disclosure_mode`. The old
  `named_company_ids`/`named_in_consent` column names remain compatibility fields; new records
  explicitly record that these are internal eligibility IDs, not names displayed to consumers.
- The UI renderer and server hash the same new template. Submission fails safely if the active
  consent version has not yet been switched to the new workflow by the migration.

This is a demo workflow draft. It does not represent legal approval or enable live payments,
outbound messages, production migrations, or a production rollout.
