# tasks/integrations/INTEGRATION‑STORAGE.md – Advanced Storage Integrations

This file covers advanced storage integration tasks for multiple cloud providers and failover mechanisms. A provider‑agnostic storage adapter factory with support for Amazon S3, Google Drive, OneDrive/SharePoint, local filesystem, and Cloudflare R2 (existing). Includes failover management and cross‑provider file synchronization. All integrations implement the `StoragePort` interface defined in `infrastructure/EMAIL‑STORAGE.md`.

> **Follow all rules in `CROSS‑CUTTING‑RULES.md`.**

---

## [ ] INT‑STORAGE‑001: Advanced Storage Integrations
**Status:** ⏳ Not Started
**Actor:** AGENT
**Priority:** 🟠 High
**Current State:** Only Cloudflare R2 is supported as a storage backend. No provider abstraction layer exists for multi‑provider support, failover, or cross‑provider sync. Enterprise document management requires flexible storage backends.
**Size:** Large

**Description:** Implement a storage adapter factory with a provider‑agnostic interface supporting Amazon S3, Google Drive, OneDrive/SharePoint, local filesystem (development), and Cloudflare R2 (existing). Add failover management with automatic switching, cross‑provider file synchronization, and chunked upload/download progress tracking.

**Depends on:** `infrastructure/EMAIL‑STORAGE.md → STORAGE‑001`, `documents/DOCUMENTS‑MANAGEMENT.md → DOC‑STORAGE‑001`
**Blocks:** `documents/DOCUMENTS‑ENTERPRISE.md → ENT‑DOCS‑001`, `documents/DOCUMENTS‑MANAGEMENT.md → FRONT‑DOCS‑002`
**Related Files:** `lib/integrations/storage/s3‑adapter.ts`, `gdrive‑adapter.ts`, `onedrive‑adapter.ts`, `local‑adapter.ts`, `failover‑manager.ts`, `sync‑manager.ts`, `StorageAdapterFactory.ts`

**Definition of Done**
- [ ] `StorageAdapterFactory` creates the appropriate adapter instance based on configuration (env var `STORAGE_PROVIDER`) or runtime selection
- [ ] `S3StorageAdapter`: implements `StoragePort` using AWS SDK v3; supports `upload`, `download`, `getSignedUrl`, `delete`, `list` operations
- [ ] `GoogleDriveAdapter`: implements `StoragePort` using Google Drive API v3 with OAuth 2.0; supports file import/export, folder listing
- [ ] `OneDriveAdapter`: implements `StoragePort` using Microsoft Graph v1.0 Drive API with OAuth 2.0; supports file operations
- [ ] `LocalFileSystemAdapter`: implements `StoragePort` for local development; configurable storage path
- [ ] `StorageFailoverManager`: monitors primary storage provider health; automatically switches to fallback provider on failure; restores to primary when healthy
- [ ] `CrossProviderSyncService`: synchronises files between two storage providers using checksum‑based change detection; resolves conflicts via last‑write‑wins
- [ ] All adapters support chunked upload/download with progress callbacks and resume capability for files > 100 MB
- [ ] All adapters are swappable behind the same `StoragePort` interface — no business logic changes required when switching providers
- [ ] Unit tests for each adapter pass using mock API responses or local storage
- [ ] `pnpm run typecheck` passes

**Out of Scope**
- CDN integration for public file serving
- Backup and disaster recovery (separate infrastructure concern)
- Storage cost optimisation analytics
- Box, Dropbox, or other third‑party storage providers (architecture supports adding them later)

**Rules to Follow**
- All adapters must implement every method of the `StoragePort` interface — no optional stubs that throw `NotImplementedError`
- Chunked uploads must use `AbortController` signals for cancellation; implement retry with exponential backoff per chunk
- `StorageFailoverManager` must check provider health at configurable intervals (default: 30 s); consecutive failures (default: 3) trigger failover
- Cross‑provider sync must be idempotent — re‑syncing the same files must not create duplicates
- Signed URLs must have configurable TTL (default: 15 minutes for downloads, 1 hour for uploads)
- All OAuth tokens must be encrypted at rest and automatically refreshed before expiry (proactive refresh when `expires_in` < 300 s)

