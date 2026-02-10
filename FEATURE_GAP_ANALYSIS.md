# Syntiant Atlas - Feature Gap Analysis & Implementation Plan

> Comparing the current application against the `skills.md` specification to identify missing features, incomplete pages, and enhancement opportunities.

---

## Summary

| Category | Spec'd Features | Implemented | Partially Done | Missing |
|----------|----------------|-------------|----------------|---------|
| Pages (Investor) | 12 | 6 | 3 | 3 |
| Pages (Seller) | 3 | 3 | 0 | 0 |
| Pages (Admin) | 6 | 6 | 0 | 0 |
| Settings Sections | 7 | 2 | 0 | 5 |
| Shared Components | 10+ | 3 | 0 | 7+ |
| Backend Modules | 22 | 22 | 0 | 0 |

**Backend is well-covered.** The gap is primarily on the frontend — several spec'd investor-facing pages are missing, the settings page is minimal, and shared UI components (carousel, export, QR code, social share, copy-to-clipboard) do not exist yet.

---

## A. Missing Pages (Not Built at All)

### A1. Active Investments Page
- **Spec route:** `/active-investment/listing`
- **Suggested route:** `/active-investments`
- **Description:** Displays the user's active property purchases and tracks installment payment schedules. Shows payment progress, upcoming installments, and investment history.
- **Key UI:**
  - Header with Help (WhatsApp), Investment Report, and Explore Investments buttons
  - Investment cards showing property name, payment status, schedule, and progress bar
  - Empty state with "Purchase Now" CTA linking to `/properties`
- **Backend dependency:** `investments` module (exists) — may need a dedicated endpoint for active investments with installment data
- **Priority:** High — core investor feature

### A2. Income Streams Page
- **Spec route:** `/rentaldisbursement`
- **Suggested route:** `/income`
- **Description:** Tracks rental income, rewards, and commissions from owned properties. Shows income-generating area, historical rental payments, and upcoming disbursements.
- **Key UI:**
  - Summary cards: Income Generating Area, Income from Rentals, Upcoming Income
  - Tab 1: Rentals & Credits (payment history table)
  - Tab 2: Rewards & Commissions (coming soon placeholder)
  - Generate Rental Report and Sell Area action buttons
- **Backend dependency:** `dividends` module (exists) — needs frontend wiring
- **Priority:** High — core investor feature

### A3. My Referrals Page
- **Spec route:** `/rewards`
- **Suggested route:** `/referrals`
- **Description:** Referral program dashboard with tracking, sharing, and earnings management.
- **Key UI:**
  - Summary cards: Total Referrals, Active Referrals, Total Earnings, Pending Rewards
  - Referral link section with copy button, QR code, and social share buttons
  - Rewards structure/tiers explanation
  - Referral activity table (Name, Sign-up Date, Status, Investment, Earnings)
  - Earnings timeline
- **Backend dependency:** No referral module exists — needs backend work
- **New backend module needed:** `referrals` (referral codes, tracking, earnings calculation)
- **Priority:** Medium

### A4. Explore & Learn Page
- **Spec route:** `/learning-centre`
- **Suggested route:** `/learn`
- **Description:** Educational hub with articles, videos, learning paths, and resources about real estate investment and blockchain.
- **Key UI:**
  - Hero section with search bar
  - Category cards grid (Getting Started, Investment Basics, Real Estate 101, DAO & Blockchain, Market Insights, Advanced Strategies)
  - Content type tabs/filters (Articles, Videos, Infographics)
  - Content cards with thumbnails, excerpts, read time, tags
  - Learning paths section
  - Glossary section
- **Backend dependency:** No content/learning module exists — needs backend work or CMS integration
- **New backend module needed:** `content` or integrate with headless CMS
- **Priority:** Low — nice-to-have, not core to investment flow

### A5. E-Reports Page
- **Spec route:** `/reports`
- **Description:** Report generation and statement history for investment documentation.
- **Key UI:**
  - Tab 1: Generate Report (form to create investment summary reports)
  - Tab 2: Statement Logs (table of previously generated statements with download)
  - Report format selection (PDF)
  - Date range picker
- **Backend dependency:** `compliance` module has `generateComplianceReport` — can be extended. `audit-export` module also relevant
- **Priority:** Medium — useful for investors and regulatory compliance

