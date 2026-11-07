# Arc Optical Club

Full-stack NGO website and protected administration workspace for Arc Optical Club (AOC).

## Project structure

- `frontend/` — React, TypeScript, Vite and Tailwind CSS
- `backend/` — Node.js, Express, TypeScript and MongoDB/Mongoose

## Requirements

- Node.js 22.x
- npm
- MongoDB local instance or MongoDB Atlas connection string for shared storage (optional for local file-based development)

## Getting started

Run these commands from the project root to install dependencies for both apps and start them together:

```bash
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and the API runs at `http://localhost:5001`. Health check: `http://localhost:5001/api/health`.

The root development command waits for a successful backend build and API health check before starting the frontend. Backend changes trigger one restart after a successful compilation; TypeScript errors keep the last successful API build running. Both apps reload when their source files change. Press `Ctrl+C` to stop both servers and their child processes. Restart development after changing backend environment settings.

To run an app individually from the project root:

```bash
npm run dev:frontend
npm run dev:backend
```

Copy `backend/.env.example` to `backend/.env` and set `MONGODB_URI` to your database, for example `mongodb://127.0.0.1:27017/arc_optical_club` for a local MongoDB service. If no URI is set during development, records persist in the ignored `backend/.data/arc-database.json` file. Production requires MongoDB and refuses to start without it. Configured MongoDB connection failures never fall back to a different database.

The frontend uses `/api` by default, with Vite forwarding local requests to `http://127.0.0.1:5001`. For a separately hosted API, set `VITE_API_URL` to its HTTPS URL ending in `/api`.

## Join Us and connected forms

Open `/join` for the responsive application page. Its panels, fields and submit button have square corners and no decorative borders. Applications include contact details, background, interests, availability, motivation and consent. The server validates each submission, prevents duplicate applications by email and saves successful applications as Pending volunteers. The success page displays an application reference.

Public contact submissions appear in the admin inbox, and footer newsletter subscriptions appear under Newsletter subscribers. Failed saves return errors; forms do not show success until persistence completes. There are no seeded demo records or browser-stored private records.

## Create your administrator

With MongoDB running and the backend configured, run this command before starting the API:

```bash
npm run setup:admin --workspace backend
```

Enter your admin email and a password of at least 12 characters. Password input is hidden, and only a salted scrypt hash is stored. Start the app with `npm run dev`, then open `http://localhost:5173/admin`. There is no public admin registration or default password. If using development file storage, stop the API before running account setup, then restart it.

Administrator accounts belong to the database in `MONGODB_URI`. Switching from local MongoDB to Atlas does not move existing accounts; create the administrator in the newly configured database before signing in. Do not add a fallback password or bypass authentication to work around a missing account.

For unattended initial setup, `ADMIN_EMAIL` and `ADMIN_PASSWORD` may be supplied privately in the server environment. They create an administrator only when none exists; they do not reset existing accounts. Remove bootstrap credentials from the environment after the initial account is created.

On PowerShell systems that block `npm.ps1`, use `npm.cmd` in these commands.

## Admin workspace

The protected `/admin` workspace includes:

- Outreach and screening planning, editing, status tracking and impact charts.
- Volunteer application details, approvals and status management.
- Donation contribution records, with amounts in GHS.
- A contact inbox with persisted read status and reply-by-email links.
- Newsletter subscriber management and CSV export.
- Outreach CSV reports and secure sign-out.
- Site analytics, weekly traffic radar, outreach/volunteer progress rings and donations by program.
- Administrator account creation and an audit-log browser with search, category, outcome and date filters.
- Settings for profile names and password changes, with shortcuts to team access and audit logs.

Data refreshes every 30 seconds and when the browser window regains focus. Records are saved by the API; empty databases show empty states. Paystack donations are recorded after server verification, alongside manually entered contributions. Reply links open the administrator’s email client, and newsletter registration does not send email campaigns. Automated email delivery requires a separately configured provider.

## Administrators, traffic and audit logs

Signed-in administrators can open **Administrators** (`/admin/admins`) to add trusted teammates. Enter a name, email and password of 12–256 characters. New accounts have full administrator access; share credentials directly, as account creation does not send an invitation email. Account lists never return password hashes or salts. Creation, successful/failed sign-ins, sign-outs, form submissions, record changes and denied admin requests are logged by the server before its JSON response is sent. Initial CLI/bootstrap account creation takes place outside the web audit trail.

**Site & impact analytics** (`/admin/analytics`) also appears on the overview. Traffic totals cover the selected 7, 30 or 90 calendar days in Ghana time. The radar shows the last seven days; mission progress and program donations use all existing workspace records. Page views count public route loads, reloads and back/forward navigation. Visits use anonymous browser sessions renewed after 30 minutes of inactivity. Unique browsers use an anonymous identifier stored in that browser, so they are not a count of individual people. Admin routes are excluded from public traffic.

