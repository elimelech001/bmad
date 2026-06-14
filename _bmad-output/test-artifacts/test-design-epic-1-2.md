---
workflowStatus: 'completed'
totalSteps: 5
stepsCompleted: ['step-01-detect-mode', 'step-02-load-context', 'step-03-risk-and-testability', 'step-04-coverage-plan', 'step-05-generate-output']
lastStep: 'step-05-generate-output'
nextStep: ''
lastSaved: '2026-06-14'
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-2026-06-14/prd.md
  - _bmad-output/planning-artifacts/epics.md
---

# Test Design: Epics 1 & 2 — Simple Node.js API Backend

**Date:** 2026-06-14
**Author:** ElimelechAharon
**Status:** Draft

---

## Executive Summary

**Scope:** Epic-level test design for Epics 1 (Project Setup & Infrastructure) and 2 (API Endpoints). Both epics are treated together because they are co-dependent: Epic 2 endpoints cannot be tested until Epic 1's server bootstrap is in place.

**Risk Summary:**

- Total risks identified: 8
- High-priority risks (≥6): 1 (R-01, OPS — `npm start` script misconfiguration)
- Critical categories: OPS, BUS, TECH

**Coverage Summary:**

- P0 scenarios: 6 (~3–5 hours)
- P1 scenarios: 5 (~2–4 hours)
- P2 scenarios: 3 (~1–2 hours)
- P3 scenarios: 0
- **Total effort**: ~6–11 hours (~1–2 developer days)

---

## Not in Scope

| Item | Reasoning | Mitigation |
|------|-----------|------------|
| HTTPS / TLS | Explicit PRD exclusion (§4.3 Out of Scope) | Not required for v1; revisit if exposed publicly |
| Performance / load tests | No SLA defined in PRD; PRD explicitly defers | Accept risk; note as waived NFR |
| Auth / authorization | PRD NFR4: explicitly out of scope | No auth tests; negative test verifies no 401 on valid routes |
| Error handling beyond Express defaults | PRD NFR4 | TC 2.2-API-006 verifies 404 default works; no custom handler tested |
| Automated test suite scaffold | PRD §6.2 defers to v2 follow-on story | This plan creates the design; implementation via `/bmad-dev-story` |
| `GET /test` `timestamp` timezone correctness | Assumption §4.2 pins to `new Date().toISOString()` | Covered by ISO 8601 format assertion (TC 2.2-API-003) |

---

## Risk Assessment

> **Note:** P0/P1/P2/P3 labels in this document denote **test priority**, not execution timing. See Execution Strategy for timing.

### High-Priority Risks (Score ≥6)

| Risk ID | Category | Description | Probability | Impact | Score | Action | Mitigation |
|---------|----------|-------------|:-----------:|:------:|:-----:|--------|------------|
| R-01 | OPS | `npm start` script missing or misconfigured in `package.json` — server cannot be launched via the mandated command | 2 | 3 | **6** | MITIGATE | Story 1.1 AC explicitly requires `scripts.start`; TC 1.1-UNIT-001 asserts it statically before any API test runs |

### Medium-Priority Risks (Score 3–5)

| Risk ID | Category | Description | Probability | Impact | Score | Mitigation |
|---------|----------|-------------|:-----------:|:------:|:-----:|------------|
| R-02 | BUS | `GET /` returns wrong `Content-Type` (e.g., `application/json` instead of `text/plain`) | 2 | 2 | 4 | TC 2.1-API-002 asserts header |
| R-03 | BUS | `GET /test` JSON body missing or has misspelled field (`status`, `message`, `timestamp`) | 2 | 2 | 4 | TC 2.2-API-002 asserts all three fields by name |
| R-04 | BUS | `GET /test` `timestamp` is not ISO 8601 | 2 | 2 | 4 | TC 2.2-API-003 validates format |
| R-05 | TECH | `express` placed in `devDependencies` instead of `dependencies` — production install breaks NFR1 | 2 | 2 | 4 | TC 1.1-UNIT-002 reads `package.json` statically |

