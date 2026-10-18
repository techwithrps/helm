/**
 * TallyPrime Smart Billing Suite
 * Sales Voucher, Credit Note & Debit Note Generation and Tally Gateway Client
 */

// 1. Indian States & GST Codes
const INDIAN_STATES = [
  { code: "01", name: "Jammu and Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "19", name: "West Bengal" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "97", name: "Other Territory" }
];

// 2. Default Configuration & State
const appConfig = {
  connectorUrl: "https://courtesy-vanilla-volvo-blocking.trycloudflare.com/?key=infra_d4e4f164a4d442d4",
  companyName: "Nanak Food Mart",
  companyGstin: "07AAAAA0000A1Z5",
  companyStateCode: "07",
  companyAddress: "Shop 4, Market Complex, Delhi - 110001",
  voucherType: "Sales" // "Sales", "Receipt", "Credit Note", "Debit Note"
};

let rowCounter = 0;

// Verified Nanak Food Mart Masters (In-Memory Baseline with Real-Time Tally Sync)
const DEFAULT_DEBTORS = [
  { name: "The Eclair Bakery", balance: "305740.86", group: "Sundry Debtors", gstin: "07AAAAA0000A1Z5" },
  { name: "M/s Gyan's Vegetarian Catering Service", balance: "98665.00", group: "Sundry Debtors", gstin: "" },
  { name: "M/s  Shri Balaji Infrastructure", balance: "90990.00", group: "Sundry Debtors", gstin: "" },
  { name: "An Amm Entertainment Venture", balance: "84580.00", group: "Sundry Debtors", gstin: "" },
  { name: "Perfeccion Hospitality Private Limted", balance: "71311.01", group: "Sundry Debtors", gstin: "" },
  { name: "M/s Garun Hotels Private Limited", balance: "69245.90", group: "Sundry Debtors", gstin: "" },
  { name: "Deepak Quality Bakery", balance: "142500.00", group: "Sundry Debtors", gstin: "" },
  { name: "MVR Grand Hotel LLP", balance: "210450.00", group: "Sundry Debtors", gstin: "" },
  { name: "Kay Sons Oils Pvt. Ltd.", balance: "88200.00", group: "Sundry Debtors", gstin: "" },
  { name: "Sharma Grocery Mart", balance: "45210.00", group: "Sundry Debtors", gstin: "07BBAAA9999C1Z1" },
  { name: "7 Heaven Hotel", balance: "52100.00", group: "Sundry Debtors", gstin: "" },
  { name: "Bikanervala Foods Pvt Ltd", balance: "58400.00", group: "Sundry Debtors", gstin: "" },
  { name: "Haldiram Snacks Pvt Ltd", balance: "62150.00", group: "Sundry Debtors", gstin: "" },
  { name: "Modern Bazaar Departmental Stores", balance: "115300.00", group: "Sundry Debtors", gstin: "" },
  { name: "Cash Customer (Walk-in)", balance: "0.00", group: "Sundry Debtors", gstin: "" }
];

const DEFAULT_ITEMS = [
  { name: "Hamper Box Transparant Lid", hsn: "4819", unit: "PCS", rate: 296.61, gst: 18 },
  { name: "Hamper Box Transparant Lid 10*10", hsn: "4819", unit: "PCS", rate: 296.61, gst: 18 },
  { name: "12pcs Brownie Tray", hsn: "392410", unit: "PCS", rate: 14.50, gst: 18 },
  { name: "1cup Cake Hamper Box", hsn: "392690", unit: "PCS", rate: 18.00, gst: 18 },
  { name: "4 Cup Cake Box Christmas", hsn: "392690", unit: "PCS", rate: 22.00, gst: 18 },
  { name: "5 Side Window Box 1/2kg", hsn: "4819", unit: "PCS", rate: 16.50, gst: 18 },
  { name: "6pcs Brownie Tray", hsn: "4819", unit: "PCS", rate: 9.50, gst: 18 },
  { name: "3d Heart Mould 600", hsn: "392640", unit: "PCS", rate: 45.00, gst: 18 },
  { name: "Hamper Box 225", hsn: "4819", unit: "PCS", rate: 225.00, gst: 18 },
  { name: "Hamper Box 8*8", hsn: "4819", unit: "PCS", rate: 195.00, gst: 18 },
  { name: "Dr.Smith Black Olive 680ml", hsn: "2005", unit: "BTL", rate: 107.61, gst: 12 },
  { name: "Basmati Rice Premium (1kg)", hsn: "1006", unit: "KG", rate: 120.00, gst: 5 },
  { name: "Fortune Sunlite Refined Oil (1L)", hsn: "1512", unit: "LTR", rate: 145.00, gst: 5 },
  { name: "Amul Butter Pasteurized (500g)", hsn: "0405", unit: "PKT", rate: 275.00, gst: 12 },
  { name: "Cadbury Dairy Milk Silk Chocolate", hsn: "1806", unit: "PCS", rate: 175.00, gst: 18 },
  { name: "Aashirvaad Superior MP Atta (10kg)", hsn: "1101", unit: "BAG", rate: 420.00, gst: 5 },
  { name: "Tata Salt Vacuum Evaporated (1kg)", hsn: "2501", unit: "PKT", rate: 28.00, gst: 0 },
  { name: "Almond California Raw (1kg)", hsn: "0802", unit: "KG", rate: 850.00, gst: 5 },
  { name: "Cashew Nut W320 Premium (1kg)", hsn: "0801", unit: "KG", rate: 920.00, gst: 5 },
  { name: "Nestle Everyday Dairy Whitener (1kg)", hsn: "0402", unit: "PKT", rate: 590.00, gst: 5 },
  { name: "Catch Black Pepper Sprinkler (100g)", hsn: "0904", unit: "BTL", rate: 95.00, gst: 5 },
  { name: "Everest Pav Bhaji Masala (100g)", hsn: "0910", unit: "PKT", rate: 78.00, gst: 5 },
  { name: "Red Bull Energy Drink (250ml)", hsn: "2202", unit: "CAN", rate: 125.00, gst: 28 },
  { name: "Coca Cola Can (300ml)", hsn: "2202", unit: "CAN", rate: 40.00, gst: 28 },
  { name: "Bisleri Mineral Water (1L)", hsn: "2201", unit: "BTL", rate: 20.00, gst: 18 },
  { name: "Kissan Fresh Tomato Ketchup (1kg)", hsn: "2103", unit: "BTL", rate: 135.00, gst: 12 },
  { name: "Nutella Hazelnut Spread (350g)", hsn: "1806", unit: "JAR", rate: 390.00, gst: 18 },
  { name: "Haldiram Soan Papdi (500g)", hsn: "2106", unit: "BOX", rate: 160.00, gst: 5 },
  { name: "Bikano Bhujia Sev (1kg)", hsn: "2106", unit: "PKT", rate: 260.00, gst: 5 }
];

window.allDebtors = [...DEFAULT_DEBTORS];
window.allCreditors = [];
window.allStockItems = [...DEFAULT_ITEMS];
window.allBillsByParty = {};

// Initialize on Load
document.addEventListener("DOMContentLoaded", () => {
  initStates();
  initDefaults();
  addItemRow(); // Default initial row
  loadTallyMasters(); // Fetch real-time from Tally
  checkConnectorStatus();
  setInterval(checkConnectorStatus, 15000); // 15s heartbeat

  // Close autocomplete dropdowns when clicking outside
  document.addEventListener("click", (e) => {
    if (!e.target.closest(".autocomplete-wrapper")) {
      document.querySelectorAll(".autocomplete-dropdown").forEach(d => d.style.display = "none");
    }
  });
});

// Pre-seeded price memory from Nanak Food Mart vouchers
const DEFAULT_PRICE_MEM = {
  "kay sons oils pvt. ltd.:::dr.smith black olive 680ml": 107.61,
  "deepak quality bakery:::hamper box transparant lid 10*10": 296.61,
  "the eclair bakery:::hamper box transparant lid 10*10": 296.61,
  "mvr grand hotel llp:::hamper box transparant lid 10*10": 296.61
};

function getPartyLastRate(party, item) {
  if (!party || !item) return null;
  const key = `${party.toLowerCase().trim()}:::${item.toLowerCase().trim()}`;
  try {
    const memory = JSON.parse(localStorage.getItem("NFM_PRICE_MEMORY") || "{}");
    if (memory[key]) return memory[key];
  } catch (e) {}
  return DEFAULT_PRICE_MEM[key] || null;
}

function savePartyLastRate(party, item, rate) {
  if (!party || !item || !rate) return;
  const key = `${party.toLowerCase().trim()}:::${item.toLowerCase().trim()}`;
  try {
    const memory = JSON.parse(localStorage.getItem("NFM_PRICE_MEMORY") || "{}");
    memory[key] = parseFloat(rate);
    localStorage.setItem("NFM_PRICE_MEMORY", JSON.stringify(memory));
  } catch (e) {}
}

function highlightMatch(text, query) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return text.substring(0, idx) + '<mark>' + text.substring(idx, idx + query.length) + '</mark>' + text.substring(idx + query.length);
}

// =========================================================================
// AUTOCOMPLETE DROPDOWN HANDLERS (Party & Items)
// =========================================================================

function handlePartyInput(input) {
  const dd = document.getElementById("party-autocomplete-dropdown");
  if (!dd) return;
  const q = input.value.trim().toLowerCase();

  const list = (window.allDebtors && window.allDebtors.length > 0) ? window.allDebtors : DEFAULT_DEBTORS;
  const filtered = q ? list.filter(d => d.name.toLowerCase().includes(q)) : list.slice(0, 10);

  if (filtered.length === 0 && !q) {
    dd.style.display = "none";
    return;
  }

  let html = filtered.slice(0, 10).map(d => `
    <div class="autocomplete-item" onclick="selectParty('${d.name.replace(/'/g, "\\'")}', '${d.balance || '0.00'}', '${d.gstin || ''}')">
      <div>
        <div class="autocomplete-item-name">${highlightMatch(d.name, q)}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${d.group || 'Sundry Debtors'}</div>
      </div>
      <div class="autocomplete-item-meta">
        <span class="autocomplete-item-badge">₹${parseFloat(d.balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})} Dr</span>
      </div>
    </div>
  `).join("");

  if (q && !filtered.some(d => d.name.toLowerCase() === q)) {
    html += `
      <div class="autocomplete-create-new" onclick="selectParty('${input.value.replace(/'/g, "\\'")}', '0.00', '')">
        ➕ Use "${input.value}" as New Customer
      </div>
    `;
  }

  dd.innerHTML = html;
  dd.style.display = "block";
}

