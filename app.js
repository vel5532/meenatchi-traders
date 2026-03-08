// ═══════════════════════════════════════════════════════
//  MEENATCHI TRADERS BUSINESS MANAGER — app.js
//  Full business logic: Sales, Products, Customers,
//  Invoices, Tea Shop, Tuition, Reminders, Reports
// ═══════════════════════════════════════════════════════

const APP_VERSION = '1.0.0';
const STORAGE_KEY = 'meenatchi_traders_data';

// ─── DATA STORE ───────────────────────────────────────
let DB = {
  products: [],
  customers: [],
  sales: [],
  invoices: [],
  teaEntries: [],
  students: [],
  staff: [],
  settings: {
    bizName: 'Meenatchi Traders',
    bizOwner: '',
    bizPhone: '',
    bizAddr: '',
    bizGstin: '',
    bizUpi: '',
    sheetUrl: '',
    appsScriptUrl: '',
    sheetTabs: 'DAILY SALES,MCS,SCRUBER,Tuition,Tean31,Selling TEA'
  },
  invoiceCounter: 1001
};

// ─── INIT ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  setDefaultDates();
  renderDashboard();
  renderProductTable();
  renderCustomerTable();
  renderSalesTable();
  renderInvoiceHistory();
  renderTeaShop();
  renderTuition();
  renderOrders();
  renderReminders();
  updateCurrentDate();
  loadSettings();
  generateInvoiceNumber();
  renderInvRows();
  populateProductDropdowns();
  populateCustomerDatalist();
  checkSheetsConnection();
  initPWA();

  // Check if first load - show sheets banner if not connected
  if (!DB.settings.appsScriptUrl) {
    document.getElementById('sheets-banner').style.display = 'flex';
  }
});

// ─── PERSISTENCE ──────────────────────────────────────
function saveData() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(DB)); } catch(e) { showToast('Storage full! Export data.','error'); }
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      DB = { ...DB, ...parsed };
      // Seed defaults if empty
      if (!DB.products.length) seedDefaultProducts();
    } else {
      seedDefaultProducts();
      seedDefaultCustomers();
    }
  } catch(e) {
    console.warn('Failed to load data:', e);
    seedDefaultProducts();
  }
}

function seedDefaultProducts() {
  DB.products = [
    { id: 'p1', name: 'Tea n31 – Sample 10g', category: 'Tea', buyQty: 10, buyPrice: 500, shipCost: 50, totalCost: 550, cpu: 5.5, sellPrice: 10, profitPerUnit: 4.5, stock: 10, sold: 0, balance: 10, alertAt: 5, unit: 'packs' },
    { id: 'p2', name: 'Tea n31 – 100g', category: 'Tea', buyQty: 10, buyPrice: 1800, shipCost: 50, totalCost: 1850, cpu: 18.5, sellPrice: 45, profitPerUnit: 26.5, stock: 40, sold: 12, balance: 28, alertAt: 10, unit: 'packs' },
    { id: 'p3', name: 'Tea n31 – 250g', category: 'Tea', buyQty: 10, buyPrice: 2500, shipCost: 50, totalCost: 2550, cpu: 42.5, sellPrice: 110, profitPerUnit: 67.5, stock: 25, sold: 8, balance: 17, alertAt: 8, unit: 'packs' },
    { id: 'p4', name: 'Nattu Sakkarai 500g', category: 'Nattu Sakkarai', buyQty: 20, buyPrice: 1400, shipCost: 80, totalCost: 1480, cpu: 27, sellPrice: 50, profitPerUnit: 23, stock: 20, sold: 5, balance: 15, alertAt: 5, unit: 'packs' },
    { id: 'p5', name: 'Scrubber Pro', category: 'Scrubber', buyQty: 215, buyPrice: 1720, shipCost: 200, totalCost: 1920, cpu: 8.93, sellPrice: 20, profitPerUnit: 11.07, stock: 180, sold: 35, balance: 145, alertAt: 20, unit: 'pcs' },
    { id: 'p6', name: 'MCS Item', category: 'MCS Items', buyQty: 845, buyPrice: 2535, shipCost: 300, totalCost: 2835, cpu: 3.35, sellPrice: 6, profitPerUnit: 2.65, stock: 700, sold: 145, balance: 555, alertAt: 50, unit: 'pcs' },
    { id: 'p7', name: 'GNS Nattu Sakkarai 1kg', category: 'Nattu Sakkarai', buyQty: 20, buyPrice: 2600, shipCost: 100, totalCost: 2700, cpu: 135, sellPrice: 200, profitPerUnit: 65, stock: 18, sold: 2, balance: 16, alertAt: 4, unit: 'kg' },
  ];
  saveData();
}

function seedDefaultCustomers() {
  DB.customers = [
    { id: 'c1', name: 'Anbu Kumar', phone: '9876543210', addr: 'Chennai, TN', product: 'Tea n31 – 250g', payment: 'UPI', total: 330, paid: 330, pending: 0, status: 'Delivered', notes: '', date: today() },
    { id: 'c2', name: 'Priya Devi', phone: '9123456789', addr: 'Kallakurichi, TN', product: 'Nattu Sakkarai 500g', payment: 'Cash', total: 150, paid: 100, pending: 50, status: 'Pending', notes: 'Regular customer', date: today() },
    { id: 'c3', name: 'Raja Sundaram', phone: '9988776655', addr: 'Villupuram, TN', product: 'Scrubber Pro', payment: 'GPay', total: 200, paid: 200, pending: 0, status: 'Delivered', notes: '', date: today() },
  ];
  DB.sales = [
    { id: 's1', date: today(), customer: 'Anbu Kumar', product: 'Tea n31 – 250g', qty: 3, price: 110, disc: 0, total: 330, received: 330, pending: 0, payment: 'UPI', status: 'Delivered', profit: 202.5 },
    { id: 's2', date: today(), customer: 'Priya Devi', product: 'Nattu Sakkarai 500g', qty: 3, price: 50, disc: 0, total: 150, received: 100, pending: 50, payment: 'Cash', status: 'Pending', profit: 69 },
  ];
  saveData();
}

// ─── NAVIGATION ───────────────────────────────────────
const PAGE_TITLES = {
  dashboard: '📊 Dashboard', products: '📦 Products & Stock',
  customers: '👥 Customers', sales: '🧾 Sales Entry',
  invoices: '📄 Invoices', reminders: '💬 WhatsApp Reminders',
  teashop: '☕ Tea & Coffee Shop', tuition: '🎓 Tuition',
  orders: '🚚 Order Tracking', reports: '📊 Reports',
  settings: '⚙️ Settings'
};

function showPage(id, el, isMobile = false) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById('page-' + id).classList.add('active');
  document.getElementById('page-title').textContent = PAGE_TITLES[id] || id;

  if (!isMobile) {
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
  } else {
    document.querySelectorAll('.bnav-item').forEach(n => n.classList.remove('active'));
    if (el) el.classList.add('active');
  }

  // Close sidebar on mobile
  if (window.innerWidth <= 768) {
    document.getElementById('sidebar').classList.remove('open');
  }

  // Page-specific renders
  if (id === 'dashboard') { renderDashboard(); }
  if (id === 'reports') { generateProductReport(); generateCustomerPendingReport(); generateTuitionReport(); }
}

function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  const tb = document.getElementById('topbar');
  const main = document.getElementById('main');
  if (window.innerWidth <= 768) {
    sb.classList.toggle('open');
  } else {
    sb.classList.toggle('collapsed');
    tb.classList.toggle('full');
    main.classList.toggle('full');
  }
}

// ─── TABS ─────────────────────────────────────────────
function switchTab(page, tab) {
  const tabs = document.querySelectorAll(`#page-${page} .tab`);
  const contents = document.querySelectorAll(`#page-${page} .tab-content`);
  tabs.forEach((t, i) => {
    const id = `${page}-${tab}`;
    t.classList.toggle('active', t.textContent.trim().toLowerCase().includes(tab.toLowerCase()) ||
      (contents[i] && contents[i].id === id));
  });
  contents.forEach(c => c.classList.toggle('active', c.id === `${page}-${tab}`));
}

// ─── DATE HELPERS ─────────────────────────────────────
function today() { return new Date().toISOString().split('T')[0]; }
function formatDate(d) { return new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); }
function formatCurrency(n) { return '₹' + Number(n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
function uid() { return 'id' + Date.now() + Math.random().toString(36).substr(2, 5); }

function updateCurrentDate() {
  document.getElementById('current-date').textContent = new Date().toLocaleDateString('en-IN', { weekday:'short', day:'numeric', month:'short' });
}

function setDefaultDates() {
  const d = today();
  ['s-date','ts-date','inv-date','st-join','sf-paydate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = d;
  });
  const rptDate = document.getElementById('rpt-date');
  if (rptDate) rptDate.value = d;
  const rptMonth = document.getElementById('rpt-month');
  if (rptMonth) rptMonth.value = d.substr(0, 7);
}

// ─── DASHBOARD ────────────────────────────────────────
function renderDashboard() {
  const t = today();
  const thisMonth = t.substr(0, 7);

  const todaySales = DB.sales.filter(s => s.date === t);
  const monthlySales = DB.sales.filter(s => s.date && s.date.startsWith(thisMonth));

  const todayIncome = todaySales.reduce((a, s) => a + (s.received || 0), 0);
  const monthlyIncome = monthlySales.reduce((a, s) => a + (s.received || 0), 0);
  const monthlyProfit = monthlySales.reduce((a, s) => a + (s.profit || 0), 0);
  const pending = DB.customers.reduce((a, c) => a + (c.pending || 0), 0);

  // Tea shop income this month
  const teaIncome = DB.teaEntries.filter(e => e.date && e.date.startsWith(thisMonth)).reduce((a, e) => a + (e.income || 0), 0);
  // Tuition income
  const tuitionIncome = DB.students.reduce((a, s) => a + (s.paid || 0), 0);

  const totalIncome = monthlyIncome + teaIncome + tuitionIncome;
  const staffExpense = DB.staff.reduce((a, s) => a + (s.paid || 0), 0);
  const expense = DB.products.reduce((a, p) => a + (p.totalCost || 0), 0) * 0.2; // simplified
  const totalExpense = staffExpense + expense;
  const totalProfit = totalIncome - totalExpense;

  set('d-income', formatCurrency(totalIncome));
  set('d-expense', formatCurrency(totalExpense));
  set('d-profit', formatCurrency(monthlyProfit));
  set('d-pending', formatCurrency(pending));
  set('d-today', formatCurrency(todayIncome));
  set('d-monthly', formatCurrency(monthlyIncome));

  const sub = document.getElementById('dashboard-subtitle');
  if (sub) sub.textContent = `${new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} — ${todaySales.length} orders today`;

  renderLowStockAlerts();
  renderWeeklyChart();
  renderStockOverview();
  renderPendingTable();
  renderRecentOrders();
}

function renderLowStockAlerts() {
  const low = DB.products.filter(p => p.balance <= p.alertAt);
  const el = document.getElementById('low-stock-alerts');
  if (!el) return;
  if (!low.length) { el.innerHTML = ''; return; }
  el.innerHTML = `<div class="alert alert-danger"><i class="fas fa-exclamation-triangle"></i><div><strong>Low Stock Alert!</strong><br>${low.map(p => `<span>${p.name}: <strong>${p.balance} ${p.unit}</strong> left</span>`).join(' &nbsp;|&nbsp; ')}</div></div>`;
}

function renderWeeklyChart() {
  const el = document.getElementById('weekly-chart');
  if (!el) return;
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const total = DB.sales.filter(s => s.date === ds).reduce((a, s) => a + (s.total || 0), 0);
    days.push(total);
  }
  const max = Math.max(...days, 1);
  el.innerHTML = days.map(v => `<div class="chart-bar" style="height:${Math.max((v/max)*100,3)}%" data-val="${formatCurrency(v)}"></div>`).join('');
}

