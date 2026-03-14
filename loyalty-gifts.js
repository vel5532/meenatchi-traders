// ═══════════════════════════════════════════════════════════════
//  MEENATCHI TRADERS — Loyalty Gift Redemption Module
//  File: loyalty-gifts.js
//
//  FEATURE: Loyal customers can redeem their points to get
//  products as FREE GIFTS.
//
//  RULES (configurable in Settings → Loyalty Gifts):
//  ┌─────────────────────────────────────────────────────────┐
//  │  ₹100 spent   =  1 Point                               │
//  │  Points needed per product = Product Sell Price / 10   │
//  │  i.e. a ₹100 product needs 10 points to redeem FREE    │
//  │  Minimum points to redeem = 10 (configurable)          │
//  └─────────────────────────────────────────────────────────┘
//
//  GIFT REDEMPTION FLOW:
//  1. Open Loyalty → Gift Redemption tab
//  2. Select customer → auto-shows their points
//  3. Select product → auto-calculates points needed
//  4. If customer has enough points → "Redeem Gift" button unlocks
//  5. On redeem: points deducted, stock reduced, record saved
//  6. WhatsApp notification sent to customer
// ═══════════════════════════════════════════════════════════════

// ── Ensure gift redemptions array exists in DB ─
(function initGiftDB() {
  if (!DB.giftRedemptions) DB.giftRedemptions = [];
  // Patch saveData to include giftRedemptions
})();

// ── Gift config (points per ₹ spent, divisor for product cost) ──
const GIFT_CONFIG = {
  pointsPerRupee: 1 / 100,      // ₹100 = 1 point
  giftPointDivisor: 10,          // product cost ÷ 10 = points needed
  minPointsToRedeem: 10,         // minimum points required to redeem
  maxGiftQtyPerRedemption: 5,    // max qty per single redemption
};

// ── Calculate points needed for a product ─────
function calcPointsNeeded(product, qty = 1) {
  if (!product) return 0;
  const price = Number(product.sellPrice) || 0;
  return Math.ceil((price / GIFT_CONFIG.giftPointDivisor) * qty);
}

// ── Get customer loyalty data (points + history) ──
function getCustomerLoyalty(customerId) {
  const cust = DB.customers.find(c => c.id === customerId);
  if (!cust) return null;

  const custSales = DB.sales.filter(s =>
    s.customer && s.customer.toLowerCase() === cust.name.toLowerCase()
  );
  const totalSpent = custSales.reduce((a, s) => a + (Number(s.total) || 0), 0);
  const earnedPoints = Math.floor(totalSpent * GIFT_CONFIG.pointsPerRupee);

  // Points already used in redemptions
  const usedPoints = (DB.giftRedemptions || [])
    .filter(g => g.customerId === customerId || g.customer === cust.name)
    .reduce((a, g) => a + (Number(g.pointsUsed) || 0), 0);

  const availablePoints = Math.max(0, earnedPoints - usedPoints);
  const totalRedemptions = (DB.giftRedemptions || [])
    .filter(g => g.customerId === customerId || g.customer === cust.name).length;

  return {
    ...cust,
    totalSpent,
    earnedPoints,
    usedPoints,
    availablePoints,
    totalRedemptions,
    tier: getLoyaltyTier(availablePoints),
  };
}

// ── Tier system based on available points ─────
function getLoyaltyTier(points) {
  if (points >= 500) return { name: 'Platinum', icon: '💎', color: '#a29bfe', minPoints: 500 };
  if (points >= 200) return { name: 'Gold',     icon: '🥇', color: '#f7c948', minPoints: 200 };
  if (points >= 100) return { name: 'Silver',   icon: '🥈', color: '#b2bec3', minPoints: 100 };
  if (points >= 50)  return { name: 'Bronze',   icon: '🥉', color: '#e17055', minPoints: 50 };
  return                     { name: 'Member',  icon: '⭐', color: '#74b9ff', minPoints: 0 };
}

// ── Inject Gift Redemption tab into Loyalty page ──
function injectGiftRedemptionUI() {
  // Add tab button if not exists
  const tabBar = document.querySelector('#page-loyalty .tabs');
  if (tabBar && !document.getElementById('ltab-gifts')) {
    const giftTab = document.createElement('div');
    giftTab.className = 'tab';
    giftTab.id = 'ltab-gifts';
    giftTab.onclick = () => switchLoyaltyTab('gifts');
    giftTab.innerHTML = '🎁 Gift Redemption';
    tabBar.appendChild(giftTab);
  }

  // Add tab content if not exists
  const loyaltyPage = document.getElementById('page-loyalty');
  if (loyaltyPage && !document.getElementById('ltab-content-gifts')) {
    const content = document.createElement('div');
    content.id = 'ltab-content-gifts';
    content.style.display = 'none';
    content.innerHTML = buildGiftRedemptionHTML();
    loyaltyPage.appendChild(content);
  }
}