function selectParty(name, balance, gstin) {
  document.getElementById("party-name").value = name;
  const balElem = document.getElementById("party-current-bal");
  if (balElem) {
    balElem.innerHTML = `💰 Current Outstanding: <strong>₹${parseFloat(balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})} Dr</strong>`;
  }
  if (gstin) {
    const gstinInput = document.getElementById("party-gstin");
    if (gstinInput) gstinInput.value = gstin;
    handleGstinInput();
  }
  const dd = document.getElementById("party-autocomplete-dropdown");
  if (dd) dd.style.display = "none";
  showToast(`Selected Customer: ${name}`, "info");
}

function handleReceiptPartyInput(input) {
  const dd = document.getElementById("receipt-party-autocomplete-dropdown");
  if (!dd) return;
  const q = input.value.trim().toLowerCase();

  const list = (window.allDebtors && window.allDebtors.length > 0) ? window.allDebtors : DEFAULT_DEBTORS;
  const filtered = q ? list.filter(d => d.name.toLowerCase().includes(q)) : list.slice(0, 10);

  if (filtered.length === 0 && !q) {
    dd.style.display = "none";
    return;
  }

  let html = filtered.slice(0, 10).map(d => `
    <div class="autocomplete-item" onclick="selectReceiptParty('${d.name.replace(/'/g, "\\'")}', '${d.balance || '0.00'}')">
      <div>
        <div class="autocomplete-item-name">${highlightMatch(d.name, q)}</div>
        <div style="font-size: 10px; color: var(--text-muted);">${d.group || 'Sundry Debtors'}</div>
      </div>
      <div class="autocomplete-item-meta">
        <span class="autocomplete-item-badge">₹${parseFloat(d.balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})} Dr</span>
      </div>
    </div>
  `).join("");

  dd.innerHTML = html;
  dd.style.display = "block";
}

function selectReceiptParty(name, balance) {
  document.getElementById("receipt-party").value = name;
  const balElem = document.getElementById("receipt-party-bal");
  if (balElem) {
    balElem.innerHTML = `💰 Outstanding: <strong>₹${parseFloat(balance || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})} Dr</strong>`;
  }
  const dd = document.getElementById("receipt-party-autocomplete-dropdown");
  if (dd) dd.style.display = "none";
  handleReceiptPartyChange();
}

function findMatchingStockItem(query) {
  if (!query) return null;
  const list = (window.allStockItems && window.allStockItems.length > 0) ? window.allStockItems : DEFAULT_ITEMS;
  const q = query.trim().toLowerCase();

  // 1. Exact match
  let m = list.find(it => it.name.toLowerCase() === q);
  if (m) return m;

  // 2. Starts with query
  m = list.find(it => it.name.toLowerCase().startsWith(q));
  if (m) return m;

  // 3. Item contains query
  m = list.find(it => it.name.toLowerCase().includes(q));
  if (m) return m;

  // 4. Query contains item name
  m = list.find(it => q.includes(it.name.toLowerCase()));
  if (m) return m;

  // 5. Multi-token word match (e.g. 'hamper box lid' -> 'Hamper Box Transparant Lid 10*10')
  const tokens = q.split(/[\s*xX\-_]+/).filter(t => t.length > 1);
  if (tokens.length > 0) {
    m = list.find(it => {
      const itName = it.name.toLowerCase();
      return tokens.every(tok => itName.includes(tok));
    });
    if (m) return m;
  }

  return null;
}

function handleItemInput(input, rowId) {
  const dd = document.getElementById(`item-dropdown-${rowId}`);
  if (!dd) return;
  const q = input.value.trim().toLowerCase();

  const list = (window.allStockItems && window.allStockItems.length > 0) ? window.allStockItems : DEFAULT_ITEMS;
  const filtered = q ? list.filter(it => it.name.toLowerCase().includes(q)) : list.slice(0, 12);

  if (filtered.length === 0) {
    dd.innerHTML = `<div class="autocomplete-item" style="color: var(--text-muted); font-size: 11px;">No matching stock item found in Tally catalog.</div>`;
    dd.style.display = "block";
    return;
  }

  dd.innerHTML = filtered.slice(0, 10).map(it => {
    const rateVal = parseFloat(it.rate || 0);
    const rateBadge = rateVal > 0 ? `₹${rateVal.toFixed(2)}/${it.unit || 'PCS'}` : `✏️ Rate: Manual / ${it.unit || 'PCS'}`;
    const hsnBadge = it.hsn ? `<span class="autocomplete-item-hsn">HSN ${it.hsn}</span>` : '';
    const safeName = it.name.replace(/'/g, "\'");
    return `
      <div class="autocomplete-item" 
           onmousedown="selectStockItem(${rowId}, '${safeName}')"
           onclick="selectStockItem(${rowId}, '${safeName}')">
        <div class="autocomplete-item-name">${highlightMatch(it.name, q)}</div>
        <div class="autocomplete-item-meta">
          ${hsnBadge}
          <span class="autocomplete-item-badge">${rateBadge}</span>
          <span class="autocomplete-item-badge" style="background: #eef2ff; color: #4338ca; border-color: #c7d2fe;">${it.gst || 18}% GST</span>
        </div>
      </div>
    `;
  }).join("");
  dd.style.display = "block";
}

function handleItemBlur(input, rowId) {
  setTimeout(() => {
    const val = input.value.trim();
    if (!val) {
      recalculateTotals();
      return;
    }
    const item = findMatchingStockItem(val);
    if (item) {
      selectStockItem(rowId, item.name);
    } else {
      recalculateTotals();
    }
  }, 220);
}

function selectStockItem(rowId, itemName) {
  const row = document.getElementById(`item-row-${rowId}`);
  if (!row) return;

  const item = findMatchingStockItem(itemName);
  if (!item) {
    recalculateTotals();
    return;
  }

  const nameInput = row.querySelector(".item-name");
  if (nameInput) nameInput.value = item.name;

  const hsnInput = row.querySelector(".item-hsn");
  if (hsnInput) hsnInput.value = item.hsn || "";

  const unitInput = row.querySelector(".item-unit");
  if (unitInput) unitInput.value = item.unit || "PCS";

  // Check Party Price Memory
  const partyName = document.getElementById("party-name")?.value.trim() || "";
  const oldRate = getPartyLastRate(partyName, item.name);
  const rateInput = row.querySelector(".item-rate");
  if (rateInput) {
    const finalRate = (oldRate !== null && oldRate > 0) ? oldRate : (parseFloat(item.rate) || 0);
    if (finalRate > 0) {
      rateInput.value = parseFloat(finalRate).toFixed(2);
    } else {
      rateInput.value = "";
      rateInput.placeholder = "Enter Rate (₹)";
      setTimeout(() => {
        rateInput.focus();
        if (rateInput.select) rateInput.select();
      }, 100);
    }
  }

    let badge = row.querySelector(".last-rate-badge");
    if (oldRate !== null && oldRate > 0) {
      if (!badge) {
        badge = document.createElement("div");
        badge.className = "last-rate-badge";
        rateInput.parentNode.appendChild(badge);
      }
      badge.innerHTML = `🏷️ Old Rate: ₹${oldRate.toFixed(2)}`;
    } else if (badge) {
      badge.remove();
    }
  }

  const gstSelect = row.querySelector(".item-gst");
  if (gstSelect) {
    const itemGst = parseInt(item.gst || 18, 10);
    Array.from(gstSelect.options).forEach(opt => {
      if (parseInt(opt.value, 10) === itemGst) {
        opt.selected = true;
      }
    });
  }

  const dd = document.getElementById(`item-dropdown-${rowId}`);
  if (dd) dd.style.display = "none";

  recalculateTotals();
  showToast(`Item Loaded: ${item.name} (HSN ${item.hsn || '4819'}, ₹${parseFloat(item.rate || 0).toFixed(2)})`, "info");
}

async function loadTallyMasters() {
  try {
    let itemsCount = 0;
    let debtorsCount = 0;

    // 1. Live API: Fetch Ledgers directly from Tally
    try {
      const lRes = await fetch("/api/ledgers", {
        headers: { "X-Tally-URL": appConfig.connectorUrl, "X-Tally-Company": appConfig.companyName }
      });
      if (lRes.ok) {
        const lData = await lRes.json();
        if (lData.debtors && lData.debtors.length > 0) {
          window.allDebtors = lData.debtors;
          debtorsCount = window.allDebtors.length;
        }
        if (lData.creditors && lData.creditors.length > 0) {
          window.allCreditors = lData.creditors;
        }
        if (lData.sales && lData.sales.length > 0) {
          const gstSales = lData.sales.find(s => s.name.toLowerCase().includes("gst sales")) || lData.sales[0];
          if (gstSales) {
            document.getElementById("sales-ledger").value = gstSales.name;
          }
        }
      }
    } catch (e) {
      console.warn("API /api/ledgers query:", e);
    }

    // 2. Live API: Fetch Stock Items directly from Tally
    try {
      const iRes = await fetch("/api/items", {
        headers: { "X-Tally-URL": appConfig.connectorUrl, "X-Tally-Company": appConfig.companyName }
      });
      if (iRes.ok) {
        const iData = await iRes.json();
        if (iData.items && iData.items.length > 0) {
          window.allStockItems = iData.items;
          itemsCount = window.allStockItems.length;
        }
      }
    } catch (e) {
      console.warn("API /api/items query:", e);
    }

    if (itemsCount > 0 || debtorsCount > 0) {
      showToast(`⚡ Realtime Tally API: Synced ${itemsCount} Stock Items & ${debtorsCount} Parties!`, "success");
    }
    fetchRealtimeVoucherNumber("Sales");
  } catch (err) {
    console.warn("Could not load Tally masters via API:", err);
  }
}

function initStates() {
  const posSelect = document.getElementById("place-of-supply");
  const cfgStateSelect = document.getElementById("cfg-company-state");

  posSelect.innerHTML = "";
  cfgStateSelect.innerHTML = "";

  INDIAN_STATES.forEach(st => {
    const opt1 = document.createElement("option");
    opt1.value = st.code;
    opt1.textContent = `${st.code} - ${st.name}`;
    posSelect.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = st.code;
    opt2.textContent = `${st.code} - ${st.name}`;
    cfgStateSelect.appendChild(opt2);
  });

  posSelect.value = appConfig.companyStateCode;
  cfgStateSelect.value = appConfig.companyStateCode;
}

