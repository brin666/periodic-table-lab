# Anonymous website feedback receiver

This small Node.js service accepts a report from the website and publishes it as an issue in one fixed, dedicated public GitHub repository. It does not create repositories, accept a repository name from the browser, or use a visitor's GitHub account. The GitHub token stays in the server process.

The receiver accepts a screenshot plus one of three report types: a bug, a content correction, or a suggestion. Every report requires `consent: true`, which represents the visitor's explicit consent to public publication. The server strips page URL query strings and keeps only the allowlisted SPA hash routes before storing or publishing diagnostics. A submitted description and screenshot are public in the selected feedback repository.

## Configure

Create the dedicated public feedback repository separately, then issue a fine-grained GitHub token restricted to that repository. Give it **Contents: Read and write** and **Issues: Read and write**; repository metadata read is needed to check that the target is public. Do not grant this token access to the website source repository. Configure it in a server-only environment file with owner, repository, token, and the exact browser origin or origins in `FEEDBACK_ALLOWED_ORIGINS`.

Copy `feedback.env.example` to a server-only file, fill in the values, and restrict access to the service account (for example, mode `0600`). Do not place the token in frontend code, Vite variables, logs, or this project repository.

Set `FEEDBACK_DATA_DIR` to a writable directory outside the web server document root. The default is the service user's `~/.periodic-table-lab-feedback`. It holds durable report journals, pending screenshot data needed for retries, and rate-limit state. Treat this directory as private user-submitted data and include it in protected backups only if those are appropriate. The receiver acquires an exclusive lock in this directory, reclaims a lock left by a dead process, and refuses a second live process; run one service process per data directory.

Run with Node.js 20 or later:

```sh
node server/feedback-server.mjs
```

By default it binds to `127.0.0.1:4186`. Keep it on loopback and configure the web server to proxy `/api/feedback` and `/api/feedback/health` to that address. `FEEDBACK_HOST` and `FEEDBACK_PORT` can override the bind address and port when the deployment requires it.

## Contract and safeguards

- `POST /api/feedback` accepts JSON with a UUID `id`; `type` set to `bug`, `content`, or `suggestion`; a 10–3000 character `description`; page URL, title, learning mode, viewport, user agent, and version; `consent: true`; and the empty `website` honeypot. An optional screenshot must be a structurally valid PNG or JPEG no larger than 2 MiB decoded.
- `GET /api/feedback/health` reports safe readiness fields. `configured` and `ready` are false until required configuration is present and the GitHub API confirms the target repository is public.
- Browser requests must have an exact origin listed in `FEEDBACK_ALLOWED_ORIGINS`. By default the receiver uses the direct socket peer for its cooldown key and ignores forwarded IP headers. If a reverse proxy overwrites `X-Forwarded-For` with exactly one client IP, set `FEEDBACK_TRUSTED_PROXY_ADDRESSES` to the proxy's direct socket address (comma-separated for multiple known proxies). Only then will a single valid `X-Forwarded-For` address be used; comma-separated chains are ignored.
- Page diagnostics remove query strings and retain only `/`, `/element/{id}`, `/element/{id}/atom`, and `/element/{id}/substance/{id}` hash routes. Other fragments are discarded.
- New submissions are limited to one per peer per minute and 100 accepted reports per UTC day. Rate state stores a one-way hash of the peer address, not the address itself.
- Reports are journaled before external writes. A stable screenshot path plus Git blob checksum recovers uncertain upload results. Before writing, repository visibility is checked and a successful public result is cached for at most 60 seconds; failed checks are retried after 10 seconds.
- A stable hidden issue marker searches for an issue after an uncertain create timeout. Search and recent-issue results can be delayed or incomplete, so a missing match leaves that report pending and the service never sends a second issue-create request for it. The visitor receives the feedback UUID and an explanation that retries only check the result. Definitive GitHub 4xx rejections (including 429) reset the journal to a retryable state; network errors and 5xx responses remain pending because GitHub may have accepted the issue.
- API calls have a timeout. Failures return generic Chinese messages; GitHub response bodies, token values, and exception text are not returned to the browser or printed by the service.

## Resolving an issue-create request that stayed pending

If the service was stopped while a report was pending and repeated reconciliation still cannot find the marker, a maintainer can reopen it only after independently confirming that GitHub did not create the issue. Search and recent-issue API responses alone are not authoritative because they can lag.

1. Stop the feedback service and keep it stopped during recovery. The administration command also acquires `.feedback-server.lock` and refuses to run if a lock exists. If the service crashed and left a stale lock, verify the PID in that lock is no longer running and the service manager is stopped before removing that one lock file; the recovery utility does not remove locks automatically.
2. List the unresolved UUIDs with `node server/feedback-admin.mjs list-pending`. This command prints UUIDs only; it does not print report descriptions or diagnostics.
3. In the dedicated feedback repository, inspect the complete issue history for the exact marker `feedback-id:<UUID>`. Use GitHub's issue list with `state=all` and paginate through all results, or inspect it in the GitHub UI. If any matching issue exists, leave the journal pending; the next client retry will reconcile it.
4. Only when a complete inspection confirms that no matching issue exists, run `node server/feedback-admin.mjs retry-confirmed-absent <UUID> --confirmed-absent`. The explicit flag records the maintainer's confirmation. The utility changes only `state` and `issueCreateStartedAt`, preserving the existing feedback UUID, fingerprint, and screenshot upload.
5. Restart the service. The visitor can retry the same report using the same UUID and payload. If the issue history could not be checked completely, leave the record pending and do not run the recovery command.

For example, after setting the repository owner/repository values for the operator's shell, `gh api --paginate "repos/$OWNER/$REPO/issues?state=all&per_page=100" --jq '.[] | select((.body // "") | contains("feedback-id:<UUID>")) | .html_url'` lists matching issue URLs. Verify pagination completed successfully and substitute the literal UUID in place of `<UUID>` before deciding that the marker is absent. Do not put the server token into a command line or terminal transcript.

## Tests

Run the fake-upstream tests without GitHub credentials or authenticated writes:

```sh
node --test server/feedback-server.test.mjs
```

The tests cover configuration and origin checks, consent and request limits, image validation, creation and idempotency, upload retry, issue recovery after an ambiguous timeout, definitive rejection retries, safe operator recovery, rate limiting, and credential redaction.