function renderStockOverview() {
  const el = document.getElementById('stock-overview');
  if (!el) return;
  el.innerHTML = DB.products.slice(0, 5).map(p => {
    const pct = Math.min((p.balance / (p.stock || 1)) * 100, 100);
    const color = pct < 20 ? '#fd79a8' : pct < 50 ? '#fd9644' : '#55efc4';
    return `<div style="margin-bottom:10px">
      <div style="display:flex;justify-content:space-between;font-size:0.78rem;margin-bottom:4px">
        <span>${p.name.length > 22 ? p.name.substr(0,22)+'…' : p.name}</span>
        <span style="color:${color}">${p.balance} ${p.unit}</span>
      </div>
      <div class="progress-bar"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>
    </div>`;
  }).join('') || '<div class="empty-state"><i class="fas fa-box-open"></i><p>No products added</p></div>';
}

function renderPendingTable() {
  const tbody = document.getElementById('pending-table');
  if (!tbody) return;
  const pending = DB.customers.filter(c => c.pending > 0).slice(0, 5);
  if (!pending.length) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-dim);padding:20px">No pending payments 🎉</td></tr>'; return; }
  tbody.innerHTML = pending.map(c => {
    const days = Math.floor((new Date() - new Date(c.date)) / 86400000);
    return `<tr><td>${c.name}</td><td class="text-red">${formatCurrency(c.pending)}</td><td>${days}d</td></tr>`;
  }).join('');
}

