# VMS Compliance Dashboard — Architecture & Demo

A **demo version** of a video-scan (VMS) compliance dashboard and automated weekly report that I designed and built end to end for a multi-city warehousing and fulfillment operation.

> **All numbers, clients and FC names in the live demo are synthetic.** Production screenshots below are masked. The production system, its code and its data are private to the company. This repo shows the product and the architecture, not company data.

**Live demo:** open `index.html` (GitHub Pages) · **Sample emails:** `report-sample-admin.html`, `report-sample-fc.html` · **Architecture:** `architecture.html`

## What it does
Every outbound shipment and every return must be video-scanned during packing/QC. The platform answers, for leadership and for each fulfillment centre (FC):
- How many shipments/returns were processed and how many were scanned?
- Which FC and which client is weak, and is it improving week-on-week or month-on-month?
- Where should the team audit first?

## Architecture
![End-to-end architecture](Project%20Architecture%20Diagram/architecture-flow.png)

Full interactive version with object reference: `architecture.html` (open via the GitHub Pages link).

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

### Production dashboard (real UI)
_Client names, shipment IDs and sensitive figures are masked._



<br>

<br>
<br> <h3 align="center">📦 &nbsp;Outbound Compliance</h3> <p align="center"><sub>Daily dispatch compliance across FCs and clients</sub></p> <br> <p align="center"> <img src="dashboard%20images/outbound-1.png" width="92%" alt="Outbound overview"> <br><br> <b>Overview</b> · KPIs, daily trend, FC summary </p>

<br><br>

<p align="center"> <img src="dashboard%20images/outbound-2.png" width="92%" alt="Outbound FC drill-down"> <br><br> <b>FC → Client drill-down</b> </p>

<br><br>

<p align="center"> <img src="dashboard%20images/outbound-3.png" width="92%" alt="Outbound detail"> <br><br> <b>Visualization</b> </p> <br>
<br> <h3 align="center">↩️ &nbsp;Returns Compliance</h3> <p align="center"><sub>Return QC video-scan compliance across FCs and clients</sub></p> <br> <p align="center"> <img src="dashboard%20images/returns-1.png" width="92%" alt="Returns overview"> <br><br> <b>Overview</b> · KPIs, daily trend, FC summary </p>

<br><br>

<p align="center"> <img src="dashboard%20images/returns-2.png" width="92%" alt="Returns FC drill-down"> <br><br> <b>FC → Client drill-down</b> </p>

<br><br>

<p align="center"> <img src="dashboard%20images/returns-3.png" width="92%" alt="Returns detail"> <br><br> <b>Visualization</b> </p> <br>
<br> <h3 align="center">📈 &nbsp;Trends &amp; Comparisons</h3> <p align="center"><sub>Is compliance improving week on week and month on month?</sub></p> <br> <p align="center"> <img src="dashboard%20images/monthly-trend.png" width="92%" alt="Monthly trend"> <br><br> <b>Monthly trend</b> </p>

<br><br>

<p align="center"> <img src="dashboard%20images/week-on-week.png" width="92%" alt="Week on week comparison"> <br><br> <b>Week-on-week comparison</b> </p> <br>
<br> <h3 align="center">👥 &nbsp;Client View</h3> <p align="center"><sub>What each client sees for their own shipments</sub></p> <br> <table align="center"> <tr> <td align="center" width="50%"> <img src="dashboard%20images/client-view-outbound.png" alt="Client view outbound"> <br><br> <b>Outbound</b> </td> <td align="center" width="50%"> <img src="dashboard%20images/client-view-returns.png" alt="Client view returns"> <br><br> <b>Returns</b> </td> </tr> </table> <br>
About the live demo

mock.js replaces the private Apps Script and BigQuery backend with a synthetic data generator that returns the same response shapes, so the real front-end runs unchanged as a static page. No login or backend is needed.
![Weekly email](docs/weekly-email.png)
