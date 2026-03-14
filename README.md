# 🍵 Meenatchi Traders — File Setup Guide

## 📁 Required File Structure

Place all files in the **same folder** on your computer or web server:

```
meenatchi-traders/
│
├── index.html              ← Main app (your original file, updated)
├── manifest.json           ← PWA install manifest
├── sw.js                   ← Service worker (offline support)
├── loyalty-gifts.js        ← 🆕 Gift Redemption feature
├── Code.gs                 ← Google Apps Script (for Sheets sync)
├── generate-icons.html     ← Helper: generate PWA icons
│
└── icons/                  ← PWA icon images (generate using generate-icons.html)
    ├── icon-72.png
    ├── icon-96.png
    ├── icon-128.png
    ├── icon-144.png
    ├── icon-152.png
    ├── icon-192.png
    ├── icon-384.png
    └── icon-512.png
```

---

## 🚀 Quick Setup (3 Steps)

### Step 1 — Generate Icons
1. Open `generate-icons.html` in your browser
2. Click **"Download All Icons"**
3. Create a folder called `icons/` and save all 8 PNG files inside it

### Step 2 — Open the App
- Double-click `index.html` to open in browser, **OR**
- For best experience, serve from a local web server:
  ```
  # Python (if installed)
  python -m http.server 8080
  # Then open: http://localhost:8080
  ```

### Step 3 — Install as PWA (optional)
- On Chrome/Edge: click the install icon (⊕) in the address bar
- On mobile: "Add to Home Screen" from browser menu

---

## 🎁 New Feature: Loyalty Gift Redemption

> **File:** `loyalty-gifts.js`

Loyal customers can now redeem their points to get products as FREE gifts.

### How Points Work
| Action | Points |
|--------|--------|
| Spend ₹100 | Earn 1 point |
| Spend ₹1000 | Earn 10 points |

### How to Redeem a Gift
| Product Price | Points Needed |
|---------------|---------------|
| ₹50 product   | 5 points      |
| ₹100 product  | 10 points     |
| ₹200 product  | 20 points     |
| ₹500 product  | 50 points     |

**Formula:** `Points Needed = Product Sell Price ÷ 10`

### Loyalty Tiers
| Tier | Points Required |
|------|----------------|
| ⭐ Member | 0+ pts |
| 🥉 Bronze | 50+ pts |
| 🥈 Silver | 100+ pts |
| 🥇 Gold | 200+ pts |
| 💎 Platinum | 500+ pts |

### To Use
1. Go to **Loyalty & Referrals** → **🎁 Gift Redemption** tab
2. Select a customer — their available points display automatically
3. Choose a product — points required calculated automatically
4. If eligible, click **"Redeem Gift"**
5. Stock reduces, points deducted, WhatsApp notification sent

---

## 📊 Google Sheets Sync (Optional)

`Code.gs` is a Google Apps Script to sync data with Google Sheets.

### Setup
1. Open your Google Sheet → **Extensions → Apps Script**
2. Paste the contents of `Code.gs`
3. Click **Deploy → New Deployment → Web App**
4. Set "Who has access" to **Anyone**
5. Copy the Web App URL
6. Paste it in the app under **Settings → Google Sheets URL**

### Sheet Tabs Created Automatically
- `DAILY SALES` — all sales records
- `Products` — product catalog & stock
- `Customers` — customer records
- `Invoices` — invoice history
- `Gift Redemptions` — 🆕 loyalty gift records
- `Tuition` — student records
- `Staff` — staff & salary

---

## 💾 Data Storage

All data is stored in your **browser's localStorage** under the key:
```
meenatchi_traders_data
```

To back up: go to **Settings → Export JSON Backup**
To restore: **Settings → Import JSON Backup**

---

## 📱 PWA Features
- ✅ Works offline (after first load)
- ✅ Installable on phone & desktop
- ✅ No internet required for core features
- ✅ Data stays on your device (private)

---

*Meenatchi Traders © 2026 — v1.0 PWA*
