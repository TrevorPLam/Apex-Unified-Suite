# TODO-P9-MOBILE.md – Phase 9: Mobile Applications

This task document is engineered for 100% agentic coding. The owner of this repository is not a software developer. The owner of this repo has decided to integrate "The Framework" into the agentic task flow to ensure perfect execution. This is a blend of deep module, DDD, TDD, and BDD; purposely leaving these labels in every open task for context injection and agentic steering.

Every parent task should be small in size, and should be broken down into subtasks with direct file paths when applicable.

Each SMALL parent task should have a box to mark complete, a unqiue task ID, and a status indicator.

Each SMALLER subtask should have a box to mark complete, a unique TASK ID related to the parent task ID, and direct file paths when application, and a task description.

Each parent task should have a well reasoned definition of done, out of scope, rules to follow, advanced code patterns, anti-patterns, related files, depends on, imports from/exports to, blocks, verification.

Each subtask/task should direct specfic commands to be utilized through the process, optimized to reduce context usage, swift execution, etc.

---

## Phase 9 Mobile Applications Task Index

- [ ] MOBILE‑001 – iOS Mobile Application
- [ ] MOBILE‑002 – Android Mobile Application
- [ ] MOBILE‑003 – Cross‑Platform Mobile Development
- [ ] MOBILE‑DOCS‑001 – Mobile Document Access
- [ ] MOBILE‑FIN‑001 – Mobile AP/AR Approval Interface

---

## Mobile Applications

### [ ] MOBILE‑001: iOS Mobile Application Foundation
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑APPT‑006 (team scheduling interface), INT‑CALENDAR‑003.  
**Definition of Done:**
- React Native iOS project structure with TypeScript configuration.
- Core navigation and app shell with bottom tab bar.
- Authentication flow with secure token storage (Keychain).
- API client integration with request/response interceptors.
- Development build pipeline configured for iOS simulator and device.

**Deep Module:**
- Mobile API client is a deep module: simple interface (api.get('/appointments')) but complex implementation handling authentication token refresh, request queuing during offline periods, response caching with cache invalidation, and retry logic with exponential backoff.
- Secure token storage abstracts Keychain complexity behind simple getToken/setToken interface with biometric authentication option.

**DDD:** Mobile app as presentation layer; uses API client to communicate with backend bounded contexts. No domain logic in mobile app.
**TDD:** Unit test verifying that API client correctly queues requests when offline and flushes queue when connectivity restored.
**BDD:** "As a user, I can open the iOS app and view my appointments after logging in."

**Advanced Code Patterns:**
- **Offline-First Architecture**: Implement request queue for offline periods with automatic sync on reconnection.
- **Secure Storage with Keychain**: Use iOS Keychain for token storage with kSecAttrAccessibleAfterFirstUnlock accessibility.
- **API Client with Interceptors**: Implement Axios interceptors for auth token injection and automatic refresh on 401.
- **React Navigation with Deep Linking**: Configure deep linking for appointment detail URLs.

**Anti-Patterns:**
- ❌ **Storing Tokens in AsyncStorage**: Don't store auth tokens in AsyncStorage; use Keychain for security.
- ❌ **Synchronous API Calls on UI Thread**: Don't block UI with synchronous API calls; use async/await with loading states.
- ❌ **No Offline Handling**: Don't fail when offline; queue requests and retry.
- ❌ **Hard-Coded API URLs**: Don't hard-code API URLs; use environment configuration.

**Rules to Follow:**
- **MOBILE‑012**: Use iOS Keychain for secure token storage; never use AsyncStorage for credentials.
- **OFFLINE‑018**: Implement request queue for offline support; auto-sync on reconnect.
- **NAV‑015**: Use React Navigation with TypeScript; configure deep linking.
- **TDD‑025**: Test API client offline behavior; verify queue and flush logic.
- **CONFIG‑022**: Use react-native-config for environment variables; no hard-coded URLs.

**Subtasks:**
- [ ] MOBILE‑001.1: Initialize React Native iOS project with TypeScript. (AGENT) – `mobile/ios/`  
  **verification:** `cd mobile/ios && npx react-native run-ios` builds successfully.
