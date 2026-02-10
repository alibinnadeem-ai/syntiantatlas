# Syntiant Atlas - Phase 9+ Implementation Plan

## Current State (End of Phase 8)

Phases 1-8 are complete. The platform has:
- Full monorepo (NestJS API + Next.js 14 frontend + Prisma + Docker)
- 22 backend modules (auth, users, properties, investments, transactions, KYC, governance, tickets, notifications, payments, marketplace, dividends, email, SMS, IPFS, compliance, AML, audit, audit-export, analytics, settings, health)
- 4 role-based dashboards (investor, seller, admin, staff)
- Smart contracts scaffold, CI/CD, governance, compliance, AML

**What's missing** (see `FEATURE_GAP_ANALYSIS.md` for full details):
- Seller cannot edit/delete properties after creation
- No admin bootstrap (seed) mechanism
- Admin cannot edit/suspend/delete users
- 7 investor-facing pages from the skills.md spec are missing
- 3 existing pages need significant enhancement
- Settings page only has 2 of 7 spec'd sections
- 10+ reusable UI components missing
- No referrals backend module
- No content/learning backend module

---

## Phase 9: Platform Foundation Fixes & Admin Bootstrap

**Goal:** Fix critical operational gaps — admin bootstrap, seller property CRUD, and admin user management. Without these, the platform cannot be operated.

### 9A. Database Seed & Admin Bootstrap

**Problem:** No way to create the first admin account. No seed script exists.

**Deliverables:**
- `prisma/seed.ts` — Creates initial admin user, default system settings, and role definitions
- Add `prisma.seed` config to `package.json`
- Seed includes: admin account (email/password from env), default platform settings (min investment, platform fee %, etc.)

**Files:**
- Create: `prisma/seed.ts`
- Modify: root `package.json` (add seed script), `prisma/schema.prisma` (add seed config)

**Verification:**
- `npx prisma db seed` creates admin account
- Admin can log in and access `/admin`

### 9B. Seller Property CRUD (Edit + Delete)

**Problem:** Sellers can create and view properties but cannot edit or delete them. Backend PUT endpoint exists but is not wired to the frontend. No DELETE endpoint exists.

**Deliverables:**

Backend:
- Add `DELETE /properties/:id` endpoint (soft delete or hard delete, seller/admin only)
- Verify existing `PUT /properties/:id` works correctly for sellers

Frontend:
- Add `updateProperty(id, data)` and `deleteProperty(id)` methods to API client
- Create `/seller/properties/[id]/page.tsx` — property detail view for sellers with status badge, investment stats
- Create `/seller/properties/[id]/edit/page.tsx` — edit form (reuses new-property form structure, pre-filled)
- Add edit/delete action buttons on seller property cards and detail page
- Delete confirmation modal
- Status-aware UI: only allow edit on `pending_review` or `rejected` properties

**Files:**
- Modify: `apps/api/src/modules/properties/properties.controller.ts` (add DELETE)
- Modify: `apps/api/src/modules/properties/properties.service.ts` (add delete method)
- Modify: `apps/web/src/lib/api-client.ts` (add updateProperty, deleteProperty)
- Create: `apps/web/src/app/(seller)/seller/properties/[id]/page.tsx`
- Create: `apps/web/src/app/(seller)/seller/properties/[id]/edit/page.tsx`

**Verification:**
- Seller can view individual property details
- Seller can edit a pending/rejected property
- Seller can delete a property (with confirmation)
- Cannot edit an `active` or `funded` property

### 9C. Admin User Management Enhancements

**Problem:** Admin can list users and create staff accounts but cannot edit, suspend, or delete users.

**Deliverables:**

Backend:
- Add `PUT /admin/users/:id` endpoint (update role, suspend/unsuspend)
- Add `DELETE /admin/users/:id` endpoint (soft delete / deactivate)
- Add `PUT /admin/users/:id/suspend` and `/unsuspend` endpoints

Frontend:
- Add user detail modal or page (`/admin/users/[id]`)
- Add edit user form (change role, update info)
- Add suspend/unsuspend toggle button
- Add delete user with confirmation
- Add user activity summary (investments, transactions, KYC status)
- Add `updateUser()`, `suspendUser()`, `deleteUser()` to API client