function renderRecentOrders() {
  const tbody = document.getElementById('recent-orders');
  if (!tbody) return;
  const recent = DB.sales.slice(-5).reverse();
  if (!recent.length) { tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;color:var(--text-dim);padding:20px">No orders yet</td></tr>'; return; }
  tbody.innerHTML = recent.map(s => `<tr><td>${s.customer}</td><td>${(s.product||'').substr(0,16)}</td><td><span class="badge badge-${(s.status||'pending').toLowerCase()}">${s.status||'Pending'}</span></td></tr>`).join('');
}

// ─── PRODUCTS ─────────────────────────────────────────
function calcProductCost() {
  const qty = +v('p-qty') || 1;
  const buy = +v('p-buy') || 0;
  const ship = +v('p-ship') || 0;
  const total = buy + ship;
  const cpu = total / qty;
  set2('p-total', total.toFixed(2));
  set2('p-cpu', cpu.toFixed(2));
  calcProductProfit();
}

function calcProductProfit() {
  const cpu = +v('p-cpu') || 0;
  const sell = +v('p-sell') || 0;
  set2('p-profit', (sell - cpu).toFixed(2));
}

function saveProduct() {
  const name = v('p-name');
  if (!name.trim()) { showToast('Product name required!', 'error'); return; }
  const editId = v('p-edit-id');
  const qty = +v('p-qty') || 0;
  const buy = +v('p-buy') || 0;
  const ship = +v('p-ship') || 0;
  const total = buy + ship;
  const cpu = qty ? total / qty : 0;
  const sell = +v('p-sell') || 0;

  if (editId) {
    // UPDATE existing product
    const idx = DB.products.findIndex(p => p.id === editId);
    if (idx !== -1) {
      const existing = DB.products[idx];
      const addStock = +v('p-add-stock') || 0;
      const newStock = existing.stock + addStock;
      const newBalance = existing.balance + addStock;
      DB.products[idx] = {
        ...existing, name, category: v('p-cat'),
        buyQty: qty, buyPrice: buy, shipCost: ship,
        totalCost: total, cpu, sellPrice: sell,
        profitPerUnit: sell - cpu,
        stock: newStock,
        balance: newBalance,
        alertAt: +v('p-alert') || 10,
        unit: v('p-unit') || 'pcs'
      };
      if (addStock > 0) {
        showToast('✅ Product updated! +' + addStock + ' stock added', 'success');
      } else {
        showToast('✅ Product updated!', 'success');
      }
    }
  } else {
    // ADD new product
    const prod = {
      id: uid(), name, category: v('p-cat'),
      buyQty: qty, buyPrice: buy, shipCost: ship,
      totalCost: total, cpu, sellPrice: sell,
      profitPerUnit: sell - cpu,
      stock: qty, sold: 0, balance: qty,
      alertAt: +v('p-alert') || 10,
      unit: v('p-unit') || 'pcs'
    };
    DB.products.push(prod);
    showToast('✅ Product saved!', 'success');
  }
  saveData();
  renderProductTable();
  populateProductDropdowns();
  clearProductForm();
  switchTab('products', 'list');
}

function editProduct(id) {
  const p = DB.products.find(x => x.id === id);
  if (!p) return;
  set2('p-edit-id', p.id);
  set2('p-name', p.name);
  const cat = document.getElementById('p-cat');
  if (cat) cat.value = p.category;
  set2('p-qty', p.buyQty);
  set2('p-buy', p.buyPrice);
  set2('p-ship', p.shipCost);
  set2('p-total', p.totalCost ? p.totalCost.toFixed(2) : '');
  set2('p-cpu', p.cpu ? p.cpu.toFixed(2) : '');
  set2('p-sell', p.sellPrice);
  set2('p-profit', p.profitPerUnit ? p.profitPerUnit.toFixed(2) : '');
  set2('p-alert', p.alertAt);
  set2('p-add-stock', '');  // clear add-stock field
  const unit = document.getElementById('p-unit');
  if (unit) unit.value = p.unit;
  // Show current stock info
  const stockInfo = document.getElementById('p-stock-info');
  if (stockInfo) {
    stockInfo.style.display = 'block';
    stockInfo.innerHTML = `<div class="alert alert-info" style="margin-top:8px">
      <i class="fas fa-box"></i>
      <div>Current Stock: <strong style="color:var(--accent)">${p.stock} ${p.unit}</strong> &nbsp;|&nbsp;
      Sold: <strong style="color:var(--green)">${p.sold || 0}</strong> &nbsp;|&nbsp;
      Balance: <strong style="color:${p.balance <= p.alertAt ? 'var(--red)' : 'var(--green)'}">${p.balance} ${p.unit}</strong>
      </div></div>`;
  }
  // Show edit badge
  const badge = document.getElementById('prod-edit-badge');
  const title = document.getElementById('prod-form-title');
  const btn = document.getElementById('prod-save-btn');
  if (badge) badge.style.display = 'inline-block';
  if (title) title.textContent = 'Edit Product';
  if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Update Product';
  switchTab('products', 'add');
  setTimeout(() => document.getElementById('products-add').scrollIntoView({ behavior: 'smooth' }), 100);
  showToast('✏️ Product loaded — edit details below', 'info');
}

function renderProductTable() {
  const tbody = document.getElementById('prod-tbody');
  if (!tbody) return;
  if (!DB.products.length) {
    tbody.innerHTML = `<tr><td colspan="12" style="padding:32px"><div class="empty-state"><i class="fas fa-box-open"></i><p>No products yet. Add your first product!</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = DB.products.map(p => {
    const isLow = p.balance <= p.alertAt;
    return `<tr>
      <td><strong>${p.name}</strong><br><span class="text-dim" style="font-size:0.7rem">${p.category}</span></td>
      <td>${p.buyQty} ${p.unit}</td>
      <td>${formatCurrency(p.buyPrice)}</td>
      <td>${formatCurrency(p.shipCost)}</td>
      <td>${formatCurrency(p.cpu)}</td>
      <td class="text-green">${formatCurrency(p.sellPrice)}</td>
      <td class="highlight">${formatCurrency(p.profitPerUnit)}</td>
      <td>${p.stock}</td>
      <td>${p.sold || 0}</td>
      <td><strong>${p.balance}</strong></td>
      <td>${isLow ? '<span class="badge badge-cancelled">LOW</span>' : '<span class="badge badge-delivered">OK</span>'}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="editProduct('${p.id}')" title="Edit" style="margin-right:4px;margin-bottom:2px"><i class="fas fa-pen"></i> Edit</button>
        <button class="btn btn-danger btn-sm" onclick="deleteProduct('${p.id}')" title="Delete"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`;
  }).join('');

  renderStockHealthGrid();
}


// ─── ADD STOCK TO EXISTING PRODUCT ────────────────────
function addStockToProduct(id, qty) {
  const p = DB.products.find(x => x.id === id);
  if (!p) return;
  const add = parseInt(qty) || 0;
  if (add <= 0) { showToast('Enter a valid quantity!', 'error'); return; }
  p.stock += add;
  p.balance += add;
  p.buyQty += add;
  saveData();
  renderProductTable();
  populateProductDropdowns();
  showToast('✅ Stock added: +' + add + ' ' + p.unit, 'success');
}


function quickAddStock() {
  const editId = v('p-edit-id');
  if (!editId) {
    showToast('Please click Edit on a product first!', 'error');
    switchTab('products', 'list');
    return;
  }
  const addQty = +v('p-add-stock') || 0;
  if (addQty <= 0) {
    showToast('Enter a quantity greater than 0!', 'error');
    return;
  }
  const p = DB.products.find(x => x.id === editId);
  if (!p) return;
  p.stock += addQty;
  p.balance += addQty;
  saveData();
  // Refresh stock info display
  const stockInfo = document.getElementById('p-stock-info');
  if (stockInfo) {
    stockInfo.innerHTML = `<div class="alert alert-success" style="margin-top:8px">
      <i class="fas fa-check-circle"></i>
      <div>Stock updated! New balance: <strong style="color:var(--green)">${p.balance} ${p.unit}</strong> &nbsp;|&nbsp;
      Total stock: <strong style="color:var(--accent)">${p.stock} ${p.unit}</strong></div></div>`;
  }
  set2('p-add-stock', '');
  renderProductTable();
  renderLowStockAlerts();
  populateProductDropdowns();
  showToast('✅ Added ' + addQty + ' ' + p.unit + ' to ' + p.name, 'success');
}

function promptAddStock(id) {
  const p = DB.products.find(x => x.id === id);
  if (!p) return;
  const qty = prompt(`Add stock for "${p.name}"\nCurrent balance: ${p.balance} ${p.unit}\n\nEnter quantity to add:`);
  if (qty === null) return;
  addStockToProduct(id, qty);
}

function renderStockHealthGrid() {
  const el = document.getElementById('stock-health-grid');
  if (!el) return;
  el.innerHTML = DB.products.map(p => {
    const pct = p.stock ? Math.min((p.balance / p.stock) * 100, 100) : 0;
    const color = pct < 20 ? 'red' : pct < 50 ? 'orange' : 'green';
    const cls = pct < 20 ? 'badge-cancelled' : pct < 50 ? 'badge-pending' : 'badge-delivered';
    return `<div class="stat-card ${color}">
      <div class="label">${p.name.substr(0,20)}</div>
      <div class="value">${p.balance}<span style="font-size:0.8rem"> ${p.unit}</span></div>
      <div class="progress-bar" style="margin-top:6px"><div class="progress-fill" style="width:${pct}%;background:var(--${color === 'orange' ? 'accent2' : color === 'red' ? 'red' : 'green'})"></div></div>
      <div class="sub">${p.sold || 0} sold • alert@${p.alertAt}</div>
    </div>`;
  }).join('');
}

function deleteProduct(id) {
  if (!confirm('Delete this product?')) return;
  DB.products = DB.products.filter(p => p.id !== id);
  saveData();
  renderProductTable();
  populateProductDropdowns();
  showToast('Product deleted', 'info');
}

function clearProductForm() {
  ['p-name','p-qty','p-buy','p-ship','p-total','p-cpu','p-sell','p-profit','p-alert','p-edit-id','p-add-stock'].forEach(id => set2(id, ''));
  const badge = document.getElementById('prod-edit-badge');
  const title = document.getElementById('prod-form-title');
  const btn = document.getElementById('prod-save-btn');
  const stockInfo = document.getElementById('p-stock-info');
  if (badge) badge.style.display = 'none';
  if (title) title.textContent = 'Add Product';
  if (btn) btn.innerHTML = '<i class="fas fa-save"></i> Save Product';
  if (stockInfo) stockInfo.style.display = 'none';
}

// ─── CUSTOMERS ────────────────────────────────────────
function calcPending() {
  const total = +v('c-total') || 0;
  const paid = +v('c-paid') || 0;
  set2('c-pending-amt', Math.max(total - paid, 0).toFixed(2));
}

function saveCustomer() {
  const name = v('c-name');
  if (!name.trim()) { showToast('Customer name required!', 'error'); return; }
  const total = +v('c-total') || 0;
  const paid = +v('c-paid') || 0;
  const cust = {
    id: uid(), name, phone: v('c-phone'), addr: v('c-addr'),
    product: v('c-product'), payment: v('c-payment'),
    total, paid, pending: Math.max(total - paid, 0),
    status: v('c-status'), notes: v('c-notes'), date: today()
  };
  DB.customers.push(cust);
  saveData();
  renderCustomerTable();
  populateCustomerDatalist();
  showToast('✅ Customer saved!', 'success');
  clearCustomerForm();
  switchTab('customers', 'list');
}

function renderCustomerTable() {
  const tbody = document.getElementById('cust-tbody');
  if (!tbody) return;
  if (!DB.customers.length) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><i class="fas fa-users"></i><p>No customers yet</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = DB.customers.map(c => `<tr>
    <td><strong>${c.name}</strong></td>
    <td><a href="tel:${c.phone}" style="color:var(--accent4)">${c.phone}</a></td>
    <td>${(c.addr||'').substr(0,20)}</td>
    <td>${c.product || '—'}</td>
    <td><span class="badge" style="background:rgba(162,155,254,0.1);color:var(--accent4)">${c.payment||'Cash'}</span></td>
    <td><span class="badge badge-${(c.status||'pending').toLowerCase()}">${c.status||'Pending'}</span></td>
    <td class="text-green">${formatCurrency(c.paid)}</td>
    <td class="${c.pending > 0 ? 'text-red' : 'text-green'}">${formatCurrency(c.pending)}</td>
    <td>
      ${c.pending > 0 ? `<button class="wa-btn" style="padding:3px 8px;font-size:0.7rem" onclick="quickRemind('${c.id}')"><i class="fab fa-whatsapp"></i></button>` : ''}
      <button class="btn btn-danger btn-sm" onclick="deleteCustomer('${c.id}')"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`).join('');

  // Pending tab
  const pendingTbody = document.getElementById('pending-cust-tbody');
  if (pendingTbody) {
    const pending = DB.customers.filter(c => c.pending > 0);
    pendingTbody.innerHTML = pending.length ? pending.map(c => {
      const days = Math.floor((new Date() - new Date(c.date || today())) / 86400000);
      return `<tr>
        <td><strong>${c.name}</strong></td>
        <td><a href="tel:${c.phone}" style="color:var(--accent4)">${c.phone}</a></td>
        <td class="text-red"><strong>${formatCurrency(c.pending)}</strong></td>
        <td>${days}d</td>
        <td><button class="wa-btn" style="padding:4px 10px;font-size:0.75rem" onclick="quickRemind('${c.id}')"><i class="fab fa-whatsapp"></i> Remind</button></td>
      </tr>`;
    }).join('') : '<tr><td colspan="5" style="text-align:center;padding:20px;color:var(--green)">🎉 All payments cleared!</td></tr>';
  }
}

function deleteCustomer(id) {
  if (!confirm('Delete this customer?')) return;
  DB.customers = DB.customers.filter(c => c.id !== id);
  saveData();
  renderCustomerTable();
  showToast('Customer deleted', 'info');
}

function clearCustomerForm() {
  ['c-name','c-phone','c-addr','c-total','c-paid','c-pending-amt','c-notes'].forEach(id => set2(id, ''));
}

function quickRemind(id) {
  const c = DB.customers.find(x => x.id === id);
  if (!c) return;
  const msg = `Hello ${c.name}, this is a reminder from Meenatchi Traders. Your pending amount is ₹${c.pending}. Kindly clear the payment. Thank you!`;
  const phone = c.phone.replace(/\D/g, '');
  window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91'+phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

// ─── SALES ────────────────────────────────────────────
function fillUnitPrice() {
  const name = v('s-product');
  const prod = DB.products.find(p => p.name === name);
  if (prod) { set2('s-price', prod.sellPrice); calcSaleTotal(); }
}

function calcSaleTotal() {
  const qty = +v('s-qty') || 0;
  const price = +v('s-price') || 0;
  const disc = +v('s-disc') || 0;
  const total = (qty * price) - disc;
  set2('s-total', total.toFixed(2));

  // Profit calc
  const prod = DB.products.find(p => p.name === v('s-product'));
  if (prod) set2('s-profit', (qty * prod.profitPerUnit - disc).toFixed(2));

  calcSalePending();
}

function calcSalePending() {
  const total = +v('s-total') || 0;
  const received = +v('s-received') || 0;
  set2('s-pending', Math.max(total - received, 0).toFixed(2));
}

function saveSale(andInvoice = false) {
  const customer = v('s-customer');
  if (!customer.trim()) { showToast('Customer name required!', 'error'); return; }
  const product = v('s-product');
  if (!product) { showToast('Select a product!', 'error'); return; }
  const qty = +v('s-qty') || 0;
  const price = +v('s-price') || 0;
  const disc = +v('s-disc') || 0;
  const total = (qty * price) - disc;
  const received = +v('s-received') || 0;
  const pending = Math.max(total - received, 0);

  const prod = DB.products.find(p => p.name === product);
  const profit = prod ? (qty * prod.profitPerUnit - disc) : 0;

  if (prod && prod.balance < qty) { showToast(`⚠️ Only ${prod.balance} in stock!`, 'error'); return; }

  const sale = {
    id: uid(), date: v('s-date') || today(), customer, product,
    qty, price, disc, total, received, pending,
    payment: v('s-payment'), status: v('s-status'), profit
  };

  DB.sales.push(sale);

  // Update stock
  if (prod) {
    prod.sold = (prod.sold || 0) + qty;
    prod.balance = Math.max(prod.balance - qty, 0);
  }

  // Update/create customer record
  let cust = DB.customers.find(c => c.name.toLowerCase() === customer.toLowerCase());
  if (cust) {
    cust.pending = (cust.pending || 0) + pending;
    cust.paid = (cust.paid || 0) + received;
    cust.product = product;
    cust.status = v('s-status');
  } else {
    DB.customers.push({ id: uid(), name: customer, phone: '', addr: '', product, payment: v('s-payment'), total, paid: received, pending, status: v('s-status'), notes: '', date: v('s-date') });
  }

  saveData();
  renderSalesTable();
  renderDashboard();
  renderProductTable();
  renderCustomerTable();
  updateSalesQuickStats();
  updateDailySummary();
  showToast('✅ Sale recorded!', 'success');
  clearSaleForm();
  populateCustomerDatalist();

  if (andInvoice) {
    prefillInvoiceFromSale(sale);
    showPage('invoices', null);
  }

  // Sync to sheets
  if (DB.settings.appsScriptUrl) syncSaleToSheet(sale);

  return sale;
}

function saveSaleAndInvoice() { saveSale(true); }

function renderSalesTable() {
  const tbody = document.getElementById('sales-tbody');
  if (!tbody) return;
  const sales = [...DB.sales].reverse();
  if (!sales.length) { tbody.innerHTML = `<tr><td colspan="13"><div class="empty-state"><i class="fas fa-receipt"></i><p>No sales yet</p></div></td></tr>`; return; }
  tbody.innerHTML = sales.map(s => `<tr>
    <td>${formatDate(s.date)}</td>
    <td>${s.customer}</td>
    <td>${(s.product||'').substr(0,16)}</td>
    <td>${s.qty}</td>
    <td>${formatCurrency(s.price)}</td>
    <td>${s.disc ? formatCurrency(s.disc) : '—'}</td>
    <td class="highlight">${formatCurrency(s.total)}</td>
    <td class="text-green">${formatCurrency(s.received)}</td>
    <td class="${s.pending > 0 ? 'text-red' : ''}">${s.pending > 0 ? formatCurrency(s.pending) : '—'}</td>
    <td>${s.payment}</td>
    <td><span class="badge badge-${(s.status||'pending').toLowerCase()}">${s.status}</span></td>
    <td class="text-green">${formatCurrency(s.profit)}</td>
    <td>
      <button class="btn btn-secondary btn-sm" onclick="prefillInvoiceAndGo('${s.id}')"><i class="fas fa-file-invoice"></i></button>
      <button class="btn btn-danger btn-sm" onclick="deleteSale('${s.id}')"><i class="fas fa-trash"></i></button>
    </td>
  </tr>`).join('');

  updateSalesQuickStats();
  updateDailySummary();
}

function updateSalesQuickStats() {
  const t = today();
  const wStart = new Date(); wStart.setDate(wStart.getDate() - 7);
  const mStart = t.substr(0, 7);

  const todaySales = DB.sales.filter(s => s.date === t);
  const weekSales = DB.sales.filter(s => new Date(s.date) >= wStart);
  const monthSales = DB.sales.filter(s => s.date && s.date.startsWith(mStart));

  set('qs-today', formatCurrency(todaySales.reduce((a,s) => a+(s.total||0), 0)));
  set('qs-week', formatCurrency(weekSales.reduce((a,s) => a+(s.total||0), 0)));
  set('qs-month', formatCurrency(monthSales.reduce((a,s) => a+(s.total||0), 0)));
  set('qs-orders', DB.sales.length);
}

function updateDailySummary() {
  const el = document.getElementById('daily-summary');
  if (!el) return;
  const t = today();
  const ts = DB.sales.filter(s => s.date === t);
  if (!ts.length) { el.innerHTML = `<div class="empty-state"><i class="fas fa-sun"></i><p>No sales today yet</p></div>`; return; }
  const income = ts.reduce((a,s) => a+(s.total||0), 0);
  const received = ts.reduce((a,s) => a+(s.received||0), 0);
  const profit = ts.reduce((a,s) => a+(s.profit||0), 0);
  const pending = ts.reduce((a,s) => a+(s.pending||0), 0);
  el.innerHTML = `
    <div class="quick-stats">
      <div class="quick-stat"><div class="qs-val">${ts.length}</div><div class="qs-label">Orders</div></div>
      <div class="quick-stat"><div class="qs-val">${formatCurrency(income)}</div><div class="qs-label">Sales</div></div>
      <div class="quick-stat"><div class="qs-val" style="color:var(--green)">${formatCurrency(profit)}</div><div class="qs-label">Profit</div></div>
      <div class="quick-stat"><div class="qs-val" style="color:var(--red)">${formatCurrency(pending)}</div><div class="qs-label">Pending</div></div>
    </div>
    <div class="table-wrap"><table>
      <thead><tr><th>Customer</th><th>Product</th><th>Total</th><th>Profit</th></tr></thead>
      <tbody>${ts.map(s => `<tr><td>${s.customer}</td><td>${(s.product||'').substr(0,14)}</td><td>${formatCurrency(s.total)}</td><td class="text-green">${formatCurrency(s.profit)}</td></tr>`).join('')}</tbody>
    </table></div>`;
}

function deleteSale(id) {
  if (!confirm('Delete this sale?')) return;
  DB.sales = DB.sales.filter(s => s.id !== id);
  saveData();
  renderSalesTable();
  renderDashboard();
  showToast('Sale deleted', 'info');
}

function filterSalesByDate() {
  const d = v('filter-date');
  const rows = document.querySelectorAll('#sales-tbody tr');
  rows.forEach(r => {
    if (!d) { r.style.display = ''; return; }
    const dateCell = r.cells[0]?.textContent || '';
    r.style.display = dateCell.includes(new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' })) ? '' : 'none';
  });
}

function clearSaleForm() {
  ['s-customer','s-qty','s-price','s-disc','s-total','s-received','s-pending','s-profit'].forEach(id => {
    const el = document.getElementById(id);
    if (el) { el.value = id === 's-qty' ? 1 : id === 's-disc' ? 0 : ''; }
  });
  const p = document.getElementById('s-product');
  if (p) p.selectedIndex = 0;
  setDefaultDates();
}

function prefillInvoiceAndGo(id) {
  const s = DB.sales.find(x => x.id === id);
  if (!s) return;
  prefillInvoiceFromSale(s);
  showPage('invoices', null);
}

function prefillInvoiceFromSale(s) {
  set2('inv-customer', s.customer);
  set2('inv-date', s.date);
  const prod = document.getElementById('inv-product');
  if (prod) {
    for (let o of prod.options) { if (o.value === s.product) { prod.value = s.product; break; } }
  }
  set2('inv-qty', s.qty);
  set2('inv-price', s.price);
  set2('inv-disc', s.disc || 0);
  set2('inv-total', s.total);
  set2('inv-payment', s.payment);
  const c = DB.customers.find(x => x.name.toLowerCase() === s.customer.toLowerCase());
  if (c) { set2('inv-phone', c.phone); set2('inv-addr', c.addr); }
  generateInvoiceNumber();
}

// ─── INVOICES v2 ──────────────────────────────────────
// Multi-item invoice with MRP/Sell/Discount per row,
// edit/delete/duplicate, QR code, motivation quote, PDF & WA

let _invRows = [];  // working rows array

function generateInvoiceNumber() {
  const el = document.getElementById('inv-no');
  if (el) el.value = 'MT-' + String(DB.invoiceCounter).padStart(4, '0');
}

// Adds a blank editable row to the items table
function addInvRow(data) {
  const id = uid();
  const d = data || { name: '', mrp: '', sell: '', disc: 0, qty: 1, total: 0 };
  _invRows.push({ id, ...d });
  renderInvRows();
  // Focus on new name cell
  setTimeout(() => {
    const inp = document.querySelector(`[data-row="${id}"][data-col="name"]`);
    if (inp) inp.focus();
  }, 50);
}

function renderInvRows() {
  const tbody = document.getElementById('inv-items-tbody');
  if (!tbody) return;

  if (!_invRows.length) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:20px;font-size:0.82rem">No items. Click "+ Add Row" to add products.</td></tr>`;
    recalcInvSummary();
    return;
  }

  // Build product name options string for datalist
  const opts = DB.products.map(p => `<option value="${p.name}">`).join('');

  tbody.innerHTML = _invRows.map((r, i) => `
    <tr data-rowid="${r.id}">
      <td>
        <input type="text" list="inv-prod-list-${r.id}" data-row="${r.id}" data-col="name" value="${r.name || ''}" placeholder="Product name" oninput="onInvRowInput(this)" onchange="autoFillRowFromProduct(this)">
        <datalist id="inv-prod-list-${r.id}">${opts}</datalist>
      </td>
      <td><input type="number" data-row="${r.id}" data-col="mrp" value="${r.mrp || ''}" placeholder="0.00" step="0.01" oninput="onInvRowInput(this)"></td>
      <td><input type="number" data-row="${r.id}" data-col="sell" value="${r.sell || ''}" placeholder="0.00" step="0.01" oninput="onInvRowInput(this)"></td>
      <td><input type="number" data-row="${r.id}" data-col="disc" value="${r.disc || 0}" placeholder="0" step="0.01" oninput="onInvRowInput(this)"></td>
      <td><input type="number" data-row="${r.id}" data-col="qty" value="${r.qty || 1}" min="1" step="1" oninput="onInvRowInput(this)"></td>
      <td><span class="row-total" id="row-total-${r.id}">${formatCurrency(r.total || 0)}</span></td>
      <td><button class="remove-row-btn" onclick="removeInvRow('${r.id}')"><i class="fas fa-times"></i></button></td>
    </tr>`).join('');

  recalcInvSummary();
}

function onInvRowInput(el) {
  const rowId = el.dataset.row;
  const col = el.dataset.col;
  const row = _invRows.find(r => r.id === rowId);
  if (!row) return;
  row[col] = el.value;
  // Recalc row total
  const sell = +row.sell || 0;
  const disc = +row.disc || 0;
  const qty = +row.qty || 1;
  row.total = (sell - disc) * qty;
  const totalEl = document.getElementById('row-total-' + rowId);
  if (totalEl) totalEl.textContent = formatCurrency(row.total);
  recalcInvSummary();
}

function autoFillRowFromProduct(el) {
  const rowId = el.dataset.row;
  const row = _invRows.find(r => r.id === rowId);
  const prod = DB.products.find(p => p.name === el.value);
  if (!prod || !row) return;
  row.name = prod.name;
  row.mrp = prod.sellPrice;
  row.sell = prod.sellPrice;
  row.disc = 0;
  row.qty = 1;
  row.total = prod.sellPrice;
  renderInvRows();
}

function removeInvRow(id) {
  _invRows = _invRows.filter(r => r.id !== id);
  renderInvRows();
}

function recalcInvSummary() {
  const subtotal = _invRows.reduce((a, r) => a + ((+r.sell || 0) * (+r.qty || 1)), 0);
  const discTotal = _invRows.reduce((a, r) => a + ((+r.disc || 0) * (+r.qty || 1)), 0);
  const grand = subtotal - discTotal;
  const sub = document.getElementById('inv-subtotal');
  const disc = document.getElementById('inv-disc-total');
  const gt = document.getElementById('inv-grand-total');
  if (sub) sub.textContent = formatCurrency(subtotal);
  if (disc) disc.textContent = '-' + formatCurrency(discTotal);
  if (gt) gt.textContent = formatCurrency(grand);
  return { subtotal, discTotal, grand };
}

function toggleUPIPreview() {
  const mode = v('inv-payment');
  const preview = document.getElementById('inv-upi-preview');
  const upi = DB.settings.bizUpi;
  if ((mode === 'UPI' || mode === 'GPay') && upi) {
    if (preview) {
      preview.style.display = 'block';
      const label = document.getElementById('inv-upi-label');
      if (label) label.textContent = upi;
      const qrEl = document.getElementById('inv-qr-preview');
      if (qrEl) {
        qrEl.innerHTML = '';
        const grand = recalcInvSummary().grand;
        try {
          new QRCode(qrEl, { text: `upi://pay?pa=${upi}&pn=${DB.settings.bizName || 'Meenatchi Traders'}&am=${grand.toFixed(2)}`, width: 100, height: 100 });
        } catch(e) {}
      }
    }
  } else {
    if (preview) preview.style.display = 'none';
  }
}

function buildInvoiceHTML(inv) {
  const biz = DB.settings;
  const items = (inv.items || []);
  const { subtotal, discTotal, grand } = items.reduce((a, r) => {
    const st = (+r.sell || 0) * (+r.qty || 1);
    const dt = (+r.disc || 0) * (+r.qty || 1);
    return { subtotal: a.subtotal + st, discTotal: a.discTotal + dt, grand: a.grand + st - dt };
  }, { subtotal: 0, discTotal: 0, grand: 0 });

  const itemRows = items.map(r => `
    <tr>
      <td>${r.name || ''}</td>
      <td style="text-align:right;color:#888;text-decoration:line-through">₹${(+r.mrp || 0).toFixed(2)}</td>
      <td style="text-align:right">₹${(+r.sell || 0).toFixed(2)}</td>
      <td style="text-align:right;color:green">${(+r.disc||0) > 0 ? '-₹' + (+r.disc).toFixed(2) : '—'}</td>
      <td style="text-align:center">${r.qty}</td>
      <td style="text-align:right;font-weight:600">₹${(+r.total || 0).toFixed(2)}</td>
    </tr>`).join('');

  const qrHtml = (inv.payment === 'UPI' || inv.payment === 'GPay') && biz.bizUpi
    ? `<div id="inv-qr-doc" style="display:inline-block;margin-top:8px"></div><p style="font-size:0.72rem;color:#888;margin-top:4px">${biz.bizUpi}</p>`
    : '';

  return `
  <div class="inv-doc" id="inv-print">
    <div class="inv-doc-header">
      <div>
        <div class="inv-doc-logo">🍵 ${biz.bizName || 'Meenatchi Traders'}
          <span>${biz.bizAddr || ''}${biz.bizPhone ? ' · 📞 ' + biz.bizPhone : ''}</span>
          ${biz.bizGstin ? '<span>GSTIN: ' + biz.bizGstin + '</span>' : ''}
        </div>
      </div>
      <div class="inv-badge">INVOICE<small>${inv.invNo}</small><small style="font-weight:400;font-size:0.68rem">${formatDate(inv.date)}</small></div>
    </div>
    <hr class="inv-divider">
    <div class="inv-meta-grid">
      <div class="inv-meta-block">
        <strong>Bill To</strong>
        <p><b>${inv.customer}</b><br>${inv.phone || ''}<br>${(inv.addr || '').replace(/\n/g,'<br>')}</p>
      </div>
      <div class="inv-meta-block" style="text-align:right">
        <strong>Reference</strong><p>${inv.ref || '—'}</p>
        <strong style="margin-top:8px;display:block">Payment</strong><p>${inv.payment}</p>
      </div>
    </div>
    <table class="inv-items-tbl">
      <thead><tr><th>Product</th><th style="text-align:right">MRP</th><th style="text-align:right">Price</th><th style="text-align:right">Disc</th><th style="text-align:center">Qty</th><th style="text-align:right">Total</th></tr></thead>
      <tbody>${itemRows || '<tr><td colspan="6" style="text-align:center;color:#aaa">No items</td></tr>'}</tbody>
    </table>
    <div class="inv-summary-box">
      <div class="inv-summary-inner">
        <div class="inv-summary-row"><span>Subtotal</span><span>₹${subtotal.toFixed(2)}</span></div>
        <div class="inv-summary-row"><span style="color:green">Total Discount</span><span style="color:green">-₹${discTotal.toFixed(2)}</span></div>
        <div class="inv-summary-row total"><span>Grand Total</span><span style="color:#1a0a2e">₹${grand.toFixed(2)}</span></div>
      </div>
    </div>
    <div class="inv-payment-row">
      <div><strong>Payment Mode:</strong> ${inv.payment}</div>
      ${qrHtml ? `<div style="text-align:center">${qrHtml}</div>` : ''}
    </div>
    ${inv.quote ? `<div class="inv-quote-box">"${inv.quote}"</div>` : ''}
    <div class="inv-footer">Generated by Meenatchi Traders Business Manager · Thank you for your business!</div>
  </div>`;
}

function previewAndSaveInvoice() {
  const customer = v('inv-customer');
  if (!customer.trim()) { showToast('Customer name required!', 'error'); return; }
  if (!_invRows.length) { showToast('Add at least one product!', 'error'); return; }

  const editId = v('inv-edit-id');
  const { subtotal, discTotal, grand } = recalcInvSummary();
  const invNo = v('inv-no');

  const invData = {
    id: editId || uid(),
    invNo,
    date: v('inv-date') || today(),
    customer,
    phone: v('inv-phone'),
    addr: v('inv-addr'),
    ref: v('inv-ref'),
    payment: v('inv-payment'),
    items: JSON.parse(JSON.stringify(_invRows)),
    subtotal, discTotal,
    total: grand,
    quote: v('inv-quote'),
    status: 'Generated'
  };

  if (editId) {
    const idx = DB.invoices.findIndex(x => x.id === editId);
    if (idx !== -1) DB.invoices[idx] = invData;
    showToast('✅ Invoice updated!', 'success');
  } else {
    DB.invoices.push(invData);
    DB.invoiceCounter++;
    showToast('✅ Invoice generated!', 'success');
  }
  saveData();
  renderInvoiceHistory();
  generateInvoiceNumber();

  // Render preview
  const html = buildInvoiceHTML(invData);
  document.getElementById('invoice-preview-content').innerHTML = html;
  document.getElementById('invoice-preview-card').style.display = 'block';

  // Attach QR if UPI
  if ((invData.payment === 'UPI' || invData.payment === 'GPay') && DB.settings.bizUpi) {
    setTimeout(() => {
      const qrEl = document.getElementById('inv-qr-doc');
      if (qrEl && typeof QRCode !== 'undefined') {
        new QRCode(qrEl, { text: `upi://pay?pa=${DB.settings.bizUpi}&pn=${DB.settings.bizName}&am=${grand.toFixed(2)}`, width: 80, height: 80 });
      }
    }, 100);
  }

  document.getElementById('invoice-preview-card').scrollIntoView({ behavior: 'smooth' });
}

function downloadInvoicePDF() {
  const el = document.getElementById('inv-print');
  if (!el) { showToast('Preview invoice first!', 'error'); return; }
  const invNo = v('inv-no') || 'MT-invoice';

  // Try jsPDF
  if (window.jspdf) {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'mm', 'a4');
    doc.html(el, {
      callback: d => d.save(`${invNo}.pdf`),
      x: 5, y: 5, width: 200, windowWidth: 720,
      html2canvas: { scale: 0.8 }
    });
    showToast('📄 PDF downloading...', 'info');
  } else {
    // Fallback: open in print window
    const pw = window.open('', '_blank');
    pw.document.write(`<!DOCTYPE html><html><head><title>${invNo}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@700;800&family=Poppins:wght@400;500;600&display=swap" rel="stylesheet">
      <style>
        body{margin:0;padding:0;font-family:'Poppins',sans-serif;background:#fff}
        @media print{body{margin:0}}
        .inv-doc{background:#fff;color:#1a1a2e;padding:32px 36px;font-family:'Poppins',sans-serif;font-size:0.82rem;max-width:700px;margin:0 auto}
        .inv-doc-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px}
        .inv-doc-logo{font-family:'Baloo 2',cursive;font-size:1.8rem;font-weight:800;color:#1a0a2e;line-height:1}
        .inv-doc-logo span{display:block;font-size:0.72rem;font-weight:400;color:#666;font-family:'Poppins',sans-serif;margin-top:3px}
        .inv-badge{background:linear-gradient(135deg,#1a0a2e,#3a1a6e);color:#f7c948;padding:8px 18px;border-radius:6px;font-weight:700;font-size:1rem;text-align:right}
        .inv-badge small{display:block;font-size:0.68rem;color:#ccc;font-weight:400}
        hr{border:none;border-top:2px solid #e8dfff;margin:14px 0}
        .inv-meta-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px}
        .inv-meta-block strong{display:block;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.5px;color:#888;margin-bottom:3px}
        table{width:100%;border-collapse:collapse;margin-bottom:16px}
        th{background:#1a0a2e;color:#f7c948;padding:8px 10px;text-align:left;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.5px}
        td{padding:8px 10px;border-bottom:1px solid #ede8ff;font-size:0.82rem}
        tr:nth-child(even) td{background:#faf8ff}
        .inv-summary-box{display:flex;justify-content:flex-end;margin-bottom:16px}
        .inv-summary-inner{min-width:220px;background:#f5f0ff;border-radius:6px;padding:12px 16px}
        .inv-summary-row{display:flex;justify-content:space-between;font-size:0.82rem;margin-bottom:5px}
        .inv-summary-row.total{border-top:2px solid #ccc;padding-top:8px;margin-top:5px;font-size:0.95rem;font-weight:700}
        .inv-payment-row{display:flex;align-items:center;gap:14px;background:#f5f0ff;border-radius:6px;padding:10px 14px;margin-bottom:16px}
        .inv-quote-box{border-left:3px solid #f7c948;padding:8px 12px;background:#fffbf0;border-radius:0 6px 6px 0;font-style:italic;color:#555;font-size:0.8rem;margin-bottom:14px}
        .inv-footer{text-align:center;color:#aaa;font-size:0.7rem;margin-top:16px;padding-top:12px;border-top:1px solid #e8dfff}
        .row-total{font-weight:600}
      </style></head><body>${el.outerHTML}
      <script>window.onload=()=>{window.print();}<\/script></body></html>`);
    pw.document.close();
    showToast('🖨️ Print dialog opened', 'info');
  }
}