- [ ] MOBILE‑001.2: Configure API client with auth interceptors and offline queue. (AGENT) – `mobile/src/api/client.ts`  
  **verification:** `npm test -- --testPathPattern=api-client` passes.
- [ ] MOBILE‑001.3: Implement Keychain-based secure token storage. (AGENT) – `mobile/src/utils/secureStorage.ts`  
  **verification:** `npm test -- --testPathPattern=secureStorage` passes.
- [ ] MOBILE‑001.4: Set up navigation structure with deep linking. (AGENT) – `mobile/src/navigation/`  
  **verification:** `xcrun simctl openurl booted apex://appointments/123` opens appointment screen.
- **Depends on:** FRONT‑APPT‑006.
- **Blocks:** MOBILE‑002, MOBILE‑005.

### [ ] MOBILE‑005: iOS Scheduling Features (Calendly-Style)
**Status:** ⏳ Not Started  
**Depends on:** MOBILE‑001, API‑APPT‑006.  
**Definition of Done:**
- Event type selection screen with availability display.
- Routing forms for intake questions before booking.
- Waitlist join functionality with push notification when slot opens.
- No-show tracking with check-in confirmation.
- Appointment management (view, reschedule, cancel).
- Push notifications for appointment reminders.

**Deep Module:**
- Mobile scheduling UI is a deep module: simple interface (render availability slots) but complex implementation handling timezone conversion, offline availability caching, optimistic booking with rollback, and real-time slot updates via WebSocket.

**DDD:** Mobile presentation layer consuming Appointments API; uses optimistic UI patterns for responsiveness.
**TDD:** Unit test verifying that booking a slot while offline queues the request and shows optimistic confirmation.
**BDD:** "As a client, I can book an appointment through the iOS app with the same options as the web interface."

**Advanced Code Patterns:**
- **Optimistic UI with Rollback**: Show immediate booking confirmation; rollback with toast notification if server rejects.
- **Offline Availability Cache**: Cache availability data for offline browsing with TTL invalidation.
- **WebSocket for Real-Time Updates**: Subscribe to slot availability changes via WebSocket for live updates.
- **Form Builder with Validation**: Dynamic form rendering from routing form schema with client-side validation.

**Anti-Patterns:**
- ❌ **Blocking UI on API Calls**: Don't show loading spinner during booking; use optimistic updates.
- ❌ **No Offline Support**: Don't require constant connectivity; cache for offline viewing.
- ❌ **Polling for Updates**: Don't poll for availability changes; use WebSocket or push notifications.
- ❌ **Client-Side Timezone Math**: Don't calculate timezones in app; use API-provided local times.

**Rules to Follow:**
- **OPTIMISTIC‑018**: Use optimistic UI for booking actions; implement rollback on failure.
- **CACHE‑028**: Cache availability data with 5-minute TTL for offline support.
- **WEBSOCKET‑015**: Use WebSocket for real-time slot availability updates.
- **TDD‑035**: Test optimistic booking flow; verify rollback on server rejection.
- **FORM‑022**: Render routing forms dynamically from API schema; validate client-side.

**Subtasks:**
- [ ] MOBILE‑005.1: Build event type selection with availability display. (AGENT) – `mobile/src/screens/EventTypes.tsx`  
  **verification:** `npm test -- --testPathPattern=EventTypes` passes; shows mocked availability.
- [ ] MOBILE‑005.2: Implement routing forms with dynamic field rendering. (AGENT) – `mobile/src/components/RoutingForm/`  
  **verification:** `npm test -- --testPathPattern=RoutingForm` passes; validates required fields.
- [ ] MOBILE‑005.3: Add waitlist join with push notification support. (AGENT) – `mobile/src/screens/Waitlist.tsx`  
  **verification:** `npm test -- --testPathPattern=Waitlist` passes; queues join request.
- [ ] MOBILE‑005.4: Build appointment management screens. (AGENT) – `mobile/src/screens/Appointments/`  
  **verification:** `npm test -- --testPathPattern=Appointments` passes; CRUD operations work.
- **Depends on:** MOBILE‑001.
- **Blocks:** MOBILE‑002.

