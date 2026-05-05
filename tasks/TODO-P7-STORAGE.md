# TODO-P7-STORAGE.md – Phase 7 Storage & Document Integrations

This document contains advanced storage integration tasks for multiple cloud providers and failover mechanisms. All tasks follow the established patterns with explicit dependencies, safety boundaries, rollback plans, and verification commands. Engineered for 100% agentic execution using The Framework (DDD + TDD + BDD + Deep Module).

---

## Phase 7 Storage Integration Task Index

- [ ] INT‑STORAGE‑001 – Advanced Storage Integrations

---

## [ ] INT‑STORAGE‑001: Advanced Storage Integrations
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Only Cloudflare R2 is supported as a storage backend. No provider abstraction layer exists. As of May 2026, AWS S3 SDK v3 (`@aws-sdk/client-s3`) supports modular tree‑shakable imports, Google Drive API v3 with OAuth 2.0 supports file import/export, and Microsoft Graph v1.0 Drive API supports OneDrive/SharePoint file operations. A provider‑agnostic storage layer with failover and cross‑provider sync is industry best practice for enterprise document management.
**Size:** Large

**Description:** Implement a storage adapter factory with provider‑agnostic interface supporting Amazon S3, Google Drive, OneDrive/SharePoint, local filesystem (development), and Cloudflare R2 (existing). Add failover management with automatic switching, cross‑provider file synchronization, and chunked upload/download progress tracking.

**Depends on:** DOC‑STORAGE‑001 (Cloudflare R2 adapter), STORAGE‑001 (base storage interfaces), DOMAIN‑004 (integration architecture)
**Blocks:** ENT‑DOCS‑001 (enterprise document management), FRONT‑DOCS‑002 (file upload component with provider selection)
**Related Files:** `lib/integrations/storage/s3-adapter.ts`, `lib/integrations/storage/gdrive-adapter.ts`, `lib/integrations/storage/onedrive-adapter.ts`, `lib/integrations/storage/local-adapter.ts`, `lib/integrations/storage/failover-manager.ts`, `lib/integrations/storage/sync-manager.ts`, `lib/integrations/storage/StorageAdapterFactory.ts`

**Imports / Exports**
- Imports: `StoragePort` interface (from STORAGE‑001), `@aws-sdk/client-s3` (S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command), `googleapis` (drive v3), `@microsoft/microsoft-graph-client`
- Exports: `S3StorageAdapter`, `GoogleDriveAdapter`, `OneDriveAdapter`, `LocalFileSystemAdapter`, `StorageFailoverManager`, `CrossProviderSyncService`, `StorageAdapterFactory`

**Definition of Done**
- [ ] `StorageAdapterFactory` creates the appropriate adapter instance based on configuration (env var `STORAGE_PROVIDER`) or runtime selection
- [ ] `S3StorageAdapter`: implements `StoragePort` using AWS SDK v3; supports `upload`, `download`, `getSignedUrl`, `delete`, `list` operations
- [ ] `GoogleDriveAdapter`: implements `StoragePort` using Google Drive API v3 with OAuth 2.0; supports file import/export, folder listing
- [ ] `OneDriveAdapter`: implements `StoragePort` using Microsoft Graph v1.0 Drive API with OAuth 2.0; supports file operations
- [ ] `LocalFileSystemAdapter`: implements `StoragePort` for local development; configurable storage path
- [ ] `StorageFailoverManager`: monitors primary storage provider health; automatically switches to fallback provider on failure; restores to primary when healthy
- [ ] `CrossProviderSyncService`: synchronises files between two storage providers using checksum‑based change detection; resolves conflicts via last‑write‑wins
- [ ] All adapters support chunked upload/download with progress callbacks and resume capability for files > 100 MB
- [ ] All adapters are swappable behind the same `StoragePort` interface — no business logic changes required when switching providers
- [ ] Unit tests for each adapter pass using mock API responses or local storage
- [ ] `pnpm run typecheck` passes with zero errors

**Out of Scope**
- CDN integration for public file serving
- Backup and disaster recovery (separate infrastructure concern)
- Storage cost optimisation analytics
- Box, Dropbox, or other third‑party storage providers (architecture supports adding them later)

