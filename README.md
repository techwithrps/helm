# ⚡ TallyPrime Smart Mobile POS & Billing Suite

Mobile-first POS & GST billing application for TallyPrime with instant 5-10 second voucher creation, real-time party/item auto-complete, previous price memory, and Vercel serverless integration.

---

## 🚀 Key Features

* **Mobile-First POS Interface:** Designed specifically for fast phone use (one-hand friendly, floating bottom bar, large touch buttons).
* **4 Core Accounting Vouchers:**
  * 🏷️ **Sales Invoice:** Tax invoice with AUTO GST class and MRP-inclusive back-calculation.
  * 💳 **Cash Receipt:** Single-entry mode with `Agst Ref` bill settlement.
  * 🔻 **Credit Note:** Sales return mapped to `Gst Sales` ledger.
  * 🔺 **Debit Note:** Purchase return mapped to `GST PURCHASE` ledger.
* **Price Memory Engine:** Automatically remembers and auto-fills the last sold rate for each customer and item.
* **Instant History & Daybook:** Local offline history of all generated and synced vouchers.
* **Zero Corruption & Atomicity:** Strict `<SVCURRENTCOMPANY>` locking for multi-company data safety.
* **Vercel Serverless Ready:** Deployable on Vercel with zero configuration via `vercel.json` and `/api/tally.js`.

---

## 📦 How to Deploy on Vercel

1. Import this repository (`techwithrps/helm`) into [Vercel](https://vercel.com).
2. Set Environment Variables (optional, defaults to Cloudflare Tunnel):
   * `TALLY_URL`: Your live Tally Connector tunnel URL.
3. Click **Deploy**!
