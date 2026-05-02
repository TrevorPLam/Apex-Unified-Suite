# TODO-P10-DOCUMENTS-AI.md – Phase 10: Document AI (ShareFile depth)

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

## Phase 10 Document AI Task Index

**Document AI (ShareFile depth)**
- [ ] AI‑DOCS‑002 – AI‑Powered PII/PHI Detection
- [ ] AI‑DOCS‑003 – AI Document Classification & Tagging

---

## Document AI (ShareFile depth)

### [ ] AI‑DOCS‑002: AI‑Powered PII/PHI Detection
**Status:** ⏳ Not Started  
**Depends on:** API‑DOCS‑013 (share link API), DOC‑STORAGE‑001 (file storage).  
**Definition of Done:** AI‑powered sensitive content scanning for documents:
- Automatically scan files being uploaded or shared for personally identifiable information (PII: social security numbers, driver's licence numbers, passport numbers, dates of birth, addresses), protected health information (PHI: medical record numbers, health plan numbers, treatment dates), and payment card data (PCI: credit card numbers, bank account numbers).
- Scanning occurs: on document upload, before a share link is created, and on‑demand for existing documents.
- Detection results include: type of sensitive data found, location (page number or section), and a recommended action (encrypt, restrict sharing, redact).
- If sensitive data is detected during share link creation, warn the user and recommend sending via encrypted secure link instead of open sharing.
- Configurable policies per organisation: block sharing entirely if certain data types are detected (e.g., block if SSN found), or warn and allow with audit log entry.
- All detection events logged in the document audit trail.
- Initial implementation can use pattern matching (regex for SSN, credit card) plus a third‑party DLP API for advanced detection; both behind a port interface.

**DDD:** AI security service within the Documents bounded context (ShareFile secure share recommender).  
**TDD:** Unit test with sample documents containing known PII/PHI/PCI data verifying detection and correct classification.  
**BDD:** "As a compliance officer, the system automatically warns users when they try to share documents containing sensitive client data."

**Subtasks:**
- [ ] AI‑DOCS‑002.1: Implement PII/PHI/PCI detection engine using pattern matching and optional external DLP API. (AGENT) – `lib/ai/dlp/document‑scanner.ts`  
  **verification:** Engine detects known PII patterns (SSN, credit card numbers) in test documents; returns type and location.
- [ ] AI‑DOCS‑002.2: Integrate scanning into document upload and share link creation flows. (AGENT)  
  **verification:** Uploading a document with SSN triggers warning; share link creation blocked if policy configured.
- [ ] AI‑DOCS‑002.3: Build organisation‑level policy configuration (block vs. warn per data type). (AGENT) – `src/components/documents/DLPPolicyConfig.tsx`  
  **verification:** Policies configurable; changes take effect immediately.
- [ ] AI‑DOCS‑002.4: Add detection event logging to document audit trail. (AGENT)  
  **verification:** Every detection event logged with type, location, and action taken.
- [ ] AI‑DOCS‑002.5: Write integration tests for full detection‑to‑enforcement flow. (AGENT)  
  **verification:** End‑to‑end test passes; detection correctly enforces configured policies.
- **Depends on:** API‑DOCS‑013, DOC‑STORAGE‑001.

### [ ] AI‑DOCS‑003: AI Document Classification & Tagging
**Status:** ⏳ Not Started  
**Depends on:** AI‑DOCS‑001 (intelligent document analytics), API‑DOCS‑004 (documents API).  
**Definition of Done:** AI‑powered automatic document classification and metadata extraction:
- When a document is uploaded, automatically classify it by type: contract, invoice, tax form, report, proposal, ID document, correspondence, or other.
- Extract key metadata based on document type: for contracts → parties, effective date, expiration date, contract value; for invoices → vendor, amount, due date, invoice number; for tax forms → form type, tax year, entity name; for ID documents → document type, issuing authority, expiry date.
- Auto‑tag documents with extracted metadata as searchable tags.
- Confidence scoring for each classification and metadata field; low‑confidence items flagged for manual review.
- Learning from corrections: user overrides feed back into the model to improve future classifications.
- Classified documents are grouped by type in the document list view with type icons and colour coding.
- Tags are used by the global search index to improve document search relevance.

**DDD:** AI service within the Documents bounded context that enriches document metadata for better organisation and search.  
**TDD:** Unit test with sample documents of known types verifying correct classification and metadata extraction.  
**BDD:** "As a user, documents I upload are automatically categorised and tagged so I can find them easily later."

**Subtasks:**
- [ ] AI‑DOCS‑003.1: Implement document classification model (can use a pre‑trained model or third‑party API via a port interface). (AGENT) – `lib/ai/documents/classifier‑service.ts`  
  **verification:** Classifier correctly identifies document types in a test set with acceptable accuracy.
- [ ] AI‑DOCS‑003.2: Implement metadata extraction per document type. (AGENT) – `lib/ai/documents/metadata‑extractor.ts`  
  **verification:** Key fields extracted correctly for each document type.
- [ ] AI‑DOCS‑003.3: Integrate classification and tagging into document upload flow. (AGENT)  
  **verification:** Uploaded documents automatically classified and tagged; tags visible in document detail.
- [ ] AI‑DOCS‑003.4: Build manual review interface for low‑confidence classifications. (AGENT) – `src/components/documents/ClassificationReview.tsx`  
  **verification:** Low‑confidence items appear in review queue; user corrections update classification.
- [ ] AI‑DOCS‑003.5: Wire auto‑tags into global search index for improved document search. (AGENT)  
  **verification:** Searching for a tag returns the correct documents.
- **Depends on:** AI‑DOCS‑001, API‑DOCS‑004.

---