**Files:**
- Modify: `apps/api/src/modules/users/users.controller.ts`
- Modify: `apps/api/src/modules/users/users.service.ts`
- Create: `apps/api/src/modules/users/dto/update-user.dto.ts`
- Modify: `apps/web/src/lib/api-client.ts`
- Create: `apps/web/src/app/(admin)/admin/users/[id]/page.tsx`

**Verification:**
- Admin can view user detail page
- Admin can change a user's role
- Admin can suspend/unsuspend a user
- Admin can deactivate a user account
- Suspended users cannot log in

---

## Phase 10: Shared UI Component Library

**Goal:** Build the reusable component library that all subsequent pages depend on. Building these once avoids duplication across phases 11-14.

### Components to build:

#### 10A. Data Display Components
- **DataTable** (`components/ui/data-table.tsx`) — Responsive table with desktop table layout + mobile card layout, column sorting, row selection, row actions dropdown
- **MetricCard** (`components/ui/metric-card.tsx`) — Summary stat card with icon, label, value, sub-text, optional trend indicator
- **EmptyState** (`components/ui/empty-state.tsx`) — Standardized empty state: icon + heading + message + CTA button
- **StatusBadge** (`components/ui/status-badge.tsx`) — Color-coded status pill (active, pending, completed, failed, etc.)

#### 10B. Interactive Components
- **TabNavigation** (`components/ui/tab-navigation.tsx`) — Tab bar with content panels, URL query param sync, keyboard navigation, ARIA roles
- **FilterPanel** (`components/ui/filter-panel.tsx`) — Collapsible filter sidebar with date range picker, dropdowns, checkboxes, active filter chips, "Clear All" button
- **ExportButton** (`components/ui/export-button.tsx`) — Export dropdown with format options (PDF, CSV, Excel), triggers download via API
- **CopyButton** (`components/ui/copy-button.tsx`) — Copy to clipboard with "Copied!" feedback tooltip, auto-reset after 2s
- **ConfirmModal** (`components/ui/confirm-modal.tsx`) — Generic confirmation dialog with customizable title, message, confirm/cancel buttons, destructive variant
- **ImageCarousel** (`components/ui/image-carousel.tsx`) — Swipeable image carousel with prev/next arrows, dot indicators, slide counter, touch support

#### 10C. Utility Components
- **QRCodeDisplay** (`components/ui/qr-code-display.tsx`) — QR code generation from data string with download button (uses `qrcode.react`)
- **SocialShareButtons** (`components/ui/social-share-buttons.tsx`) — WhatsApp, Facebook, Twitter/X, Email share buttons with pre-filled messages
- **Pagination** (`components/ui/pagination.tsx`) — Page navigation with prev/next, page numbers, "Showing X-Y of Z" text

**Dependencies to install:** `qrcode.react`

**Files:** ~13 new files in `apps/web/src/components/ui/`

**Verification:**
- Each component renders correctly in isolation
- Build passes with all new components
- Components are exported and importable

---

## Phase 11: Core Investor Pages (Tier 1)

**Goal:** Build the missing investor-facing pages that complete the primary investment lifecycle.

### 11A. Active Investments Page

**Route:** `/active-investments`

**Frontend:**
- Summary header with "Help" (WhatsApp link), "Investment Report", and "Explore" buttons
- Investment cards showing: property name, thumbnail, total invested, payment progress bar, installment schedule, next payment date, status badge
- Empty state with "Purchase Now" CTA → `/properties`
- Uses: MetricCard, EmptyState, StatusBadge

**Backend:**
- May need new endpoint: `GET /investments/active` returning investments with installment breakdown
- Extend investments service if needed

**Files:**
- Create: `apps/web/src/app/(dashboard)/active-investments/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` (add nav item)
- Modify: `apps/web/src/lib/api-client.ts` (add getActiveInvestments if needed)
- Modify: `apps/api/src/modules/investments/` (add endpoint if needed)

### 11B. Income Streams Page

**Route:** `/income`