### [ ] MOBILE‑002: Android Mobile Application Foundation
**Status:** ⏳ Not Started  
**Depends on:** MOBILE‑005, INT‑CALENDAR‑003.  
**Definition of Done:**
- React Native Android project sharing code with iOS where possible.
- Android-specific optimizations (Firebase, Material Design).
- Platform-specific notification handling via Firebase Cloud Messaging.
- Cross-platform component testing suite.

**Deep Module:**
- Android platform adapter is a deep module: simple interface (initializeAndroid()) but complex implementation handling Android-specific permission models, Firebase integration, notification channels, and secure storage via Android Keystore.

**DDD:** Mobile presentation layer; Android-specific platform code communicates with shared business logic.
**TDD:** Unit test verifying that Firebase token registration handles retry on initial failure.
**BDD:** "As an Android user, I can book appointments and receive push notifications."

**Advanced Code Patterns:**
- **Platform-Specific Modules**: Use React Native's Platform module for iOS/Android branching with shared core.
- **Firebase Integration**: Use Firebase Cloud Messaging with notification channels for Android 8+.
- **Android Keystore Storage**: Use Android Keystore for secure token storage equivalent to iOS Keychain.
- **Material Design Components**: Use react-native-paper for Material Design compliance.

**Anti-Patterns:**
- ❌ **Duplicating Business Logic**: Don't duplicate business logic in Android; share via common modules.
- ❌ **Ignoring Notification Channels**: Don't send notifications without channels on Android 8+.
- ❌ **Hard-Coded Permissions**: Don't request all permissions at startup; request contextually.
- ❌ **Main Thread Networking**: Don't run network operations on main thread; use async patterns.

**Rules to Follow:**
- **PLATFORM‑018**: Share business logic via common modules; use platform code only for native features.
- **FIREBASE‑022**: Implement Firebase with proper notification channels and channel groups.
- **KEYSTORE‑015**: Use Android Keystore for secure storage; never use SharedPreferences for tokens.
- **TDD‑032**: Test platform-specific code with mocked native modules.
- **PERMISSION‑025**: Request permissions contextually; explain why permission is needed.

**Subtasks:**
- [ ] MOBILE‑002.1: Set up React Native Android project with shared modules. (AGENT) – `mobile/android/`  
  **verification:** `cd mobile/android && npx react-native run-android` builds successfully.
- [ ] MOBILE‑002.2: Implement Android Keystore-based secure storage. (AGENT) – `mobile/src/utils/secureStorage.android.ts`  
  **verification:** `npm test -- --testPathPattern=secureStorage` passes on Android.
- [ ] MOBILE‑002.3: Configure Firebase Cloud Messaging with notification channels. (AGENT) – `mobile/src/notifications/firebase.ts`  
  **verification:** `adb shell am start -W -a android.intent.action.VIEW -d "apex://appointments/123"` opens screen.
- [ ] MOBILE‑002.4: Apply Material Design components and theme. (AGENT) – `mobile/src/theme/`  
  **verification:** `npm test -- --testPathPattern=theme` passes; components match Material Design.
- **Depends on:** MOBILE‑001.
- **Blocks:** MOBILE‑003.

### [ ] MOBILE‑003: Cross‑Platform Mobile Development
**Status:** ⏳ Not Started  
**Depends on:** MOBILE‑001, MOBILE‑002.  
**Definition of Done:**
- Unified codebase for iOS and Android platforms.
- Shared business logic and UI components **covering the full Calendly feature set, CRM core workflows, and project task management**.
- Platform‑specific optimisations and features.
- Cross‑platform testing and quality assurance.
- Mobile app store deployment and maintenance.

**Deep Module:**
- Cross-platform module federation is a deep module: simple interface (import from '@shared/core') but complex implementation handling platform-specific module resolution, tree-shaking across platforms, and conditional native module loading.

**DDD:** Shared presentation layer with platform-specific entry points; all domain logic remains in backend.
**TDD:** Unit test verifying that shared hooks work correctly on both iOS and Android with mocked platform APIs.
**BDD:** "As a developer, I can write code once and have it work on both iOS and Android."