// ── Build the Gift Redemption HTML UI ─────────
function buildGiftRedemptionHTML() {
  return `
  <!-- Gift Redemption Stats Cards -->
  <div class="cards-grid" id="gift-stat-cards"></div>

  <div class="grid-2" style="margin-top:0">

    <!-- ── Left: Redeem Form ── -->
    <div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">🎁 Redeem Gift for Customer</span>
        </div>

        <!-- Customer selector -->
        <div class="form-group" style="margin-bottom:14px">
          <label>Select Customer</label>
          <select id="gift-customer-sel"
            onchange="onGiftCustomerChange()"
            style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);width:100%;font-family:'Poppins',sans-serif">
            <option value="">— Select customer —</option>
          </select>
        </div>

        <!-- Customer points display -->
        <div id="gift-customer-info" style="display:none;margin-bottom:14px">
          <div style="background:rgba(247,201,72,0.08);border:1px solid rgba(247,201,72,0.2);border-radius:10px;padding:14px">
            <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px">
              <div>
                <div style="font-size:0.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px">Customer</div>
                <div style="font-size:1rem;font-weight:700" id="gift-cust-name">—</div>
                <div style="font-size:0.75rem;color:var(--text-dim)" id="gift-cust-tier">—</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:0.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px">Total Spent</div>
                <div style="font-size:1rem;font-weight:700;color:var(--green)" id="gift-cust-spent">₹0</div>
              </div>
              <div style="text-align:center">
                <div style="font-size:0.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px">Available Points</div>
                <div style="font-size:1.4rem;font-weight:800;color:var(--accent);font-family:'Baloo 2',cursive" id="gift-cust-points">0 ⭐</div>
              </div>
            </div>
            <!-- Points progress bar -->
            <div style="margin-top:10px">
              <div style="display:flex;justify-content:space-between;font-size:0.7rem;color:var(--text-dim);margin-bottom:4px">
                <span id="gift-tier-label">Current Tier</span>
                <span id="gift-tier-next">Next Tier</span>
              </div>
              <div style="background:rgba(255,255,255,0.07);border-radius:20px;height:7px;overflow:hidden">
                <div id="gift-points-bar" style="height:100%;border-radius:20px;transition:width 0.8s;background:var(--accent);width:0%"></div>
              </div>
            </div>
          </div>
        </div>

        <!-- Product selector -->
        <div class="form-group" style="margin-bottom:12px">
          <label>Select Gift Product</label>
          <select id="gift-product-sel"
            onchange="onGiftProductChange()"
            style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);width:100%;font-family:'Poppins',sans-serif">
            <option value="">— Select product —</option>
          </select>
        </div>

        <!-- Quantity -->
        <div class="form-group" style="margin-bottom:12px">
          <label>Quantity</label>
          <input type="number" id="gift-qty" value="1" min="1" max="5"
            oninput="onGiftProductChange()"
            style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);width:100%;font-family:'Poppins',sans-serif">
        </div>

        <!-- Notes -->
        <div class="form-group" style="margin-bottom:16px">
          <label>Notes (optional)</label>
          <input type="text" id="gift-notes" placeholder="e.g. Birthday gift, Festival offer..."
            style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:9px 12px;color:var(--text);width:100%;font-family:'Poppins',sans-serif">
        </div>

        <!-- Calculation panel -->
        <div id="gift-calc-panel" style="display:none;margin-bottom:16px">
          <div style="background:rgba(162,155,254,0.06);border:1px solid rgba(162,155,254,0.2);border-radius:10px;padding:14px">
            <div style="font-size:0.78rem;font-weight:700;color:var(--accent4);margin-bottom:10px;text-transform:uppercase;letter-spacing:.5px">Gift Calculation</div>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.82rem">
              <div style="color:var(--text-dim)">Product Price</div>
              <div id="gc-price" style="font-weight:600;text-align:right">₹0</div>
              <div style="color:var(--text-dim)">Qty</div>
              <div id="gc-qty" style="font-weight:600;text-align:right">1</div>
              <div style="color:var(--text-dim)">Total Value</div>
              <div id="gc-total" style="font-weight:600;text-align:right;color:var(--green)">₹0</div>
              <div style="border-top:1px solid var(--border);padding-top:8px;color:var(--text-dim)">Points Needed</div>
              <div id="gc-needed" style="border-top:1px solid var(--border);padding-top:8px;font-weight:700;text-align:right;color:var(--accent)">0 ⭐</div>
              <div style="color:var(--text-dim)">Your Points</div>
              <div id="gc-available" style="font-weight:700;text-align:right">0 ⭐</div>
              <div style="color:var(--text-dim)">Points After</div>
              <div id="gc-after" style="font-weight:700;text-align:right">0 ⭐</div>
            </div>
            <!-- Eligibility indicator -->
            <div id="gift-eligibility" style="margin-top:12px;padding:8px 12px;border-radius:8px;font-size:0.82rem;font-weight:600;text-align:center"></div>
          </div>
        </div>

        <!-- Action buttons -->
        <div class="form-actions">
          <button id="gift-redeem-btn" class="btn btn-primary" onclick="redeemGift()" disabled
            style="opacity:0.5;cursor:not-allowed">
            🎁 Redeem Gift
          </button>
          <button class="btn btn-success" onclick="sendGiftNotificationWA()" id="gift-wa-btn" style="display:none">
            💬 Notify via WhatsApp
          </button>
          <button class="btn btn-secondary" onclick="clearGiftForm()">Clear</button>
        </div>
      </div>

      <!-- Gift rules explanation -->
      <div class="card" style="background:rgba(78,205,196,0.05);border:1px solid rgba(78,205,196,0.15)">
        <div class="card-header">
          <span class="card-title" style="color:var(--accent3)">📋 How Points & Gifts Work</span>
        </div>
        <div style="font-size:0.82rem;color:var(--text-dim);line-height:2">
          <div>🛒 <strong style="color:var(--text)">Earn Points:</strong> Spend ₹100 → get 1 point</div>
          <div>🎁 <strong style="color:var(--text)">Redeem Gift:</strong> Points needed = Product Price ÷ 10</div>
          <div>📦 <strong style="color:var(--text)">Example:</strong> ₹100 product = 10 pts | ₹50 product = 5 pts</div>
          <div>🔒 <strong style="color:var(--text)">Minimum:</strong> Need at least ${GIFT_CONFIG.minPointsToRedeem} points to redeem</div>
          <div>📊 <strong style="color:var(--text)">Stock:</strong> Stock is reduced automatically on redemption</div>
        </div>
        <div style="margin-top:12px">
          <div style="font-size:0.72rem;color:var(--text-dim);text-transform:uppercase;letter-spacing:.5px;margin-bottom:8px">Tier Benefits</div>
          <div style="display:flex;flex-wrap:wrap;gap:6px">
            <span style="background:rgba(116,185,255,0.1);border:1px solid rgba(116,185,255,0.2);border-radius:20px;padding:3px 10px;font-size:0.72rem;color:#74b9ff">⭐ Member (0+ pts)</span>
            <span style="background:rgba(225,112,85,0.1);border:1px solid rgba(225,112,85,0.2);border-radius:20px;padding:3px 10px;font-size:0.72rem;color:#e17055">🥉 Bronze (50+ pts)</span>
            <span style="background:rgba(178,190,195,0.1);border:1px solid rgba(178,190,195,0.2);border-radius:20px;padding:3px 10px;font-size:0.72rem;color:#b2bec3">🥈 Silver (100+ pts)</span>
            <span style="background:rgba(247,201,72,0.1);border:1px solid rgba(247,201,72,0.2);border-radius:20px;padding:3px 10px;font-size:0.72rem;color:var(--accent)">🥇 Gold (200+ pts)</span>
            <span style="background:rgba(162,155,254,0.1);border:1px solid rgba(162,155,254,0.2);border-radius:20px;padding:3px 10px;font-size:0.72rem;color:var(--accent4)">💎 Platinum (500+ pts)</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Right: Redemption History ── -->
    <div>
      <div class="card">
        <div class="card-header">
          <span class="card-title">📜 Gift Redemption History</span>
          <button class="btn btn-secondary btn-sm" onclick="renderGiftHistory()">Refresh</button>
        </div>
        <div class="search-bar" style="margin-bottom:10px">
          <input type="text" placeholder="🔍 Search by customer or product..."
            onkeyup="filterGiftHistory(this.value)"
            style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:8px;padding:7px 12px;color:var(--text);width:100%;font-size:0.82rem">
        </div>
        <div id="gift-history-list"></div>
      </div>

      <!-- Per-customer gift summary -->
      <div class="card" style="margin-top:0">
        <div class="card-header">
          <span class="card-title">👤 Customer Gift Summary</span>
        </div>
        <div id="gift-customer-summary"></div>
      </div>
    </div>

  </div>`;
}

