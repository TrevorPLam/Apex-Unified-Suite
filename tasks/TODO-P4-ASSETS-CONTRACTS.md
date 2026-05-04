# TODO-P4-ASSETS-CONTRACTS.md – Phase 4: Asset Contracts & Licenses

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

## Phase 4 – Asset Contracts & Licenses

This section covers the contracts and licenses management module for assets, tracking renewal dates, costs, linked documents, and vendor relationships. These features provide comprehensive contract lifecycle management matching AssetTiger's contracts module.

---

## Contracts & Licenses Module

### [ ] ASSETS-CON-001: Contracts & Licenses Table & API
**Status:** ⏳ Not Started  
**Depends on:** DB-ASSETS-001  
**Why added:** AssetTiger includes a contracts and licenses module tied to assets, tracking renewal, cost, and linked documents. Missing entirely.  
**Definition of Done:**
- New database table `contracts` (organization_id, asset_id nullable, vendor_id nullable, name, description, start_date, end_date, renewal_terms JSONB, cost_cents, status enum, document_id nullable).  
- CRUD API endpoints under `/api/v1/contracts`.  
- In the asset detail view, list linked contracts; allow linking/unlinking.  
- Alert integration: expiring contracts generate `asset_alerts` with type `contract_expiration`.  
**BDD:** "From an asset's page, I can see the maintenance contract that covers it and open the contract document."  
**TDD:** Integration test verifying contract CRUD, asset linking, and alert generation for expiring contracts.  
**Deep Module:** Encapsulates contract lifecycle, asset relationships, and renewal management.

**Advanced Code Patterns:**
- Contract status state machine (draft → active → expired → renewed)
- JSONB renewal terms for flexible contract configurations
- Automatic alert generation for contract expirations
- Asset-contract relationship management with soft unlinking

**Anti-Patterns:**
- Missing contract status validation allowing invalid transitions
- No audit trail for contract changes
- Hard-coded renewal logic without flexibility
- Missing document linkage for contract storage

**Database Schema:**
```sql
-- Contracts and licenses table
CREATE TABLE contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  asset_id UUID REFERENCES assets(id), -- nullable for non-asset contracts
  vendor_id UUID REFERENCES vendors(id), -- nullable
  document_id UUID REFERENCES documents(id), -- nullable, linked contract document
  name VARCHAR(255) NOT NULL,
  description TEXT,
  contract_type VARCHAR(50) NOT NULL, -- 'lease', 'warranty', 'maintenance', 'license', 'insurance'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  renewal_terms JSONB DEFAULT '{}', -- { auto_renew: boolean, notice_period_days: number, renewal_duration_months: number }
  cost_cents INTEGER, -- nullable for no-cost contracts
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- 'draft', 'active', 'expired', 'terminated', 'renewed'
  termination_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contract history/audit log
CREATE TABLE contract_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES contracts(id),
  action VARCHAR(50) NOT NULL, -- 'created', 'updated', 'renewed', 'terminated', 'linked_to_asset', 'unlinked_from_asset'
  action_by UUID NOT NULL REFERENCES users(id),
  action_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for contract queries
CREATE INDEX idx_contracts_org ON contracts(organization_id, status);
CREATE INDEX idx_contracts_asset ON contracts(asset_id);
CREATE INDEX idx_contracts_vendor ON contracts(vendor_id);
CREATE INDEX idx_contracts_dates ON contracts(end_date, status);
CREATE INDEX idx_contracts_type ON contracts(contract_type, status);
```

**API Endpoints:**
- `GET /api/v1/contracts` - List all contracts with filtering (by type, status, asset, vendor)
- `POST /api/v1/contracts` - Create new contract
- `GET /api/v1/contracts/{contractId}` - Get contract detail with history
- `PATCH /api/v1/contracts/{contractId}` - Update contract details
- `DELETE /api/v1/contracts/{contractId}` - Soft delete/terminate contract
- `POST /api/v1/contracts/{contractId}/renew` - Renew an expiring contract
- `POST /api/v1/contracts/{contractId}/link-asset` - Link contract to asset
- `POST /api/v1/contracts/{contractId}/unlink-asset` - Unlink contract from asset
- `GET /api/v1/assets/{assetId}/contracts` - List contracts linked to specific asset

