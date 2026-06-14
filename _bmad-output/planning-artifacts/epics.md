---
stepsCompleted: [step-01-validate-prerequisites, step-02-design-epics, step-03-create-stories, step-04-final-validation]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad-2026-06-14/prd.md
---

# Simple Node.js API Backend - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for the Simple Node.js API Backend, decomposing the requirements from the PRD into implementable stories.

## Requirements Inventory

### Functional Requirements

FR1: Developer (or any HTTP client) can send `GET /` and receive the plain-text string `Hello World` with HTTP 200. Response `Content-Type` must be `text/plain` or equivalent.

FR2: Developer (or any HTTP client) can send `GET /test` and receive a JSON object with HTTP 200. Response body must contain `status: "ok"`, `message: "Test payload"`, and `timestamp` (ISO 8601 string, server-generated at request time). Response `Content-Type` must be `application/json`.

FR3: The server can be started with a single command (`npm start`) and begins accepting HTTP connections on port 3000 (or the value of the `PORT` environment variable). A startup message including the active port must be printed to stdout.

### NonFunctional Requirements

NFR1: Implementation must use Node.js with Express (or equivalent minimal HTTP framework) as the only runtime dependency.

NFR2: All dependencies must be installable via a single `npm install` command with no errors.

NFR3: The server process must remain alive after startup (no crash-on-start). `console.log` is acceptable for all logging (no logging library required).

NFR4: No authentication, authorization, database connectivity, or persistent storage is required. Error handling beyond Express defaults is out of scope.

### Additional Requirements

- No architecture document was provided; no additional architecture-driven requirements apply.
- The PRD explicitly excludes: HTTPS/TLS, hot reload, process managers (PM2, forever), `.env` file support, automated test suite, Docker/deployment config, and any routes beyond `GET /` and `GET /test`.

### UX Design Requirements

N/A — this is a backend-only API project with no UI.

### FR Coverage Map

| FR | Epic | Story |
|---|---|---|
| FR3 | Epic 1 — Running Server | Story 1.1, Story 1.2 |
| FR1 | Epic 2 — Working API Endpoints | Story 2.1 |
| FR2 | Epic 2 — Working API Endpoints | Story 2.2 |

## Epic List

### Epic 1: Running Server
A developer can install dependencies and start the server with a single command, seeing a startup message confirming the active port.
**FRs covered:** FR3
**Definition of done:** `npm install` and `npm start` both succeed without errors; server process stays alive and logs the port.
**Implementation note:** FR3's full verification (routes responding correctly) requires Epic 2 to be complete.

### Epic 2: Working API Endpoints
A developer (or any HTTP client) can hit both routes and receive the correct response shapes.
**FRs covered:** FR1, FR2
**Definition of done:** `GET /` returns `Hello World` (plain text, 200) and `GET /test` returns the JSON payload (200) while the server from Epic 1 is running.

---

## Epic 1: Running Server

A developer can clone the repo, run `npm install`, and then `npm start` to get a live HTTP server that logs its port and stays running — no routes required yet.

### Story 1.1: Initialize Node.js Project

As a developer,
I want a `package.json` with the correct metadata, start script, and Express dependency declared,
So that I can install all dependencies with a single `npm install` and the project is ready to run.

**Acceptance Criteria:**

**Given** I am in the project root directory
**When** I inspect `package.json`
**Then** it contains `name`, `version`, `main`, and `scripts.start` fields
**And** `express` is listed under `dependencies`

**Given** a freshly cloned repo with no `node_modules`
**When** I run `npm install`
**Then** the command completes with exit code 0 and no errors printed to stderr
**And** `node_modules/express` exists on disk

---

### Story 1.2: Bootstrap HTTP Server

As a developer,
I want an entry point file that creates an Express app and starts listening on a configurable port,
So that running `npm start` brings up a live HTTP server that stays alive and tells me which port it is on.

**Acceptance Criteria:**

**Given** dependencies are installed (Story 1.1 complete)
**When** I run `npm start`
**Then** the process starts without throwing an error and does not exit
**And** a startup message containing the active port number is printed to stdout

**Given** the `PORT` environment variable is not set
**When** the server starts
**Then** it binds to port 3000

**Given** the `PORT` environment variable is set to `4000`
**When** the server starts
**Then** it binds to port 4000 and the startup message reflects port 4000

**Given** the server is running
**When** I send any HTTP request to `localhost:<port>`
**Then** the server process remains alive (does not crash)

---

## Epic 2: Working API Endpoints

Both application routes are implemented and return the correct status codes, headers, and body shapes defined in the PRD.

### Story 2.1: Hello World Route

As a developer (or any HTTP client),
I want `GET /` to return the plain-text string `Hello World` with HTTP 200,
So that I can verify the server is handling the root route correctly.

**Acceptance Criteria:**

**Given** the server is running (Epic 1 complete)
**When** I send `GET /` to the server
**Then** the response status is `200 OK`
**And** the response body is exactly `Hello World`
**And** the `Content-Type` response header is `text/plain` or contains `text/plain`

**Given** the server is running
**When** I send `GET /` multiple times in succession
**Then** every response returns the same body and status (idempotent)

---

### Story 2.2: Test Payload Route

As a developer (or any HTTP client),
I want `GET /test` to return a JSON object with HTTP 200,
So that I can verify the server can serialize and return structured data with a live timestamp.

**Acceptance Criteria:**

**Given** the server is running (Epic 1 complete)
**When** I send `GET /test` to the server
**Then** the response status is `200 OK`
**And** the `Content-Type` response header is `application/json`
**And** the response body is valid JSON

**Given** the response body is parsed as JSON
**When** I inspect the fields
**Then** `status` equals `"ok"`
**And** `message` equals `"Test payload"`
**And** `timestamp` is a valid ISO 8601 date-time string

**Given** I send `GET /test` twice with a short delay between requests
**When** I compare the `timestamp` fields
**Then** the two timestamps differ, confirming the value is generated at request time and not cached
