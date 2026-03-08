# 🍵 Meenatchi Traders Business Manager

A complete, mobile-first PWA business management system for Meenatchi Traders.

---

## 📁 Folder Structure

```
meenatchi-traders/
├── index.html          ← Main app (single-page application)
├── manifest.json       ← PWA manifest for mobile install
├── sw.js               ← Service Worker (offline support)
├── Code.gs             ← Google Apps Script backend
├── js/
│   ├── app.js          ← All business logic (12 modules)
│   └── sheets.js       ← Google Sheets API module
└── README.md           ← This file
```

---

## 🚀 Deployment Options

### Option A — Host on GitHub Pages (Free, Recommended)

1. Create a GitHub account at github.com
2. Create a new repository (e.g. `meenatchi-traders`)
3. Upload all files maintaining the folder structure
4. Go to Settings → Pages → Source: Deploy from branch → main
5. Your app URL: `https://yourusername.github.io/meenatchi-traders/`

### Option B — Host on Netlify (Free)

1. Go to netlify.com and create a free account
2. Drag and drop the `meenatchi-traders/` folder
3. Your app goes live instantly with a URL like `https://meenatchi-traders.netlify.app`

### Option C — Use Locally (No hosting)

1. Simply open `index.html` in Chrome browser
2. Works fully offline with localStorage
3. Install as PWA from Chrome menu

---

## 🔗 Google Sheets Connection

### Step 1: Create Your Google Sheet

Create a Google Sheet with these tabs:
- `DAILY SALES`
- `MCS`
- `SCRUBER`
- `Tuition`
- `Tean31`
- `Selling TEA`

### Step 2: Set Up Google Apps Script

1. Open your Google Sheet
2. Click **Extensions** → **Apps Script**
3. Delete existing code, paste the entire contents of `Code.gs`
4. Press **Ctrl+S** to save
5. Click **Deploy** → **New Deployment**
6. Type: **Web App**
7. Execute as: **Me**
8. Who has access: **Anyone**
9. Click **Deploy**
10. Copy the Web App URL (looks like: `https://script.google.com/macros/s/XXXXX/exec`)

### Step 3: Connect in the App

1. Open the Meenatchi Traders app
2. Go to **Settings** (⚙️)
3. Paste the Web App URL in "Apps Script Web App URL"
4. Click **Connect & Test**
5. Green checkmark = success!

---

## 💬 WhatsApp Reminders Setup

WhatsApp reminders work via the **wa.me** link API (no extra setup needed).

**How it works:**
1. Go to **WhatsApp Reminders** module
2. Enter customer name and pending amount
3. Click **Send WhatsApp** — it opens WhatsApp with the pre-filled message
4. Just hit Send!

**For bulk reminders:**
1. Go to **WhatsApp Reminders** → **Bulk Pending Reminders**
2. All customers with pending payments are listed
3. Click **Remind All** to open WhatsApp for each (1.5 sec apart)

> 💡 Tip: For automated WhatsApp (no manual click), you'd need WhatsApp Business API. Contact your GSM provider.

---

## 📄 Invoice Generation

### Automatic Invoice
1. Enter a sale in **Sales Entry**
2. Click **Save & Invoice** — invoice auto-generates!

### Manual Invoice
1. Go to **Invoices** module
2. Fill in customer and product details
3. Click **Preview Invoice**
4. Use **Download PDF** or **Send via WhatsApp**

### PDF Download
- Uses jsPDF library (loaded from CDN)
- Works offline once cached
- Includes QR code if UPI ID is set in Settings

---

## 📱 Install as Mobile App (PWA)

### Android (Chrome):
1. Open app in Chrome browser
2. Tap ⋮ menu (3 dots)
3. Tap "Add to Home Screen"
4. Tap "Add"
5. App appears on home screen like a native app!

### iPhone (Safari):
1. Open app in Safari
2. Tap Share icon (square with arrow)
3. Scroll down, tap "Add to Home Screen"
4. Tap "Add"

### Desktop (Chrome):
1. Open app in Chrome
2. Click the install icon (📥) in address bar
3. Click "Install"

---

## 📊 All Modules

| Module | Features |
|--------|----------|
| 📊 Dashboard | 7 KPI cards, weekly chart, low stock alerts, pending payments |
| 📦 Products | Add/edit products, cost calc, selling price, profit per unit, stock alerts |
| 👥 Customers | Customer profiles, purchase history, payment tracking, WhatsApp |
| 🧾 Sales Entry | Full sales form, auto-calc profit, daily summary, export CSV |
| 📄 Invoices | PDF generation, QR code, WhatsApp share, invoice history |
| 💬 WhatsApp | Payment reminders, order notifications, bulk send |
| ☕ Tea Shop | Cups sold, ingredient tracking, cost per cup, daily profit |
| 🎓 Tuition | Students, staff, fee tracking, salary management |
| 🚚 Orders | Pipeline view, status updates, WhatsApp notifications |
| 📊 Reports | Daily/weekly/monthly, product profit, customer pending, tuition |
| ⚙️ Settings | Google Sheets connection, business info, PWA install, data backup |

---

## 💾 Data Storage

- **Local:** All data stored in browser localStorage (works offline)
- **Cloud:** Sync to Google Sheets via Apps Script (optional)
- **Backup:** Export all data as JSON from Settings
- **Import:** Restore from JSON backup file

---

## 🛠️ Tech Stack

- **Frontend:** Pure HTML5, CSS3, Vanilla JavaScript
- **Styling:** Custom CSS (no framework dependency) + Google Fonts
- **Icons:** Font Awesome 6.5
- **PDF:** jsPDF + jsPDF-AutoTable
- **QR Code:** QRCode.js
- **Backend:** Google Apps Script
- **Database:** Google Sheets + localStorage
- **PWA:** Service Worker + Web App Manifest

---

## 📞 Support

Built for Meenatchi Traders, Kallakurichi, Tamil Nadu
Contact: Set up your phone number in Settings → Business Information
