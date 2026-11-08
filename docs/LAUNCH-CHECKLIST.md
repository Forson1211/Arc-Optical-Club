# Arc Optical Club launch check

The code is prepared for the public address **https://arcoptical.org**. The visual design is unchanged by the SEO work. This checklist distinguishes implemented behavior from checks that require the hosted services or the owner’s accounts.

## SEO implemented

- Unique titles, descriptions, canonical URLs, Open Graph and Twitter previews for every public page; metadata updates during navigation.
- Organization and website structured data identifying **Arc Optical Club**, **ARC Optical** and **ARC**, with Ghana as the area served and October 2022 as the founding date. Breadcrumbs on inner pages and article structured data for news. No invented reviews, ratings, addresses or social profiles.
- Public page content is rendered to HTML at build time. Published news listings and articles render from the database on request, so crawlers and sharing tools can read them without executing JavaScript.
- `/robots.txt`, `/sitemap.xml` and `/sitemap-pages.xml`. The sitemap index also includes `/api/seo/news-sitemap.xml`, which automatically includes published stories and excludes drafts.
- Noindex protection for admin screens, donation receipts and missing stories. Missing stories return an actual HTTP 404; unknown static routes use the generated `404.html`.
- The supplied eye logo is used as the favicon, with a PNG fallback and a transparent square SVG canvas. Existing responsive image optimization stays in place.

## Finish before announcing the site

1. **Redeploy the latest repository to Vercel.** Use the repository root and its `vercel.json`. Confirm the production MongoDB connection, `CLIENT_URL=https://arcoptical.org` and administrator account. `/api/health` must report `success: true` and `storage: "mongodb"`. Follow the production setup in README.md; do not put server secrets in frontend variables.
2. **Verify live workflows.** Sign in, upload an image, publish a news story, edit a program and reload from another browser. Submit Contact, Join and Newsletter forms and confirm their records appear in the admin workspace. The code saves contact messages and newsletter subscriptions; it does not currently send notification emails or newsletter campaigns.
3. **Confirm donations on the hosted site.** Complete a Paystack test checkout and webhook, verify the recorded amount and receipt, then configure the live key and live webhook before accepting real payments.
4. **Replace the WhatsApp placeholder and social links.** WhatsApp currently falls back to `+233000000000`; set the real `VITE_WHATSAPP_NUMBER` and rebuild. Footer social links currently go to platform homepages. Social-link editing is not yet part of Admin Settings; its existing controls cover profile, password and access. No guessed social URLs were added to structured data.
5. **Connect Google Search Console.** Verify ownership of `arcoptical.org` (a domain property uses a DNS TXT record). Submit `https://arcoptical.org/sitemap.xml`. Use URL Inspection for the homepage, About, Programs and a published news story; request indexing after the deployment is healthy. An authenticated owner account/DNS access is needed for these steps.
6. **Check the production domain.** Confirm HTTPS works, one primary hostname is used, and the other hostname redirects to it. Open the robots file, sitemap, a direct inner-page URL and a shared news link. Check mobile display and load performance using PageSpeed Insights against the deployed address.
7. **Build recognition after launch.** Publish accurate outreach stories with descriptive headlines, dates and image descriptions. Link the official website from the organization’s real profiles and ask existing partners to link relevant programs or reports. Avoid buying links or repeating keywords unnaturally.

Google chooses rankings. These changes help crawling and brand recognition; they cannot promise first place for broad searches such as “ARC” or “optical club.” Search Console reports are the way to measure indexing and results after launch. See [Google’s SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Validation

Build the frontend before running the SEO integration test, because it generates the server renderer used by news pages:

```sh
npm run build --workspace backend
npm run build --workspace frontend
npm exec --workspace backend -- tsc -p tsconfig.test.json
node --test --test-concurrency=1 backend/.test-build/tests/*.test.js
```

Local tests use temporary storage and do not publish test stories to the production database. The live domain could not be reached from this execution environment during the review; production reachability, DNS, Search Console ownership and live payment/email services are not verified by local tests.