**Frontend:**
- Summary cards: Income Generating Area, Income from Rentals, Upcoming Income
- Tab 1: Rentals & Credits — table with rental payment history, property name, amount, date, status
- Tab 2: Rewards & Commissions — "Coming Soon" placeholder with WhatsApp support link
- Action buttons: Generate Rental Report, Sell Area
- Uses: MetricCard, TabNavigation, DataTable, EmptyState

**Backend:**
- Wire to existing `dividends` module
- May need: `GET /dividends/summary` (income stats), `GET /dividends/history` (payment history)

**Files:**
- Create: `apps/web/src/app/(dashboard)/income/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` (add nav item)
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/api/src/modules/dividends/` (add endpoints if needed)

### 11C. Transactions Page Enhancement

**Route:** `/transactions` (existing, enhance)

**Enhancements:**
- Add 4 summary MetricCards at top: Total Invested, Total Income, Pending Transactions, Net Balance
- Add ExportButton with PDF/CSV/Excel options
- Replace basic list with DataTable (responsive, sortable)
- Add FilterPanel: date range, type, status, amount range, property, payment method
- Add active filter chips with "Clear All"
- Add CopyButton on transaction IDs
- Add transaction detail modal (click row to expand)
- Backend: `GET /transactions/summary` endpoint for metric cards, `GET /transactions/export` for file download

**Files:**
- Rewrite: `apps/web/src/app/(dashboard)/transactions/page.tsx`
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/api/src/modules/transactions/` (add summary + export endpoints)

### 11D. Portfolio Page Enhancement

**Route:** `/portfolio` (existing, enhance)

**Enhancements:**
- Add MetricCards: Net Amount Invested (PKR), Total Area Owned (sq ft)
- Add TabNavigation:
  - Tab 1: Area Ownership — owned area breakdown by property, wallet address display
  - Tab 2: Accumulated Property — active demarcation investments, demarcated units overview
- Proper empty states with CTAs → `/properties`

**Files:**
- Rewrite: `apps/web/src/app/(dashboard)/portfolio/page.tsx`

### 11E. Settings Page Completion

**Route:** `/settings` (existing, extend from 2 to 7 sections)

**New sections (added to `settings-page-content.tsx`):**

1. **Personal Details** (enhance existing) — Add DOB date picker, photo upload, gender select, phone verify button
2. **Address** — Address list + "Add new address" modal form (street, city, state, postal code, country, default toggle)
3. **Bank Details** — Bank account list + "Add new bank" modal form (bank name, account title, IBAN, branch code, default toggle)
4. **Legal Information** — CNIC input, FBR tax filer radio group (Yes/No), CNIC front/back image upload, Next of Kin section with add form
5. **Notifications** — Push notifications toggle, SMS notifications toggle, email digest preference
6. **Wallet Info** — Wallet address (read-only + CopyButton), QR code display (QRCodeDisplay component), "Connect Wallet" button (disabled, "Coming Soon")

**Backend:**
- Add endpoints: `POST/GET/PUT/DELETE /users/addresses`, `POST/GET/PUT/DELETE /users/bank-accounts`, `PUT /users/legal-info`, `PUT /users/notification-preferences`, `GET /users/wallet-info`
- Add Prisma models: `UserAddress`, `BankAccount`, `LegalInfo`, `NotificationPreference` (or extend User model)
- Update: `prisma/schema.prisma`

**Files:**
- Modify: `apps/web/src/components/features/settings/settings-page-content.tsx` (major expansion)
- Modify: `apps/web/src/lib/api-client.ts`
- Modify: `apps/api/src/modules/users/` (add sub-controllers/services for addresses, banks, legal, prefs)
- Modify: `prisma/schema.prisma` (new models)

**Verification (Phase 11 overall):**
- Active Investments page renders with investments or empty state
- Income Streams page shows dividends or empty state, tabs switch
- Transactions page has summary cards, filters, export, detail modal
- Portfolio page has tabs, area breakdown, empty states
- Settings has all 7 sections functional
- `turbo build` succeeds
- Navigation items in sidebar updated

---

## Phase 12: Growth & Engagement Features (Tier 2)