**Advanced Code Patterns:**
- **Monorepo with Module Federation**: Use pnpm workspaces with shared packages imported by both platforms.
- **Platform-Specific File Extensions**: Use `.ios.ts` and `.android.ts` extensions for platform variants.
- **React Native Testing Library**: Use RNTL with jest for cross-platform component testing.
- **Code Push for Updates**: Use Microsoft CodePush for over-the-air updates without store approval.

**Anti-Patterns:**
- ❌ **Platform-Specific Duplication**: Don't duplicate entire screens; extract platform-agnostic components.
- ❌ **Runtime Platform Checks**: Don't use if/else for platform inside render; use platform-specific files.
- ❌ **Ignoring Platform Constraints**: Don't ignore iOS/Android design differences; respect platform conventions.
- ❌ **No E2E Testing**: Don't rely only on unit tests; implement E2E with Detox.

**Rules to Follow:**
- **SHARE‑018**: Extract shared components to common packages; minimize platform-specific code.
- **PLATFORM‑022**: Use `.ios.ts` and `.android.ts` extensions for platform variants, not runtime checks.
- **TEST‑028**: Implement Detox E2E tests for critical user flows on both platforms.
- **TDD‑038**: Test shared hooks with both platform mocks.
- **DEPLOY‑015**: Use CodePush for hotfixes; full releases through app stores.

**Subtasks:**
- [ ] MOBILE‑003.1: Extract shared components to monorepo packages. (AGENT) – `mobile/packages/shared/`  
  **verification:** `pnpm test --filter @mobile/shared` passes; tests run in both iOS and Android modes.
- [ ] MOBILE‑003.2: Configure platform-specific module resolution. (AGENT) – `mobile/metro.config.js`  
  **verification:** `npx react-native bundle --platform ios` and `--platform android` both succeed.
- [ ] MOBILE‑003.3: Implement Detox E2E testing for critical flows. (AGENT) – `mobile/e2e/`  
  **verification:** `detox test --configuration ios.sim.debug` passes all critical flow tests.
- [ ] MOBILE‑003.4: Set up CodePush and app store deployment pipeline. (AGENT) – `mobile/deployment/`  
  **verification:** `appcenter codepush release-react` succeeds; apps pass store review guidelines.
- **Depends on:** MOBILE‑001, MOBILE‑002.
- **Blocks:** AUTO‑001.

### [ ] MOBILE‑DOCS‑001: Mobile Document Access
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑DOCS‑004, MOBILE‑001.  
**Definition of Done:** Mobile‑optimised document experience:
- Native mobile document viewer with annotations and markup tools.
- Offline document access and synchronisation with conflict resolution.
- Mobile document upload from camera/gallery with automatic compression.
- Touch‑optimised document navigation and gesture controls.
- Push notifications for document updates and sharing requests.
- Document sharing via mobile apps and deep linking.
**Related Files:** `mobile/shared/src/documents/`, `DocumentViewer.tsx`

**Deep Module:**
- Mobile document viewer is a deep module: simple interface (renderDocument(documentId)) but complex implementation handling progressive PDF rendering for large files, annotation layer management with touch gestures, and offline caching with delta sync.

**DDD:** Mobile presentation layer for Documents context; uses Document aggregate via API.
**TDD:** Unit test verifying that large PDFs render progressively without blocking UI thread.
**BDD:** "As a mobile user, I can view documents offline and annotate them with touch gestures."

**Advanced Code Patterns:**
- **Progressive PDF Rendering**: Use react-native-pdf with lazy page loading for large documents.
- **Offline-First Sync**: Use WatermelonDB for offline document metadata with delta sync.
- **Gesture Handler for Annotations**: Use react-native-gesture-handler for smooth annotation drawing.
- **Background Upload with Retry**: Use react-native-background-upload for large file uploads with retry.

**Anti-Patterns:**
- ❌ **Loading Entire PDF into Memory**: Don't load entire PDF; use progressive rendering.
- ❌ **Synchronous File Operations**: Don't block UI with file I/O; use async native modules.
- ❌ **No Compression on Upload**: Don't upload full-resolution images; compress before upload.
- ❌ **Ignoring Storage Limits**: Don't cache indefinitely; implement LRU cache eviction.

