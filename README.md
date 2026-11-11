# Unique Twelve – Samity Finance Dashboard

Finance tracker for the Unique Twelve savings samity (12 members). It runs on Google Sheets + Google Apps Script, so hosting and storage are free.

## Files
- `Index.html` – the full dashboard (single file). Opened directly in a browser it runs in demo mode with sample data saved in the browser.
- `Code.gs` – Apps Script backend that stores everything in a Google Sheet.

## Features
Overview charts · member profiles with payment calendars · admin Quick Pay · ledger · banks & FDR · expenses · asset management · reports, CSV export, JSON/Drive backup · 5 themes · read-only member view with admin login (default password `1535`, change it in Settings).

## Deploy (free)
1. Create a Google Sheet → Extensions → Apps Script.
2. Paste `Code.gs`; add an HTML file named `Index` and paste `Index.html`.
3. Run `setup` once and allow permissions.
4. Deploy → New deployment → Web app → Execute as: Me, Access: Anyone → Deploy.
5. Open the Web app URL, log in as admin, then add members or load demo data from Settings.
