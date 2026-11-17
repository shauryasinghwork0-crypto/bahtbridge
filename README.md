# Bahtbridge

A responsive business finance prototype connecting Thai vendors with credit providers. All currency is Thai baht. The interface uses Arial, an ivory canvas, navy navigation and electric blue accents.

The presentation uses coordinated hero and section entrances, animated chart drawing, vertical ledger growth and subtle pointer movement. Workspace entrances run on page or role changes; changing a filter or chart period keeps the view steady. Use **Pause motion** in the footer to stop nonessential animation. This preference is remembered, and system reduced-motion settings always take priority. The layout supports English and Thai on desktop and mobile.

## Run

No dependency installation is required. With Python 3 and Node 18 or later:

```sh
npm run dev
```

Open `http://localhost:4173`. Alternatively, open `Bahtbridge.html` directly in a browser. The Google Maps preview requires an internet connection.

## Explore

The first page explains the two products, with separate vendor and lender access, a sample lender registration flow, animated illustrative reviews, and a proposed Bangkok office map.

| Workspace | Sample email | Demo password |
| --- | --- | --- |
| Vendor | vendor@bahtbridge.demo | Bahtbridge2026 |
| Lender | lender@bahtbridge.demo | Bahtbridge2026 |

The sample credentials are prefilled. They are public prototype values, not secrets or live credentials. No real account is created and no credentials are sent or stored.

Vendors can record transactions, compare 10 sample lenders, filter by product, amount, term, rate, security and decision time, and submit funding requests. Categories include short term, long term, instant credit, 24 hour decisions, working capital, invoice finance, equipment and supplier credit.

Lenders can discover and compare 10 fictional Thai businesses. Filters include sector, readiness, monthly revenue, requested funding, term, urgency, trading history and payment performance. Shared profiles include transaction records, financial documents, margins and debt service coverage. The lender workspace also offers market comparisons, application review, information requests, funding offers and a sample portfolio.

To demonstrate the complete workflow, submit an application to **Siam Capital** from the vendor workspace, switch roles and log in as a lender, issue an offer, then return to the vendor workspace and accept it.

The public header and footer link to a Contact us page at `#contact`. Its form validates details and prepares a copyable enquiry locally. Messages are not transmitted; a real delivery service and confirmed recipient are still needed for production.

The application guide at `#how-to-apply` explains the four application steps, supporting records, document references and browser storage. The eligibility checker at `#eligibility` compares the requested amount and trading history with each sample lender's listing and provides a separate document preparation checklist. It does not assess creditworthiness or guarantee eligibility. Answers are not stored or transmitted. Eight accessible FAQ disclosures at `#faq` explain documents, records, sharing, product terms and application outcomes.

The English / ไทย button is available on public pages, sign ins and both workspaces. Language preference is stored in the browser. Public copy, forms, filters, dialogs, accessibility labels and dynamic results have Thai translations; fictional business names and entered user text stay as entered. Switching languages preserves form values and selected filters. Thai searches match translated product and sector names, and CSV exports include Thai labels when Thai is selected.

## Validate and build

```sh
npm run check
npm test
npm run build
```

The build creates `Bahtbridge.html` with the CSS and JavaScript embedded. Runtime tests cover product filters, vendor filters, access, onboarding, comparisons, financial records and the application through offer acceptance workflow. They use a lightweight simulated DOM; they do not replace visual browser checks.

The static entry point includes content-based asset versions so returning visitors receive updated files. Motion tests cover page transitions, stable filters, remembered pause state, language changes and system reduced motion.

## Source

| File | Purpose |
| --- | --- |
| `dist/index.html` | Static entry point |
| `dist/data.js` | Fictional Thai business, lender and transaction data |
| `dist/access.js` | Public pages, application guide, eligibility checker, FAQ, access and onboarding |
| `dist/filters.js` | Provider and vendor matching functions |
| `dist/app.js` | Dashboard pages and interactive funding workflow |
| `dist/styles.css` | Workspace layout and base components |
| `dist/access.css` | Public pages, reviews and motion |
| `dist/refinements.css` | Discovery controls, Arial and workspace motion |
| `dist/design.css` | Editorial public pages and access screens |
| `dist/workspace-theme.css` | Light finance workspace and dialog theme |
| `dist/typography.css` | Refined text hierarchy, readable copy and Thai responsive styles |
| `dist/polish.css` | Unified visual refinement, responsive layouts and motion timing |
| `dist/motion.js` | Page-aware entrances, pointer motion and accessible motion preferences |
| `dist/locale.js` | Persistent language switch, dynamic translation and form value preservation |
| `dist/th-public.js` | Thai public page and access translations |
| `dist/th-workspace.js` | Thai dashboard, marketplace, filter and record translations |
| `dist/th-workflows.js` | Thai dialog, application and offer translations |
| `dist/assets/bangkok-storefront.jpg` | Generated illustrative brand photography |

## Prototype boundaries

Records are stored in the current browser. A refresh returns to the public landing page. Settings includes a reset control. The review quotes, businesses, lenders, financial records and rates are fictional. The Bangkok map indicates a proposed city location, not a confirmed office address.

There is no backend authentication, bank connection, credit scoring service, payment processing, real lending decision or legally binding agreement. Annual rate and repayment examples exclude fees. Instant and 24 hour categories describe sample decision times, not guaranteed funding. Review motion can be paused, and reduced motion preferences are respected.
