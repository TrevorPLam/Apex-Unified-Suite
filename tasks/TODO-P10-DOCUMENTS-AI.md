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
**TDD:** Unit test with sample documents containing known PII/PHI/PCI data verifying detection and correct classification; integration test verifying that policy enforcement blocks or warns appropriately based on configuration.  
**BDD:** "As a compliance officer, the system automatically warns users when they try to share documents containing sensitive client data."

**Deep Module:** AI-powered DLP (Data Loss Prevention) system with PII/PHI/PCI detection, policy enforcement, and audit logging. The module encapsulates pattern matching algorithms, external DLP service integration, policy management, and detection event tracking while providing simple interfaces for document security scanning.

**Advanced Code Patterns:**
- Strategy pattern for different detection methods (regex, ML models, external APIs)
- Observer pattern for real-time detection event notifications
- Factory pattern for creating detection policies
- Command pattern for policy enforcement actions
- Adapter pattern for different DLP service providers
- Event-driven architecture for detection workflows

**Anti-Patterns (AI):**
- Do not rely solely on pattern matching for sensitive data detection
- Avoid false positives that block legitimate document sharing
- Do not ignore context when evaluating sensitive data (e.g., sample data vs real data)
- Avoid training ML models on biased or incomplete datasets
- Do not cache detection results without proper invalidation

**Advanced Code Patterns:**
- Repository pattern for detection event persistence
- State machine for policy enforcement workflows
- Decorator pattern for adding detection to document operations
- Caching strategies for detection pattern optimization
- Queue management for batch document scanning
- Rate limiting for external DLP API calls

**Anti-Patterns:**
- Do not block document operations with synchronous scanning
- Avoid storing raw sensitive content in detection logs
- Do not ignore user feedback on false positives/negatives
- Avoid complex policy rules without clear business justification
- Do not bypass detection for any user role without audit trail

**Rules to Follow:**
- All detection must complete within 2 seconds for documents <10MB
- Detection events must be retained for at least 7 years
- Policy changes must take effect immediately across all operations
- False positive rate must be below 1% for production data
- All detection features must work offline with cached patterns
- Sensitive content must never be logged or stored in plain text

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
**TDD:** Unit test with sample documents of known types verifying correct classification and metadata extraction; integration test verifying that classification accuracy improves with user feedback.  
**BDD:** "As a user, documents I upload are automatically categorised and tagged so I can find them easily later."

**Deep Module:** AI document classification and tagging system with automatic metadata extraction, confidence scoring, and learning from corrections. The module encapsulates classification algorithms, metadata extraction patterns, confidence management, and learning systems while providing simple interfaces for document intelligence features.

**Advanced Code Patterns:**
- Strategy pattern for different classification models (pre-trained, custom ML, rule-based)
- Observer pattern for classification result notifications
- Factory pattern for creating metadata extractors per document type
- Command pattern for classification correction and learning
- Adapter pattern for different AI service providers
- Event-driven architecture for classification workflows

**Anti-Patterns (AI):**
- Do not rely on a single classification model without fallback
- Avoid overfitting classification models to specific document types
- Do not ignore confidence scores when auto-applying classifications
- Avoid training models on biased or unrepresentative document samples
- Do not cache classification results without proper invalidation

**Advanced Code Patterns:**
- Repository pattern for classification and metadata persistence
- State machine for classification lifecycle management
- Decorator pattern for adding classification to document operations
- Caching strategies for classification model optimization
- Queue management for batch document processing
- Feedback loop implementation for model improvement

**Anti-Patterns:**
- Do not block document operations with synchronous classification
- Avoid storing raw document content in classification logs
- Do not ignore user corrections to classification results
- Avoid complex classification rules without clear business value
- Do not bypass manual review for low-confidence classifications

**Rules to Follow:**
- Classification must complete within 5 seconds for documents <50MB
- Confidence scores must be displayed to users for all classifications
- User corrections must be incorporated into model within 24 hours
- Classification accuracy must be validated quarterly against human labels
- All classification features must work offline with cached models
- Manual review queue must be processed within 48 hours

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
