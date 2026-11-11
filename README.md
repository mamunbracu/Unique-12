# Unique Twelve (ইউনিক-১২) – Samity Finance Dashboard

Finance tracker for the Unique-12 savings samity (12 members, founded 03-05-2022, Harala, Chandanaish, Chattogram).
It runs on Google Sheets, Google Drive and Google Apps Script, so storage and hosting are free.

## Files
- `Index.html` – the whole dashboard in one file. Opened directly in a browser it runs in demo mode (data saved in that browser).
- `Code.gs` – Apps Script backend that stores everything in a Google Sheet and files in Google Drive.

## Features
- Overview charts, ledger, Finance tab (every account, holders, FDR projections, interest & income), expenses, assets, reports, CSV/JSON backup, 5 themes
- 12 members with English + Bangla names, father's name, nominee, share %, photo
- Payment calendar per member, late detection (due 1–5th) and late fines (Rule 3: 10% on the 6th, then ৳100/day)
- Admin Quick Pay: any year/month, down payments, and a Year Grid to pay many months at once (with automatic late fines)
- Member and nominee ID card uploads (admin-only viewing)
- Resolution (চুক্তিনামা / রেজুলেশন) in English and Bangla tabs, editable by the admin
- Excel template + import for back-filling 2022 → today
- Read-only member view; admin login (default password `1535` — change it in Settings)

## Deploy (free) – you only need a Google account
1. sheets.google.com → blank sheet → Extensions → Apps Script.
2. Paste `Code.gs`. Add an HTML file named `Index` and paste `Index.html`. Save.
3. Run `setup` once and allow the permissions.
4. Deploy → New deployment → Web app → Execute as: **Me**, Who has access: **Anyone** → Deploy.
5. Open the Web app URL → Admin Login → confirm "Set up" to create the 12 members and the resolution.

To update later: paste the new code → Deploy → Manage deployments → Edit → Version: New version → Deploy.