### Low-Priority Risks (Score 1–3)

| Risk ID | Category | Description | Probability | Impact | Score | Action |
|---------|----------|-------------|:-----------:|:------:|:-----:|--------|
| R-06 | OPS | `PORT` env var not respected; server hardcodes 3000 | 2 | 1 | 2 | DOCUMENT — TC 1.2-API-002 |
| R-07 | TECH | Server crashes immediately on startup | 1 | 3 | 3 | DOCUMENT — TC 1.2-API-001 is the smoke test |
| R-08 | OPS | No startup log message printed to stdout | 2 | 1 | 2 | DOCUMENT — TC 1.2-API-003 |

### Risk Category Legend

- **TECH** — Technical/architecture (integration, fragility)
- **BUS** — Business impact (response contract, UX)
- **OPS** — Operations (config, startup, deployment)

---

## NFR Planning

**Purpose:** Identify planned validation for each NFR. Final PASS/CONCERNS/FAIL deferred to `nfr-assess` once implementation evidence exists.

| NFR | Requirement / Threshold | Risk Link | Planned Validation | Evidence Needed |
|-----|------------------------|-----------|--------------------|-----------------|
| NFR1 — Express-only deps | `express` is the sole entry in `dependencies`; no extra runtime deps | R-05 | TC 1.1-UNIT-002: static `package.json` parse | `package.json` snapshot |
| NFR2 — `npm install` succeeds | Exit code 0, no error output | — | TC 1.1-API-001: CI step runs `npm ci` | CI build log |
| NFR3 — No crash-on-start | Process alive ≥3s after launch; `GET /` returns 200 | R-07 | TC 1.2-API-001: smoke integration test | Test run result |
| NFR4 — No auth/DB/error handling | No 401/403 on valid requests; no DB connection strings in code | — | TC 2.2-API-006: unknown route → 404; code review | Test result + manual audit |
| Perf — Response latency | **UNKNOWN / WAIVED** — no SLA defined in PRD (§5 explicit non-goal) | — | N/A | Revisit in v2 if SLA is added |

---

## Entry Criteria

- [ ] Story 1.1 and 1.2 are implemented and deployed to test environment (local or CI)
- [ ] `npm install` has been run in the repo
- [ ] Node.js (≥18 LTS) is available in the test environment
- [ ] Port 3000 is free (or `PORT` env var is set)

## Exit Criteria

- [ ] All P0 tests (TC 1.1-UNIT-001, 1.1-API-001, 1.2-API-001, 2.1-API-001, 2.2-API-001, 2.2-API-002) pass 100%
- [ ] All P1 tests pass 100%
- [ ] R-01 mitigation verified (TC 1.1-UNIT-001 green)
- [ ] No open bugs against FR1, FR2, FR3 acceptance criteria
- [ ] NFR evidence artifacts available for each in-scope NFR

---

## Test Coverage Plan

> P0/P1/P2 = **priority and risk level**, not execution timing. All tests run on every PR for this project (see Execution Strategy).

### P0 — Critical

**Criteria:** Blocks core functionality + risk score ≥6, or FR acceptance criteria with no workaround

| Test ID | Requirement | Scenario | Level | Risk Link | Notes |
|---------|-------------|----------|-------|-----------|-------|
| 1.1-UNIT-001 | Story 1.1 / R-01 | `package.json` defines `scripts.start` | Unit (static) | R-01 | Run before any API test; gate on this |
| 1.1-API-001 | NFR2 | `npm install` (or `npm ci`) exits with code 0 | Integration (CI) | NFR2 | Prerequisite step |
| 1.2-API-001 | NFR3 / Story 1.2 | `npm start` starts server; `GET /` returns 200 within 2s | API | R-07 | Smoke gate — all other API tests depend on this |
| 2.1-API-001 | FR1 / Story 2.1 | `GET /` → status 200, body is exactly `Hello World` | API | — | Core FR1 |
| 2.2-API-001 | FR2 / Story 2.2 | `GET /test` → status 200, body is valid JSON | API | — | Core FR2 |
| 2.2-API-002 | FR2 / R-03 | `GET /test` body contains `status:"ok"`, `message:"Test payload"`, `timestamp` (string, non-empty) | API | R-03 | All three fields asserted in one test |