**Goal:** Build the features that drive platform growth, secondary trading, and investor engagement.

### 12A. Marketplace Page (Secondary Trading)

**Route:** `/marketplace`

**Frontend:**
- Beta badge in header
- Search bar with debounced search
- FilterPanel: property type, price range slider, area size, location, sort
- Listings grid (3-col responsive) — each card: property image, name, type, status badge, seller info, area for sale, price/sqft, performance metrics, "Buy Area" button
- "List Your Area" button → creation modal (select property, set area, set price)
- Empty states: no listings, no search results
- Purchase flow: click "Buy Area" → confirmation modal → API call → success/error feedback
- Uses: DataTable/Grid, FilterPanel, SearchInput, ConfirmModal, ImageCarousel, StatusBadge

**Backend:** `marketplace` module exists — wire frontend to it. May need additional listing/trading endpoints.

**Files:**
- Create: `apps/web/src/app/(dashboard)/marketplace/page.tsx`
- Create: `apps/web/src/app/(dashboard)/marketplace/[id]/page.tsx` (listing detail)
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` (add nav item)
- Modify: `apps/web/src/lib/api-client.ts` (add marketplace methods)

### 12B. E-Reports Page

**Route:** `/reports`

**Frontend:**
- TabNavigation:
  - Tab 1: Generate Report — form with date range picker, report type selection, property filter, "Generate" button with loading state
  - Tab 2: Statement Logs — DataTable of previously generated reports with date, type, status, download button
- ExportButton for downloading generated reports
- Empty states for both tabs

**Backend:**
- Extend `compliance` module or create `reports` sub-module: `POST /reports/generate`, `GET /reports/history`, `GET /reports/:id/download`

**Files:**
- Create: `apps/web/src/app/(dashboard)/reports/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` (add nav item)
- Modify: `apps/web/src/lib/api-client.ts`

### 12C. Referrals System (Backend + Frontend)

**Route:** `/referrals`

**Backend (new `referrals` module):**
- Prisma models: `ReferralCode` (userId, code, createdAt), `Referral` (referrerId, referredId, status, investmentAmount, commission, createdAt)
- Service: generate unique referral code on registration, track referral sign-ups, calculate commissions based on tier structure, process earnings
- Controller endpoints: `GET /referrals/summary`, `GET /referrals/code`, `GET /referrals/activity`, `GET /referrals/earnings`
- Hook into auth register flow to track referrer

**Frontend:**
- Summary MetricCards: Total Referrals, Active Referrals, Total Earnings, Pending Rewards
- Referral link section: input with URL + CopyButton + QRCodeDisplay
- SocialShareButtons (WhatsApp, Facebook, Twitter, Email)
- Rewards tier structure explanation section
- Referral activity DataTable: Name/ID, Sign-up Date, Status, Investment Amount, Earnings, Actions
- Earnings timeline chart

**Files:**
- Create: `apps/api/src/modules/referrals/` (module, controller, service, dto) — ~5 files
- Modify: `prisma/schema.prisma` (add ReferralCode, Referral models)
- Create: `apps/web/src/app/(dashboard)/referrals/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Modify: `apps/web/src/lib/api-client.ts`

### 12D. Properties Page Enhancement

**Route:** `/properties` (existing, enhance)

**Enhancements:**
- Filter tabs with count badges: All, Developmental, Mature, Upcoming
- ImageCarousel on each property card (replace static images)
- "New Listing" badge on properties created within 7 days
- More detailed stats per card: ROI %, completion %, investor count
- Improved property detail page: image gallery, investment breakdown chart, investor count, funding timeline

**Files:**
- Modify: `apps/web/src/app/(dashboard)/properties/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/properties/[id]/page.tsx`

**Verification (Phase 12 overall):**
- Marketplace page loads listings, search/filter works, buy/sell flows complete
- E-Reports page generates reports and shows history
- Referral code generated for new users, sharing works, activity tracked
- Properties page has image carousel, filter tabs, enhanced stats
- `turbo build` succeeds

---

## Phase 13: Content, Tools & Placeholder Pages (Tier 3)