// ── Populate gift form dropdowns ───────────────
function populateGiftDropdowns() {
  // Customer dropdown
  const custSel = document.getElementById('gift-customer-sel');
  if (custSel) {
    const existing = custSel.value;
    custSel.innerHTML = '<option value="">— Select customer —</option>' +
      DB.customers
        .filter(c => c.name)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(c => {
          const loyalty = getCustomerLoyalty(c.id);
          const pts = loyalty ? loyalty.availablePoints : 0;
          return `<option value="${c.id}" ${c.id === existing ? 'selected' : ''}>
            ${c.name} — ⭐ ${pts} pts
          </option>`;
        }).join('');
  }

  // Product dropdown
  const prodSel = document.getElementById('gift-product-sel');
  if (prodSel) {
    const existing = prodSel.value;
    prodSel.innerHTML = '<option value="">— Select product —</option>' +
      DB.products
        .filter(p => p.name && (p.balance || 0) > 0)
        .sort((a, b) => a.name.localeCompare(b.name))
        .map(p => {
          const ptsNeeded = calcPointsNeeded(p, 1);
          return `<option value="${p.id}" ${p.id === existing ? 'selected' : ''}>
            ${p.name} (₹${p.sellPrice}) — needs ${ptsNeeded} pts | Stock: ${p.balance}
          </option>`;
        }).join('');
  }
}