**Rules to Follow:**
- **PDF‑015**: Use progressive PDF rendering with page virtualization for large documents.
- **CACHE‑032**: Implement LRU cache for offline documents with configurable size limit.
- **UPLOAD‑025**: Compress images to 1080p before upload; use background upload for files >10MB.
- **TDD‑042**: Test progressive rendering with 100+ page PDFs; verify smooth scrolling.
- **STORAGE‑018**: Monitor and report cache usage; implement automatic LRU eviction.

**Subtasks:**
- [ ] MOBILE‑DOCS‑001.1: Implement progressive PDF viewer with annotation support. (AGENT) – `mobile/src/documents/DocumentViewer.tsx`  
  **verification:** `npm test -- --testPathPattern=DocumentViewer` passes; renders 100-page PDF smoothly.
- [ ] MOBILE‑DOCS‑001.2: Add WatermelonDB for offline document sync. (AGENT) – `mobile/src/documents/sync.ts`  
  **verification:** `npm test -- --testPathPattern=document-sync` passes; syncs deltas correctly.
- [ ] MOBILE‑DOCS‑001.3: Build camera/gallery upload with compression. (AGENT) – `mobile/src/documents/Upload.tsx`  
  **verification:** `npm test -- --testPathPattern=document-upload` passes; compresses 4MB image to <500KB.
- [ ] MOBILE‑DOCS‑001.4: Implement touch-optimized annotation gestures. (AGENT) – `mobile/src/documents/Annotations/`  
  **verification:** `npm test -- --testPathPattern=annotations` passes; gestures recognized correctly.
- **Depends on:** FRONT‑DOCS‑004.
- **Blocks:** AUTO‑DOCS‑001.

### [ ] MOBILE‑FIN‑001: Mobile AP/AR Approval Interface
**Status:** ⏳ Not Started  
**Depends on:** FRONT‑FIN‑001 (invoices & payments), FRONT‑FIN‑004 (AP inbox).  
**Definition of Done:** Mobile‑optimised finance workflow:
- Approve or reject bills directly from the mobile app with push notification deep‑links.
- Review invoice details including line items, vendor/customer info, and payment history.
- Execute single‑bill payments from mobile with biometric confirmation (Touch ID / Face ID).
- AP inbox view: see captured invoices, review extracted data, quick‑approve or flag for review.
- Payment run summary view (read‑only for mobile; execution remains on desktop).
- Offline queue: approve/reject actions queued when offline, synced when connection restored.

**Related Files:** `mobile/shared/src/finance/`, `MobileApprovalScreen.tsx`

**Deep Module:**
- Mobile finance approval is a deep module: simple interface (approveBill(billId)) but complex implementation handling offline action queuing with conflict resolution, biometric authentication integration, and secure payment request signing.

**DDD:** Mobile presentation layer for Finance context; uses Bill aggregate via API with offline queue.
**TDD:** Unit test verifying that offline approval is queued and executed in order when connectivity restored.
**BDD:** "As a finance manager, I can approve bills on mobile with biometric security, even when offline."

**Advanced Code Patterns:**
- **Offline Action Queue with Conflict Resolution**: Queue approvals offline with timestamp-based conflict resolution.
- **Biometric Auth with Fallback**: Use react-native-biometrics with PIN fallback for payment confirmation.
- **Request Signing**: Sign payment requests with device key for non-repudiation.
- **Swipeable List with Undo**: Use react-native-gesture-handler for swipe actions with undo timeout.

**Anti-Patterns:**
- ❌ **Approving Without Auth**: Don't allow high-value approvals without biometric confirmation.
- ❌ **No Offline Support**: Don't require connectivity for approvals; queue and retry.
- ❌ **Ignoring Conflict Resolution**: Don't blindly apply offline actions; check for conflicts.
- ❌ **Storing Payment Keys**: Don't store signing keys insecurely; use hardware-backed storage.

**Rules to Follow:**
- **BIOMETRIC‑018**: Require biometric auth for payments over $1,000; offer PIN fallback.
- **OFFLINE‑025**: Queue finance actions offline with optimistic UI and conflict detection.
- **SIGN‑015**: Cryptographically sign payment requests from mobile for audit trail.
- **TDD‑048**: Test offline action queue with simulated conflicts; verify resolution.
- **SECURITY‑032**: Use hardware-backed key storage for request signing; never export keys.