**Verification**
```bash
pnpm vitest run -- lib/integrations/storage/__tests__/s3‑adapter.test.ts
pnpm vitest run -- lib/integrations/storage/__tests__/gdrive‑adapter.test.ts
pnpm vitest run -- lib/integrations/storage/__tests__/onedrive‑adapter.test.ts
pnpm vitest run -- lib/integrations/storage/__tests__/local‑adapter.test.ts
pnpm vitest run -- lib/integrations/storage/__tests__/failover‑manager.test.ts
pnpm vitest run -- lib/integrations/storage/__tests__/sync‑manager.test.ts
pnpm vitest run -- lib/integrations/storage/__tests__/StorageAdapterFactory.test.ts
pnpm run typecheck
```

**DDD / TDD / BDD / Deep Module notes**
- DDD: Storage is a pure infrastructure concern. The `StoragePort` interface decouples the domain from any specific storage provider. All adapters are anti‑corruption layers translating provider‑specific APIs into domain‑agnostic operations.
- TDD: Write contract tests against the `StoragePort` interface first; each adapter must pass the same test suite against mock API responses.
- BDD: “As an administrator, I can configure which storage provider to use for document storage, and the system automatically handles failover if the primary provider is unavailable.”
- Deep Module: `StorageAdapterFactory.create('s3')` returns a `StoragePort` — callers interact with a simple interface while the adapter hides all provider‑specific complexity (OAuth, chunked upload, retry, rate limiting).

---

### Subtasks
- [ ] INT‑STORAGE‑001.0.25 (AGENT): Read the `StoragePort` interface from STORAGE‑001 and the existing `CloudflareR2Adapter` from DOC‑STORAGE‑001. *No action – pause.*
- [ ] INT‑STORAGE‑001.0.5 (AGENT): Research AWS SDK v3 S3 client API, Google Drive API v3 file operations, Microsoft Graph Drive API, and provider rate limits. *Document findings briefly.*
- [ ] INT‑STORAGE‑001.1 (AGENT): Implement `StorageAdapterFactory` with provider registration and creation.
  **File(s):** `lib/integrations/storage/StorageAdapterFactory.ts`
  **Verification:** `pnpm vitest run -- StorageAdapterFactory.test.ts`
- [ ] INT‑STORAGE‑001.2 (AGENT): Implement `S3StorageAdapter` with chunked upload/download and signed URL support.
  **File(s):** `lib/integrations/storage/adapters/s3‑adapter.ts`
  **Verification:** `pnpm vitest run -- s3‑adapter.test.ts`
- [ ] INT‑STORAGE‑001.3 (AGENT): Implement `GoogleDriveAdapter` with OAuth 2.0 flow and file import/export.
  **File(s):** `lib/integrations/storage/adapters/gdrive‑adapter.ts`
  **Verification:** `pnpm vitest run -- gdrive‑adapter.test.ts`
- [ ] INT‑STORAGE‑001.4 (AGENT): Implement `OneDriveAdapter` with Microsoft Graph OAuth 2.0.
  **File(s):** `lib/integrations/storage/adapters/onedrive‑adapter.ts`
  **Verification:** `pnpm vitest run -- onedrive‑adapter.test.ts`
- [ ] INT‑STORAGE‑001.5 (AGENT): Implement `LocalFileSystemAdapter` for development use.
  **File(s):** `lib/integrations/storage/adapters/local‑adapter.ts`
  **Verification:** `pnpm vitest run -- local‑adapter.test.ts`
- [ ] INT‑STORAGE‑001.6 (AGENT): Implement `StorageFailoverManager` with health checks and automatic provider switching.
  **File(s):** `lib/integrations/storage/failover‑manager.ts`
  **Verification:** `pnpm vitest run -- failover‑manager.test.ts`
- [ ] INT‑STORAGE‑001.7 (AGENT): Implement `CrossProviderSyncService` with checksum‑based change detection and conflict resolution.
  **File(s):** `lib/integrations/storage/sync‑manager.ts`
  **Verification:** `pnpm vitest run -- sync‑manager.test.ts`
- [ ] INT‑STORAGE‑001.8 (AGENT): Run `pnpm run typecheck` and fix any type errors. **Verification:** `pnpm run typecheck` exits 0.
- [ ] INT‑STORAGE‑001.N (HUMAN): Final review – verify S3 adapter against a real S3 bucket, Google Drive adapter with a test account, and failover behaviour, approve. **Verification:** Approved.

---