// ── On customer selection change ──────────────
function onGiftCustomerChange() {
  const custId = document.getElementById('gift-customer-sel')?.value;
  const infoDiv = document.getElementById('gift-customer-info');
  if (!custId || !infoDiv) { if (infoDiv) infoDiv.style.display = 'none'; return; }

  const loyalty = getCustomerLoyalty(custId);
  if (!loyalty) return;

  infoDiv.style.display = '';
  set2El('gift-cust-name', loyalty.name);
  set2El('gift-cust-tier', `${loyalty.tier.icon} ${loyalty.tier.name} Member`);
  set2El('gift-cust-spent', formatCurrency(loyalty.totalSpent));
  set2El('gift-cust-points', `${loyalty.availablePoints} ⭐`);

  // Points bar - progress to next tier
  const tiers = [
    { name: 'Member', minPoints: 0, nextMin: 50, nextName: 'Bronze 🥉' },
    { name: 'Bronze', minPoints: 50, nextMin: 100, nextName: 'Silver 🥈' },
    { name: 'Silver', minPoints: 100, nextMin: 200, nextName: 'Gold 🥇' },
    { name: 'Gold', minPoints: 200, nextMin: 500, nextName: 'Platinum 💎' },
    { name: 'Platinum', minPoints: 500, nextMin: null, nextName: 'Max Tier' },
  ];
  const currentTierData = tiers.find(t => t.name === loyalty.tier.name) || tiers[0];
  set2El('gift-tier-label', `${loyalty.tier.icon} ${loyalty.tier.name} (${loyalty.availablePoints} pts)`);

  if (currentTierData.nextMin !== null) {
    const progress = Math.min(100,
      ((loyalty.availablePoints - currentTierData.minPoints) /
       (currentTierData.nextMin - currentTierData.minPoints)) * 100
    );
    const bar = document.getElementById('gift-points-bar');
    if (bar) { bar.style.width = progress + '%'; bar.style.background = loyalty.tier.color; }
    set2El('gift-tier-next', `${currentTierData.nextName} (${currentTierData.nextMin} pts)`);
  } else {
    const bar = document.getElementById('gift-points-bar');
    if (bar) { bar.style.width = '100%'; bar.style.background = loyalty.tier.color; }
    set2El('gift-tier-next', '🎉 Max Tier Reached!');
  }

  // Re-run product calc if product already selected
  onGiftProductChange();
}