**Subtasks:**
- [ ] MOBILE‑FIN‑001.1: Build swipeable approval list with undo. (AGENT) – `mobile/src/finance/ApprovalList.tsx`  
  **verification:** `npm test -- --testPathPattern=ApprovalList` passes; swipe triggers with 3s undo.
- [ ] MOBILE‑FIN‑001.2: Implement biometric auth for payments. (AGENT) – `mobile/src/utils/biometricAuth.ts`  
  **verification:** `npm test -- --testPathPattern=biometricAuth` passes; falls back to PIN.
- [ ] MOBILE‑FIN‑001.3: Add offline action queue with conflict resolution. (AGENT) – `mobile/src/finance/OfflineQueue.ts`  
  **verification:** `npm test -- --testPathPattern=OfflineQueue` passes; handles conflicts correctly.
- [ ] MOBILE‑FIN‑001.4: Implement secure payment request signing. (AGENT) – `mobile/src/finance/PaymentSigner.ts`  
  **verification:** `npm test -- --testPathPattern=PaymentSigner` passes; signatures verify.
- **Depends on:** FRONT‑FIN‑001, FRONT‑FIN‑004.

---

### [ ] MOBILE‑ASSETS‑001: Mobile Barcode Scanning for Asset Check‑In/Out
**Status:** ⏳ Not Started  
**Depends on:** MOBILE‑001, API‑ASSETS‑005  
**Why updated:** AssetTiger's core field workflow relies on barcode scanning. Current mobile tasks mention scanning but don't define the API or UI specifics for assets.  
**Definition of Done:**
- `GET /api/v1/assets/by‑barcode/{barcode}` – quick lookup endpoint for status and basic info.  
- Mobile UI: a "Scan" tab that opens the camera, scans a barcode, and immediately shows the asset.  
- From the scanned asset screen, user can check‑out/check‑in with a single tap.  
**BDD:** "I can scan a laptop's barcode, see that it's currently checked out to John, and check it back in."  
**TDD:** Integration test verifying barcode lookup API and mobile scan workflow.  
**Deep Module:** Encapsulates barcode scanning, asset lookup, and check-in/out workflow in mobile context.

**Advanced Code Patterns:**
- Camera integration with react-native-camera or expo-camera
- Barcode decoding with ML Kit or ZXing
- Offline barcode cache for assets recently viewed
- Quick action buttons for common workflows post-scan

**Anti-Patterns:**
- No offline support requiring constant connectivity
- Slow camera initialization blocking UI
- No flashlight/torch control for low-light scanning
- Missing haptic feedback for successful scan

**Subtasks:**
- [ ] MOBILE‑ASSETS‑001.1: Implement barcode lookup API endpoint. (AGENT) – `artifacts/api-server/src/routes/assets/by-barcode.ts`
  **verification:** `npm test -- --testPathPattern=barcode-lookup` passes; returns asset by barcode.
- [ ] MOBILE‑ASSETS‑001.2: Add camera integration with barcode scanning. (AGENT) – `mobile/src/assets/BarcodeScanner.tsx`
  **verification:** Camera opens; barcodes detected; haptic feedback on scan.
- [ ] MOBILE‑ASSETS‑001.3: Build scanned asset detail view with status. (AGENT) – `mobile/src/assets/ScannedAssetScreen.tsx`
  **verification:** Asset info displayed; checkout status visible; assignee shown.
- [ ] MOBILE‑ASSETS‑001.4: Implement single-tap check-out/check-in actions. (AGENT)
  **verification:** Tap action executes API call; UI updates optimistically.
- [ ] MOBILE‑ASSETS‑001.5: Add offline asset cache for recent scans. (AGENT) – `mobile/src/assets/AssetCache.ts`
  **verification:** Recently scanned assets viewable offline; syncs on reconnect.
- [ ] MOBILE‑ASSETS‑001.6: Add torch control and scan history. (AGENT)
  **verification:** Flashlight toggle works; scan history persists locally.
- [ ] MOBILE‑ASSETS‑001.7: Write integration tests for scan workflow. (AGENT) – `mobile/e2e/barcode-scan.spec.ts`
  **verification:** E2E test covers scan → view → check-in flow.

---
