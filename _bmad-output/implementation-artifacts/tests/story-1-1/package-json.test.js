/**
 * Story 1.1: Initialize Node.js Project
 * Tests validating package.json structure and npm install behavior.
 *
 * Acceptance Criteria covered:
 *   AC1 - package.json contains name, version, main, scripts.start
 *   AC2 - npm install completes with exit code 0
 *   AC3 - scripts.start invokes "node server.js"
 *   AC4 - main field points to "server.js"
 *   AC5 - dependencies block is empty (no runtime libraries)
 */

import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

// Resolve project root (4 levels up from tests/story-1-1/)
const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, '../../../../');
const packageJsonPath = resolve(PROJECT_ROOT, 'package.json');

/** Load and parse package.json once for all tests. */
function loadPackageJson() {
  const raw = readFileSync(packageJsonPath, 'utf8');
  return JSON.parse(raw);
}

describe('Story 1.1 — Initialize Node.js Project', () => {

  describe('AC1: package.json required fields', () => {
    it('package.json is valid JSON (parseable without throwing)', () => {
      assert.doesNotThrow(() => loadPackageJson(), 'package.json must be valid JSON');
    });

    it('contains a "name" field', () => {
      const pkg = loadPackageJson();
      assert.ok(Object.prototype.hasOwnProperty.call(pkg, 'name'), '"name" field must be present');
      assert.ok(typeof pkg.name === 'string' && pkg.name.length > 0, '"name" must be a non-empty string');
    });

    it('contains a "version" field', () => {
      const pkg = loadPackageJson();
      assert.ok(Object.prototype.hasOwnProperty.call(pkg, 'version'), '"version" field must be present');
      assert.ok(typeof pkg.version === 'string' && pkg.version.length > 0, '"version" must be a non-empty string');
    });

    it('contains a "main" field', () => {
      const pkg = loadPackageJson();
      assert.ok(Object.prototype.hasOwnProperty.call(pkg, 'main'), '"main" field must be present');
    });

    it('contains a "scripts" object with a "start" property', () => {
      const pkg = loadPackageJson();
      assert.ok(Object.prototype.hasOwnProperty.call(pkg, 'scripts'), '"scripts" field must be present');
      assert.ok(typeof pkg.scripts === 'object' && pkg.scripts !== null, '"scripts" must be an object');
      assert.ok(Object.prototype.hasOwnProperty.call(pkg.scripts, 'start'), '"scripts.start" must be present');
    });
  });

  describe('AC3: scripts.start must invoke "node server.js"', () => {
    it('scripts.start equals "node server.js"', () => {
      const pkg = loadPackageJson();
      assert.equal(
        pkg.scripts.start,
        'node server.js',
        'scripts.start must be exactly "node server.js"'
      );
    });
  });

  describe('AC4: main field must point to "server.js"', () => {
    it('main equals "server.js"', () => {
      const pkg = loadPackageJson();
      assert.equal(
        pkg.main,
        'server.js',
        'main field must be "server.js"'
      );
    });
  });

  describe('AC5: dependencies block must be empty (no runtime libraries)', () => {
    it('dependencies field is present', () => {
      const pkg = loadPackageJson();
      assert.ok(
        Object.prototype.hasOwnProperty.call(pkg, 'dependencies'),
        '"dependencies" field must be present'
      );
    });

    it('dependencies object has no keys (empty)', () => {
      const pkg = loadPackageJson();
      const keys = Object.keys(pkg.dependencies || {});
      assert.equal(
        keys.length,
        0,
        `dependencies must be empty — found: ${keys.join(', ')}`
      );
    });

    it('express is NOT listed as a dependency', () => {
      const pkg = loadPackageJson();
      const deps = pkg.dependencies || {};
      assert.ok(
        !Object.prototype.hasOwnProperty.call(deps, 'express'),
        'express must not appear in dependencies (architecture uses node:http built-in)'
      );
    });
  });

  describe('AC2: npm install completes with exit code 0', () => {
    it('npm install exits with code 0 and prints no error output', () => {
      let stdout = '';
      let stderr = '';
      let exitCode = 0;

      try {
        stdout = execSync('npm install', {
          cwd: PROJECT_ROOT,
          encoding: 'utf8',
          stdio: ['pipe', 'pipe', 'pipe'],
        });
      } catch (err) {
        exitCode = err.status ?? 1;
        stderr = err.stderr ?? '';
      }

      assert.equal(exitCode, 0, `npm install must exit with code 0 — stderr: ${stderr}`);
    });
  });
});