**Goal:** Build remaining spec'd pages — educational content, tools, and placeholder/coming-soon pages.

### 13A. Explore & Learn Page

**Route:** `/learn`

**Backend (new `content` module):**
- Prisma models: `ContentItem` (title, body, type [article/video/infographic], category, difficulty, readTime, thumbnailUrl, tags, publishedAt), `ContentProgress` (userId, contentId, completed, lastReadAt)
- Admin CRUD for content management
- Public read endpoints with filters

**Frontend:**
- Hero section with search bar
- Category cards grid: Getting Started, Investment Basics, Real Estate 101, DAO & Blockchain, Market Insights, Advanced Strategies
- Content type tabs/filter: All, Articles, Videos, Infographics
- Content card grid with thumbnail, title, excerpt, read time, tags, bookmark icon
- Content detail page: full article/video embed with related content sidebar
- Auth-dependent: personalized recommendations and reading progress for logged-in users

**Files:**
- Create: `apps/api/src/modules/content/` (~5 files)
- Modify: `prisma/schema.prisma`
- Create: `apps/web/src/app/(dashboard)/learn/page.tsx`
- Create: `apps/web/src/app/(dashboard)/learn/[id]/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`
- Modify: `apps/web/src/lib/api-client.ts`

### 13B. Rewards Shop Page (Placeholder)

**Route:** `/rewards-shop`

**Frontend only (no backend):**
- Reward/gift illustration
- "Coming Soon" heading
- Description message
- "Contact Support" link (WhatsApp or ticket creation)

**Files:**
- Create: `apps/web/src/app/(dashboard)/rewards-shop/page.tsx`
- Modify: `apps/web/src/app/(dashboard)/layout.tsx`

### 13C. Tools (External Links)

**No new pages needed.** Add to sidebar navigation:
- "DAO Bot" — external link icon, opens AI chat in new tab
- "Calculators" — external link icon, opens calculator portal in new tab

**Files:**
- Modify: `apps/web/src/app/(dashboard)/layout.tsx` (add nav items with external link markers)
- Modify: `apps/web/src/components/layout/dashboard-layout.tsx` (support external links with `target="_blank"` icon)

**Verification (Phase 13 overall):**
- Learn page shows content categories and articles
- Rewards Shop shows coming soon state
- External tool links open in new tabs
- `turbo build` succeeds

---

## Phase 14: Layout, Navigation & UX Polish

**Goal:** Enhance sidebar, header, and overall navigation to match the full skills.md spec.

### 14A. Sidebar Enhancements

- Expandable section groups:
  - "My DAO" (expandable) → Portfolio, Active Investments, Income Streams
  - "Tools" (expandable) → DAO Bot (external), Calculators (external)
- Beta badge on Marketplace nav item
- External link icon (↗) on external tool links
- Footer section: divider, copyright notice, "Powered by Syntiant", release version
- Persist expanded/collapsed sections in localStorage

**Files:**
- Modify: `apps/web/src/components/layout/dashboard-layout.tsx` (major sidebar refactor)
- Modify: all layout files to use new nav item format (add `group`, `external`, `badge` fields to NavItem type)

### 14B. Header Enhancements

- Breadcrumb navigation (auto-generated from route path)
- "Book a Meeting" button (links to external calendar/Calendly)
- Cart/Wishlist button with count badge (if cart feature implemented)
- Enhanced user dropdown: user ID, "Active Purchases" link, "Account Settings" link, divider, logout

**Files:**
- Modify: `apps/web/src/components/layout/dashboard-layout.tsx` (header section)

### 14C. Global UX Polish

- Consistent loading skeletons on all pages (replace spinners with skeleton screens)
- Toast notification system (success/error/warning/info, auto-dismiss, stackable)
- Error boundaries on each route group
- 404 page for invalid routes
- Mobile hamburger menu for sidebar collapse
- Keyboard navigation improvements (tab order, focus visible)

**Files:**
- Create: `apps/web/src/components/ui/toast.tsx`
- Create: `apps/web/src/app/not-found.tsx`
- Create: `apps/web/src/components/ui/skeleton.tsx`
- Modify: various layout and page files

