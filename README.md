# Unique Twelve (ইউনিক-১২) – Samity Finance Dashboard

Finance tracker for the Unique-12 savings samity (12 members, founded 03-05-2022, Harala, Chandanaish, Chattogram).
It runs on Google Sheets, Google Drive and Google Apps Script, so storage and hosting are free.

## Files
- `index.html` – the whole dashboard in one file. With the Firebase settings filled in it uses your online database; without them it runs in demo mode (data saved in that browser).
- `firestore.rules` – security rules to paste into Firebase (everyone can view, only the admin can edit, ID cards admin-only).
- `Code.gs` – only for Option B (Google Sheets + Apps Script).

## Features
- Overview charts, ledger, Finance tab (every account, holders, FDR projections, interest & income), expenses, assets, reports, CSV/JSON backup, 5 themes
- 12 members with English + Bangla names, father's name, nominee, share %, photo
- Payment calendar per member, late detection (due 1–5th) and late fines (Rule 3: 10% on the 6th, then ৳100/day)
- Admin Quick Pay: any year/month, down payments, and a Year Grid to pay many months at once (with automatic late fines)
- Member and nominee ID card uploads (admin-only viewing)
- Resolution (চুক্তিনামা / রেজুলেশন) in English and Bangla tabs, editable by the admin
- Excel template + import for back-filling 2022 → today
- Read-only member view; admin login (default password `1535` — change it in Settings)

## Option A (recommended): Firebase + GitHub Pages — free, no card, no warnings

### 1. Create the Firebase project (5 min)
1. Go to **console.firebase.google.com** → **Create a project** → name it `unique-twelve` → you can turn Google Analytics **off** → Create.
2. The project is on the free **Spark** plan. No card is needed; don't upgrade.

### 2. Create the database
1. Left menu **Build → Firestore Database** → **Create database**.
2. Location: pick one near you (e.g. `asia-south1` Mumbai or `australia-southeast1` Sydney) → **Start in production mode** → Create.
3. Open the **Rules** tab, delete everything, paste the contents of `firestore.rules` from this repo, **change the email** to your admin email, then click **Publish**.

### 3. Create the admin login
1. **Build → Authentication** → Get started → **Email/Password** → Enable → Save.
2. **Users** tab → **Add user** → your admin email + a password (at least 6 characters). This is the password you will type in the dashboard.

### 4. Connect index.html to Firebase
1. Project **⚙ Settings → General** → under "Your apps" click the **</>** (Web) icon → name `dashboard` → Register app (no hosting needed).
2. Copy the `firebaseConfig` values it shows.
3. In `index.html` find `FIREBASE_CONFIG` near the top of the script and paste the values; set `ADMIN_EMAIL` to the same admin email. Commit the change on GitHub (✏️ Edit → Commit changes).

### 5. Put the site online with GitHub Pages
1. This repo → **Settings → Pages** → Source: **Deploy from a branch** → Branch: **main** / **(root)** → Save.
2. After about a minute your site is at **https://mamunbracu.github.io/Unique-12/**.
3. Back in Firebase → **Authentication → Settings → Authorized domains** → **Add domain** → `mamunbracu.github.io`.
4. Open the site → **Admin Login** → your password → click **Set up** to create the 12 members and the resolution.

Notes
- The `apiKey` in index.html is meant to be public — security comes from the Firestore rules and the admin login. If GitHub emails you a "secret detected" alert about it, that is expected for Firebase web keys.
- Free limits (50,000 reads / 20,000 writes per day, 1 GB) are far more than 12 members need.
- Files (photos, NID cards, documents) are stored inside Firestore, up to about 680 KB each; photos and large images are shrunk automatically.

## Option B: Google Sheets + Apps Script
 – you only need a Google account
1. sheets.google.com → blank sheet → Extensions → Apps Script.
2. Paste `Code.gs`. Add an HTML file named `Index` and paste `index.html`. Save.
3. Run `setup` once and allow the permissions.
4. Deploy → New deployment → Web app → Execute as: **Me**, Who has access: **Anyone** → Deploy.
5. Open the Web app URL → Admin Login → confirm "Set up" to create the 12 members and the resolution.

To update later: paste the new code → Deploy → Manage deployments → Edit → Version: New version → Deploy.