### A6. Rewards Shop Page
- **Spec route:** `/rewards-shop`
- **Description:** Placeholder/coming-soon page for future reward redemption system.
- **Key UI:**
  - Reward illustration
  - "Coming Soon" heading and message
  - Contact support WhatsApp link
- **Backend dependency:** None (placeholder)
- **Priority:** Low — it's a placeholder page

### A7. Marketplace / DAO Listings Page
- **Spec route:** `/marketplace`
- **Description:** Secondary market where investors can trade property areas (fractional ownership shares) with other investors.
- **Key UI:**
  - Search bar and advanced filters (property type, price range, area size, location)
  - Listings grid with property cards showing seller info, area, price/sqft, performance metrics
  - "List Your Area" flow (sell modal/page)
  - "Buy Area" purchase flow
  - Make Offer, Contact Seller, Save actions
  - Beta badge
- **Backend dependency:** `marketplace` module (exists) — needs frontend page
- **Priority:** Medium — differentiating feature but marked as Beta in spec

---

## B. Partially Implemented Pages (Need Enhancement)

### B1. Portfolio Page (`/portfolio`)
**What exists:** Basic portfolio summary showing investment distribution.
**What's missing per spec:**
- [ ] Net Amount Invested summary card with formatted currency
- [ ] Area Owned summary card (value in sq. ft. with sub-metrics)
- [ ] Tab 1: Area Ownership — wallet icon empty state, "Receive Area" button
- [ ] Tab 2: Accumulated Property — Active Demarcation Investments section, Overview of Demarcated Units section
- [ ] Wallet address display
- [ ] Specific empty state CTAs linking to `/properties`

### B2. Properties Page (`/properties`)
**What exists:** Property listing grid with search, type/status filters, funding progress bars, min investment, and expected returns.
**What's missing per spec:**
- [ ] Filter tabs with count badges (Home, Developmental, Mature, Upcoming)
- [ ] Image carousel on each property card (currently just static images)
- [ ] "New Listing" badge on recent properties
- [ ] "Add to Cart" / shopping cart functionality
- [ ] "DAO Listing" button per property
- [ ] More detailed property statistics (3 metrics per card)
- [ ] ROI percentage, completion %, investor count on card face

### B3. Transactions Page (`/transactions`)
**What exists:** Transaction history with pagination.
**What's missing per spec:**
- [ ] Summary cards at top: Total Invested, Total Income, Pending Transactions, Net Balance
- [ ] Export/Download button with format selection (PDF, CSV, Excel)
- [ ] Advanced filter panel (date range, type, status, amount, property, payment method)
- [ ] Active filter chips
- [ ] Sort dropdown
- [ ] Copy transaction ID button
- [ ] Transaction detail modal (expand row)
- [ ] Mobile card layout (responsive table alternative)

---

## C. Settings Page Gaps

The current settings page only has **Profile Information** and **Change Password** sections. The spec defines 7 sections:

| Section | Status | Details |
|---------|--------|---------|
| Personal Details | Partial | Has first/last name, email, phone. Missing: DOB, photo upload, gender, phone verify button |
| Address | Missing | Address CRUD with add/edit/delete, address list |
| Bank Details | Missing | Bank account CRUD with add/edit/delete |
| Legal Information | Missing | CNIC input, FBR tax filer status radio, CNIC front/back document upload, Next of Kin section |
| Change Password | Done | Current, new, confirm password fields |
| Notifications | Missing | Push notifications toggle, SMS notifications toggle |
| Wallet Info | Missing | Wallet address (read-only + copy), QR code, "Connect with Fasset Wallet" button (disabled/coming soon) |

**Backend impact:** The `users` module may need additional endpoints for addresses, bank accounts, legal docs, and notification preferences. KYC module partially covers document upload.

---

## D. Missing Shared Components

| Component | Used By | Description |
|-----------|---------|-------------|
| Image Carousel | Properties, Marketplace | Swipeable image carousel with arrows, dots, slide counter |
| Export/Download Button | Transactions, E-Reports, Income Streams | Export data in PDF/CSV/Excel with options modal |
| QR Code Display | Referrals, Settings/Wallet | QR code generation with download button |
| Social Share Buttons | Referrals | WhatsApp, Facebook, Twitter/X, Email share buttons |
| Copy to Clipboard | Referrals, Transactions, Settings | Copy button with "Copied!" feedback |
| Filter Panel | Transactions, Marketplace, Explore | Advanced filter sidebar/drawer with chips |
| Data Table (responsive) | Transactions, Referrals, E-Reports | Table with mobile card layout, sort, pagination |
| Tab Navigation | Portfolio, Income, E-Reports, Settings | Tabbed content switching with URL sync |
| Empty State | All pages | Standardized icon + heading + message + CTA |
| Summary/Metric Cards | Dashboard, Transactions, Income, Referrals | Stat card with icon, label, value, sub-text |