function shareInvoiceWhatsApp() {
  const customer = v('inv-customer') || 'Customer';
  const invNo = v('inv-no') || 'MT-XXXX';
  const phone = v('inv-phone') || '';
  const { grand } = recalcInvSummary();
  const msg = `Hello *${customer}*! 🙏\n\nInvoice from *Meenatchi Traders*\n\n📋 Invoice No: *${invNo}*\n📅 Date: ${formatDate(v('inv-date') || today())}\n💰 Grand Total: *₹${grand.toFixed(2)}*\n💳 Payment: ${v('inv-payment')}\n\n${v('inv-quote') || 'Thank you for your business!'}\n\n_Meenatchi Traders_`;
  const ph = phone.replace(/\D/g, '');
  window.open(`https://wa.me/${ph ? (ph.startsWith('91') ? ph : '91' + ph) : ''}?text=${encodeURIComponent(msg)}`, '_blank');
}

function clearInvoiceForm() {
  set2('inv-edit-id', '');
  set2('inv-customer', '');
  set2('inv-phone', '');
  set2('inv-ref', '');
  set2('inv-addr', '');
  set2('inv-quote', 'Thank you for supporting local business! Your trust means the world to us. 🙏');
  const pm = document.getElementById('inv-payment');
  if (pm) pm.selectedIndex = 0;
  _invRows = [];
  renderInvRows();
  generateInvoiceNumber();
  const badge = document.getElementById('inv-edit-badge');
  if (badge) badge.style.display = 'none';
  const preview = document.getElementById('invoice-preview-card');
  if (preview) preview.style.display = 'none';
  const upiPrev = document.getElementById('inv-upi-preview');
  if (upiPrev) upiPrev.style.display = 'none';
  setDefaultDates();
}