The browser automatically sends public page views and link/button interactions, and authenticated workspace navigation, controls and CSV exports. Public traffic retries transient failures using a bounded queue of up to 200 events; unique event identifiers prevent retry duplicates. Server timestamps determine the reporting date. Tracking begins when this code is running; it cannot reconstruct earlier traffic or guarantee collection when JavaScript, storage or network requests are blocked. Anonymous identifiers are browser-generated; IP addresses, raw user agents, query strings, passwords, message contents and form answers are not placed in activity logs.

**Audit logs** (`/admin/audit-logs`) distinguishes server-confirmed API outcomes from browser-reported activity. History is paginated on the server, refreshes every 30 seconds and can be searched and filtered. The application exposes no audit edit/delete endpoint. Database administrators still control the underlying database; this is an application audit trail, not a cryptographically tamper-proof ledger. MongoDB indexes support date/category filtering and event deduplication. Existing local development databases gain empty activity collections without replacing prior records. Logs currently remain until managed directly through your database retention process.

## News, programs and completed pages

Public Gallery, ARC Academy, Research, Donate and News pages are complete. Gallery photos open in an accessible viewer with arrow-key navigation. Academy and Research actions lead to the existing contact/application workflows. The donation page uses preset or custom GHS amounts and a server-initialized Paystack checkout. Its square, borderless styling is scoped to that page; other pages keep their existing corners and borders.

In `/admin/news`, choose **Write a story**, enter its headline, summary, author, category and publication date, and add a cover image. Build the article with paragraph, heading and photo blocks; reorder blocks and use **Preview article** to check the published format. Save with **Draft** visibility to keep a story private, or **Published** to display it on `/news` and its permanent `/news/:id` address. Publishing uses the shared database; it does not require rebuilding the frontend. No example news is published automatically.

In `/admin/programs`, edit the existing programs or add a new one. Title, category, short description, details, photo, display order and visibility are editable. Published content appears on both the homepage and Programs page. Set visibility to Draft to hide a program or story without deleting it. Existing outreach/donation records retain their historical program names when a program is renamed. New planning forms include published program names.

Upload JPEG, PNG or WebP images up to 5 MB, use an existing `/images/` or `/scrolling/` image, or supply an HTTPS image URL. Uploads persist in MongoDB in production, so they survive backend restarts and do not require a writable server disk. Include the `contentimages`, `news` and `programs` collections in database backups. The API must be reachable for uploaded images, news and program listings. Uploaded photo files are public assets; drafts protect article content, not confidential image files.

Before going live, configure production MongoDB, `CLIENT_URL`, `VITE_API_URL`, HTTPS and the administrator account as described below. Test sign-in, a published article with an uploaded image, program edits and each public form against the actual hosted services. Local tests do not verify hosting configuration or email/payment services.

## Paystack configuration