**Contract Status Transitions:**
```
draft → active → expired → renewed
         ↓           ↓
      terminated  terminated
```

**Renewal Terms JSONB Structure:**
```json
{
  "auto_renew": true,
  "notice_period_days": 30,
  "renewal_duration_months": 12,
  "renewal_cost_cents": 50000,
  "termination_notice_required": true
}
```

**Subtasks:**
- [ ] ASSETS-CON-001.1: Create contracts and contract_history table migrations. (AGENT) – `lib/db/src/migrations/`
  **verification:** Migration runs successfully; tables created with correct schema and indexes.
- [ ] ASSETS-CON-001.2: Add contract endpoints to OpenAPI spec. (AGENT) – `lib/api-spec/openapi.yaml`
  **verification:** Spec validates; codegen produces correct types.
- [ ] ASSETS-CON-001.3: Implement ContractService with status machine. (AGENT) – `artifacts/api-server/src/services/assets/contract-service.ts`
  **verification:** Unit tests pass; status transitions validated; Result<T, DomainError> returns.
- [ ] ASSETS-CON-001.4: Implement ContractRepository with query methods. (AGENT) – `lib/db/src/repositories/assets/contracts.ts`
  **verification:** Repository tests pass; soft delete and filtering work correctly.
- [ ] ASSETS-CON-001.5: Create contract routes with validation. (AGENT) – `artifacts/api-server/src/routes/assets/contracts.ts`
  **verification:** Routes wired; integration tests pass.
- [ ] ASSETS-CON-001.6: Implement asset linking/unlinking functionality. (AGENT)
  **verification:** Link/unlink operations update asset-contract relationships correctly.
- [ ] ASSETS-CON-001.7: Integrate with alert system for contract expiration. (AGENT) – `artifacts/api-server/src/services/assets/contract-alert-integration.ts`
  **verification:** Expiring contracts generate asset_alerts automatically.
- [ ] ASSETS-CON-001.8: Implement contract renewal workflow. (AGENT)
  **verification:** Renewal creates new contract period; history tracked.
- [ ] ASSETS-CON-001.9: Write integration tests for full contract workflow. (AGENT) – `artifacts/api-server/__tests__/api/assets/contracts.test.ts`
  **verification:** Tests cover CRUD, linking, renewal, and alert integration.

---

## Progress Tracking

### Overall Status
**Asset Contracts Context:** [ ] 0/1 parent tasks complete

### Dependencies
- **DB-ASSETS-001** enables asset database operations
- **ASSETS-ALERT-001** enables contract expiration alerts
- **API-DOCS-004** enables document linkage for contracts

### Next Actions
- [ ] Start ASSETS-CON-001.1: Create database migrations
- [ ] Start ASSETS-CON-001.2: Add OpenAPI spec entries

### Verification Commands
```bash
# Database verification
pnpm --filter @workspace/db run push

# API verification
pnpm test -- contracts.test.ts
pnpm typecheck

# Contract workflow verification
pnpm test -- contract-renewal.test.ts
```

---

## File Index

### Contracts & Licenses
- `lib/db/src/migrations/` - Database migrations for contracts table
- `lib/db/src/repositories/assets/contracts.ts` - Contract repository
- `artifacts/api-server/src/services/assets/contract-service.ts` - Contract service
- `artifacts/api-server/src/services/assets/contract-alert-integration.ts` - Alert integration
- `artifacts/api-server/src/routes/assets/contracts.ts` - Contract routes
- `artifacts/api-server/__tests__/api/assets/contracts.test.ts` - Integration tests

---

*End of Phase 4 Asset Contracts & Licenses section.*