function prefillInvoiceFromSale(s) {
  clearInvoiceForm();
  set2('inv-customer', s.customer);
  set2('inv-date', s.date);
  const c = DB.customers.find(x => x.name.toLowerCase() === s.customer.toLowerCase());
  if (c) { set2('inv-phone', c.phone); set2('inv-addr', c.addr || ''); }
  const pm = document.getElementById('inv-payment');
  if (pm) pm.value = s.payment || 'Cash';
  // Add product as first row
  const prod = DB.products.find(p => p.name === s.product);
  addInvRow({
    name: s.product,
    mrp: prod ? prod.sellPrice : s.price,
    sell: s.price,
    disc: s.disc || 0,
    qty: s.qty,
    total: s.total
  });
  generateInvoiceNumber();
}

function renderInvoiceHistory() {
  const tbody = document.getElementById('inv-history-tbody');
  if (!tbody) return;
  if (!DB.invoices.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><i class="fas fa-file-invoice"></i><p>No invoices yet. Create your first invoice!</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = [...DB.invoices].reverse().map(inv => {
    const itemCount = (inv.items || []).length;
    return `<tr>
      <td class="highlight" style="font-family:'Baloo 2',cursive">${inv.invNo}</td>
      <td>${formatDate(inv.date)}</td>
      <td><strong>${inv.customer}</strong><br><span class="text-dim" style="font-size:0.7rem">${inv.phone || ''}</span></td>
      <td>${inv.ref ? '<span style="color:var(--accent4)">' + inv.ref + '</span>' : '—'}</td>
      <td><span class="badge" style="background:rgba(162,155,254,0.1);color:var(--accent4)">${itemCount} item${itemCount !== 1 ? 's' : ''}</span></td>
      <td class="text-green"><strong>${formatCurrency(inv.total)}</strong></td>
      <td><span class="badge" style="background:rgba(78,205,196,0.1);color:var(--accent3)">${inv.payment}</span></td>
      <td>
        <div style="display:flex;gap:4px;flex-wrap:nowrap">
          <button class="btn btn-secondary btn-sm" title="Edit" onclick="editInvoice('${inv.id}')"><i class="fas fa-pen"></i></button>
          <button class="btn btn-secondary btn-sm" title="Duplicate" onclick="duplicateInvoice('${inv.id}')"><i class="fas fa-copy"></i></button>
          <button class="wa-btn" style="padding:4px 8px;font-size:0.72rem" title="WhatsApp" onclick="resendInvoiceWA('${inv.id}')"><i class="fab fa-whatsapp"></i></button>
          <button class="btn btn-danger btn-sm" title="Delete" onclick="deleteInvoice('${inv.id}')"><i class="fas fa-trash"></i></button>
        </div>
      </td>
    </tr>`;
  }).join('');
}

function editInvoice(id) {
  const inv = DB.invoices.find(x => x.id === id);
  if (!inv) return;
  switchTab('invoices', 'create');
  set2('inv-edit-id', inv.id);
  set2('inv-no', inv.invNo);
  set2('inv-date', inv.date);
  set2('inv-customer', inv.customer);
  set2('inv-phone', inv.phone || '');
  set2('inv-ref', inv.ref || '');
  set2('inv-addr', inv.addr || '');
  set2('inv-quote', inv.quote || '');
  const pm = document.getElementById('inv-payment');
  if (pm) pm.value = inv.payment || 'Cash';
  // Load items
  _invRows = (inv.items || []).map(r => ({ ...r, id: r.id || uid() }));
  renderInvRows();
  // Show badge
  const badge = document.getElementById('inv-edit-badge');
  if (badge) badge.style.display = 'inline-block';
  document.getElementById('page-invoices').scrollIntoView({ behavior: 'smooth' });
  showToast('✏️ Invoice loaded for editing', 'info');
}

function duplicateInvoice(id) {
  const orig = DB.invoices.find(x => x.id === id);
  if (!orig) return;
  const dup = {
    ...JSON.parse(JSON.stringify(orig)),
    id: uid(),
    invNo: 'MT-' + String(DB.invoiceCounter).padStart(4, '0'),
    date: today(),
    status: 'Generated'
  };
  dup.items = dup.items.map(r => ({ ...r, id: uid() }));
  DB.invoices.push(dup);
  DB.invoiceCounter++;
  saveData();
  renderInvoiceHistory();
  showToast('✅ Invoice duplicated!', 'success');
}

function resendInvoiceWA(id) {
  const inv = DB.invoices.find(x => x.id === id);
  if (!inv) return;
  const ph = (inv.phone || '').replace(/\D/g, '');
  const msg = `Hello *${inv.customer}*! 🙏\nInvoice *${inv.invNo}* from Meenatchi Traders.\n💰 Total: *₹${(inv.total || 0).toFixed(2)}*\nPayment: ${inv.payment}\n${inv.quote || 'Thank you for your business!'}`;
  window.open(`https://wa.me/${ph ? (ph.startsWith('91') ? ph : '91' + ph) : ''}?text=${encodeURIComponent(msg)}`, '_blank');
}

function deleteInvoice(id) {
  if (!confirm('Delete this invoice permanently?')) return;
  DB.invoices = DB.invoices.filter(x => x.id !== id);
  saveData();
  renderInvoiceHistory();
  showToast('Invoice deleted', 'info');
}

// ─── WHATSAPP REMINDERS ───────────────────────────────
const TEMPLATES = {
  pending: (name, amount) => `Hello ${name}, this is a reminder from Meenatchi Traders. Your pending amount is ₹${amount}. Kindly clear the payment. Thank you! 🙏`,
  order: (name) => `Hello ${name}, your order from Meenatchi Traders is ready for delivery! 📦 Please contact us to arrange delivery. Thank you!`,
  custom: () => ''
};

function fillTemplate() {
  const t = v('wa-template');
  const name = v('wa-name') || '[Customer Name]';
  const amount = v('wa-amount') || '[Amount]';
  const msg = TEMPLATES[t] ? TEMPLATES[t](name, amount) : '';
  set2('wa-message', msg);
}

function sendWhatsApp() {
  const phone = v('wa-phone').replace(/\D/g, '');
  const msg = v('wa-message');
  if (!msg.trim()) { showToast('Message required!', 'error'); return; }
  window.open(`https://wa.me/${phone.startsWith('91') ? phone : '91'+phone}?text=${encodeURIComponent(msg)}`, '_blank');
}

function copyMessage() {
  const msg = v('wa-message');
  navigator.clipboard.writeText(msg).then(() => showToast('Copied!', 'success'));
}

function renderReminders() {
  // Bulk remind table
  const tbody = document.getElementById('bulk-remind-tbody');
  if (tbody) {
    const pending = DB.customers.filter(c => c.pending > 0);
    tbody.innerHTML = pending.length ? pending.map(c => {
      const days = Math.floor((new Date() - new Date(c.date || today())) / 86400000);
      return `<tr>
        <td>${c.name}</td>
        <td class="text-red">${formatCurrency(c.pending)}</td>
        <td>${days}d</td>
        <td><button class="wa-btn" style="padding:4px 10px;font-size:0.75rem" onclick="quickRemind('${c.id}')"><i class="fab fa-whatsapp"></i> Send</button></td>
      </tr>`;
    }).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--green);padding:20px">🎉 No pending payments!</td></tr>';
  }

  // Templates list
  const tl = document.getElementById('templates-list');
  if (tl) {
    tl.innerHTML = [
      { title: '💰 Pending Payment', msg: TEMPLATES.pending('[Customer]', '[Amount]') },
      { title: '📦 Order Ready', msg: TEMPLATES.order('[Customer]') },
    ].map(t => `<div class="card" style="margin:0">
      <strong style="font-size:0.85rem">${t.title}</strong>
      <p style="font-size:0.8rem;color:var(--text-dim);margin-top:8px;line-height:1.6">${t.msg}</p>
      <button class="btn btn-secondary btn-sm" style="margin-top:10px" onclick="useTemplate(\`${t.msg}\`)"><i class="fas fa-copy"></i> Use Template</button>
    </div>`).join('');
  }
}