**Verification (Phase 14 overall):**
- Sidebar has expandable groups, badges, footer, external links
- Header has breadcrumbs and enhanced dropdown
- Toast notifications appear on actions (invest, deposit, save settings, etc.)
- 404 page shows for invalid routes
- `turbo build` succeeds

---

## Phase 15: Testing & Quality Assurance

**Goal:** Add test coverage across the platform.

### 15A. Backend Unit Tests
- Auth module: register, login, token refresh, password change
- Properties module: CRUD, authorization (seller owns property), status transitions
- Investments module: invest transaction, portfolio calculation, double-invest prevention
- Transactions module: deposit, withdraw, balance calculation
- Each module: DTO validation, service logic, guard behavior

### 15B. Backend Integration Tests
- Full auth flow: register → login → access protected route → refresh → logout
- Investment flow: register → deposit → invest → check portfolio → check transaction history
- Admin flow: login as admin → create staff → staff logs in
- Seller flow: register as seller → create property → admin approves → investors can see it

### 15C. Frontend Component Tests
- Shared UI components: DataTable, FilterPanel, TabNavigation, EmptyState, ConfirmModal
- Auth guard: renders children for authenticated, redirects for unauthenticated
- Forms: validation triggers, submission states, error display

### 15D. E2E Tests (Cypress or Playwright)
- Investor journey: register → KYC → deposit → browse → invest → view portfolio → view transactions
- Seller journey: register → create property → edit property → view dashboard
- Admin journey: login → manage users → approve property → review KYC → manage tickets

**Files:**
- Create: `apps/api/test/` directory with test files per module
- Create: `apps/web/__tests__/` directory with component tests
- Create: `e2e/` directory with E2E test specs
- Modify: `turbo.json` (add test pipeline)
- Modify: `.github/workflows/ci.yml` (add test step)

---

## Dependency Graph

```
Phase 9 (Foundation Fixes)
    ├── 9A: Seed/Bootstrap (independent)
    ├── 9B: Seller CRUD (independent)
    └── 9C: Admin User Mgmt (independent)
         │
Phase 10 (UI Components) ← depends on Phase 9
         │
Phase 11 (Core Investor Pages) ← depends on Phase 10
    ├── 11A: Active Investments
    ├── 11B: Income Streams
    ├── 11C: Transactions Enhancement
    ├── 11D: Portfolio Enhancement
    └── 11E: Settings Completion
         │
Phase 12 (Growth Features) ← depends on Phase 10, can overlap Phase 11
    ├── 12A: Marketplace
    ├── 12B: E-Reports
    ├── 12C: Referrals (backend + frontend)
    └── 12D: Properties Enhancement
         │
Phase 13 (Content & Placeholders) ← depends on Phase 10
    ├── 13A: Explore & Learn (backend + frontend)
    ├── 13B: Rewards Shop (placeholder)
    └── 13C: Tools (external links)
         │
Phase 14 (UX Polish) ← depends on Phases 11-13
    ├── 14A: Sidebar
    ├── 14B: Header
    └── 14C: Global UX
         │
Phase 15 (Testing) ← depends on all above
    ├── 15A: Backend Unit Tests
    ├── 15B: Backend Integration Tests
    ├── 15C: Frontend Component Tests
    └── 15D: E2E Tests
```

---

## Summary Table

| Phase | Focus | New Files | Modified Files | Backend Changes |
|-------|-------|-----------|----------------|-----------------|
| 9 | Foundation Fixes | ~12 | ~8 | Seed, delete endpoint, user mgmt endpoints |
| 10 | UI Components | ~13 | ~1 | None |
| 11 | Core Investor Pages | ~8 | ~10 | Transaction summary/export, dividend endpoints, user settings endpoints, Prisma models |
| 12 | Growth Features | ~12 | ~8 | Referrals module, marketplace wiring, reports endpoints |
| 13 | Content & Placeholders | ~8 | ~4 | Content module, Prisma models |
| 14 | UX Polish | ~4 | ~10 | None |
| 15 | Testing | ~30 | ~5 | Test infrastructure |
| **Total** | | **~87** | **~46** | |