---

## E. Sidebar & Header Enhancements

### Sidebar
**What exists:** Flat list of nav items, collapsible, logo at top.
**What's missing per spec:**
- [ ] Expandable section groups (e.g., "My DAO" → Portfolio, Active Investments, Income Streams)
- [ ] Beta badges on items (e.g., Marketplace)
- [ ] External link icons for tools (DAO Bot, Calculators)
- [ ] Footer section: copyright, "Powered by" text, release version
- [ ] Dark background theme option

### Header
**What exists:** Page title, back/home buttons, wallet balance badge, notification bell, user avatar dropdown.
**What's missing per spec:**
- [ ] Breadcrumb navigation
- [ ] "Book a Meeting" button
- [ ] Cart/Wishlist button with item count badge
- [ ] User dropdown: user ID, Active Purchases link

---

## F. Backend Modules Needed

| Module | Purpose | Priority |
|--------|---------|----------|
| `referrals` | Referral codes, tracking, commission calculation, earnings | Medium |
| `content` | Learning content CMS (articles, videos, learning paths) | Low |
| `cart` | Shopping cart for property investments | Medium |
| `reports` | User-facing report generation (investment summaries, statements) | Medium |

All other backend modules already exist (auth, users, properties, investments, transactions, kyc, governance, tickets, notifications, payments, marketplace, dividends, email, sms, ipfs, compliance, aml, audit, audit-export, analytics, settings, health).

---

## G. Implementation Priorities

### Tier 1 — Core Investor Experience (High Priority)
These are essential investor-facing features that complete the primary investment flow.

1. **Active Investments page** — Users need to track their ongoing purchases and installment schedules
2. **Income Streams page** — Users need to see their rental income and upcoming disbursements
3. **Transactions page enhancements** — Summary cards, export, filters, detail modal
4. **Portfolio page enhancements** — Tabs, area ownership breakdown, demarcation tracking
5. **Settings page completion** — Address, bank details, legal info, notification prefs, wallet info

### Tier 2 — Growth & Engagement Features (Medium Priority)
Features that drive platform adoption and user retention.

6. **Marketplace page** (frontend for existing backend) — Secondary trading market
7. **E-Reports page** — Investment documentation and statement generation
8. **My Referrals page** + backend `referrals` module — Growth engine
9. **Properties page enhancements** — Image carousel, cart, filter tabs with counts
10. **Shared components** — Data table, export button, copy-to-clipboard, filter panel

### Tier 3 — Content & Polish (Lower Priority)
Nice-to-have features that improve the overall experience.

11. **Explore & Learn page** + backend `content` module — Educational hub
12. **Rewards Shop page** — Coming soon placeholder
13. **Sidebar enhancements** — Expandable groups, badges, footer
14. **Header enhancements** — Breadcrumbs, cart button
15. **QR Code & Social Share components** — For referrals and wallet

---

## H. Estimated File Counts

| Item | New Files | Modified Files |
|------|-----------|----------------|
| Active Investments page | 2 | 1 (layout nav) |
| Income Streams page | 2 | 1 (layout nav) |
| Marketplace page | 3 | 1 (layout nav) |
| My Referrals page | 3 | 1 (layout nav) |
| E-Reports page | 2 | 1 (layout nav) |
| Rewards Shop page | 1 | 1 (layout nav) |
| Explore & Learn page | 3 | 1 (layout nav) |
| Settings enhancements | 5 | 1 (settings-page-content) |
| Portfolio enhancements | 0 | 1 |
| Properties enhancements | 2 | 1 |
| Transactions enhancements | 1 | 1 |
| Shared components | 10 | 0 |
| Sidebar/Header enhancements | 0 | 2 |
| Backend: referrals module | 5 | 2 (app.module + prisma schema) |
| Backend: content module | 5 | 2 |
| Backend: cart module | 4 | 2 |
| Backend: reports endpoints | 2 | 1 |
| **Total** | **~50** | **~20** |