function sendAllReminders() {
  const pending = DB.customers.filter(c => c.pending > 0);
  if (!pending.length) { showToast('No pending payments!', 'info'); return; }
  showToast(`Opening WhatsApp for ${pending.length} customers...`, 'info');
  pending.forEach((c, i) => {
    setTimeout(() => quickRemind(c.id), i * 1500);
  });
}

function useTemplate(msg) {
  set2('wa-message', msg);
  showPage('reminders', null);
}

// ─── TEA SHOP ─────────────────────────────────────────
function calcTeaProfit() {
  const cups = +v('ts-cups-count') || 0;
  const sellPrice = +v('ts-sell-price') || 10;
  const milk = +v('ts-milk') || 0;
  const sugar = +v('ts-sugar') || 0;
  const powder = +v('ts-powder') || 0;
  const gas = +v('ts-gas') || 0;
  const other = +v('ts-other-exp') || 0;

  const milkRate = +v('milk-rate') || 60;
  const sugarRate = +v('sugar-rate') || 45;
  const powderRate = +v('powder-rate') || 400;

  const milkCost = (milk / 1000) * milkRate;
  const sugarCost = (sugar / 1000) * sugarRate;
  const powderCost = (powder / 1000) * powderRate;
  const totalIngredients = milkCost + sugarCost + powderCost + gas + other;
  const cpu = cups ? totalIngredients / cups : 0;
  const income = cups * sellPrice;
  const profit = income - totalIngredients;
  const ppc = cups ? profit / cups : 0;

  set2('ts-cpu', cpu.toFixed(2));
  set2('ts-ppc', ppc.toFixed(2));
  set2('ts-total-income', income.toFixed(2));
  set2('ts-daily-profit', profit.toFixed(2));
}

function saveTeaEntry() {
  const cups = +v('ts-cups-count') || 0;
  if (!cups) { showToast('Enter cups sold!', 'error'); return; }
  const income = +v('ts-total-income') || 0;
  const expense = income - (+v('ts-daily-profit') || 0);
  const entry = {
    id: uid(), date: v('ts-date') || today(),
    cups, sellPrice: +v('ts-sell-price') || 10,
    milk: +v('ts-milk') || 0, sugar: +v('ts-sugar') || 0,
    powder: +v('ts-powder') || 0, gas: +v('ts-gas') || 0,
    income, expense, profit: +v('ts-daily-profit') || 0,
    cpu: +v('ts-cpu') || 0, notes: v('ts-notes'), time: new Date().toTimeString().substr(0,5)
  };
  DB.teaEntries.push(entry);
  saveData();
  renderTeaShop();
  showToast('✅ Tea entry saved!', 'success');
  clearTeaForm();
}

function renderTeaShop() {
  const t = today();
  const todayEntries = DB.teaEntries.filter(e => e.date === t);
  const totalCups = todayEntries.reduce((a, e) => a + e.cups, 0);
  const totalIncome = todayEntries.reduce((a, e) => a + e.income, 0);
  const totalExpense = todayEntries.reduce((a, e) => a + e.expense, 0);
  const totalProfit = todayEntries.reduce((a, e) => a + e.profit, 0);

  set('ts-cups', totalCups);
  set('ts-income', formatCurrency(totalIncome));
  set('ts-expense', formatCurrency(totalExpense));
  set('ts-profit', formatCurrency(totalProfit));

  const ordersTbody = document.getElementById('tea-orders-tbody');
  if (ordersTbody) {
    ordersTbody.innerHTML = todayEntries.length ? todayEntries.map(e => `<tr>
      <td>${e.time}</td><td>${e.cups}</td><td>${formatCurrency(e.income)}</td><td class="text-green">${formatCurrency(e.profit)}</td><td>${e.notes||'—'}</td>
    </tr>`).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:20px">No entries today</td></tr>';
  }

  const histTbody = document.getElementById('tea-history-tbody');
  if (histTbody) {
    histTbody.innerHTML = [...DB.teaEntries].reverse().slice(0, 30).map(e => `<tr>
      <td>${formatDate(e.date)}</td><td>${e.cups}</td><td>${formatCurrency(e.income)}</td><td>${formatCurrency(e.expense)}</td>
      <td class="text-green">${formatCurrency(e.profit)}</td><td>${e.milk}</td><td>${e.sugar}</td>
    </tr>`).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:20px">No entries yet</td></tr>';
  }
}

function clearTeaForm() {
  ['ts-cups-count','ts-milk','ts-sugar','ts-powder','ts-gas','ts-other-exp','ts-cpu','ts-ppc','ts-total-income','ts-daily-profit','ts-notes'].forEach(id => set2(id, ''));
  set2('ts-sell-price', 10);
}

// ─── TUITION ──────────────────────────────────────────
function calcStudentPending() {
  const fees = +v('st-fees') || 0;
  const paid = +v('st-paid') || 0;
  const scholar = +v('st-scholar') || 0;
  set2('st-pending', Math.max(fees - paid - scholar, 0));
}