**Safety Boundaries**
- Never modify: `lib/api-client-react/src/generated/`, `lib/api-zod/src/generated/`, `.generated/`
- Never commit: `.env*`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `GOOGLE_CLIENT_SECRET`, `AZURE_CLIENT_SECRET`, OAuth tokens
- Never store credentials in plaintext; use environment variables or encrypted configuration
- Never expose raw storage bucket URLs to the client — always use signed URLs or proxy through the API

**Output Artifacts**
- Code changes in: `lib/integrations/storage/`, `lib/integrations/storage/adapters/`
- Tests added/updated in: `lib/integrations/storage/__tests__/`
- Documentation: [N/A]
- Migration files: [N/A] — no schema changes; configuration only

**Rollback**
- Granularity: file‑level — delete `lib/integrations/storage/` directory; revert to single‑provider R2 adapter
- Halt condition: if failover manager causes data inconsistency (e.g., writes to primary but reads from fallback before sync completes), stop and implement write‑quorum validation

**Rules to Follow**
- All adapters must implement every method of the `StoragePort` interface — no optional stubs that throw `NotImplementedError`
- Chunked uploads must use `AbortController` signals for cancellation; implement retry with exponential backoff per chunk
- `StorageFailoverManager` must check provider health at configurable intervals (default: 30 s); consecutive failures (default: 3) trigger failover
- Cross‑provider sync must be idempotent — re‑syncing the same files must not create duplicates
- Signed URLs must have configurable TTL (default: 15 minutes for downloads, 1 hour for uploads)
- All OAuth tokens must be encrypted at rest and automatically refreshed before expiry (proactive refresh when `expires_in` < 300 s)
- Rate limits: S3 — bucket‑level limits (3,500 PUT/POST/DELETE and 5,500 GET/HEAD per second per prefix), Google Drive API — 12,000 queries per minute per user, Microsoft Graph — 10,000 requests per 10‑minute window per app

**Verification**
```bash
# Test S3 adapter
pnpm vitest run -- lib/integrations/storage/__tests__/s3-adapter.test.ts

# Test Google Drive adapter
pnpm vitest run -- lib/integrations/storage/__tests__/gdrive-adapter.test.ts

# Test OneDrive adapter
pnpm vitest run -- lib/integrations/storage/__tests__/onedrive-adapter.test.ts

# Test local adapter
pnpm vitest run -- lib/integrations/storage/__tests__/local-adapter.test.ts

# Test failover manager
pnpm vitest run -- lib/integrations/storage/__tests__/failover-manager.test.ts

# Test cross‑provider sync
pnpm vitest run -- lib/integrations/storage/__tests__/sync-manager.test.ts

# Test adapter factory
pnpm vitest run -- lib/integrations/storage/__tests__/StorageAdapterFactory.test.ts

# Full typecheck
pnpm run typecheck
```

**Advanced Code Patterns**
- Adapter factory pattern: `StorageAdapterFactory.create(provider: 's3' | 'gdrive' | 'onedrive' | 'r2' | 'local'): StoragePort` — domain layer never knows which provider is active
- Circuit breaker: `StorageFailoverManager` wraps each adapter with a circuit breaker (failure threshold: 3, reset timeout: 60 s) using `opossum` or a custom implementation
- Checksum‑based sync: compute MD5 or SHA‑256 hash per file; compare across providers; sync only changed files
- Chunked upload with progress: `XMLHttpRequest` or `fetch` with `ReadableStream` for upload progress; emit `onProgress` callbacks per chunk
- Health check: lightweight `list` operation with 5 s timeout on each provider to determine health status

**Anti‑Patterns**
- Do not hardcode provider‑specific logic in business code — always go through the `StoragePort` interface
- Do not ignore provider rate limits; implement exponential backoff with jitter
- Do not store credentials in application code; always from environment variables or encrypted config
- Do not skip conflict resolution in cross‑provider sync — without it, data can be lost or duplicated
- Do not create a monolithic "mega‑adapter" that handles all providers in one class; use separate adapter implementations behind a shared interface

**DDD / TDD / BDD / Deep Module notes**
- DDD: Storage is a pure infrastructure concern. The `StoragePort` interface decouples the domain from any specific storage provider. All adapters are anti‑corruption layers translating provider‑specific APIs into domain‑agnostic operations.
- TDD: Write contract tests against the `StoragePort` interface first; each adapter must pass the same test suite against mock API responses.
- BDD: "As an administrator, I can configure which storage provider to use for document storage, and the system automatically handles failover if the primary provider is unavailable."
- Deep Module: `StorageAdapterFactory.create('s3')` returns a `StoragePort` — callers interact with a simple interface (`upload`, `download`, `delete`, `list`, `getSignedUrl`) while the adapter hides all provider‑specific complexity (OAuth, chunked upload, retry, rate limiting).