// ── On product / qty change ────────────────────
function onGiftProductChange() {
  const custId  = document.getElementById('gift-customer-sel')?.value;
  const prodId  = document.getElementById('gift-product-sel')?.value;
  const qty     = parseInt(document.getElementById('gift-qty')?.value) || 1;
  const calcDiv = document.getElementById('gift-calc-panel');
  const redeemBtn = document.getElementById('gift-redeem-btn');

  if (!prodId || !calcDiv) {
    if (calcDiv) calcDiv.style.display = 'none';
    if (redeemBtn) { redeemBtn.disabled = true; redeemBtn.style.opacity = '0.5'; redeemBtn.style.cursor = 'not-allowed'; }
    return;
  }

  const product = DB.products.find(p => p.id === prodId);
  if (!product) return;

  const loyalty      = custId ? getCustomerLoyalty(custId) : null;
  const pointsNeeded = calcPointsNeeded(product, qty);
  const available    = loyalty ? loyalty.availablePoints : 0;
  const pointsAfter  = available - pointsNeeded;
  const canRedeem    = available >= pointsNeeded && pointsNeeded >= GIFT_CONFIG.minPointsToRedeem && (product.balance || 0) >= qty;

  calcDiv.style.display = '';
  set2El('gc-price',     formatCurrency(product.sellPrice));
  set2El('gc-qty',       qty + ' ' + (product.unit || 'pcs'));
  set2El('gc-total',     formatCurrency(product.sellPrice * qty));
  set2El('gc-needed',    pointsNeeded + ' ⭐');
  set2El('gc-available', available + ' ⭐');
  set2El('gc-after',     Math.max(0, pointsAfter) + ' ⭐');

  // Eligibility display
  const eligDiv = document.getElementById('gift-eligibility');
  if (eligDiv) {
    if (!custId) {
      eligDiv.style.background = 'rgba(253,121,168,0.1)';
      eligDiv.style.color = 'var(--red)';
      eligDiv.textContent = '⚠️ Please select a customer first';
    } else if ((product.balance || 0) < qty) {
      eligDiv.style.background = 'rgba(253,121,168,0.1)';
      eligDiv.style.color = 'var(--red)';
      eligDiv.textContent = `❌ Insufficient stock! Available: ${product.balance} ${product.unit}`;
    } else if (pointsNeeded < GIFT_CONFIG.minPointsToRedeem) {
      eligDiv.style.background = 'rgba(253,150,68,0.1)';
      eligDiv.style.color = '#fd9644';
      eligDiv.textContent = `ℹ️ Minimum ${GIFT_CONFIG.minPointsToRedeem} points needed to redeem`;
    } else if (canRedeem) {
      eligDiv.style.background = 'rgba(85,239,196,0.1)';
      eligDiv.style.color = 'var(--green)';
      eligDiv.textContent = `✅ Eligible! Customer has ${available} pts, needs ${pointsNeeded} pts`;
    } else {
      const deficit = pointsNeeded - available;
      eligDiv.style.background = 'rgba(253,121,168,0.1)';
      eligDiv.style.color = 'var(--red)';
      eligDiv.textContent = `❌ Not enough points! Need ${deficit} more point${deficit !== 1 ? 's' : ''}`;
    }
  }

  // Enable/disable redeem button
  if (redeemBtn) {
    redeemBtn.disabled = !canRedeem;
    redeemBtn.style.opacity = canRedeem ? '1' : '0.5';
    redeemBtn.style.cursor  = canRedeem ? 'pointer' : 'not-allowed';
  }
}

