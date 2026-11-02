<div align="center">

# VMS Compliance Dashboard

**Video-scan compliance tracking and automated AI reporting for a multi-city fulfillment operation**

<sub>Designed and built end to end: data pipeline · BigQuery SQL · dashboard · scheduled reports</sub>

<br>

[**▶ Live Demo**](https://bishtdeepak16.github.io/vms-compliance-dashboard/) &nbsp;·&nbsp;
[**Architecture**](https://bishtdeepak16.github.io/vms-compliance-dashboard/architecture.html) &nbsp;·&nbsp;

</div>

<br>

> **The live demo uses synthetic data.** All numbers, clients and FC names in it are generated. The production system, its code and its data are private to the company; production screenshots below are masked. This repo shows the product and the architecture, not company data.

---

## What it does
Every outbound shipment and every return must be video-scanned during packing and QC. The platform answers, for leadership and for each fulfillment centre (FC):
- How many shipments and returns were processed, and how many were scanned?
- Which FC and which client is weak, and is it improving week on week or month on month?
- Where should the team audit first?

## Highlights
- **Multi-tenant data pipeline:** daily automated ingestion from several warehouse-management tenants (30+ facilities), marketplace scan portals and a returns database into Cloud Storage and BigQuery.
- **SQL-heavy BigQuery modelling:** raw → flat → enriched layers, AWB-level joins, mapping tables (facility / channel / client) and business rules, producing two date-partitioned compliance tables.
- **Dashboard:** KPI cards, daily and monthly trends, FC → client drill-down, week-on-week and month-on-month comparison, row-level Excel export for root-cause analysis.
- **Role-based access:** Google sign-in; FC users see only their own FC. Enforced server-side, not in the browser.
- **Automated weekly AI report:** scheduled emails to leadership (all FCs) and to each FC (own data only), with scorecards, trends, a ranked "needs immediate attention" list and raw-data Excel. All numbers are computed in SQL; the AI only writes the summary, and any text with a non-matching number is rejected.
- **Reliability:** queue-based sending that resumes after a crash with no duplicate mail, safety triggers, progress log and a health-check panel.

## Stack
BigQuery (SQL) · Google Cloud Storage · Google Apps Script · Supabase · HTML / JS · Chart.js

---

<div align="center">

## Architecture

<img src="Project%20Architecture%20Diagram/architecture-flow.png" width="100%" alt="End-to-end architecture">

<sub>Four automated streams land in Cloud Storage, are prepared in BigQuery and joined on AWB into two compliance tables, which feed the dashboard and the scheduled AI report.<br>Interactive version with object reference: <a href="https://bishtdeepak16.github.io/vms-compliance-dashboard/architecture.html">architecture.html</a></sub>

</div>

---

<div align="center">

## Screenshots

<sub>Real dashboard. Client names, IDs and sensitive figures are masked.</sub>

<br>

### 📦 Outbound Compliance
<sub>Daily dispatch compliance across FCs and clients</sub>

<br>

<img src="dashboard%20images/outbound-1.png" width="92%" alt="Outbound overview">

**Overview** · KPIs, daily trend, FC summary

<br>

<img src="dashboard%20images/outbound-2.png" width="92%" alt="Outbound FC drill-down">

**FC → Client drill-down**

<br>

<img src="dashboard%20images/outbound-3.png" width="92%" alt="Outbound visualization">

**Visualization**

<br>

---

### ↩️ Returns Compliance
<sub>Return QC video-scan compliance across FCs and clients</sub>

<br>

<img src="dashboard%20images/returns-1.png" width="92%" alt="Returns overview">

**Overview** · KPIs, daily trend, FC summary

<br>

<img src="dashboard%20images/returns-2.png" width="92%" alt="Returns FC drill-down">

**FC → Client drill-down**

<br>

<img src="dashboard%20images/returns-3.png" width="92%" alt="Returns visualization">

**Visualization**

<br>

---

### 📈 Trends &amp; Comparisons
<sub>Is compliance improving week on week and month on month?</sub>

<br>

<img src="dashboard%20images/monthly-trend.png" width="92%" alt="Monthly trend">

**Monthly trend**

<br>

<img src="dashboard%20images/week-on-week.png" width="92%" alt="Week on week comparison">

**Week-on-week comparison**

<br>

---

### 👥 Client View
<sub>What each client sees for their own shipments</sub>

<br>

<table>
  <tr>
    <td align="center" width="50%">
      <img src="dashboard%20images/client-view-outbound.png" alt="Client view outbound">
      <br><br>
      <b>Outbound</b>
    </td>
    <td align="center" width="50%">
      <img src="dashboard%20images/client-view-returns.png" alt="Client view returns">
      <br><br>
      <b>Returns</b>
    </td>
  </tr>
</table>


---

<div align="center">

## 📧 Automated Weekly AI Report
<sub>Sent every week to leadership and to each FC. All numbers are computed in SQL; the AI only writes the commentary.</sub>

<br>

[**Download full report (PDF)**](Weekly%20AI%20Automated%20Report/Weekly_AI_Report_Sample.pdf) &nbsp;·&nbsp;
[**Open as HTML email**](https://bishtdeepak16.github.io/vms-compliance-dashboard/report-sample-admin.html)

<br>

**Page 1 of 6 · Summary, KPIs and FC scorecard**

<img src="Weekly%20AI%20Automated%20Report/weekly-report-page-1.png" width="75%" alt="Weekly report page 1">

<br><br>

**Page 2 of 6**

<img src="Weekly%20AI%20Automated%20Report/weekly-report-page-2.png" width="75%" alt="Weekly report page 2">

<br><br>

**Page 3 of 6**

<img src="Weekly%20AI%20Automated%20Report/weekly-report-page-3.png" width="75%" alt="Weekly report page 3">

<br><br>

**Page 4 of 6**

<img src="Weekly%20AI%20Automated%20Report/weekly-report-page-4.png" width="75%" alt="Weekly report page 4">

<br><br>

**Page 5 of 6**

<img src="Weekly%20AI%20Automated%20Report/weekly-report-page-5.png" width="75%" alt="Weekly report page 5">

<br><br>

**Page 6 of 6**

<img src="Weekly%20AI%20Automated%20Report/weekly-report-page-6.png" width="75%" alt="Weekly report page 6">

<br>

<sub>Sample built from synthetic data.</sub>

</div>as a static page. No login or backend is needed.
