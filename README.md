# VMS Compliance Dashboard — Demo

A **demo version** of a video-scan (VMS) compliance dashboard and automated weekly report that I designed and built end to end for a multi-city warehousing and fulfillment operation.

> **All numbers, clients and FC names in this demo are synthetic.** The production system, its code and its data are private to the company. This repo shows the product and the architecture, not company data.

**Live demo:** open `index.html` (GitHub Pages) · **Sample emails:** `report-sample-admin.html`, `report-sample-fc.html` · **Architecture:** `architecture.html`

## What it does
Every outbound shipment and every return must be video-scanned during packing/QC. The platform answers, for leadership and for each fulfillment centre (FC):
- How many shipments/returns were processed and how many were scanned?
- Which FC and which client is weak, and is it improving week-on-week or month-on-month?
- Where should the team audit first?

## Highlights
- **Multi-tenant data pipeline:** daily automated ingestion from several warehouse-management tenants (30+ facilities), marketplace scan portals and a returns database into Cloud Storage → BigQuery.
- **SQL-heavy BigQuery modelling:** raw → flat → enriched layers, AWB-level joins, mapping tables (facility / channel / client) and business rules, producing two date-partitioned compliance tables.
- **Dashboard:** KPI cards, daily and monthly trends, FC → client drill-down, W-O-W and M-O-M comparison, row-level Excel export for root-cause analysis.
- **Role-based access:** Google sign-in; FC users see only their own FC. Enforced server-side, not in the browser.
- **Automated weekly AI report:** scheduled emails to leadership (all FCs) and to each FC (own data only), with scorecards, trends, a ranked "needs immediate attention" list and raw-data Excel. All numbers are computed in SQL; the AI only writes the summary and any text with a non-matching number is rejected.
- **Reliability:** queue-based sending that resumes after a crash with no duplicate mail, safety triggers, progress log, health-check panel.

## Stack
BigQuery (SQL) · Google Cloud Storage · Google Apps Script · Supabase · HTML/JS · Chart.js

## About this demo
`mock.js` replaces the private Apps Script + BigQuery backend with a synthetic data generator that returns the same response shapes, so the real front-end runs unchanged as a static page.

## Screenshots
![Outbound](docs/dashboard-outbound.png)
![Monthly trends](docs/dashboard-trends.png)
![Week on week](docs/dashboard-wow.png)
![Weekly email](docs/weekly-email.png)