// ── Redeem Gift (main action) ──────────────────
function redeemGift() {
  const custId  = document.getElementById('gift-customer-sel')?.value;
  const prodId  = document.getElementById('gift-product-sel')?.value;
  const qty     = parseInt(document.getElementById('gift-qty')?.value) || 1;
  const notes   = document.getElementById('gift-notes')?.value || '';

  if (!custId || !prodId) { showToast('Select customer and product!', 'error'); return; }

  const cust    = DB.customers.find(c => c.id === custId);
  const product = DB.products.find(p => p.id === prodId);
  if (!cust || !product) { showToast('Invalid selection!', 'error'); return; }

  const loyalty      = getCustomerLoyalty(custId);
  const pointsNeeded = calcPointsNeeded(product, qty);

  // Final validation
  if (loyalty.availablePoints < pointsNeeded) {
    showToast(`Not enough points! Has ${loyalty.availablePoints}, needs ${pointsNeeded}`, 'error');
    return;
  }
  if ((product.balance || 0) < qty) {
    showToast(`Insufficient stock! Only ${product.balance} available`, 'error');
    return;
  }
  if (!confirm(`Confirm: Redeem ${qty}x ${product.name} for ${cust.name}?\n\nPoints used: ${pointsNeeded}\nPoints remaining: ${loyalty.availablePoints - pointsNeeded}`)) {
    return;
  }

  // Create redemption record
  const redemption = {
    id: uid(),
    date: today(),
    customerId: cust.id,
    customer: cust.name,
    phone: cust.phone || '',
    productId: product.id,
    product: product.name,
    qty: qty,
    productValue: product.sellPrice * qty,
    pointsUsed: pointsNeeded,
    pointsBefore: loyalty.availablePoints,
    pointsAfter: loyalty.availablePoints - pointsNeeded,
    totalSpent: loyalty.totalSpent,
    notes: notes,
    redeemedBy: DB.settings.bizName || 'Meenatchi Traders',
  };

  // Save redemption
  if (!DB.giftRedemptions) DB.giftRedemptions = [];
  DB.giftRedemptions.push(redemption);

  // Reduce product stock
  const prodIndex = DB.products.findIndex(p => p.id === prodId);
  if (prodIndex > -1) {
    DB.products[prodIndex].balance = Math.max(0, (DB.products[prodIndex].balance || 0) - qty);
    DB.products[prodIndex].sold = (DB.products[prodIndex].sold || 0) + qty;
  }

  saveData();

  // Update UI
  showToast(`🎁 Gift redeemed! ${qty}x ${product.name} for ${cust.name}. ${pointsNeeded} pts used.`, 'success');
  renderGiftHistory();
  renderGiftStatCards();
  renderGiftCustomerSummary();
  populateGiftDropdowns();
  onGiftCustomerChange(); // Refresh points display

  // Show WhatsApp button
  const waBtn = document.getElementById('gift-wa-btn');
  if (waBtn) {
    waBtn.style.display = '';
    waBtn._redemptionData = redemption; // store for WA send
  }

  // Clear calc panel
  document.getElementById('gift-calc-panel').style.display = 'none';
  const redeemBtn = document.getElementById('gift-redeem-btn');
  if (redeemBtn) { redeemBtn.disabled = true; redeemBtn.style.opacity = '0.5'; }
}

// ── Send WhatsApp notification after redemption ──
function sendGiftNotificationWA() {
  const custId = document.getElementById('gift-customer-sel')?.value;
  const cust = DB.customers.find(c => c.id === custId);
  if (!cust || !cust.phone) { showToast('No phone number for this customer!', 'error'); return; }

  // Get last redemption for this customer
  const lastRedemption = [...(DB.giftRedemptions || [])]
    .filter(g => g.customerId === custId || g.customer === cust.name)
    .sort((a, b) => b.date.localeCompare(a.date))[0];

  if (!lastRedemption) return;

  const loyalty = getCustomerLoyalty(custId);
  const biz = DB.settings.bizName || 'Meenatchi Traders';

  const msg =
    `🎁 *Gift Redeemed Successfully!*\n\n` +
    `Hello ${cust.name}! 🎉\n\n` +
    `You have successfully redeemed your loyalty points for a FREE gift!\n\n` +
    `📦 *Gift:* ${lastRedemption.qty}x ${lastRedemption.product}\n` +
    `💰 *Gift Value:* ₹${lastRedemption.productValue}\n` +
    `⭐ *Points Used:* ${lastRedemption.pointsUsed} points\n` +
    `✅ *Points Remaining:* ${loyalty.availablePoints} points\n\n` +
    `Thank you for being a loyal customer of *${biz}*! 🙏\n` +
    `Keep shopping to earn more rewards!\n\n` +
    `_${biz} — Loyalty Rewards Program_`;

  const ph = cust.phone.replace(/\D/g, '');
  window.open(
    `https://wa.me/${ph.startsWith('91') ? ph : '91' + ph}?text=${encodeURIComponent(msg)}`,
    '_blank'
  );
}

// ── Render Gift Statistics Cards ───────────────
function renderGiftStatCards() {
  const el = document.getElementById('gift-stat-cards');
  if (!el) return;

  const redemptions = DB.giftRedemptions || [];
  const totalRedemptions = redemptions.length;
  const totalPointsUsed  = redemptions.reduce((a, g) => a + (g.pointsUsed || 0), 0);
  const totalGiftValue   = redemptions.reduce((a, g) => a + (g.productValue || 0), 0);
  const uniqueRecipients = new Set(redemptions.map(g => g.customer)).size;

  // All loyalty data for total available
  const totalAvailablePoints = DB.customers.reduce((a, c) => {
    const l = getCustomerLoyalty(c.id);
    return a + (l ? l.availablePoints : 0);
  }, 0);

  el.innerHTML = `
    <div class="stat-card gold">
      <div class="icon">🎁</div>
      <div class="label">Total Gifts Given</div>
      <div class="value">${totalRedemptions}</div>
      <div class="sub">All time redemptions</div>
    </div>
    <div class="stat-card purple">
      <div class="icon">⭐</div>
      <div class="label">Points Redeemed</div>
      <div class="value">${totalPointsUsed.toLocaleString()}</div>
      <div class="sub">Total points used</div>
    </div>
    <div class="stat-card green">
      <div class="icon">₹</div>
      <div class="label">Total Gift Value</div>
      <div class="value" style="font-size:1rem">${formatCurrency(totalGiftValue)}</div>
      <div class="sub">Products given free</div>
    </div>
    <div class="stat-card teal">
      <div class="icon">👥</div>
      <div class="label">Gift Recipients</div>
      <div class="value">${uniqueRecipients}</div>
      <div class="sub">Unique customers</div>
    </div>
    <div class="stat-card orange">
      <div class="icon">💳</div>
      <div class="label">Points Outstanding</div>
      <div class="value">${totalAvailablePoints.toLocaleString()}</div>
      <div class="sub">Across all customers</div>
    </div>
  `;
}