function initDefaults() {
  const today = new Date().toISOString().split("T")[0];
  document.getElementById("voucher-date").value = today;
  document.getElementById("lbl-active-company").textContent = appConfig.companyName;
  updatePrintHeader();
}

function updatePrintHeader() {
  document.getElementById("print-company-name").textContent = appConfig.companyName.toUpperCase();
  document.getElementById("print-company-address").textContent = 
    `GSTIN: ${appConfig.companyGstin} | State: ${getStateName(appConfig.companyStateCode)} (${appConfig.companyStateCode})`;
}

function getStateName(code) {
  const st = INDIAN_STATES.find(s => s.code === code);
  return st ? st.name : "Delhi";
}

// =========================================================================
// VOUCHER TYPE TOGGLING (Sales, Receipt, Credit Note, Debit Note)
// =========================================================================

function setVoucherType(type) {
  appConfig.voucherType = type;

  // Update pills
  document.querySelectorAll(".voucher-pill").forEach(p => {
    if (p.getAttribute("data-type") === type) {
      p.classList.add("active");
    } else {
      p.classList.remove("active");
    }
  });

  const heading = document.getElementById("voucher-heading");
  const crDrContainer = document.getElementById("cr-dr-ref-container");
  const printTitle = document.getElementById("print-voucher-title");
  const salesLedgerInput = document.getElementById("sales-ledger");

  const receiptCard = document.getElementById("receipt-card");
  const invoiceDetailsCard = document.getElementById("invoice-details-card");
  const partyCard = document.getElementById("party-card");
  const itemsCard = document.getElementById("items-card");
  const summaryCard = document.getElementById("summary-card");
  const narrationCard = document.getElementById("narration-card");
  const actionsFooter = document.getElementById("actions-footer");
  const mobileBar = document.getElementById("mobile-sticky-bar");

  if (type === "Receipt") {
    if (receiptCard) receiptCard.style.display = "block";
    if (invoiceDetailsCard) invoiceDetailsCard.style.display = "none";
    if (partyCard) partyCard.style.display = "none";
    if (itemsCard) itemsCard.style.display = "none";
    if (summaryCard) summaryCard.style.display = "none";
    if (narrationCard) narrationCard.style.display = "none";
    if (actionsFooter) actionsFooter.style.display = "none";
    if (mobileBar) mobileBar.style.display = "none";

    const rDate = document.getElementById("receipt-date");
    if (rDate && !rDate.value) rDate.value = new Date().toISOString().split("T")[0];
    showToast("Switched to Cash Receipt Entry", "info");
    return;
  }

  // Invoice / Notes: Show standard cards
  if (receiptCard) receiptCard.style.display = "none";
  if (invoiceDetailsCard) invoiceDetailsCard.style.display = "block";
  if (partyCard) partyCard.style.display = "block";
  if (itemsCard) itemsCard.style.display = "block";
  if (summaryCard) summaryCard.style.display = "grid";
  if (narrationCard) narrationCard.style.display = "block";
  if (actionsFooter) actionsFooter.style.display = "flex";
  if (mobileBar) mobileBar.style.display = "flex";

  if (type === "Sales") {
    heading.textContent = "Tax Invoice Details";
    crDrContainer.style.display = "none";
    printTitle.textContent = "TAX INVOICE";
    salesLedgerInput.value = "Gst Sales";
    updatePartyDatalist("debtors");
  } else if (type === "Credit Note") {
    heading.textContent = "Credit Note Details (Sales Return)";
    crDrContainer.style.display = "block";
    printTitle.textContent = "CREDIT NOTE (SALES RETURN)";
    salesLedgerInput.value = "Gst Sales";
    updatePartyDatalist("debtors");
  } else if (type === "Debit Note") {
    heading.textContent = "Debit Note Details (Purchase Return)";
    crDrContainer.style.display = "block";
    printTitle.textContent = "DEBIT NOTE (PURCHASE RETURN)";
    salesLedgerInput.value = "GST PURCHASE";
    updatePartyDatalist("creditors");
  }

  recalculateTotals();
  fetchRealtimeVoucherNumber(type);
  showToast(`Switched to ${type}`, "info");
}

// =========================================================================
// INVENTORY ROW MANAGEMENT
// =========================================================================

function addItemRow(initialData = null) {
  rowCounter++;
  const tbody = document.getElementById("items-tbody");
  const tr = document.createElement("tr");
  tr.id = `item-row-${rowCounter}`;

  tr.innerHTML = `
    <td class="text-center mono row-idx" data-label="#">${tbody.children.length + 1}</td>
    <td data-label="Item Description">
      <div class="autocomplete-wrapper">
        <input type="text" class="form-control item-name" 
               placeholder="Type 2-3 letters to search item..." 
               value="${initialData?.name || ''}" 
               autocomplete="off"
               oninput="handleItemInput(this, ${rowCounter})"
               onfocus="handleItemInput(this, ${rowCounter})"
               onblur="handleItemBlur(this, ${rowCounter})"
               onchange="handleItemBlur(this, ${rowCounter})"
               required>
        <div id="item-dropdown-${rowCounter}" class="autocomplete-dropdown" style="display: none;"></div>
      </div>
    </td>
    <td data-label="HSN / SAC">
      <input type="text" class="form-control mono item-hsn" placeholder="HSN/SAC" 
             value="${initialData?.hsn || ''}" oninput="recalculateTotals()">
    </td>
    <td data-label="Qty">
      <input type="number" class="form-control mono text-right item-qty" min="1" step="any" 
             value="${initialData?.qty || 1}" oninput="recalculateTotals()">
    </td>
    <td data-label="Unit">
      <input type="text" class="form-control item-unit" placeholder="Unit" 
             value="${initialData?.unit || 'PCS'}" oninput="recalculateTotals()">
    </td>
    <td data-label="Rate (₹)">
      <input type="number" class="form-control mono text-right item-rate" min="0" step="0.01" 
             value="${initialData?.rate || '0.00'}" oninput="recalculateTotals()">
    </td>
    <td data-label="Disc (%)">
      <input type="number" class="form-control mono text-right item-disc" min="0" max="100" step="0.1" 
             value="${initialData?.discount || '0.00'}" oninput="recalculateTotals()">
    </td>
    <td class="text-right mono item-taxable" data-label="Taxable">₹0.00</td>
    <td data-label="GST Rate">
      <select class="form-control item-gst" onchange="recalculateTotals()">
        <option value="0" ${initialData?.gst === 0 ? 'selected' : ''}>0%</option>
        <option value="5" ${initialData?.gst === 5 ? 'selected' : ''}>5%</option>
        <option value="12" ${initialData?.gst === 12 ? 'selected' : ''}>12%</option>
        <option value="18" ${initialData?.gst === 18 || !initialData ? 'selected' : ''}>18%</option>
        <option value="28" ${initialData?.gst === 28 ? 'selected' : ''}>28%</option>
      </select>
    </td>
    <td class="text-right mono item-tax-amt" data-label="Tax">₹0.00</td>
    <td class="text-right mono item-total-amt" data-label="Total">₹0.00</td>
    <td class="text-center no-print" data-label="Action">
      <button class="btn btn-danger-outline" onclick="removeItemRow(${rowCounter})" title="Delete Line">&times;</button>
    </td>
  `;

  tbody.appendChild(tr);
  updateRowIndices();
  recalculateTotals();
}

function removeItemRow(id) {
  const row = document.getElementById(`item-row-${id}`);
  if (row) {
    const tbody = document.getElementById("items-tbody");
    if (tbody.children.length <= 1) {
      showToast("Invoice must contain at least 1 item", "error");
      return;
    }
    row.remove();
    updateRowIndices();
    recalculateTotals();
  }
}

function updateRowIndices() {
  const rows = document.querySelectorAll("#items-tbody tr");
  rows.forEach((r, idx) => {
    const idxCell = r.querySelector(".row-idx");
    if (idxCell) idxCell.textContent = idx + 1;
  });
  document.getElementById("row-count-label").textContent = `${rows.length} ${rows.length === 1 ? 'Item' : 'Items'}`;
}

// Auto-fill HSN, Unit, Rate, GST when datalist item is selected
function handleItemSelect(rowId) {
  const row = document.getElementById(`item-row-${rowId}`);
  if (!row) return;

  const nameInput = row.querySelector(".item-name");
  const val = nameInput.value.trim();

  const datalist = document.getElementById("stock-item-datalist");
  const option = Array.from(datalist.options).find(o => o.value.toLowerCase() === val.toLowerCase());

  if (option) {
    if (option.dataset.hsn) row.querySelector(".item-hsn").value = option.dataset.hsn;
    if (option.dataset.unit) row.querySelector(".item-unit").value = option.dataset.unit;
    if (option.dataset.rate) row.querySelector(".item-rate").value = option.dataset.rate;
    if (option.dataset.gst) row.querySelector(".item-gst").value = option.dataset.gst;
  }

  // Check Party-wise Last Sold Rate (Price Memory)
  const partyName = document.getElementById("party-name")?.value.trim() || "";
  const oldRate = getPartyLastRate(partyName, val);
  const rateInput = row.querySelector(".item-rate");
  
  if (oldRate && rateInput) {
    rateInput.value = oldRate.toFixed(2);
    let badge = row.querySelector(".last-rate-badge");
    if (!badge) {
      badge = document.createElement("div");
      badge.className = "last-rate-badge";
      rateInput.parentNode.appendChild(badge);
    }
    badge.innerHTML = `🏷️ Old Rate: ₹${oldRate.toFixed(2)}`;
    badge.title = "Pichla rate auto-apply ho gaya hai";
  }

  recalculateTotals();
}

// Auto-extract state code when GSTIN is typed
function handleGstinInput() {
  const gstin = document.getElementById("party-gstin").value.trim().toUpperCase();
  if (gstin.length >= 2) {
    const stateCode = gstin.substring(0, 2);
    const posSelect = document.getElementById("place-of-supply");
    if (Array.from(posSelect.options).some(o => o.value === stateCode)) {
      posSelect.value = stateCode;
      recalculateTotals();
    }
  }
}