function saveStudent() {
  const name = v('st-name');
  if (!name.trim()) { showToast('Student name required!', 'error'); return; }
  const fees = +v('st-fees') || 0;
  const paid = +v('st-paid') || 0;
  const scholar = +v('st-scholar') || 0;
  const student = {
    id: uid(), name, class: v('st-class'), phone: v('st-phone'),
    fees, paid, pending: Math.max(fees - paid - scholar, 0),
    scholar, joinDate: v('st-join') || today()
  };
  DB.students.push(student);
  saveData();
  renderTuition();
  showToast('✅ Student added!', 'success');
  clearStudentForm();
  switchTab('tuition', 'students');
}

function saveStaff() {
  const name = v('sf-name');
  if (!name.trim()) { showToast('Staff name required!', 'error'); return; }
  const sf = {
    id: uid(), name, subject: v('sf-subject'), class: v('sf-class'),
    salary: +v('sf-salary') || 0, paid: +v('sf-paid') || 0,
    payDate: v('sf-paydate'), phone: v('sf-phone')
  };
  DB.staff.push(sf);
  saveData();
  renderTuition();
  showToast('✅ Staff added!', 'success');
  clearStaffForm();
  switchTab('tuition', 'staff');
}

function renderTuition() {
  const totalFees = DB.students.reduce((a, s) => a + s.fees, 0);
  const totalPaid = DB.students.reduce((a, s) => a + s.paid, 0);
  const totalPending = DB.students.reduce((a, s) => a + s.pending, 0);

  set('t-students', DB.students.length);
  set('t-fees', formatCurrency(totalFees));
  set('t-pending', formatCurrency(totalPending));
  set('t-staff', DB.staff.length);

  const stBody = document.getElementById('student-tbody');
  if (stBody) {
    stBody.innerHTML = DB.students.length ? DB.students.map(s => `<tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.class}</td>
      <td><a href="tel:${s.phone}" style="color:var(--accent4)">${s.phone}</a></td>
      <td>${formatCurrency(s.fees)}</td>
      <td class="text-green">${formatCurrency(s.paid)}</td>
      <td class="${s.pending > 0 ? 'text-red' : 'text-green'}">${formatCurrency(s.pending)}</td>
      <td>
        ${s.pending > 0 ? `<button class="wa-btn" style="padding:3px 8px;font-size:0.7rem" onclick="remindStudent('${s.id}')"><i class="fab fa-whatsapp"></i></button>` : ''}
        <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')"><i class="fas fa-trash"></i></button>
      </td>
    </tr>`).join('') : '<tr><td colspan="7"><div class="empty-state"><i class="fas fa-user-graduate"></i><p>No students yet</p></div></td></tr>';
  }

  const sfBody = document.getElementById('staff-tbody');
  if (sfBody) {
    sfBody.innerHTML = DB.staff.length ? DB.staff.map(s => `<tr>
      <td><strong>${s.name}</strong></td>
      <td>${s.subject}</td>
      <td>${s.class}</td>
      <td>${formatCurrency(s.salary)}</td>
      <td class="text-green">${formatCurrency(s.paid)}</td>
      <td><button class="btn btn-danger btn-sm" onclick="deleteStaff('${s.id}')"><i class="fas fa-trash"></i></button></td>
    </tr>`).join('') : '<tr><td colspan="6"><div class="empty-state"><i class="fas fa-chalkboard-teacher"></i><p>No staff added</p></div></td></tr>';
  }
}

function remindStudent(id) {
  const s = DB.students.find(x => x.id === id);
  if (!s) return;
  const msg = `Hello! Fees reminder from Meenatchi Tuition for ${s.name} (Class ${s.class}). Pending: ₹${s.pending}. Kindly clear the fees. Thank you!`;
  const ph = s.phone.replace(/\D/g, '');
  window.open(`https://wa.me/${ph.startsWith('91') ? ph : '91'+ph}?text=${encodeURIComponent(msg)}`, '_blank');
}

function deleteStudent(id) { DB.students = DB.students.filter(x => x.id !== id); saveData(); renderTuition(); showToast('Student deleted', 'info'); }
function deleteStaff(id) { DB.staff = DB.staff.filter(x => x.id !== id); saveData(); renderTuition(); showToast('Staff deleted', 'info'); }
function clearStudentForm() { ['st-name','st-phone','st-fees','st-paid','st-pending','st-scholar'].forEach(id => set2(id,'')); }
function clearStaffForm() { ['sf-name','sf-subject','sf-class','sf-salary','sf-paid','sf-phone'].forEach(id => set2(id,'')); }

// ─── ORDERS ───────────────────────────────────────────
function renderOrders() {
  const statusCounts = { Pending: 0, Processing: 0, Ready: 0, Delivered: 0, Cancelled: 0 };
  DB.sales.forEach(s => { if (statusCounts[s.status] !== undefined) statusCounts[s.status]++; });

  Object.entries(statusCounts).forEach(([k, v]) => {
    const el = document.getElementById('ord-' + k.toLowerCase());
    if (el) el.textContent = v;
  });

  const tbody = document.getElementById('orders-tbody');
  if (!tbody) return;
  tbody.innerHTML = [...DB.sales].reverse().map((s, i) => `<tr>
    <td class="highlight">#${String(DB.sales.length - i).padStart(4,'0')}</td>
    <td>${formatDate(s.date)}</td>
    <td>${s.customer}</td>
    <td>${(s.product||'').substr(0,16)}</td>
    <td>${s.qty}</td>
    <td>${formatCurrency(s.total)}</td>
    <td><span class="badge badge-${(s.status||'pending').toLowerCase()}">${s.status}</span></td>
    <td>
      <select onchange="updateOrderStatus('${s.id}',this.value)" style="background:rgba(255,255,255,0.05);border:1px solid var(--border);border-radius:4px;padding:4px 8px;color:var(--text);font-size:0.75rem">
        ${['Pending','Processing','Ready','Delivered','Cancelled'].map(st => `<option ${s.status===st?'selected':''}>${st}</option>`).join('')}
      </select>
    </td>
  </tr>`).join('') || '<tr><td colspan="8"><div class="empty-state"><i class="fas fa-truck"></i><p>No orders yet</p></div></td></tr>';
}

function updateOrderStatus(id, newStatus) {
  const sale = DB.sales.find(s => s.id === id);
  if (sale) {
    sale.status = newStatus;
    const cust = DB.customers.find(c => c.name.toLowerCase() === sale.customer.toLowerCase());
    if (cust) cust.status = newStatus;
    saveData();
    renderOrders();
    renderCustomerTable();
    if (newStatus === 'Ready') {
      const c = DB.customers.find(cc => cc.name.toLowerCase() === sale.customer.toLowerCase());
      if (c && c.phone) {
        const msg = TEMPLATES.order(c.name);
        showToast(`Order ready! Click to notify ${c.name}`, 'info');
      }
    }
    showToast(`Order status: ${newStatus}`, 'success');
  }
}

function filterOrders() {
  const filter = v('order-filter');
  const rows = document.querySelectorAll('#orders-tbody tr');
  rows.forEach(r => {
    if (!filter) { r.style.display = ''; return; }
    r.style.display = r.textContent.includes(filter) ? '' : 'none';
  });
}

// ─── REPORTS ──────────────────────────────────────────
function generateReport(type) {
  const date = v('rpt-date');
  const week = v('rpt-week');
  const month = v('rpt-month');

  if (type === 'daily') {
    const ds = DB.sales.filter(s => s.date === date);
    const te = DB.teaEntries.filter(e => e.date === date);
    const content = document.getElementById('daily-report-content');
    if (!content) return;
    const income = ds.reduce((a,s) => a + s.total, 0);
    const profit = ds.reduce((a,s) => a + s.profit, 0);
    const teaProfit = te.reduce((a,e) => a + e.profit, 0);
    content.innerHTML = `
      <div class="card-header"><span class="card-title">Daily Report — ${formatDate(date)}</span><button class="btn btn-secondary btn-sm" onclick="printReport('daily-report-content')"><i class="fas fa-print"></i> Print</button></div>
      <div class="quick-stats">
        <div class="quick-stat"><div class="qs-val">${ds.length}</div><div class="qs-label">Sales Orders</div></div>
        <div class="quick-stat"><div class="qs-val">${formatCurrency(income)}</div><div class="qs-label">Total Income</div></div>
        <div class="quick-stat"><div class="qs-val" style="color:var(--green)">${formatCurrency(profit + teaProfit)}</div><div class="qs-label">Total Profit</div></div>
        <div class="quick-stat"><div class="qs-val">${te.reduce((a,e) => a+e.cups, 0)}</div><div class="qs-label">Tea Cups</div></div>
      </div>
      <div class="table-wrap"><table>
        <thead><tr><th>Customer</th><th>Product</th><th>Qty</th><th>Total</th><th>Profit</th><th>Mode</th></tr></thead>
        <tbody>${ds.length ? ds.map(s => `<tr><td>${s.customer}</td><td>${s.product}</td><td>${s.qty}</td><td>${formatCurrency(s.total)}</td><td class="text-green">${formatCurrency(s.profit)}</td><td>${s.payment}</td></tr>`).join('') : '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:16px">No sales on this date</td></tr>'}</tbody>
      </table></div>`;
  } else if (type === 'monthly') {
    const ms = DB.sales.filter(s => s.date && s.date.startsWith(month));
    const content = document.getElementById('monthly-report-content');
    if (!content) return;
    const income = ms.reduce((a,s) => a+s.total, 0);
    const profit = ms.reduce((a,s) => a+s.profit, 0);
    const pending = ms.reduce((a,s) => a+s.pending, 0);
    content.innerHTML = `
      <div class="card-header"><span class="card-title">Monthly Report — ${month}</span><button class="btn btn-secondary btn-sm" onclick="printReport('monthly-report-content')"><i class="fas fa-print"></i> Print</button></div>
      <div class="quick-stats">
        <div class="quick-stat"><div class="qs-val">${ms.length}</div><div class="qs-label">Orders</div></div>
        <div class="quick-stat"><div class="qs-val">${formatCurrency(income)}</div><div class="qs-label">Income</div></div>
        <div class="quick-stat"><div class="qs-val" style="color:var(--green)">${formatCurrency(profit)}</div><div class="qs-label">Profit</div></div>
        <div class="quick-stat"><div class="qs-val" style="color:var(--red)">${formatCurrency(pending)}</div><div class="qs-label">Pending</div></div>
      </div>`;
  }
}

function generateProductReport() {
  const el = document.getElementById('product-report-content');
  if (!el) return;
  el.innerHTML = `
    <div class="card-header"><span class="card-title">📦 Product Profit Report</span><button class="btn btn-secondary btn-sm" onclick="exportTableCSV('prod-report-table','product_report')"><i class="fas fa-download"></i> Export</button></div>
    <div class="table-wrap"><table id="prod-report-table">
      <thead><tr><th>Product</th><th>Sold Qty</th><th>Revenue</th><th>Profit/Unit</th><th>Total Profit</th><th>Stock Left</th></tr></thead>
      <tbody>${DB.products.map(p => {
        const rev = (p.sold || 0) * p.sellPrice;
        const totalProfit = (p.sold || 0) * p.profitPerUnit;
        return `<tr><td>${p.name}</td><td>${p.sold || 0}</td><td>${formatCurrency(rev)}</td><td>${formatCurrency(p.profitPerUnit)}</td><td class="text-green">${formatCurrency(totalProfit)}</td><td>${p.balance}</td></tr>`;
      }).join('') || '<tr><td colspan="6" style="text-align:center;padding:16px;color:var(--text-dim)">No products</td></tr>'}</tbody>
    </table></div>`;
}