Set `PAYSTACK_SECRET_KEY` privately on the backend only. Use a test key first; do not put it in frontend variables or source control. Configure the webhook in the Paystack dashboard to `https://YOUR_API_HOST/api/donations/webhook`. If using a `whsec_` webhook signing secret, also set `PAYSTACK_WEBHOOK_SECRET`; the backend then requires the timestamped `Paystack-Signature` header. Without that setting it verifies the legacy `X-Paystack-Signature` using the server secret key. See [Paystack's webhook documentation](https://paystack.com/docs/payments/webhooks/).

Checkout returns to the allowed frontend origin at `/donate/thank-you`. The server checks the expected reference, GHS amount, currency and payment mode before recording a donation. Verified webhook deliveries and browser returns share the same unique payment reference, so retries do not create duplicate donations. Donor contact details and notes stay in the private payment-attempt record; the public receipt does not expose them. Card details are handled by Paystack.

Live charges appear as Received in the admin Donations screen. Test charges appear as Test and do not count toward received totals. Paystack records cannot be edited through the admin record editor. Manage refunds in Paystack and reconcile them with your donation records. Before launch, verify a test checkout and webhook on the hosted site, then configure your live key and corresponding live webhook. Without a configured key the form explains that online donations are being set up; it never reports a payment as successful.

## Run checks

```bash
npm run build --workspace frontend
npm run build --workspace backend
npm test --workspace backend
```

The backend integration tests use isolated temporary file storage. Set `TEST_MONGODB_URI=mongodb://127.0.0.1:27017/arc_optical_test` to also test against a unique temporary MongoDB database; the tests remove only their own database afterwards. Tests cover public forms, duplicate handling, durable writes, protected endpoints, CSRF rejection, volunteer review, donation validation, inbox/subscriber updates, session expiry, logout, administrator creation, safe account responses, traffic deduplication/counts, audit filtering/pagination and sensitive-data exclusion.

## Security

Never commit `.env` files, database credentials, passwords or the local `.data` directory. Admin sessions use random tokens in HttpOnly cookies, with hashed tokens in storage and an eight-hour expiry. Admin writes require an allowed Origin and a custom request header. Sign-in attempts are rate limited. The API never returns password hashes or session records through the workspace endpoint.

Password changes require the current password and at least 12 characters for the new password. They rotate the current browser session and invalidate other sessions, including sign-ins that began before the change. Profile and password updates are recorded in the audit trail without storing form values or passwords. The account email is read-only in Settings.

## Vercel and social sharing

Import this repository into Vercel with the repository root as the Root Directory. The root `vercel.json` builds both apps, includes the compiled backend in `api/index.mjs`, forwards `/api/*` to Express and supports direct links to React pages. The `.mjs` entry preserves native ES modules when importing the backend.

The deployment sets `NODEJS_HELPERS=0` so Express parses request bodies itself, preserving raw uploaded images and Paystack webhook signatures. See [Vercel's Node.js configuration](https://vercel.com/docs/functions/runtimes/node-js/advanced-node-configuration#disabling-helpers-for-nodejs).

Set these variables in **Vercel Project Settings → Environment Variables → Production**, then redeploy (a local `backend/.env` is not uploaded):

- `MONGODB_URI`: your existing production MongoDB/Atlas connection string, including the database name. Use the same database that contains your existing records and administrator accounts.
- `CLIENT_URL`: `https://arcoptical.org` (add `https://www.arcoptical.org` or a Vercel domain only if you use them, separated by commas).
- `NODE_ENV`: `production`.
- Leave `VITE_API_URL` unset for this combined deployment; the frontend uses same-origin `/api`.
- `ADMIN_EMAIL` and `ADMIN_PASSWORD`: optional initial account creation, only when the production database has no administrators. Existing local accounts do not automatically migrate to a different database.
- Paystack server secrets, when enabling online donations, as described above.

Ensure the MongoDB database user has read/write and index-creation permissions, and Atlas network access permits connections from your hosting environment. Open `/api/health` after redeploying; it must return JSON with `success: true` and `storage: "mongodb"`. Then test `/api/content/programs` and admin sign-in. A `503` with `API_CONFIGURATION_REQUIRED` means an environment variable is missing; `API_STARTUP_FAILED` means startup failed (inspect Vercel Function Logs for the error name and check Atlas connectivity/permissions). Failed startup is retryable and never falls back to temporary files or an empty database.

Search and sharing metadata use `https://arcoptical.org`, configured in `frontend/src/lib/seo.ts`, and the 1200 × 630 logo image at `frontend/public/images/arc-social-preview.png`. The frontend build renders public pages, creates robots/sitemap files and packages a server renderer in `backend/dist/render`. Vercel serves static pages directly and renders published news through the API, including fresh article previews and a published-news sitemap. Deploy both apps together using the root build command. If the public domain changes, update the SEO origin in the frontend and news sitemap route together. Social platforms may cache earlier previews.

See [the launch checklist](docs/LAUNCH-CHECKLIST.md) for remaining production checks, Search Console setup and current limitations. The frontend build must run before the SEO integration test because that test exercises the built news renderer.

The frontend build runner sets `NODE_ENV=production` before loading Vite for both browser and server rendering builds. This prevents hosting-level development settings from mixing development JSX calls with React's production runtime. Keep the Vercel `NODE_ENV` variable set to `production` for the backend as well. Node 22 is selected by the repository's `engines` setting.

For an optional separately hosted Express backend instead, set `NODE_ENV=production`, `MONGODB_URI` and your actual `CLIENT_URL` on that service, and set `VITE_API_URL` in Vercel to its HTTPS URL ending in `/api`. If the frontend and API use different sites, set `COOKIE_SAME_SITE=none`; cookies then require HTTPS, and browser policies may still restrict third-party cookies. Prefer the same-origin deployment above. Use `TRUST_PROXY=1` only behind one trusted reverse proxy. `CLIENT_URL` supports a comma-separated list of exact allowed origins.

## Concept document content and team photos

The public content has been aligned with Concept (1) (1).docx: mission, vision, the origin of the Arc name, partners, program history and all 18 team names and roles. The source document describes team members rather than event speakers. No portraits are seeded or copied from the document. Existing public page styles and layouts are retained.

Open `/admin/team`, edit a member, upload a photo and save with Published visibility. Photos are optional; the public Team page retains its existing silhouette until a photo is supplied. Names, roles, group, display order and visibility are editable in the same content manager used for programs and news. Team photo uploads use the existing authenticated image endpoint and production MongoDB storage. Include `teammembers` and `contentimages` in backups. Seeded names are added once without replacing administrator edits. Older untouched program details are refreshed from the document; edited program text, visibility and order are preserved. The document leaves payment contact details and Journal Club dates incomplete, so the site keeps the existing Paystack/contact workflows and does not invent those details.