**Total P0:** 6 tests

### P1 — High

**Criteria:** Important feature detail + medium-risk (score 3–5) + contract precision

| Test ID | Requirement | Scenario | Level | Risk Link | Notes |
|---------|-------------|----------|-------|-----------|-------|
| 1.1-UNIT-002 | NFR1 / R-05 | `express` is in `dependencies`, not `devDependencies` | Unit (static) | R-05 | Parse `package.json`; assert key placement |
| 1.2-API-002 | Story 1.2 / R-06 | Server started with `PORT=4000`; `GET localhost:4000/` returns 200 | API | R-06 | Restart server with env var |
| 2.1-API-002 | FR1 / R-02 | `GET /` `Content-Type` header contains `text/plain` | API | R-02 | Single header assertion |
| 2.2-API-003 | FR2 / R-04 | `GET /test` `timestamp` is a valid ISO 8601 string | API | R-04 | `new Date(body.timestamp).toISOString()` round-trips |
| 2.2-API-004 | FR2 | `GET /test` `Content-Type` header contains `application/json` | API | — | Single header assertion |

**Total P1:** 5 tests

### P2 — Medium

**Criteria:** Secondary verification + low-risk (score 1–2) + edge behavior

| Test ID | Requirement | Scenario | Level | Risk Link | Notes |
|---------|-------------|----------|-------|-----------|-------|
| 1.2-API-003 | Story 1.2 / R-08 | `npm start` stdout includes port number | Integration | R-08 | Capture child-process stdout |
| 2.2-API-005 | Assumption §4.2 | `GET /test` `timestamp` is within ±5s of request time | API | — | Bounded freshness check |
| 2.2-API-006 | NFR4 | `GET /unknown-route` returns 404 (Express default) | API | — | Negative test; confirms no custom handler |

**Total P2:** 3 tests

---

## Execution Strategy

**All tests run on every PR.** The entire suite (14 tests) completes in under 2 minutes — no expensive infrastructure, no browser, no external dependencies. There is no benefit to a nightly/weekly split at this scope.

**Execution order within the PR job:**

1. Static unit tests (1.1-UNIT-001, 1.1-UNIT-002) — run first as fast prerequisite gates
2. `npm ci` step (1.1-API-001)
3. Start server (`npm start`), wait for ready signal
4. P0 API tests (1.2-API-001 → 2.2-API-002)
5. P1 API tests
6. P2 API tests
7. Stop server