---

### Subtasks

- [ ] INT‑STORAGE‑001.0.25 (AGENT): Read the entire task, the `StoragePort` interface from STORAGE‑001, and the existing `CloudflareR2Adapter` from DOC‑STORAGE‑001.
  *No action — pause until fully understood.*

- [ ] INT‑STORAGE‑001.0.5 (AGENT): Research AWS SDK v3 S3 client API, Google Drive API v3 file operations, Microsoft Graph Drive API, and provider rate limits (as of May 2026).
  *Document findings briefly or note "no changes."*

- [ ] INT‑STORAGE‑001.0.75 (AGENT): Reason about adapter factory design, failover manager architecture, and cross‑provider sync strategy. Present design to user if uncertain.
  *If uncertain about architecture, ask the user before executing.*

- [ ] INT‑STORAGE‑001.1 (AGENT): Implement `StorageAdapterFactory` with provider registration and creation.
  **File(s):** `lib/integrations/storage/StorageAdapterFactory.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/storage/__tests__/StorageAdapterFactory.test.ts`

- [ ] INT‑STORAGE‑001.2 (AGENT): Implement `S3StorageAdapter` with chunked upload/download and signed URL support.
  **File(s):** `lib/integrations/storage/adapters/s3-adapter.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/storage/__tests__/s3-adapter.test.ts`

- [ ] INT‑STORAGE‑001.3 (AGENT): Implement `GoogleDriveAdapter` with OAuth 2.0 flow and file import/export.
  **File(s):** `lib/integrations/storage/adapters/gdrive-adapter.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/storage/__tests__/gdrive-adapter.test.ts`

- [ ] INT‑STORAGE‑001.4 (AGENT): Implement `OneDriveAdapter` with Microsoft Graph OAuth 2.0.
  **File(s):** `lib/integrations/storage/adapters/onedrive-adapter.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/storage/__tests__/onedrive-adapter.test.ts`

- [ ] INT‑STORAGE‑001.5 (AGENT): Implement `LocalFileSystemAdapter` for development use.
  **File(s):** `lib/integrations/storage/adapters/local-adapter.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/storage/__tests__/local-adapter.test.ts`

- [ ] INT‑STORAGE‑001.6 (AGENT): Implement `StorageFailoverManager` with health checks and automatic provider switching.
  **File(s):** `lib/integrations/storage/failover-manager.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/storage/__tests__/failover-manager.test.ts`

- [ ] INT‑STORAGE‑001.7 (AGENT): Implement `CrossProviderSyncService` with checksum‑based change detection and conflict resolution.
  **File(s):** `lib/integrations/storage/sync-manager.ts`
  **Verification:** `pnpm vitest run -- lib/integrations/storage/__tests__/sync-manager.test.ts`

- [ ] INT‑STORAGE‑001.8 (AGENT): Run `pnpm run typecheck` and fix any type errors.
  **File(s):** All modified files
  **Verification:** `pnpm run typecheck` exits 0.

- [ ] INT‑STORAGE‑001.N (HUMAN): Final review — verify S3 adapter against a real S3 bucket, Google Drive adapter with a test account, and failover behaviour, approve.
  **Verification:** Approved.

---

## Integration Rules Framework

To avoid rules duplication across all integration tasks, the following common rules framework applies:

### Common Integration Rules
- **Authentication**: Use OAuth 2.0 with proper token management and refresh flows; encrypt tokens at rest with AES‑256‑GCM
- **Error Handling**: Implement exponential backoff for rate limits and network errors
- **Security**: Store credentials securely via environment variables; never log raw tokens or credentials
- **Rate Limiting**: Respect provider‑specific API limits with intelligent throttling
- **Testing**: Use recorded API responses as fixtures; tests must pass deterministically without live API access
- **Logging**: Implement structured logging (Pino) with security‑sensitive data redaction; use `[REDACTED]` for tokens and credentials

### Provider‑Specific Rules
Each integration task includes only rules specific to that provider, not duplicating the common rules above.

---

*End of Phase 7 Storage & Document Integrations.*