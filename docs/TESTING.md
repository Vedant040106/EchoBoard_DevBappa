# DevBappa Solutions Live Feedback Wall — Testing Guide

This document describes the automated test suites, quality gates, and integration test coverage.

## 1. Test Architecture

The repository uses Node's native test runner (`node:test` + `node:assert/strict`) and TypeScript execution via `tsx` for high-speed, zero-dependency test execution:

- **Frontend Tests (`apps/web/tests/`)**:
  - `form-validation.test.ts`: Role-specific field requirements, conditional department "Other" validation, character bounds.
  - `wall-actions.test.ts`: Bounding box calculations for "Reset View", newest note selection for "Latest", spatial virtualization bounds, real-time deduplication, and hidden feedback removal.
- **Backend Tests (`apps/api/tests/`)**:
  - `validation.test.ts`: Server-side schema verification for Student, Faculty, Other Visitor, and Admin Login.
  - `name-sanitizer.test.ts`: Derivation of public display name, extraction of first name, sanitization of HTML/control characters, privacy protection.
  - `hasher.test.ts`: Bcrypt password hashing and verification.
  - `api.test.ts`: HTTP status codes, health endpoint, unauthenticated admin endpoint rejection (`401 UNAUTHORIZED`), validation error structures (`400 VALIDATION_ERROR`).

---

## 2. Running Automated Tests

Run all tests across all workspaces:
```bash
npm run test
```

Run backend tests:
```bash
npm run test --workspace=@devbappa/api
```

Run frontend tests:
```bash
npm run test --workspace=@devbappa/web
```

---

## 3. Quality Gates

Run full static analysis and build validation:

1. **Type Checking**:
   ```bash
   npm run typecheck
   ```
2. **Production Builds**:
   ```bash
   npm run build
   ```
3. **Continuous Integration**:
   - Monitored on GitHub Actions via `.github/workflows/ci.yml`.
   - Executes `npm ci`, shared package compilation, typecheck, test suites, and production builds on every push to `main` and pull request.