**Test framework:** [Jest](https://jestjs.io/) or [Vitest](https://vitest.dev/) + [Supertest](https://github.com/ladjs/supertest). Static package.json checks are plain Node.js `assert`. No browser or Playwright needed (pure backend, no UI).

**If future epics add routes with complex logic**, consider splitting long-running suites to nightly at that point. Not applicable now.

---

## Resource Estimates

| Priority | Tests | Effort |
|----------|-------|--------|
| P0 | 6 | ~3–5 hours |
| P1 | 5 | ~2–4 hours |
| P2 | 3 | ~1–2 hours |
| **Total** | **14** | **~6–11 hours (~1–2 developer days)** |

Includes: test file scaffolding, CI step wiring, first-run debugging, and peer review. Low end assumes a developer already familiar with Supertest; high end accounts for CI pipeline setup from scratch.

**Prerequisites:**

- Tooling: Jest/Vitest + Supertest (or equivalent)
- No test data factories needed (stateless GET endpoints, no seed data)
- No fixture infrastructure needed (start/stop server in `beforeAll`/`afterAll`)

---

## Quality Gate Criteria

| Gate | Threshold |
|------|-----------|
| P0 pass rate | **100%** — any failure blocks merge |
| P1 pass rate | **100%** — deterministic API; no tolerance |
| P2 pass rate | ≥80% — failures are informational, not blockers |
| FR coverage | 100% of FR1, FR2, FR3 acceptance criteria traced to test IDs |
| R-01 mitigation | TC 1.1-UNIT-001 must be green before any API test executes |
| NFR evidence | All in-scope NFRs have a named test or CI step producing evidence |

---

## Mitigation Plans

### R-01: `npm start` misconfiguration (Score: 6)

**Mitigation Strategy:**

1. Story 1.1 acceptance criteria already mandates `scripts.start` — treat as implementation requirement, not just test concern
2. TC 1.1-UNIT-001 reads `package.json` and asserts `scripts.start` is defined and non-empty
3. This test runs first in the suite; if it fails, the rest of the API tests are skipped (no false failures)

**Owner:** Developer implementing Story 1.1
**Timeline:** Before Story 1.1 is marked done
**Status:** Planned
**Verification:** TC 1.1-UNIT-001 green in CI

---

## Assumptions and Dependencies

### Assumptions

1. `new Date().toISOString()` is the implementation of `timestamp` (per Assumption §4.2 in PRD) — this makes ISO 8601 format a safe assertion target
2. Express is the HTTP framework (per Assumption §4.3) — if a raw `http` module is used instead, TC 2.1-API-002 (`Content-Type: text/plain`) behavior may differ slightly (Express sets charset automatically)
3. The test runner starts the server programmatically in `beforeAll` — if the server is started separately (e.g., by CI), TC 1.2-API-003 (stdout capture) needs to be adapted

### Dependencies

1. Node.js ≥18 LTS in CI environment — required before tests run
2. Port 3000 (or `PORT` env var) available during test runs — CI must guarantee this

### Risks to Plan

- **Risk:** Developer uses a non-Express framework (raw `http`, Fastify, etc.)
  - **Impact:** TC 2.1-API-002 `Content-Type` assertion may need header value adjustment
  - **Contingency:** Review AC for Story 2.1 before writing the assertion; parameterize the expected value

---

## Interworking & Regression

| Component | Impact | Regression Scope |
|-----------|--------|-----------------|
| `GET /` | Isolated — no dependencies | Re-run 2.1-API-001 and 2.1-API-002 on any route change |
| `GET /test` | Isolated — no DB, no external calls | Re-run 2.2-API-001 through 2.2-API-005 on any route change |
| Server bootstrap | All tests depend on it | Re-run full suite on any change to entry point or `package.json` |

No cross-service coordination needed. This is a self-contained server with no upstream or downstream dependencies.

---

## Follow-on Workflows

- Run `/bmad-testarch-atdd` to generate failing P0 tests as the first implementation step
- Run `/bmad-testarch-automate` once implementation exists to fill out the full suite
- Run `/bmad-testarch-ci` to wire test stages into the CI pipeline

---

## Appendix

### Knowledge Base References

- `risk-governance.md` — Risk classification and gate decision framework
- `probability-impact.md` — Probability × Impact scoring methodology
- `test-levels-framework.md` — Unit / Integration / E2E selection rules
- `test-priorities-matrix.md` — P0–P3 prioritization criteria

### Related Documents

- PRD: `_bmad-output/planning-artifacts/prds/prd-bmad-2026-06-14/prd.md`
- Epics: `_bmad-output/planning-artifacts/epics.md`
- Architecture: N/A (not provided for this project)

---

**Generated by:** BMad TEA Agent — Test Architect Module
**Workflow:** `bmad-testarch-test-design`
**Version:** 4.0 (BMad v6)
