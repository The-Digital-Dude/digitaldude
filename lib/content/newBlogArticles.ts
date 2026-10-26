import type { BlogArticle } from "./blogArticles";

/**
 * Articles published from the October 2026 keyword plan. Each targets one primary search intent that no existing post covers.
 * They are merged into the static article set (blogArticles.ts) and also stored in the `posts` table, which is what the blog index lists.
 */
export const newBlogArticles: BlogArticle[] = [
  // ------------------------------------------------------------------------------------------------------ 1
  {
    slug: "custom-crm-development-cost-uk",
    title: "Custom CRM Development Cost in the UK (2026): What You Will Actually Pay",
    excerpt:
      "Published UK guides quote anything from £15,000 to £200,000+ for a custom CRM. Here is what actually drives the price, the bands we scope against, and the running costs most guides leave out.",
    meta_title: "Custom CRM Development Cost UK (2026) | The Digital Dude",
    meta_description:
      "What does bespoke CRM development cost in the UK? Real price bands, what drives the number, running costs, and when off-the-shelf is cheaper. Honest 2026 guide.",
    category: "CRM Development",
    read_time: "9 min read",
    reading_time_minutes: 9,
    published_at: "2026-10-26T09:00:00Z",
    updated_at: "2026-10-26T09:00:00Z",
    author: "Farhad Hossain",
    cover_image: "/blog/custom-crm-development-cost-uk.svg",
    content: `## The short answer

Search for custom CRM development cost, or for what a bespoke CRM system costs, in the UK and you will find ranges so wide they are almost useless: some agency guides start around £15,000 and run past £200,000 for enterprise builds, while others quote a small-business CRM at £10,000 to £25,000. Most of those pages are written by agencies selling the work, so treat the numbers as marketing, not benchmarks.

For a focused, single-business CRM (a pipeline, role-based access, a few integrations and reporting), the bands we scope against are **roughly $5,500 to $12,000** and **4 to 6 weeks**, as set out in our [custom software cost guide](/blog/custom-software-development-cost-uk). The honest version of "it depends" is below: what pushes a custom CRM to the bottom or the top of a range, so you can place your own project before you speak to anyone.

## What actually drives the price of a custom CRM

Price is a function of how many different things the system has to do, not how many screens it has. Five factors explain nearly all of the variation.

### 1. How many types of user

A CRM used by one sales team is one product. A CRM with an admin, an internal team, external agencies, field staff and customers each seeing different data is five products sharing one database. Every additional user type needs its own permissions, views and testing. This is the single biggest cost driver, and it is why [role-based access control](/blog/role-based-access-control-explained-simply) deserves a proper conversation early.

### 2. How unusual your pipeline is

If your sales process really is lead, qualified, proposal, won, you can adapt almost any tool. The case for building starts when the workflow is specific: compliance deadlines, dispatch, multi-step approvals, quotes that depend on measured data. The more your process differs from a standard sales funnel, the more a custom build earns its cost, and the more design time it needs.

### 3. Integrations

Each integration (accounting, payments, email, WhatsApp, SMS, calendars) is its own mini-project with authentication, error handling and testing. A CRM that talks to one system costs noticeably less than one that synchronises with five. Ask for each integration to be priced separately.

### 4. Data migration

Moving years of contacts and deals out of spreadsheets or another CRM means cleaning, de-duplicating and mapping fields. Messy source data is the most common reason a fixed quote grows. A one-hour look at your export before scoping saves weeks later.

### 5. Reporting and compliance

Live dashboards, per-agent performance and audit trails add real work. So does anything touching regulated data. If you hold personal data, UK GDPR affects how you store, export and erase it, and building that in from the start is far cheaper than retrofitting it.

## Three realistic bands

These are guides, not quotes. Your own number depends on the five factors above.

- **Focused CRM (one team, one pipeline, one or two integrations)**: the low end of the band, usually 4 weeks. A custom pipeline, reminders, simple reporting and a clean import of your existing contacts.
- **Multi-role CRM (several user types, portals, quotes and invoices)**: the middle to upper part of the band, usually 5 to 6 weeks. Separate portals for staff, partners and customers, with documents and notifications.
- **Operational platform (CRM plus dispatch, scheduling, payments or compliance)**: above the standard band. At this point it is closer to a bespoke operations system, and it should be scoped in phases with a working release at each step.

## The running costs most guides leave out

A build price is not the whole cost. Budget for these from day one:

- **Hosting and database**: for a modern serverless stack this is typically in the region of $50 to $200 a month for a small team, rising with traffic and storage.
- **Maintenance and iteration**: plan on roughly 10 to 15 per cent of the build cost a year for security updates, dependency upgrades and the small changes every live system accumulates.
- **Third-party usage**: SMS, email sending and payment processing are billed by use, not by seat.
- **Your own time**: someone on your side needs a few hours a week during the build to answer questions and test. A build starved of that time takes longer and costs more.

What you do not pay is a per-user licence. That is the structural difference from packaged CRMs, and it is why the comparison tilts towards custom as headcount grows. We work through the numbers for specific products in our guides to [custom CRM vs Salesforce](/compare/custom-crm-vs-salesforce), [vs HubSpot](/compare/custom-crm-vs-hubspot) and [vs Zoho](/compare/custom-crm-vs-zoho).

## When buying off-the-shelf is the cheaper answer

A custom CRM is not always right, and it is worth saying so plainly. Buy a packaged CRM if:

- you have a standard sales funnel and fewer than about ten users;
- you need to be working by next week;
- you rely on a large ecosystem of ready-made integrations;
- you do not yet know how your process works and need to learn by using something.

The honest test is whether you are bending your process to fit the tool, or the tool to fit the process. Many teams start on a packaged tool, hit the limit, and build only when the workarounds cost more than the build would. We cover that decision in [off-the-shelf vs custom CRM](/blog/off-the-shelf-crm-vs-custom-crm).

## How to keep the cost down without cutting corners

1. **Start with one workflow.** Build the pipeline that makes money first; add portals and reports once it is in daily use.
2. **Decide what is not in version one.** A written "later" list is the cheapest scope control there is.
3. **Fix the price per milestone.** Fixed-scope milestones with a working demo each week keep surprises small.
4. **Own the code.** Make sure the contract gives you the source code and the database. It is what makes the asset yours rather than rented.
5. **Bring your data early.** Share a real export in week one, not week five.

## Frequently Asked Questions

### How much does a custom CRM cost in the UK?
It depends mainly on the number of user types, how unusual your workflow is, integrations and data migration. A focused single-business CRM is roughly $5,500 to $12,000 on our scoping bands, while published UK agency guides quote anything from about £10,000 to well over £100,000. Treat any figure given before a scoping conversation as an estimate.

### How long does it take to build a custom CRM?
A focused CRM typically takes 4 to 6 weeks to a first live release. Multi-role platforms with several integrations take longer and are best delivered in phases, with something usable at the end of each one.

### Is a custom CRM cheaper than Salesforce or HubSpot?
Over a few years and a growing team, often yes, because there are no per-seat licences. For a small team with a standard funnel, a packaged CRM is usually cheaper and faster to start. The break-even depends on headcount and how far your process differs from the standard one.

### What does a custom CRM cost to run each year?
Expect hosting and database costs, third-party usage fees, and roughly 10 to 15 per cent of the build cost a year for maintenance and improvements. There is no per-user licence fee.

### Do I own the code of a custom CRM?
You should. Insist that the contract transfers the source code and the database to you, so you can host it, change it or move agency without starting again.

## Next step

If you want a number for your own workflow rather than a range, [book a 30-minute discovery call](/contact). Bring one real example of how a lead moves through your business today and we will tell you honestly whether custom, packaged, or a hybrid is the right answer.`,
  },

  // ------------------------------------------------------------------------------------------------------ 2
  {
    slug: "ai-phone-ordering-for-restaurants-build-or-buy",
    title: "AI Phone Ordering for Restaurants: Build It or Buy It? Lessons From Building One",
    excerpt:
      "Restaurants lose orders when the phone rings during service. We built an AI ordering platform to fix that. Here is how it works, what surprised us, and when buying a ready-made tool is the smarter call.",
    meta_title: "AI Phone Ordering for Restaurants: Build or Buy?",
    meta_description:
      "How an AI phone ordering system for restaurants works, what it takes to build one, the pitfalls we hit, and when a ready-made product is the better choice.",
    category: "AI Engineering",
    read_time: "9 min read",
    reading_time_minutes: 9,
    published_at: "2026-10-26T09:10:00Z",
    updated_at: "2026-10-26T09:10:00Z",
    author: "Farhad Hossain",
    cover_image: "/blog/ai-phone-ordering-restaurants.svg",
    content: `## The problem is the phone, not the menu

During a dinner rush, nobody can answer the phone. The person who would is plating food or serving tables, so the call goes to voicemail and the customer orders from someone else. Delivery apps help, but they take a commission on every order, so many restaurants still want direct phone orders and have no good way to take them at peak time.

An AI phone ordering system for restaurants answers every call, takes the order against the live menu, and sends the ticket to the kitchen. The idea is simple. Doing it reliably is not, and the difference between a demo and something a restaurant trusts on a Friday night is where almost all of the engineering sits.

We built an ordering platform of this kind for the Australian market and are running it with a pilot restaurant. This article shares what that taught us, so you can decide whether to build, buy, or do neither.

## How AI phone ordering actually works

A good system is a pipeline of small, checkable steps rather than one clever model:

1. **Answer and disclose.** The agent picks up, says it is an AI assistant and that the call may be recorded. This is good practice everywhere and, depending on where you operate, a legal requirement.
2. **Understand the order.** Speech is turned into text, and the agent maps what the caller says ("a large margherita and two cokes") to real menu items.
3. **Check against the live menu.** The model never invents items or prices. It calls tools, such as "get the menu" or "add this item", and the system answers from your actual data.
4. **Read the order back.** The agent repeats the full order and total before placing it.
5. **Place the order.** The order is written to the database, the kitchen is notified, and the customer receives a text confirmation.
6. **Escalate if nobody notices.** If the tablet is not acknowledged, staff get a text, and as a last resort the system calls back.

The key design decision is step 3. A voice model that "remembers" the menu will eventually quote a price that is wrong. A model that must ask your system for every price cannot.

## What surprised us building it

### Systems you do not control become the project

Our first design ran its own telephony and voice pipeline. We later moved to using GoHighLevel as the system of record for voice, SMS and order automation, mirroring state into our own database. That removed a large amount of infrastructure, but it also meant the reliability of the whole product depended on what the third-party API actually does, not what its documentation implies. Some things we assumed were available, such as call transcripts through the API, were not. We now treat every integration as "unverified until tested against the live service", and we keep a written audit of what is confirmed and what is a guess.

### The hardest bugs are in the money and the clock

Prices stored GST-inclusive, tax shown on receipts, pickup times in the restaurant's time zone, and payment links that must never be fired by accident during testing. None of this is glamorous and all of it matters. A payment link that texts a real customer from a test run is a bad day, so anything with real-world side effects sits behind an explicit switch.

### Multi-tenant means isolation from day one

If you want to sell the system to more than one restaurant, each venue's data must be walled off at the database level. We use row-level security on every tenant table from the first migration, so a coding mistake in one screen cannot expose another restaurant's orders. Retrofitting that later is painful.

### Escalation is the product

The AI is the easy part to demo. The part owners care about is "what happens when it does not work": staff alerts, a human hand-off, hours-closed handling, and a call log with recordings so a disputed order can be checked. A system that fails safely is worth more than one that is occasionally brilliant.

## Build vs buy: an honest comparison

Ready-made products exist. Flipdish, for example, has reported that restaurants using its AI Phone Agent in the UK and Ireland have placed over 10,000 orders worth more than £230,000. Those are the company's own figures and have not been independently checked, but they show the category is real and moving.

**Buy a ready-made product if:**

- you run one or a few restaurants and just want missed calls answered;
- you already use a point-of-sale or ordering platform that offers it;
- you can accept the vendor's pricing, menu handling and roadmap.

**Build (or commission) your own if:**

- you want to resell the service to many venues under your own brand;
- you need to connect to systems a vendor does not support;
- the order data is a strategic asset you want to own;
- you need local rules, languages or pricing that products do not handle.

For a single restaurant, building almost never pays back. For a business that wants to be the platform, it can.

## Questions to ask any vendor, including us

- Does the agent ever state a price or item it did not fetch from my menu?
- What happens if the kitchen tablet is not acknowledged?
- Can I listen to the recording of any call?
- Where is my data stored, and can I export it?
- Who is responsible if a payment link or text goes to the wrong person?
- What does it cost per call, and what happens at 3x my normal volume?

## Frequently Asked Questions

### How does AI phone ordering work for restaurants?
An AI agent answers the call, takes the order conversationally, checks every item and price against the restaurant's live menu through tool calls, reads the order back, then sends the ticket to the kitchen and a confirmation text to the customer.

### Is AI phone ordering accurate enough for a busy restaurant?
Accuracy depends on how the system is built, not only on the voice model. Systems that fetch items and prices from your menu, confirm the order aloud and hand off to a person after repeated misunderstandings perform far better than ones that rely on the model's memory. Test with real accents, background noise and unusual menu items before going live.

### Do I have to tell callers it is an AI?
Plan on it. Disclosing the AI and any call recording at the start of the call is good practice and, in many places, a legal requirement. Check the rules where you operate.

### How much does it cost to build an AI phone ordering system?
It varies with the number of venues, integrations and the voice platform. A single-venue tool is far cheaper than a multi-tenant product with billing, admin and escalation. We scope it in phases so you can launch with one pilot restaurant before investing in the full platform.

### Should a single restaurant build its own?
Almost never. Use an existing product. Building makes sense when you are creating a business that serves many restaurants.

## Talk to us

If you are weighing up AI ordering for a hospitality business or a platform, see how we approached it in our [AI restaurant ordering case study](/work/ai-restaurant-ordering-platform), or [book a discovery call](/contact) and we will tell you honestly whether to buy or build.`,
  },

  // ------------------------------------------------------------------------------------------------------ 3
  {
    slug: "google-ads-for-software-development-companies",
    title: "Google Ads for Software Development Companies: A Keyword Strategy That Filters for Buyers",
    excerpt:
      "Software and agency leads are expensive and easy to waste on the wrong searches. A practical way to structure keywords by buying intent, match landing pages to the search, and measure real leads, not clicks.",
    meta_title: "Google Ads for Software Development Companies | Strategy",
    meta_description:
      "How software and agency businesses should structure Google Ads keywords by intent, write matching landing pages, and track qualified leads rather than clicks.",
    category: "Google Ads & PPC",
    read_time: "8 min read",
    reading_time_minutes: 8,
    published_at: "2026-10-26T09:20:00Z",
    updated_at: "2026-10-26T09:20:00Z",
    author: "Tanvir Ahmed Shuvo",
    cover_image: "/blog/google-ads-software-companies.svg",
    content: `## Why software lead generation wastes money

Selling custom software on Google Ads is hard because the same few words attract very different people. "Software development" is searched by students, job seekers, people comparing tools, people wanting free templates and, somewhere in there, a business ready to hire. Bid broadly and you pay for all of them.

The fix is not a bigger budget or cleverer bidding. It is deciding, before you spend, **which search intents you want to pay for** and building each campaign around exactly one of them.

> Note: Google Ads data in this article is described as a method. We do not publish keyword volumes or cost-per-click figures here because they change by market and month; pull current figures from Google Keyword Planner for your own country.

## Step 1: Sort keywords by buying intent

Group every keyword idea into one of four tiers, and decide a budget per tier.

### Tier 1: Ready to hire

Searches that name the service and signal a commercial decision: "custom CRM development company", "bespoke software development UK", "marketplace app developers". These are the most valuable and the most competitive. They get the most careful landing pages and the bulk of early budget.

### Tier 2: Researching the price

"Custom CRM development cost", "how much does a marketplace app cost". People here are budgeting and often close to a decision. A page that answers the price question honestly, with real ranges, converts better than a generic contact form.

### Tier 3: Comparing options

"Salesforce alternative", "HubSpot vs custom CRM", "Shopify alternative". These searchers already know the market and are questioning their current tool. They convert when the page is a real comparison, not a sales pitch.

### Tier 4: Learning

"What is a CRM", "how to build an app". High volume, low intent, mostly belongs in organic content, not paid search. Leave these out of Google Ads unless you have a specific reason.

## Step 2: Match type follows confidence, not habit

Match types control how closely a search must resemble your keyword. A sensible default for a small budget:

- **Exact and phrase match** for Tier 1 and Tier 2, where you know the wording and want control.
- **Broad match only after** you have conversion tracking you trust and enough conversions for the system to learn from. Broad match with weak tracking teaches Google to find cheap, low-quality clicks.
- **Always review the search terms report.** It shows the real queries that triggered your ads and is the only honest basis for adding negative keywords. Add negatives from what you actually see, never from a generic list, because a negative that looks harmless can block a customer you wanted.

## Step 3: One intent, one landing page

The most common waste in agency advertising is sending every ad to the home page. Each campaign should land on a page that finishes the sentence the searcher started.

- A "custom CRM development cost" ad lands on a CRM cost page with real ranges.
- A "Salesforce alternative" ad lands on a Salesforce comparison.
- A "marketplace app developers" ad lands on a marketplace page with a relevant case study.

On this site that means our [CRM cost guide](/blog/custom-crm-development-cost-uk), our [comparison pages](/compare) and our [case studies](/work). Message match raises quality score, which lowers cost per click and raises conversion rate, both at once.

## Step 4: Measure leads, not clicks

Clicks and form fills are not the goal. A qualified conversation is.

1. **Track the form and the booking as separate conversions.** A booked discovery call is worth more than a contact-form message.
2. **Use Enhanced Conversions** so conversions are matched more reliably despite browser privacy limits.
3. **Import offline conversions from your CRM.** When a lead later becomes a paying client, send that back to Google Ads. Optimising towards revenue, not enquiries, is how you stop paying for tyre-kickers.
4. **Record the source in the lead.** Use the click ID and campaign on every enquiry so sales can see which searches produce clients.

If you cannot yet do step 3, start with step 1 and a monthly manual review of which enquiries became clients.

## Step 5: Make paid and organic work together

Paid search is a fast test, organic is a long-term asset. Use them together:

- Run paid on a keyword for a few weeks. If it produces qualified leads, build or improve the organic page for it.
- Use the paid search terms report as a free keyword research tool for blog and landing page ideas.
- Move budget away from keywords where your organic page already ranks well and converts.

We apply the same thinking to scaled location and industry pages, which we explain in [programmatic SEO for service businesses](/blog/programmatic-seo-for-service-businesses).

## A starting structure for a small budget

- Campaign 1: **Ready to hire** (exact and phrase), one ad group per service.
- Campaign 2: **Price research**, pointing at the cost guide.
- Campaign 3: **Comparisons**, one ad group per competitor.
- Skip Tier 4 entirely.
- Review the search terms report weekly for the first month, then fortnightly.
- Judge success on booked calls and later on closed work, not clicks.

## Frequently Asked Questions

### Is Google Ads worth it for a software development company?
It can be, if you target buying-intent searches and measure qualified leads. It is a poor fit if you bid on broad terms like "software development" with no conversion tracking, because you will pay for researchers, students and job seekers.

### Which keywords should a software agency target first?
Start with Tier 1 and Tier 2 intent: the service plus a commercial word, such as "custom CRM development company" or "custom CRM development cost", then add comparison searches like "Salesforce alternative". Use Google Keyword Planner to check current volumes for your country.

### Should I use broad match?
Only when your conversion tracking is reliable and you have enough conversions for the system to learn from. Until then, exact and phrase match give you control.

### How do I find negative keywords?
From the search terms report of your own campaigns. Review the actual queries that triggered ads and block only the ones that clearly will never convert. Avoid copying generic lists, which can block valuable searches.

### How long before Google Ads produces leads?
Expect a learning period of several weeks. Judge a campaign after enough clicks and conversions to be meaningful, and avoid changing bids and budgets daily.

## Want help with this?

If you want this structure built for your own software or agency business, [get in touch](/contact). We will review your tracking first, because that is where most accounts lose money.`,
  },

  // ------------------------------------------------------------------------------------------------------ 4
  {
    slug: "programmatic-seo-for-service-businesses",
    title: "Programmatic SEO for Service Businesses: Scale Location Pages Without Thin Content",
    excerpt:
      "Programmatic SEO can multiply your pages overnight and get most of them ignored. How we generate location, industry and comparison pages, and the quality gate that decides which ones are allowed into the sitemap.",
    meta_title: "Programmatic SEO for Service Businesses",
    meta_description:
      "How to use programmatic SEO for a service business: page matrices, a quality gate for indexing, unique data per page, and the mistakes that create thin content.",
    category: "SEO & Performance",
    read_time: "9 min read",
    reading_time_minutes: 9,
    published_at: "2026-10-26T09:30:00Z",
    updated_at: "2026-10-26T09:30:00Z",
    author: "Tanvir Ahmed Shuvo",
    cover_image: "/blog/programmatic-seo-service-businesses.svg",
    content: `## What programmatic SEO is, and why most of it fails

Programmatic SEO means generating many search-focused pages from structured data and a template, instead of writing each one by hand. A service business might create a page for every combination of service and city, or service and industry. Done well, it captures the long tail of specific searches that no single article could.

Done badly, it produces hundreds of near-identical pages that Google treats as thin or duplicate content and quietly stops indexing. The difference is almost never the template. It is whether each page has something genuinely its own to say, and whether you stop low-quality pages from being published at all.

We run this on our own site, so what follows is the system we use, not theory, with examples of how each part works. If you are looking for a programmatic SEO agency, this is also how we would approach your build.

## The three matrices we generate

Our site builds pages from three data sets:

- **Location by service**: a page for each service in each city we serve, such as CRM development in Manchester. Each location carries its own local context (regions, areas, local business mix, currency).
- **Industry by service**: a page for each service applied to each industry, such as a CRM for logistics. Each industry carries its own pain points, regulations, workflows, a recommended technology stack and a linked case study.
- **Comparisons**: one page for each "custom software vs [product]" decision, with cost models, a feature matrix, migration steps and a calculator.

Together these generate dozens of pages from a few data files, which is the leverage of the approach. But volume is not the point; the data underneath is.

## Rule 1: every page needs data a competitor page does not have

A page is worth indexing if a reader gets something specific from it. For each matrix that means:

- **Locations**: real local context (areas, regional industries, currency, time zone) rather than the city name swapped into a paragraph.
- **Industries**: the actual compliance rules and workflows of that industry, plus a real project as evidence.
- **Comparisons**: real pricing models, a worked cost comparison and an honest "when to choose the other option" section.

If you cannot write the unique data for a combination, do not publish that combination. A missing page costs nothing; a thin page can drag down the pages around it.

## Rule 2: a quality gate decides what gets indexed

This is the part most people skip. Not every generated page goes into our sitemap. We mark pages as top-tier only when the data behind them is strong, and only those are submitted for indexing. The rest can exist for visitors who reach them through navigation, without asking search engines to treat them as important.

In practice the gate is a short, honest checklist:

- Is there data on this page that is not on a sibling page?
- Does it link to a relevant real project?
- Does it answer a question a person would actually search?
- Would we be comfortable if someone read only this page to judge the company?

If the answer to any of these is no, the page waits.

## Rule 3: let editors override the template

Templates are a starting point. For the keywords that matter most, we override the generated page with hand-written content, targeting a specific search phrase with its own headline, description and FAQs. The generated version covers the long tail; the hand-written version wins the head terms. Our pages support a database override for exactly this reason: an editor can improve a page without touching code.

## Rule 4: link the matrix to itself and to real proof

Programmatic pages work best as a network:

- Each city page should link to the services available there and to nearby cities.
- Each industry page should link to a matching case study and comparison.
- Blog posts link into the matrix, and the matrix links back to the deeper guides. For example, our [CRM cost guide](/blog/custom-crm-development-cost-uk) supports the CRM pages, and our [Google Ads keyword strategy](/blog/google-ads-for-software-development-companies) uses the same pages as landing destinations.

Internal links tell search engines which pages matter and give visitors a route from broad to specific.

## Rule 5: measure at the cluster level

Do not judge programmatic SEO page by page. Judge it by cluster:

- How many pages in the cluster are indexed, and how many are "crawled but not indexed"?
- Which pages receive impressions for the target phrase?
- Which pages lead to a booked call, not just a visit?

If a whole cluster is not being indexed, the problem is usually quality or duplication, not the technical setup. Improve the data, then request indexing again.

## Common mistakes

- **Swapping one word.** If two pages differ only by the city name, they are duplicates.
- **Publishing everything.** Volume without a gate is the fastest route to a site-wide quality problem.
- **Forgetting the human.** Every page should end in a clear next step for a real buyer.
- **Making claims you cannot support.** Programmatic pages are especially prone to invented statistics. Only state numbers you can source.
- **Set and forget.** Prices, regulations and tools change; schedule a review.

## A simple process you can copy

1. List your services, locations and industries.
2. For each combination, ask whether you can add genuinely unique data. Remove the ones you cannot.
3. Build the template and the data files.
4. Add a quality gate that controls sitemap inclusion.
5. Hand-write the pages for your most valuable keywords.
6. Add internal links and a relevant case study to every page.
7. Review by cluster after 6 to 8 weeks.

## Frequently Asked Questions

### What is programmatic SEO?
It is the practice of generating many search-targeted pages from structured data and a template, such as one page for each combination of service and city, instead of writing each page manually.

### Is programmatic SEO bad for rankings?
Not when each page has unique, useful content. It becomes a problem when pages are near-identical, which search engines treat as thin or duplicate content. A quality gate and genuine per-page data prevent that.

### How many programmatic pages should a service business create?
Only as many as you can support with real, distinct data. Dozens of strong pages beat thousands of weak ones.

### Should every generated page be in the sitemap?
No. Submit only the pages that meet your quality standard. Others can stay accessible to visitors without being promoted to search engines.

### How long does programmatic SEO take to work?
Usually weeks to months. Review at the cluster level after six to eight weeks and improve the data on pages that are not being indexed.

## Need this built?

We build and run these systems for our own site and for clients. [Talk to us](/contact) if you want a page matrix designed around your services, with a quality gate from day one.`,
  },
];