function generateCustomerPendingReport() {
  const el = document.getElementById('customer-pending-report');
  if (!el) return;
  const pending = DB.customers.filter(c => c.pending > 0);
  const total = pending.reduce((a,c) => a+c.pending, 0);
  el.innerHTML = `
    <div class="card-header"><span class="card-title">👥 Customer Pending Report</span><span style="color:var(--red);font-size:0.85rem">Total: ${formatCurrency(total)}</span></div>
    <div class="table-wrap"><table>
      <thead><tr><th>Customer</th><th>Phone</th><th>Product</th><th>Total</th><th>Paid</th><th>Pending</th><th>WhatsApp</th></tr></thead>
      <tbody>${pending.length ? pending.map(c => `<tr>
        <td>${c.name}</td><td>${c.phone}</td><td>${c.product||'—'}</td><td>${formatCurrency(c.total)}</td>
        <td class="text-green">${formatCurrency(c.paid)}</td><td class="text-red"><strong>${formatCurrency(c.pending)}</strong></td>
        <td><button class="wa-btn" style="padding:3px 8px;font-size:0.7rem" onclick="quickRemind('${c.id}')"><i class="fab fa-whatsapp"></i> Remind</button></td>
      </tr>`).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--green);padding:16px">🎉 All payments cleared!</td></tr>'}</tbody>
    </table></div>`;
}

function generateTuitionReport() {
  const el = document.getElementById('tuition-report-content');
  if (!el) return;
  const totalFees = DB.students.reduce((a,s) => a+s.fees, 0);
  const totalPaid = DB.students.reduce((a,s) => a+s.paid, 0);
  const totalPending = DB.students.reduce((a,s) => a+s.pending, 0);
  const totalSalary = DB.staff.reduce((a,s) => a+s.salary, 0);
  const netProfit = totalPaid - totalSalary;
  el.innerHTML = `
    <div class="card-header"><span class="card-title">🎓 Tuition Income Report</span></div>
    <div class="quick-stats">
      <div class="quick-stat"><div class="qs-val">${DB.students.length}</div><div class="qs-label">Students</div></div>
      <div class="quick-stat"><div class="qs-val">${formatCurrency(totalFees)}</div><div class="qs-label">Total Fees</div></div>
      <div class="quick-stat"><div class="qs-val" style="color:var(--green)">${formatCurrency(totalPaid)}</div><div class="qs-label">Collected</div></div>
      <div class="quick-stat"><div class="qs-val" style="color:var(--red)">${formatCurrency(totalPending)}</div><div class="qs-label">Pending</div></div>
      <div class="quick-stat"><div class="qs-val">${formatCurrency(totalSalary)}</div><div class="qs-label">Salaries</div></div>
      <div class="quick-stat"><div class="qs-val" style="color:var(--accent)">${formatCurrency(netProfit)}</div><div class="qs-label">Net Profit</div></div>
    </div>`;
}

function printReport(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const printW = window.open('', '_blank');
  printW.document.write(`<html><head><title>Report — Meenatchi Traders</title><style>body{font-family:Arial;padding:20px}table{width:100%;border-collapse:collapse}th,td{border:1px solid #ccc;padding:8px;text-align:left}th{background:#f0f0f0}</style></head><body><h2>Meenatchi Traders</h2>${el.innerHTML}</body></html>`);
  printW.print();
}

// ─── SETTINGS ─────────────────────────────────────────
function loadSettings() {
  if (DB.settings.bizName) set2('biz-name', DB.settings.bizName);
  if (DB.settings.bizOwner) set2('biz-owner', DB.settings.bizOwner);
  if (DB.settings.bizPhone) set2('biz-phone', DB.settings.bizPhone);
  if (DB.settings.bizAddr) set2('biz-addr', DB.settings.bizAddr);
  if (DB.settings.bizGstin) set2('biz-gstin', DB.settings.bizGstin);
  if (DB.settings.bizUpi) set2('biz-upi', DB.settings.bizUpi);
  if (DB.settings.sheetUrl) set2('sheet-url', DB.settings.sheetUrl);
  if (DB.settings.appsScriptUrl) set2('apps-script-url', DB.settings.appsScriptUrl);
}

function saveBizSettings() {
  DB.settings.bizName = v('biz-name');
  DB.settings.bizOwner = v('biz-owner');
  DB.settings.bizPhone = v('biz-phone');
  DB.settings.bizAddr = v('biz-addr');
  DB.settings.bizGstin = v('biz-gstin');
  DB.settings.bizUpi = v('biz-upi');
  saveData();
  showToast('✅ Business settings saved!', 'success');
}

function connectSheets() {
  const url = v('apps-script-url');
  const sheetUrl = v('sheet-url');
  if (!url) { showToast('Enter Apps Script URL!', 'error'); return; }
  DB.settings.appsScriptUrl = url;
  DB.settings.sheetUrl = sheetUrl;
  DB.settings.sheetTabs = v('sheet-tabs');
  saveData();

  const status = document.getElementById('sheets-status');
  status.innerHTML = '<div class="loading"><i class="fas fa-spinner spin"></i> Testing connection...</div>';

  fetch(url + '?action=test')
    .then(r => r.json())
    .then(data => {
      if (data.status === 'ok') {
        status.innerHTML = '<div class="alert alert-success"><i class="fas fa-check-circle"></i> Connected successfully! Google Sheets is linked.</div>';
        document.getElementById('sheets-banner').style.display = 'none';
        showToast('✅ Google Sheets connected!', 'success');
      } else {
        throw new Error(data.message || 'Connection failed');
      }
    })
    .catch(err => {
      status.innerHTML = `<div class="alert alert-warning"><i class="fas fa-exclamation-triangle"></i> Could not connect. Using local storage. Error: ${err.message}</div>`;
      showToast('⚠️ Using local storage (Google Sheets not connected)', 'info');
    });
}

function disconnectSheets() {
  DB.settings.appsScriptUrl = '';
  DB.settings.sheetUrl = '';
  saveData();
  document.getElementById('sheets-status').innerHTML = '<div class="alert alert-info"><i class="fas fa-info-circle"></i> Disconnected from Google Sheets. Using local storage.</div>';
  showToast('Disconnected from Google Sheets', 'info');
}

function checkSheetsConnection() {
  if (!DB.settings.appsScriptUrl) {
    document.getElementById('sheets-banner').style.display = 'flex';
  }
}

function exportAllData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `meenatchi_traders_backup_${today()}.json`;
  a.click();
  showToast('Data exported!', 'success');
}

function importData(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      DB = { ...DB, ...data };
      saveData();
      location.reload();
    } catch (err) {
      showToast('Invalid backup file!', 'error');
    }
  };
  reader.readAsText(file);
}

function clearAllData() {
  if (!confirm('⚠️ This will delete ALL local data! Are you sure?\n\nThis cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  showToast('All data cleared. Reloading...', 'info');
  setTimeout(() => location.reload(), 1500);
}

// ─── GOOGLE SHEETS SYNC ───────────────────────────────
function syncData() {
  if (!DB.settings.appsScriptUrl) {
    showToast('Connect Google Sheets first!', 'info');
    showPage('settings', null);
    return;
  }
  const icon = document.getElementById('sync-icon');
  icon.classList.add('fa-spin');
  showToast('Syncing with Google Sheets...', 'info');

  fetch(DB.settings.appsScriptUrl + '?action=sync', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sales: DB.sales, products: DB.products })
  })
    .then(r => r.json())
    .then(() => {
      icon.classList.remove('fa-spin');
      showToast('✅ Synced with Google Sheets!', 'success');
    })
    .catch(() => {
      icon.classList.remove('fa-spin');
      showToast('Sync failed — saved locally', 'error');
    });
}

function syncSaleToSheet(sale) {
  if (!DB.settings.appsScriptUrl) return;
  fetch(DB.settings.appsScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'addSale', sale })
  }).catch(() => {});
}

// ─── HELPERS ──────────────────────────────────────────
function v(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function set(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function set2(id, val) { const el = document.getElementById(id); if (el) el.value = val; }

function populateProductDropdowns() {
  const dropdowns = ['s-product', 'inv-product', 'c-product'];
  dropdowns.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const current = el.value;
    el.innerHTML = `<option value="">Select Product</option>` + DB.products.map(p => `<option value="${p.name}">${p.name} (${p.balance} left)</option>`).join('');
    if (current) el.value = current;
  });
}

function populateCustomerDatalist() {
  ['customer-list', 'customer-list2'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = DB.customers.map(c => `<option value="${c.name}">`).join('');
  });
}

function filterTable(tableId, query) {
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  const q = query.toLowerCase();
  rows.forEach(r => { r.style.display = r.textContent.toLowerCase().includes(q) ? '' : 'none'; });
}

function filterByCol(tableId, value, col) {
  const rows = document.querySelectorAll(`#${tableId} tbody tr`);
  rows.forEach(r => {
    if (!value) { r.style.display = ''; return; }
    r.style.display = (r.cells[col]?.textContent || '').includes(value) ? '' : 'none';
  });
}

function exportTableCSV(tableId, filename) {
  const table = document.getElementById(tableId);
  if (!table) return;
  let csv = [];
  for (const row of table.rows) {
    const cells = Array.from(row.cells).map(c => `"${c.textContent.trim().replace(/"/g, '""')}"`);
    csv.push(cells.join(','));
  }
  const blob = new Blob([csv.join('\n')], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${filename}_${today()}.csv`;
  a.click();
  showToast('CSV exported!', 'success');
}

// ─── MODALS ───────────────────────────────────────────
function showModal(title, content) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = content;
  document.getElementById('modal-overlay').classList.add('show');
}

function closeModal(e) {
  if (!e || e.target === document.getElementById('modal-overlay')) {
    document.getElementById('modal-overlay').classList.remove('show');
  }
}

// ─── TOAST ────────────────────────────────────────────
function showToast(msg, type = 'info') {
  const icons = { success: 'fa-check-circle', error: 'fa-times-circle', info: 'fa-info-circle' };
  const container = document.getElementById('toast');
  const toast = document.createElement('div');
  toast.className = `toast-item ${type}`;
  toast.innerHTML = `<i class="fas ${icons[type] || icons.info}"></i>${msg}`;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ─── PWA ──────────────────────────────────────────────
let deferredPrompt;

function initPWA() {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById('pwa-install-btn');
    if (btn) btn.style.display = 'inline-flex';
  });
}

function installPWA() {
  if (!deferredPrompt) { showToast('Use browser menu to install', 'info'); return; }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then((result) => {
    if (result.outcome === 'accepted') showToast('App installed!', 'success');
    deferredPrompt = null;
  });
}

// ─── SERVICE WORKER ───────────────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('SW registered'))
      .catch(err => console.warn('SW error:', err));
  });
}