// =========================================================================
// GST RULES & FINANCIAL TOTALS CALCULATION
// =========================================================================

function recalculateTotals() {
  const posElem = document.getElementById("place-of-supply");
  const placeOfSupply = posElem ? posElem.value : appConfig.companyStateCode;
  const isIntraState = (placeOfSupply === appConfig.companyStateCode);

  // Update GST label indicator safely without crashing if element is absent
  const gstLabel = document.getElementById("lbl-gst-type");
  if (gstLabel) {
    if (isIntraState) {
      gstLabel.textContent = "CGST + SGST (Intra-State)";
      gstLabel.style.color = "var(--sales-color)";
    } else {
      gstLabel.textContent = "IGST (Inter-State)";
      gstLabel.style.color = "var(--primary)";
    }
  }

  const rowCgst = document.getElementById("row-cgst");
  const rowSgst = document.getElementById("row-sgst");
  const rowIgst = document.getElementById("row-igst");
  const thCgst = document.getElementById("th-cgst");
  const thSgst = document.getElementById("th-sgst");
  const thIgst = document.getElementById("th-igst");

  if (isIntraState) {
    if (rowCgst) rowCgst.style.display = "flex";
    if (rowSgst) rowSgst.style.display = "flex";
    if (rowIgst) rowIgst.style.display = "none";
    if (thCgst) thCgst.style.display = "";
    if (thSgst) thSgst.style.display = "";
    if (thIgst) thIgst.style.display = "none";
  } else {
    if (rowCgst) rowCgst.style.display = "none";
    if (rowSgst) rowSgst.style.display = "none";
    if (rowIgst) rowIgst.style.display = "flex";
    if (thCgst) thCgst.style.display = "none";
    if (thSgst) thSgst.style.display = "none";
    if (thIgst) thIgst.style.display = "";
  }

  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  const hsnMap = {}; // hsn -> { taxable, gstRate, cgst, sgst, igst }

  const rows = document.querySelectorAll("#items-tbody tr");
  rows.forEach(r => {
    const qty = parseFloat(r.querySelector(".item-qty")?.value) || 0;
    const rate = parseFloat(r.querySelector(".item-rate")?.value) || 0;
    const discPercent = parseFloat(r.querySelector(".item-disc")?.value) || 0;
    const gstRate = parseFloat(r.querySelector(".item-gst")?.value) || 0;
    const hsn = (r.querySelector(".item-hsn")?.value.trim()) || "N/A";

    // Taxable amount
    const gross = qty * rate;
    const discount = (gross * discPercent) / 100;
    const taxable = Math.max(0, gross - discount);

    // Tax amounts
    let itemTax = 0;
    let cgst = 0;
    let sgst = 0;
    let igst = 0;

    if (isIntraState) {
      cgst = (taxable * (gstRate / 2)) / 100;
      sgst = (taxable * (gstRate / 2)) / 100;
      itemTax = cgst + sgst;
    } else {
      igst = (taxable * gstRate) / 100;
      itemTax = igst;
    }

    const itemTotal = taxable + itemTax;

    // Update row DOM cells
    r.querySelector(".item-taxable").textContent = `₹${taxable.toFixed(2)}`;
    r.querySelector(".item-tax-amt").textContent = `₹${itemTax.toFixed(2)}`;
    r.querySelector(".item-total-amt").textContent = `₹${itemTotal.toFixed(2)}`;

    totalTaxable += taxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    // Accumulate HSN summary
    if (!hsnMap[hsn]) {
      hsnMap[hsn] = { hsn, taxable: 0, gstRate, cgst: 0, sgst: 0, igst: 0, totalTax: 0 };
    }
    hsnMap[hsn].taxable += taxable;
    hsnMap[hsn].cgst += cgst;
    hsnMap[hsn].sgst += sgst;
    hsnMap[hsn].igst += igst;
    hsnMap[hsn].totalTax += itemTax;
  });

  // Freight & Round Off
  const freight = parseFloat(document.getElementById("freight-charges").value) || 0;
  const rawGrandTotal = totalTaxable + totalCgst + totalSgst + totalIgst + freight;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = roundedGrandTotal - rawGrandTotal;

  // Update Summary Box
  document.getElementById("subtotal-val").textContent = `₹${totalTaxable.toFixed(2)}`;
  document.getElementById("cgst-val").textContent = `₹${totalCgst.toFixed(2)}`;
  document.getElementById("sgst-val").textContent = `₹${totalSgst.toFixed(2)}`;
  document.getElementById("igst-val").textContent = `₹${totalIgst.toFixed(2)}`;
  document.getElementById("round-off-val").textContent = `${roundOff >= 0 ? '+' : ''}₹${roundOff.toFixed(2)}`;
  document.getElementById("grand-total-val").textContent = `₹${roundedGrandTotal.toFixed(2)}`;

  document.getElementById("amount-in-words").textContent = `Amount in words: ${numberToIndianWords(roundedGrandTotal)} Only`;

  // Update Mobile Sticky Bar
  const mbTotal = document.getElementById("mobile-bar-total");
  const mbCount = document.getElementById("mobile-bar-count");
  if (mbTotal) mbTotal.textContent = `₹${roundedGrandTotal.toFixed(2)}`;
  if (mbCount) {
    const rows = document.querySelectorAll("#items-tbody tr");
    mbCount.textContent = `${rows.length} ${rows.length === 1 ? 'Item' : 'Items'}`;
  }

  // Render HSN Table
  renderHsnTable(hsnMap, isIntraState);
}

function renderHsnTable(hsnMap, isIntraState) {
  const tbody = document.getElementById("hsn-summary-tbody");
  tbody.innerHTML = "";
  const keys = Object.keys(hsnMap);
  document.getElementById("hsn-count-badge").textContent = `${keys.length} HSN${keys.length === 1 ? '' : 's'}`;

  if (keys.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="color: var(--text-muted);">No items added yet</td></tr>`;
    return;
  }

  keys.forEach(k => {
    const d = hsnMap[k];
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td class="mono">${d.hsn}</td>
      <td class="text-right mono">₹${d.taxable.toFixed(2)}</td>
      ${isIntraState ? `
        <td class="text-right mono">₹${d.cgst.toFixed(2)} <span style="font-size:10px;color:var(--text-muted);">(${d.gstRate / 2}%)</span></td>
        <td class="text-right mono">₹${d.sgst.toFixed(2)} <span style="font-size:10px;color:var(--text-muted);">(${d.gstRate / 2}%)</span></td>
      ` : `
        <td class="text-right mono">₹${d.igst.toFixed(2)} <span style="font-size:10px;color:var(--text-muted);">(${d.gstRate}%)</span></td>
      `}
      <td class="text-right mono" style="font-weight: 700;">₹${d.totalTax.toFixed(2)}</td>
    `;
    tbody.appendChild(tr);
  });
}

// Number to Words in Indian numbering system
function numberToIndianWords(num) {
  if (num === 0) return "Zero Rupees";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function inWords(n) {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + inWords(n % 100) : "");
    if (n < 100000) return inWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + inWords(n % 1000) : "");
    if (n < 10000000) return inWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + inWords(n % 100000) : "");
    return inWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 !== 0 ? " " + inWords(n % 10000000) : "");
  }

  const integerPart = Math.floor(Math.abs(num));
  return inWords(integerPart) + " Rupees";
}

// =========================================================================
// TALLY XML GENERATION ENGINE
// =========================================================================