// ── Render Gift Redemption History ─────────────
function renderGiftHistory() {
  const el = document.getElementById('gift-history-list');
  if (!el) return;

  const redemptions = (DB.giftRedemptions || []).slice().reverse();
  if (!redemptions.length) {
    el.innerHTML = '<div class="empty-state">🎁<p>No gift redemptions yet. Redeem your first gift above!</p></div>';
    return;
  }

  el.innerHTML = `<div class="table-wrap">
    <table id="gift-history-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Customer</th>
          <th>Product</th>
          <th>Qty</th>
          <th>Value</th>
          <th>Pts Used</th>
          <th>Pts Left</th>
          <th>Action</th>
        </tr>
      </thead>
      <tbody>
        ${redemptions.map(g => `
          <tr>
            <td style="font-size:0.78rem">${formatDate(g.date)}</td>
            <td><strong>${g.customer}</strong></td>
            <td style="font-size:0.8rem">${g.product}</td>
            <td>${g.qty}</td>
            <td style="color:var(--green)">${formatCurrency(g.productValue || 0)}</td>
            <td style="color:var(--accent);font-weight:700">⭐ ${g.pointsUsed}</td>
            <td style="color:var(--text-dim)">${g.pointsAfter}</td>
            <td>
              ${g.phone
                ? `<button class="wa-btn" style="padding:3px 8px;font-size:0.7rem"
                    onclick="sendGiftHistoryWA('${g.id}')">💬</button>`
                : '—'}
            </td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>`;
}

// ── Filter gift history table ──────────────────
function filterGiftHistory(q) {
  const rows = document.querySelectorAll('#gift-history-table tbody tr');
  rows.forEach(r => {
    r.style.display = r.textContent.toLowerCase().includes(q.toLowerCase()) ? '' : 'none';
  });
}

// ── Per-customer gift summary ──────────────────
function renderGiftCustomerSummary() {
  const el = document.getElementById('gift-customer-summary');
  if (!el) return;

  const redemptions = DB.giftRedemptions || [];
  if (!redemptions.length) {
    el.innerHTML = '<div style="color:var(--text-dim);font-size:0.82rem;padding:8px">No redemptions yet.</div>';
    return;
  }

  // Group by customer
  const byCustomer = {};
  redemptions.forEach(g => {
    if (!byCustomer[g.customer]) {
      byCustomer[g.customer] = { count: 0, pointsUsed: 0, totalValue: 0, phone: g.phone, products: [] };
    }
    byCustomer[g.customer].count++;
    byCustomer[g.customer].pointsUsed += g.pointsUsed || 0;
    byCustomer[g.customer].totalValue += g.productValue || 0;
    byCustomer[g.customer].products.push(g.product);
  });

  const sorted = Object.entries(byCustomer).sort((a, b) => b[1].pointsUsed - a[1].pointsUsed);

  el.innerHTML = sorted.map(([name, data]) => {
    const cust = DB.customers.find(c => c.name === name);
    const loyalty = cust ? getCustomerLoyalty(cust.id) : null;
    return `
      <div style="padding:10px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px">
        <div>
          <div style="font-weight:600;font-size:0.85rem">${name}</div>
          <div style="font-size:0.72rem;color:var(--text-dim)">
            ${data.count} redemption${data.count !== 1 ? 's' : ''} ·
            ${loyalty ? `${loyalty.availablePoints} pts left` : ''}
          </div>
        </div>
        <div style="text-align:right">
          <div style="color:var(--accent);font-weight:700;font-size:0.85rem">⭐ ${data.pointsUsed} pts used</div>
          <div style="color:var(--green);font-size:0.78rem">Gifts: ${formatCurrency(data.totalValue)}</div>
        </div>
      </div>`;
  }).join('');
}

// ── Send WA from history row ───────────────────
function sendGiftHistoryWA(giftId) {
  const g = (DB.giftRedemptions || []).find(x => x.id === giftId);
  if (!g || !g.phone) { showToast('No phone number!', 'error'); return; }
  const biz = DB.settings.bizName || 'Meenatchi Traders';
  const msg =
    `🎁 Gift Redemption Reminder — ${biz}\n\n` +
    `Dear ${g.customer},\n\n` +
    `Your gift redemption on ${formatDate(g.date)}:\n` +
    `• ${g.qty}x ${g.product} (₹${g.productValue})\n` +
    `• ${g.pointsUsed} points were used\n\n` +
    `Thank you for your loyalty! 🙏`;
  const ph = g.phone.replace(/\D/g, '');
  window.open(
    `https://wa.me/${ph.startsWith('91') ? ph : '91' + ph}?text=${encodeURIComponent(msg)}`,
    '_blank'
  );
}