function generateTallyXml() {
  const vchType = appConfig.voucherType; // "Sales", "Credit Note", "Debit Note"
  const vchNo = document.getElementById("voucher-no").value.trim() || "1";
  const rawDate = document.getElementById("voucher-date").value || new Date().toISOString().split("T")[0];
  const tallyDate = rawDate.replace(/-/g, ""); // YYYYMMDD
  const partyName = document.getElementById("party-name").value.trim() || "Cash";
  const partyGstin = document.getElementById("party-gstin").value.trim();
  const salesLedger = document.getElementById("sales-ledger").value.trim() || "Sales Account";
  const placeOfSupply = document.getElementById("place-of-supply").value;
  const isIntraState = (placeOfSupply === appConfig.companyStateCode);
  const narration = document.getElementById("voucher-narration").value.trim();

  // Credit / Debit Note references
  const origInvNo = document.getElementById("orig-invoice-no").value.trim();
  const origInvDate = document.getElementById("orig-invoice-date").value.replace(/-/g, "");
  const noteReason = document.getElementById("note-reason")?.value || "Correction in Invoice";

  const rows = document.querySelectorAll("#items-tbody tr");
  let inventoryListXml = "";
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;

  rows.forEach(r => {
    const itemName = r.querySelector(".item-name")?.value.trim() || "Item";
    const hsn = r.querySelector(".item-hsn")?.value.trim() || "";
    const qty = parseFloat(r.querySelector(".item-qty")?.value) || 1;
    const unit = r.querySelector(".item-unit")?.value.trim() || "PCS";
    const rate = parseFloat(r.querySelector(".item-rate")?.value) || 0;
    const discPercent = parseFloat(r.querySelector(".item-disc")?.value) || 0;
    const gstRate = parseFloat(r.querySelector(".item-gst")?.value) || 0;

    const gross = qty * rate;
    const discount = (gross * discPercent) / 100;
    const taxable = Math.max(0, gross - discount);

    let cgst = 0, sgst = 0, igst = 0;
    if (isIntraState) {
      cgst = (taxable * (gstRate / 2)) / 100;
      sgst = (taxable * (gstRate / 2)) / 100;
    } else {
      igst = (taxable * gstRate) / 100;
    }

    totalTaxable += taxable;
    totalCgst += cgst;
    totalSgst += sgst;
    totalIgst += igst;

    const isSales = (vchType === "Sales");
    const isCreditNote = (vchType === "Credit Note");
    const isDebitNote = (vchType === "Debit Note");

    // In Tally XML:
    // Sales: Inventory amount is negative (Credit to Sales)
    // Credit Note: Inventory amount is positive (Debit to Sales Return)
    // Debit Note: Inventory amount is negative (Credit to Purchase Return)
    const invAmount = isCreditNote ? taxable : -taxable;

    inventoryListXml += `
        <ALLINVENTORYENTRIES.LIST>
          <STOCKITEMNAME>${escapeXml(itemName)}</STOCKITEMNAME>
          <ISDEEMEDPOSITIVE>${isCreditNote ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
          <RATE>${rate.toFixed(2)}/${unit}</RATE>
          <ACTUALQTY>${qty} ${unit}</ACTUALQTY>
          <BILLEDQTY>${qty} ${unit}</BILLEDQTY>
          <AMOUNT>${invAmount.toFixed(2)}</AMOUNT>
          <ACCOUNTINGALLOCATIONS.LIST>
            <LEDGERNAME>${escapeXml(salesLedger)}</LEDGERNAME>
            <ISDEEMEDPOSITIVE>${isCreditNote ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
            <AMOUNT>${invAmount.toFixed(2)}</AMOUNT>
          </ACCOUNTINGALLOCATIONS.LIST>
          ${hsn ? `<RATEDETAILS.LIST><GSTRATEDUTYHEAD>GST</GSTRATEDUTYHEAD><GSTRATEVALUATIONTYPE>Based on Value</GSTRATEVALUATIONTYPE><HSNCODE>${hsn}</HSNCODE></RATEDETAILS.LIST>` : ""}
        </ALLINVENTORYENTRIES.LIST>`;
  });

  const freight = parseFloat(document.getElementById("freight-charges").value) || 0;
  const rawGrandTotal = totalTaxable + totalCgst + totalSgst + totalIgst + freight;
  const roundedGrandTotal = Math.round(rawGrandTotal);
  const roundOff = roundedGrandTotal - rawGrandTotal;

  // Party Ledger Sign:
  // Sales: Party is Debited (Positive)
  // Credit Note: Party is Credited (Negative)
  // Debit Note: Party is Debited (Positive)
  const isCreditNote = (vchType === "Credit Note");
  const partyAmount = isCreditNote ? -roundedGrandTotal : roundedGrandTotal;
  const partyPositive = isCreditNote ? "No" : "Yes";

  let ledgerEntriesXml = `
        <!-- Party Ledger Entry -->
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>${escapeXml(partyName)}</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${partyPositive}</ISDEEMEDPOSITIVE>
          <AMOUNT>${partyAmount.toFixed(2)}</AMOUNT>
          ${partyGstin ? `<PARTYGSTIN>${partyGstin}</PARTYGSTIN>` : ""}
        </LEDGERENTRIES.LIST>`;

  // Tax Ledgers
  if (isIntraState) {
    if (totalCgst > 0) {
      const cgstAmt = isCreditNote ? totalCgst : -totalCgst;
      ledgerEntriesXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>CGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${isCreditNote ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
          <AMOUNT>${cgstAmt.toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
    }
    if (totalSgst > 0) {
      const sgstAmt = isCreditNote ? totalSgst : -totalSgst;
      ledgerEntriesXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>SGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${isCreditNote ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
          <AMOUNT>${sgstAmt.toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
    }
  } else {
    if (totalIgst > 0) {
      const igstAmt = isCreditNote ? totalIgst : -totalIgst;
      ledgerEntriesXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>IGST</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${isCreditNote ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
          <AMOUNT>${igstAmt.toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
    }
  }

  // Freight Charge Ledger
  if (freight > 0) {
    const freightAmt = isCreditNote ? freight : -freight;
    ledgerEntriesXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>Freight Charges</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${isCreditNote ? "Yes" : "No"}</ISDEEMEDPOSITIVE>
          <AMOUNT>${freightAmt.toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
  }

  // Round Off Ledger
  if (Math.abs(roundOff) > 0.001) {
    const roAmt = isCreditNote ? roundOff : -roundOff;
    ledgerEntriesXml += `
        <LEDGERENTRIES.LIST>
          <LEDGERNAME>Round Off</LEDGERNAME>
          <ISDEEMEDPOSITIVE>${roAmt < 0 ? "No" : "Yes"}</ISDEEMEDPOSITIVE>
          <AMOUNT>${roAmt.toFixed(2)}</AMOUNT>
        </LEDGERENTRIES.LIST>`;
  }

  // Credit / Debit Note Statutory Reference XML
  let refXml = "";
  if (vchType !== "Sales" && origInvNo) {
    refXml = `
        <INVOICEDETAILS.LIST>
          <ORIGINALINVOICENO>${escapeXml(origInvNo)}</ORIGINALINVOICENO>
          <ORIGINALINVOICEDATE>${origInvDate || tallyDate}</ORIGINALINVOICEDATE>
          <REASONFORNOTE>${escapeXml(noteReason)}</REASONFORNOTE>
        </INVOICEDETAILS.LIST>`;
  }

  // Full Compliant Tally XML Envelope
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(appConfig.companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="${escapeXml(vchType)}" ACTION="Create" OBJVIEW="Invoice Voucher View">
            <DATE>${tallyDate}</DATE>
            <EFFECTIVEDATE>${tallyDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>${escapeXml(vchType)}</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(vchNo)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${escapeXml(partyName)}</PARTYLEDGERNAME>
            <BASICBUYERNAME>${escapeXml(partyName)}</BASICBUYERNAME>
            <PLACEOFSUPPLY>${getStateName(placeOfSupply)}</PLACEOFSUPPLY>
            <ISINVOICE>Yes</ISINVOICE>
            ${narration ? `<NARRATION>${escapeXml(narration)}</NARRATION>` : ""}
            ${refXml}
            ${inventoryListXml}
            ${ledgerEntriesXml}
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

function escapeXml(unsafe) {
  if (!unsafe) return "";
  return unsafe.toString().replace(/[<>&'"]/g, c => {
    switch (c) {
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '&': return '&amp;';
      case '\'': return '&apos;';
      case '"': return '&quot;';
    }
  });
}

// =========================================================================
// ACTION HANDLERS: PUSH TO TALLY, VIEW XML, PREVIEW, PRINT
// =========================================================================

function previewTallyXml() {
  const xml = generateTallyXml();
  document.getElementById("xml-display-box").textContent = xml;
  openModal("modal-xml");
}

function copyXmlToClipboard() {
  const xml = document.getElementById("xml-display-box").textContent;
  navigator.clipboard.writeText(xml).then(() => {
    showToast("Tally XML copied to clipboard!", "success");
  });
}

function downloadXmlFile() {
  const xml = document.getElementById("xml-display-box").textContent;
  const vchNo = document.getElementById("voucher-no").value.trim() || "voucher";
  const blob = new Blob([xml], { type: "text/xml;charset=utf-8" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `Tally_${appConfig.voucherType}_${vchNo}.xml`;
  a.click();
  showToast("XML file downloaded", "success");
}

// =========================================================================
// REAL-TIME VOUCHER NUMBERING & TALLY SEQUENCE SYNC
// =========================================================================

function getHighestRegistryVoucherNo() {
  let maxNum = 13739; // verified baseline in Nanak Food Mart recorded registry
  if (window.allBillsByParty) {
    for (const party in window.allBillsByParty) {
      const bList = window.allBillsByParty[party];
      if (Array.isArray(bList)) {
        bList.forEach(b => {
          const m = b.bill_ref && b.bill_ref.match(/NFM\/26-27\/(\d+)/);
          if (m) {
            const n = parseInt(m[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
      }
    }
  }
  // Check any local vouchers created during current session
  try {
    const list = JSON.parse(localStorage.getItem("NFM_INVOICE_HISTORY") || "[]");
    list.forEach(item => {
      const m = item.vchNo && item.vchNo.match(/NFM\/26-27\/(\d+)/);
      if (m) {
        const n = parseInt(m[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
  } catch (e) {}

  return `NFM/26-27/${maxNum + 1}`;
}

async function fetchRealtimeVoucherNumber(vchType = "Sales") {
  const vchInput = document.getElementById("voucher-no");
  const statusSpan = document.getElementById("voucher-sync-status");

  // Immediate sequential fallbacks based on verified Tally registers
  const fallbackMap = {
    "Sales": "NFM/26-27/13740",
    "Credit Note": "249",
    "Debit Note": "77",
    "Receipt": "1074",
    "Cash Receipt": "1074"
  };

  if (vchType === "Receipt" || vchType === "Cash Receipt") {
    const rInput = document.getElementById("receipt-vch-no");
    if (rInput) rInput.value = "1074";
    return;
  }

  if (!vchInput) return;

  vchInput.value = fallbackMap[vchType] || "NFM/26-27/13740";
  if (statusSpan) statusSpan.innerHTML = `🟢 Live Sequence: <strong>${vchInput.value}</strong>`;

  // 2. Query live Tally API with short 3-second timeout
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(`/api/next-voucher?type=${encodeURIComponent(vchType)}`, {
      headers: { "X-Tally-URL": appConfig.connectorUrl, "X-Tally-Company": appConfig.companyName },
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data.next_voucher_number) {
        vchInput.value = data.next_voucher_number;
        if (statusSpan) statusSpan.innerHTML = `🟢 Live Synced with Tally: <strong>${data.next_voucher_number}</strong>`;
      }
    }
  } catch (err) {
    console.warn("Live sequence query timed out or errored, using active sequence:", vchInput.value);
  }
}

// =========================================================================
// TALLY LEDGER CREATION HELPER (Sundry Debtors / Creditors)
// =========================================================================

function generateLedgerCreationXml(partyName, isCreditor = false, gstin = "") {
  const parentGroup = isCreditor ? "Sundry Creditors" : "Sundry Debtors";
  const regType = gstin ? "Regular" : "Unregistered";
  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>All Masters</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(appConfig.companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <LEDGER NAME="${escapeXml(partyName)}" ACTION="Create">
            <NAME.LIST>
              <NAME>${escapeXml(partyName)}</NAME>
            </NAME.LIST>
            <PARENT>${parentGroup}</PARENT>
            <ISBILLWISEON>Yes</ISBILLWISEON>
            <ISCOSTCENTRESON>No</ISCOSTCENTRESON>
            <ISINTERESTON>No</ISINTERESTON>
            <ALLOWINMOBILE>Yes</ALLOWINMOBILE>
            <COUNTRYNAME>India</COUNTRYNAME>
            <LEDSTATENAME>Delhi</LEDSTATENAME>
            <GSTREGISTRATIONTYPE>${regType}</GSTREGISTRATIONTYPE>
            ${gstin ? `<PARTYGSTIN>${gstin}</PARTYGSTIN>` : ""}
            <APPROPRIATETAXVALUE>No</APPROPRIATETAXVALUE>
          </LEDGER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

async function pushVoucherToTally() {
  const btn = document.getElementById("btn-push-tally");
  const origText = btn.innerHTML;
  btn.innerHTML = `⏳ Pushing to Tally...`;
  btn.disabled = true;

  try {
    const partyNameVal = document.getElementById("party-name")?.value.trim() || "Cash";
    const partyGstin = document.getElementById("party-gstin")?.value.trim() || "";
    const isCreditor = (appConfig.voucherType === "Debit Note");
    const partyList = isCreditor ? window.allCreditors : window.allDebtors;
    const isExisting = partyList.some(p => p.name.toLowerCase() === partyNameVal.toLowerCase());
    const apiEndpoint = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "/api/tally-proxy" : "/api/tally";

    // 1. Auto-create Party Ledger in Tally if it is a new customer / supplier
    if (!isExisting && partyNameVal !== "Cash" && partyNameVal.length > 0) {
      const parentGroup = isCreditor ? "Sundry Creditors" : "Sundry Debtors";
      showToast(`Creating new ledger "${partyNameVal}" under ${parentGroup} in Tally...`, "info");
      const ledgerXml = generateLedgerCreationXml(partyNameVal, isCreditor, partyGstin);
      
      try {
        const ledRes = await fetch(apiEndpoint, {
          method: "POST",
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            "X-Tally-URL": appConfig.connectorUrl
          },
          body: ledgerXml
        });
        const ledText = await ledRes.text();
        console.log("Ledger creation response:", ledText);
        // Add to active memory so it exists immediately
        partyList.push({ name: partyNameVal, group: parentGroup, balance: "0.00" });
        updatePartyDatalist(isCreditor ? "creditors" : "debtors");
      } catch (e) {
        console.warn("Ledger auto-creation warning, proceeding with voucher:", e);
      }
    }

    const xmlPayload = generateTallyXml();

    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "X-Tally-URL": appConfig.connectorUrl
      },
      body: xmlPayload
    });

    const responseText = await response.text();

    if (response.ok && (responseText.includes("<CREATED>1</CREATED>") || responseText.includes("<ALTERED>1</ALTERED>"))) {
      showToast(`🎉 ${appConfig.voucherType} successfully created in Tally!`, "success");
      
      const vchNo = document.getElementById("voucher-no")?.value.trim();
      const vchDate = document.getElementById("voucher-date")?.value;
      const grandTotal = document.getElementById("grand-total-val")?.textContent?.replace('₹', '') || '0';
      const itemsCount = document.querySelectorAll("#items-tbody tr").length;
      saveInvoiceRecord({
        vchNo,
        date: vchDate,
        party: partyNameVal || "Cash",
        type: appConfig.voucherType,
        amount: grandTotal,
        itemCount: itemsCount,
        status: "SUCCESS"
      });

      // Save item rates to party price memory for next time auto-fill
      if (partyNameVal) {
        document.querySelectorAll("#items-tbody tr").forEach(r => {
          const item = r.querySelector(".item-name")?.value.trim();
          const rate = parseFloat(r.querySelector(".item-rate")?.value);
          if (item && rate > 0) {
            savePartyLastRate(partyNameVal, item, rate);
          }
        });
      }

      // Auto-increment invoice number
      incrementVoucherNumber();
    } else if (responseText.includes("<LINEERROR>")) {
      const match = responseText.match(/<LINEERROR>(.*?)<\/LINEERROR>/);
      const errMsg = match ? match[1] : "Tally Rejected the Voucher";
      showToast(`Tally Error: ${errMsg}`, "error");
      console.error("Tally Line Error:", responseText);
    } else {
      showToast("Voucher packet dispatched to Tally Gateway", "info");
      console.log("Tally Gateway Response:", responseText);
    }
  } catch (err) {
    console.error("Push Error:", err);
    showToast(`Network Error: ${err.message}`, "error");
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

// =========================================================================
// PARTY SELECTION & REALTIME BALANCE / OLD RATE LOOKUP
// =========================================================================

function handlePartyChange() {
  const partyInput = document.getElementById("party-name");
  const balSpan = document.getElementById("party-current-bal");
  if (!partyInput || !balSpan) return;

  const rawVal = partyInput.value.trim();
  const val = rawVal.toLowerCase();
  if (!val) {
    balSpan.textContent = "";
    return;
  }

  const isCreditor = (appConfig.voucherType === "Debit Note");
  const list = isCreditor ? window.allCreditors : window.allDebtors;
  const party = list.find(d => d.name.toLowerCase() === val);

  if (party) {
    const balNum = parseFloat(party.balance) || 0;
    balSpan.innerHTML = `✅ <span style="color: var(--primary);">Existing ${isCreditor ? 'Supplier (Creditor)' : 'Customer (Debtor)'}</span> &bull; Current Balance: <strong>₹${Math.abs(balNum).toLocaleString('en-IN', {minimumFractionDigits: 2})} ${balNum >= 0 ? 'Dr (Baaki)' : 'Cr (Advance)'}</strong>`;
    balSpan.style.color = "var(--primary)";
  } else {
    const parent = isCreditor ? "Sundry Creditors" : "Sundry Debtors";
    balSpan.innerHTML = `✨ <span style="color: var(--sales-color); font-weight: 700;">Naya Ledger Banega</span> &bull; Tally me <strong>${parent}</strong> group ke under auto-create hoga (State: Delhi)`;
    balSpan.style.color = "var(--sales-color)";
  }

  // Auto-refresh Old Rate for any already entered items
  document.querySelectorAll("#items-tbody tr").forEach(r => {
    const nameInput = r.querySelector(".item-name");
    const itemVal = nameInput ? nameInput.value.trim() : "";
    if (itemVal) {
      const oldRate = getPartyLastRate(rawVal, itemVal);
      if (oldRate) {
        const rateInput = r.querySelector(".item-rate");
        if (rateInput) rateInput.value = oldRate.toFixed(2);
        let badge = r.querySelector(".last-rate-badge");
        if (!badge && rateInput) {
          badge = document.createElement("div");
          badge.className = "last-rate-badge";
          rateInput.parentNode.appendChild(badge);
        }
        if (badge) badge.innerHTML = `🏷️ Old Rate: ₹${oldRate.toFixed(2)}`;
      }
    }
  });

  recalculateTotals();
}

// =========================================================================
// CASH RECEIPT VOUCHER ENGINE (Agst Ref Settlement)
// =========================================================================

function handleReceiptPartyChange() {
  const partyInput = document.getElementById("receipt-party");
  const balSpan = document.getElementById("receipt-party-bal");
  const billSelect = document.getElementById("receipt-bill-select");
  const billInput = document.getElementById("receipt-bill-ref");
  const amtInput = document.getElementById("receipt-amount");
  if (!partyInput) return;

  const rawVal = partyInput.value.trim();
  const val = rawVal.toLowerCase();
  const party = window.allDebtors.find(d => d.name.toLowerCase() === val);
  if (party && party.balance && balSpan) {
    const balNum = parseFloat(party.balance) || 0;
    balSpan.innerHTML = `Current Balance: <strong>₹${Math.abs(balNum).toLocaleString('en-IN', {minimumFractionDigits: 2})} ${balNum >= 0 ? 'Dr (Baaki)' : 'Cr (Advance)'}</strong>`;
  } else if (balSpan) {
    balSpan.textContent = "";
  }

  // Populate bill selection dropdown with all pending unpaid bills
  if (billSelect) {
    billSelect.innerHTML = '<option value="">-- Pick Pending Bill (Agst Ref) --</option>';
  }

  // Live API: Query pending bills for this party directly from Tally
  fetch(`/api/bills?party=${encodeURIComponent(rawVal)}`, {
    headers: { "X-Tally-URL": appConfig.connectorUrl, "X-Tally-Company": appConfig.companyName }
  })
    .then(r => r.json())
    .then(data => {
      const bills = data.bills || [];
      if (bills.length > 0) {
        if (billSelect) {
          bills.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.bill_ref;
            opt.dataset.amount = b.amount;
            opt.textContent = `${b.bill_ref} • ₹${parseFloat(b.amount).toLocaleString('en-IN', {minimumFractionDigits: 2})}`;
            billSelect.appendChild(opt);
          });
        }
        const latestBill = bills[bills.length - 1];
        if (billInput) billInput.value = latestBill.bill_ref || "";
        if (amtInput && !amtInput.value) amtInput.value = parseFloat(latestBill.amount || 0).toFixed(2);
        showToast(`⚡ Realtime Tally API: Found ${bills.length} pending bill(s) for ${rawVal}`, "info");
      }
    })
    .catch(err => console.warn("Live bills API query:", err));
}

function handleBillSelectChange() {
  const billSelect = document.getElementById("receipt-bill-select");
  const billInput = document.getElementById("receipt-bill-ref");
  const amtInput = document.getElementById("receipt-amount");
  if (!billSelect || !billInput) return;

  const selOption = billSelect.options[billSelect.selectedIndex];
  if (selOption && selOption.value) {
    billInput.value = selOption.value;
    if (selOption.dataset.amount && amtInput) {
      amtInput.value = parseFloat(selOption.dataset.amount).toFixed(2);
    }
    showToast(`Bill Ref ${selOption.value} loaded!`, "info");
  }
}

function generateReceiptXml() {
  const vchNo = document.getElementById("receipt-vch-no")?.value.trim() || "1074";
  const rawDate = document.getElementById("receipt-date")?.value || new Date().toISOString().split("T")[0];
  const tallyDate = rawDate.replace(/-/g, "");
  const account = document.getElementById("receipt-account")?.value || "Cash";
  const party = document.getElementById("receipt-party")?.value.trim() || "Cash";
  const billRef = document.getElementById("receipt-bill-ref")?.value.trim();
  const amt = parseFloat(document.getElementById("receipt-amount")?.value) || 0;
  const narration = document.getElementById("receipt-narration")?.value.trim();

  let billAlloc = "";
  if (billRef) {
    billAlloc = `
              <BILLALLOCATIONS.LIST>
                <NAME>${escapeXml(billRef)}</NAME>
                <BILLTYPE>Agst Ref</BILLTYPE>
                <AMOUNT>${amt.toFixed(2)}</AMOUNT>
              </BILLALLOCATIONS.LIST>`;
  }

  return `<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
        <STATICVARIABLES>
          <SVCURRENTCOMPANY>${escapeXml(appConfig.companyName)}</SVCURRENTCOMPANY>
        </STATICVARIABLES>
      </REQUESTDESC>
      <REQUESTDATA>
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Cash Receipt" ACTION="Create">
            <DATE>${tallyDate}</DATE>
            <EFFECTIVEDATE>${tallyDate}</EFFECTIVEDATE>
            <VOUCHERTYPENAME>Cash Receipt</VOUCHERTYPENAME>
            <VOUCHERNUMBER>${escapeXml(vchNo)}</VOUCHERNUMBER>
            <NARRATION>${escapeXml(narration)}</NARRATION>
            <!-- Debit Cash / Bank -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(account)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
              <AMOUNT>-${amt.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <!-- Credit Party (Debtor) with Agst Ref -->
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${escapeXml(party)}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
              <AMOUNT>${amt.toFixed(2)}</AMOUNT>${billAlloc}
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;
}

async function pushReceiptToTally() {
  const party = document.getElementById("receipt-party")?.value.trim();
  const amt = parseFloat(document.getElementById("receipt-amount")?.value) || 0;
  if (!party) {
    showToast("Please enter or select a customer party name", "error");
    return;
  }
  if (amt <= 0) {
    showToast("Please enter a valid receipt amount", "error");
    return;
  }

  const apiEndpoint = (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1") ? "/api/tally-proxy" : "/api/tally";

  // Check if debtor ledger exists
  const isExisting = window.allDebtors.some(d => d.name.toLowerCase() === party.toLowerCase());
  if (!isExisting && party !== "Cash") {
    showToast(`Creating customer ledger "${party}" under Sundry Debtors in Tally...`, "info");
    const ledgerXml = generateLedgerCreationXml(party, false);
    try {
      await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "text/xml; charset=utf-8", "X-Tally-URL": appConfig.connectorUrl },
        body: ledgerXml
      });
      window.allDebtors.push({ name: party, group: "Sundry Debtors", balance: "0.00" });
    } catch (e) {
      console.warn("Ledger auto-creation error:", e);
    }
  }

  const xmlPayload = generateReceiptXml();

  showToast("⏳ Posting Cash Receipt to Tally...", "info");
  try {
    const response = await fetch(apiEndpoint, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "X-Tally-URL": appConfig.connectorUrl
      },
      body: xmlPayload
    });
    const respText = await response.text();
    if (response.ok && (respText.includes("<CREATED>1</CREATED>") || respText.includes("<ALTERED>1</ALTERED>"))) {
      showToast(`🎉 Cash Receipt successfully posted to Tally!`, "success");
      
      saveInvoiceRecord({
        vchNo: document.getElementById("receipt-vch-no")?.value || "1074",
        date: document.getElementById("receipt-date")?.value || new Date().toISOString().split("T")[0],
        party: party || "Cash",
        type: "Cash Receipt",
        amount: amt,
        itemCount: 1,
        status: "SUCCESS"
      });

      const vInput = document.getElementById("receipt-vch-no");
      if (vInput) {
        const num = parseInt(vInput.value, 10);
        if (!isNaN(num)) vInput.value = num + 1;
      }
    } else {
      showToast("Receipt packet sent to Tally", "info");
    }
  } catch (err) {
    showToast(`Error: ${err.message}`, "error");
  }
}

function previewReceiptXml() {
  const xml = generateReceiptXml();
  document.getElementById("xml-display-box").textContent = xml;
  openModal("modal-xml");
}

function incrementVoucherNumber() {
  const vchInput = document.getElementById("voucher-no");
  const cur = vchInput.value;
  const match = cur.match(/\d+$/);
  if (match) {
    const num = parseInt(match[0], 10) + 1;
    const padded = String(num).padStart(match[0].length, "0");
    vchInput.value = cur.substring(0, match.index) + padded;
    const statusSpan = document.getElementById("voucher-sync-status");
    if (statusSpan) statusSpan.innerHTML = `🟢 Live Sequence: <strong>${vchInput.value}</strong>`;
  }
}

// Check Heartbeat of Tally Gateway
async function checkConnectorStatus() {
  const dot = document.getElementById("status-indicator");
  const text = document.getElementById("status-text");

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch("/api/ping-tally", {
      headers: { "X-Tally-URL": appConfig.connectorUrl },
      signal: controller.signal
    });
    clearTimeout(timer);
    const data = await res.json();
    if (data.status === "online") {
      dot.className = "status-dot online";
      text.textContent = `Online (${appConfig.companyName})`;
    } else {
      dot.className = "status-dot";
      text.textContent = `Standby (Offline)`;
    }
  } catch (e) {
    dot.className = "status-dot";
    text.textContent = `Standby (Offline)`;
  }
}

// Sample Data Filler
function loadSampleInvoice() {
  document.getElementById("party-name").value = "Sharma Grocery Mart";
  document.getElementById("party-gstin").value = "07BBAAA9999C1Z1";
  document.getElementById("party-phone").value = "+91 98111 22334";
  document.getElementById("party-billing-address").value = "Shop 14, Main Bazar, Chandni Chowk, Delhi - 110006";
  document.getElementById("party-shipping-address").value = "Godown 2B, GT Karnal Road, Delhi";
  document.getElementById("voucher-narration").value = "Being goods sold on 15 days credit terms.";

  const tbody = document.getElementById("items-tbody");
  tbody.innerHTML = "";

  addItemRow({ name: "Basmati Rice Premium (1kg)", hsn: "1006", qty: 25, unit: "KG", rate: 120, discount: 5, gst: 5 });
  addItemRow({ name: "Fortune Sunlite Refined Oil (1L)", hsn: "1512", qty: 15, unit: "LTR", rate: 145, discount: 2, gst: 5 });
  addItemRow({ name: "Amul Butter Pasteurized (500g)", hsn: "0405", qty: 10, unit: "PKT", rate: 275, discount: 0, gst: 12 });
  addItemRow({ name: "Cadbury Dairy Milk Silk Chocolate", hsn: "1806", qty: 30, unit: "PCS", rate: 175, discount: 10, gst: 18 });

  document.getElementById("freight-charges").value = "150";
  recalculateTotals();
  showToast("Sample data loaded into invoice!", "success");
}

function resetForm() {
  if (confirm("Reset current voucher and create a new one?")) {
    document.getElementById("party-name").value = "";
    document.getElementById("party-gstin").value = "";
    document.getElementById("party-phone").value = "";
    document.getElementById("party-billing-address").value = "";
    document.getElementById("party-shipping-address").value = "";
    document.getElementById("voucher-narration").value = "";
    document.getElementById("freight-charges").value = "0";

    const tbody = document.getElementById("items-tbody");
    tbody.innerHTML = "";
    addItemRow();
    incrementVoucherNumber();
    recalculateTotals();
    showToast("Form reset for new voucher", "info");
  }
}

// Settings Modal
function openSettingsModal() {
  document.getElementById("cfg-connector-url").value = appConfig.connectorUrl;
  document.getElementById("cfg-company-name").value = appConfig.companyName;
  document.getElementById("cfg-company-gstin").value = appConfig.companyGstin;
  document.getElementById("cfg-company-state").value = appConfig.companyStateCode;
  openModal("modal-settings");
}

function saveSettings() {
  appConfig.connectorUrl = document.getElementById("cfg-connector-url").value.trim();
  appConfig.companyName = document.getElementById("cfg-company-name").value.trim();
  appConfig.companyGstin = document.getElementById("cfg-company-gstin").value.trim();
  appConfig.companyStateCode = document.getElementById("cfg-company-state").value;

  document.getElementById("lbl-active-company").textContent = appConfig.companyName;
  updatePrintHeader();
  closeModal("modal-settings");
  checkConnectorStatus();
  recalculateTotals();
  showToast("Configuration saved successfully", "success");
}

// Modal Helpers
function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add("active");
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove("active");
}

// Toast System
function showToast(msg, type = "info") {
  const shelf = document.getElementById("toast-shelf");
  const t = document.createElement("div");
  t.className = `toast ${type}`;

  const icon = type === "success" ? "✅" : (type === "error" ? "❌" : "ℹ️");
  t.innerHTML = `<span>${icon}</span> <span>${msg}</span>`;

  shelf.appendChild(t);
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateX(20px)";
    setTimeout(() => t.remove(), 300);
  }, 4000);
}

// =========================================================================
// INVOICE & VOUCHER HISTORY / DAYBOOK ENGINE
// =========================================================================

function saveInvoiceRecord(record) {
  try {
    const list = JSON.parse(localStorage.getItem("NFM_INVOICE_HISTORY") || "[]");
    list.unshift(record); // newest first
    localStorage.setItem("NFM_INVOICE_HISTORY", JSON.stringify(list.slice(0, 200)));
  } catch (e) {}
}

function openHistoryModal() {
  renderHistory();
  openModal("modal-history");
}

function clearHistoryRecords() {
  if (confirm("Clear local voucher history records?")) {
    localStorage.removeItem("NFM_INVOICE_HISTORY");
    renderHistory();
    showToast("History cleared", "info");
  }
}

function renderHistory() {
  const container = document.getElementById("history-list-container");
  const countBadge = document.getElementById("history-count-badge");
  if (!container) return;

  const list = JSON.parse(localStorage.getItem("NFM_INVOICE_HISTORY") || "[]");
  countBadge.textContent = `${list.length} Vouchers Saved`;

  if (list.length === 0) {
    container.innerHTML = `<div style="text-align: center; color: var(--text-muted); padding: 30px;">No vouchers saved yet. When you create an invoice or receipt, it will appear here.</div>`;
    return;
  }

  container.innerHTML = list.map(item => `
    <div style="background: #f8fafc; border: 1px solid var(--border-color); border-radius: var(--radius-sm); padding: 12px; display: flex; justify-content: space-between; align-items: center; gap: 12px;">
      <div>
        <div style="font-size: 13px; font-weight: 700; color: #0f172a;">
          <span style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-size: 11px;">${item.type}</span>
          ${item.vchNo} &bull; <span style="color: var(--primary);">${item.party}</span>
        </div>
        <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
          📅 ${item.date} &bull; ${item.itemCount || 1} Items &bull; 
          <span style="color: ${item.status === 'SUCCESS' ? 'var(--success)' : '#eab308'}; font-weight: 600;">
            ${item.status === 'SUCCESS' ? '✅ Synced to Tally' : '⏳ Saved Locally'}
          </span>
        </div>
      </div>
      <div style="text-align: right;">
        <div style="font-family: 'JetBrains Mono', monospace; font-size: 14px; font-weight: 700; color: #b91c1c;">
          ₹${parseFloat(item.amount || 0).toLocaleString('en-IN', {minimumFractionDigits: 2})}
        </div>
      </div>
    </div>
  `).join('');
}

// =========================================================================
// MOBILE DEVICE VIEW TOGGLE & CLOCK
// =========================================================================

function toggleDeviceView() {
  document.body.classList.toggle("full-width-mode");
  const isFull = document.body.classList.contains("full-width-mode");
  const btn = document.getElementById("btn-toggle-view");
  if (btn) {
    btn.textContent = isFull ? "📱 Switch to Phone View" : "🖥️ Full Screen";
  }
}

function updateNotchClock() {
  const clock = document.getElementById("mobile-notch-time");
  if (!clock) return;
  const now = new Date();
  const hours = now.getHours().toString().padStart(2, '0');
  const minutes = now.getMinutes().toString().padStart(2, '0');
  clock.textContent = `${hours}:${minutes}`;
}
// =========================================================================
// UNIVERSAL SCHEMA DISCOVERY & DYNAMIC FIELD MAPPER ENGINE
// =========================================================================

let discoveredSchema = {
  party_fields: [],
  item_fields: [],
  voucher_fields: [],
  custom_udfs: []
};

function openFieldMapperModal() {
  document.getElementById("mapper-active-company").textContent = appConfig.companyName;
  openModal("modal-field-mapper");
  
  // If we already have discovered schema cached or saved, render it
  const savedMapping = localStorage.getItem("NFM_FIELD_MAPPING");
  if (savedMapping) {
    try {
      const parsed = JSON.parse(savedMapping);
      if (parsed.schema) {
        discoveredSchema = parsed.schema;
        renderMapperTables(discoveredSchema, parsed.selected || {});
      }
    } catch(e) {}
  }
}

function switchMapperTab(tab) {
  document.querySelectorAll(".mapper-tab-pane").forEach(el => el.style.display = "none");
  document.querySelectorAll(".mapper-tabs button").forEach(b => b.classList.remove("active-mapper-tab"));

  const targetPane = document.getElementById(`mapper-tab-${tab}`);
  const targetBtn = document.getElementById(`tab-btn-${tab}`);
  if (targetPane) targetPane.style.display = "block";
  if (targetBtn) targetBtn.classList.add("active-mapper-tab");
}

async function runSchemaDiscovery() {
  const btn = document.getElementById("btn-run-discovery");
  const sub = document.getElementById("mapper-status-sub");
  btn.disabled = true;
  btn.innerHTML = `⏳ Scanning Tally...`;
  sub.textContent = "Querying live TDL collections & extracting standard + custom UDF tags...";

  try {
    const res = await fetch("/api/discover-schema", {
      headers: {
        "X-Tally-URL": appConfig.connectorUrl,
        "X-Tally-Company": appConfig.companyName
      }
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    discoveredSchema = data;

    renderMapperTables(data);
    showToast(`⚡ Discovery Success: Found ${data.party_fields?.length || 0} Party & ${data.item_fields?.length || 0} Item fields!`, "success");
    sub.textContent = `Live Schema Sync Complete for ${appConfig.companyName} (${data.custom_udfs?.length || 0} Custom UDFs detected)`;
  } catch (err) {
    console.warn("Schema discovery warning:", err);
    // Fallback baseline schema
    const fallbackData = {
      party_fields: [
        { tag: "NAME", label: "Party Name", sample: "The Eclair Bakery", is_udf: false },
        { tag: "CLOSINGBALANCE", label: "Closing Balance", sample: "₹3,05,740.86 Dr", is_udf: false },
        { tag: "PARTYGSTIN", label: "GSTIN Number", sample: "07AAAAA0000A1Z5", is_udf: false },
        { tag: "PARENT", label: "Ledger Group", sample: "Sundry Debtors", is_udf: false },
        { tag: "UDF:VEHICLENO", label: "Vehicle Number (Custom)", sample: "DL-01-AB-1234", is_udf: true },
        { tag: "UDF:SALESMAN", label: "Salesman Name (Custom)", sample: "Ravi Sharma", is_udf: true }
      ],
      item_fields: [
        { tag: "NAME", label: "Item Name", sample: "Hamper Box Transparant Lid", is_udf: false },
        { tag: "BASEUNITS", label: "Unit (UOM)", sample: "PCS", is_udf: false },
        { tag: "GSTHSNCODE", label: "HSN / SAC Code", sample: "4819", is_udf: false },
        { tag: "OPENINGRATE", label: "Rate (₹)", sample: "296.61", is_udf: false },
        { tag: "GSTIGSTRATE", label: "GST Rate (%)", sample: "18%", is_udf: false },
        { tag: "UDF:BATCHNO", label: "Batch / Lot No (Custom)", sample: "B-2026-X1", is_udf: true }
      ],
      custom_udfs: [
        { tag: "UDF:VEHICLENO", label: "Vehicle Number", sample: "DL-01-AB-1234", category: "party" },
        { tag: "UDF:SALESMAN", label: "Salesman Name", sample: "Ravi Sharma", category: "party" },
        { tag: "UDF:BATCHNO", label: "Batch / Lot No", sample: "B-2026-X1", category: "item" }
      ]
    };
    discoveredSchema = fallbackData;
    renderMapperTables(fallbackData);
    showToast(`⚡ Loaded Baseline Tally Schema (${fallbackData.custom_udfs.length} custom fields ready to map)`, "info");
    sub.textContent = `Baseline Schema Active: Connect Tally to auto-refresh live`;
  } finally {
    btn.disabled = false;
    btn.innerHTML = `🔍 Auto-Discover Fields`;
  }
}

function renderMapperTables(data, preSelected = {}) {
  // Update counts
  document.getElementById("count-party-fields").textContent = data.party_fields?.length || 0;
  document.getElementById("count-item-fields").textContent = data.item_fields?.length || 0;
  document.getElementById("count-udf-fields").textContent = data.custom_udfs?.length || 0;

  // 1. Party Table
  const tbodyParty = document.getElementById("mapper-tbody-party");
  tbodyParty.innerHTML = (data.party_fields || []).map(f => `
    <tr>
      <td style="text-align: center;">
        <input type="checkbox" class="map-check-party" data-tag="${f.tag}" ${preSelected[f.tag] !== false ? 'checked' : ''}>
      </td>
      <td><code class="mono" style="color: #2563eb; font-size: 11px;">&lt;${f.tag}&gt;</code></td>
      <td style="font-weight: 600;">${f.label}</td>
      <td style="color: var(--text-muted); font-size: 11px;">${f.sample || '—'}</td>
      <td>
        <span class="badge ${f.is_udf ? 'badge-primary' : 'badge-neutral'}" style="font-size: 10px;">
          ${f.is_udf ? 'Custom UDF' : 'Standard Tag'}
        </span>
      </td>
    </tr>
  `).join('');

  // 2. Item Table
  const tbodyItem = document.getElementById("mapper-tbody-item");
  tbodyItem.innerHTML = (data.item_fields || []).map(f => `
    <tr>
      <td style="text-align: center;">
        <input type="checkbox" class="map-check-item" data-tag="${f.tag}" ${preSelected[f.tag] !== false ? 'checked' : ''}>
      </td>
      <td><code class="mono" style="color: #2563eb; font-size: 11px;">&lt;${f.tag}&gt;</code></td>
      <td style="font-weight: 600;">${f.label}</td>
      <td style="color: var(--text-muted); font-size: 11px;">${f.sample || '—'}</td>
      <td>
        <span class="badge ${f.is_udf ? 'badge-primary' : 'badge-neutral'}" style="font-size: 10px;">
          ${f.is_udf ? 'Custom UDF' : 'Standard Tag'}
        </span>
      </td>
    </tr>
  `).join('');

  // 3. UDF Table
  const tbodyUdf = document.getElementById("mapper-tbody-udf");
  if (data.custom_udfs && data.custom_udfs.length > 0) {
    tbodyUdf.innerHTML = data.custom_udfs.map(u => `
      <tr>
        <td style="text-align: center;">
          <input type="checkbox" class="map-check-udf" data-tag="${u.tag}" checked>
        </td>
        <td><code class="mono" style="color: #10b981; font-weight: 600; font-size: 11px;">&lt;${u.tag}&gt;</code></td>
        <td style="font-weight: 600;">${u.label}</td>
        <td style="color: var(--text-muted); font-size: 11px;">${u.sample || '—'}</td>
        <td>
          <select class="form-control mono" style="font-size: 11px; padding: 2px 6px;" id="udf-placement-${u.tag.replace(/[^a-zA-Z0-9]/g, '_')}">
            <option value="header">Bill Header</option>
            <option value="item">Line Item</option>
            <option value="narration">Narration Note</option>
          </select>
        </td>
      </tr>
    `).join('');
  } else {
    tbodyUdf.innerHTML = `<tr><td colspan="5" style="text-align: center; color: var(--text-muted); padding: 15px;">Standard Tally Schema detected. No extra custom TCP UDF tags found.</td></tr>`;
  }
}

function saveFieldMapping() {
  const selected = {};
  document.querySelectorAll(".map-check-party:checked").forEach(cb => selected[cb.dataset.tag] = true);
  document.querySelectorAll(".map-check-item:checked").forEach(cb => selected[cb.dataset.tag] = true);
  
  const activeUdfs = [];
  document.querySelectorAll(".map-check-udf:checked").forEach(cb => {
    const tag = cb.dataset.tag;
    const select = document.getElementById(`udf-placement-${tag.replace(/[^a-zA-Z0-9]/g, '_')}`);
    activeUdfs.push({
      tag,
      placement: select ? select.value : "header"
    });
  });

  const configToSave = {
    company: appConfig.companyName,
    savedAt: new Date().toISOString(),
    selected,
    activeUdfs,
    schema: discoveredSchema
  };

  localStorage.setItem("NFM_FIELD_MAPPING", JSON.stringify(configToSave));
  closeModal("modal-field-mapper");
  showToast(`✅ Universal Field Mapping Applied & Saved Locally! (${activeUdfs.length} Custom Fields Active)`, "success");
}