// ── Clear gift form ────────────────────────────
function clearGiftForm() {
  const custSel = document.getElementById('gift-customer-sel');
  const prodSel = document.getElementById('gift-product-sel');
  const qtyInp  = document.getElementById('gift-qty');
  const notesInp = document.getElementById('gift-notes');
  if (custSel) custSel.value = '';
  if (prodSel) prodSel.value = '';
  if (qtyInp)  qtyInp.value = '1';
  if (notesInp) notesInp.value = '';
  const infoDiv = document.getElementById('gift-customer-info');
  const calcDiv = document.getElementById('gift-calc-panel');
  if (infoDiv) infoDiv.style.display = 'none';
  if (calcDiv) calcDiv.style.display = 'none';
  const redeemBtn = document.getElementById('gift-redeem-btn');
  if (redeemBtn) { redeemBtn.disabled = true; redeemBtn.style.opacity = '0.5'; redeemBtn.style.cursor = 'not-allowed'; }
  const waBtn = document.getElementById('gift-wa-btn');
  if (waBtn) waBtn.style.display = 'none';
}

// ── Helper: set element text content ──────────
function set2El(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

// ── Patch switchLoyaltyTab to include 'gifts' ──
const _origSwitchLoyaltyTab = switchLoyaltyTab;
switchLoyaltyTab = function(tab) {
  _origSwitchLoyaltyTab(tab);
  if (tab === 'gifts') {
    // Deactivate other content divs (belt-and-suspenders)
    ['leaderboard','points','history','birthdays','referrals'].forEach(t => {
      const c = document.getElementById('ltab-content-' + t);
      if (c) c.style.display = 'none';
    });
    const giftsContent = document.getElementById('ltab-content-gifts');
    if (giftsContent) giftsContent.style.display = '';

    // Activate tab button
    document.querySelectorAll('#page-loyalty .tab').forEach(btn => btn.classList.remove('active'));
    const giftTabBtn = document.getElementById('ltab-gifts');
    if (giftTabBtn) giftTabBtn.classList.add('active');

    // Render everything
    populateGiftDropdowns();
    renderGiftStatCards();
    renderGiftHistory();
    renderGiftCustomerSummary();
  }
};

// ── Patch renderLoyalty to inject gift tab UI ──
const _origRenderLoyalty = renderLoyalty;
renderLoyalty = function() {
  _origRenderLoyalty();
  injectGiftRedemptionUI();
  populateLoyaltyDropdowns_gifts();
};

// ── Populate loyalty page dropdowns (gift additions) ──
function populateLoyaltyDropdowns_gifts() {
  // The main loyalty dropdowns are handled by original code
  // We just ensure gift dropdowns are also populated
  setTimeout(populateGiftDropdowns, 100);
}

// ── Patch saveData to include giftRedemptions ──
const _origSaveData = saveData;
saveData = function() {
  // giftRedemptions is already on DB object, so original saveData
  // (which saves the whole DB) will include it
  if (!DB.giftRedemptions) DB.giftRedemptions = [];
  _origSaveData();
};

// ── Patch loadData to include giftRedemptions ──
const _origLoadData = loadData;
loadData = function() {
  _origLoadData();
  if (!DB.giftRedemptions) DB.giftRedemptions = [];
};

// ── Auto-inject UI when loyalty page first loads ──
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(() => {
    injectGiftRedemptionUI();
    // Ensure giftRedemptions is initialised
    if (!DB.giftRedemptions) DB.giftRedemptions = [];
  }, 600);
});

console.log('[loyalty-gifts.js] Gift Redemption module loaded ✅');
