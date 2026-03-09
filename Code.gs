// ═══════════════════════════════════════════════════════
//  GOOGLE APPS SCRIPT BACKEND — Code.gs
//  Meenatchi Traders Business Manager
//  Version 2.0 — Full Auto-Sync All Modules
//
//  SETUP INSTRUCTIONS:
//  1. Open your Google Sheet
//  2. Go to Extensions → Apps Script
//  3. Delete all existing code, paste this entire file
//  4. Save (Ctrl+S)
//  5. Click Deploy → New Deployment
//     - Type: Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  6. Click Deploy → Copy the Web App URL
//  7. Paste URL into the app → Settings → Apps Script URL
//  8. Click "Connect & Test" — you'll see green ✅
//
//  ALL SHEETS ARE AUTO-CREATED — no manual setup needed!
// ═══════════════════════════════════════════════════════

// ─── CORS HEADERS ─────────────────────────────────────
function setCorsHeaders(output) {
  return output
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── MAIN GET ROUTER ──────────────────────────────────
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'test';
  let result;

  try {
    switch (action) {
      case 'test':
        result = {
          status: 'ok',
          message: '✅ Meenatchi Traders connected!',
          version: '2.0',
          timestamp: new Date().toISOString(),
          sheets: getAllSheetNames()
        };
        break;
      case 'getAll':
        result = getAllData();
        break;
      case 'getSales':
        result = { status: 'ok', data: readSheet('APP_SALES') };
        break;
      case 'getProducts':
        result = { status: 'ok', data: readSheet('APP_PRODUCTS') };
        break;
      case 'getCustomers':
        result = { status: 'ok', data: readSheet('APP_CUSTOMERS') };
        break;
      case 'getInvoices':
        result = { status: 'ok', data: readSheet('APP_INVOICES') };
        break;
      case 'getStudents':
        result = { status: 'ok', data: readSheet('APP_STUDENTS') };
        break;
      case 'getStaff':
        result = { status: 'ok', data: readSheet('APP_STAFF') };
        break;
      case 'getTeaEntries':
        result = { status: 'ok', data: readSheet('APP_TEA') };
        break;
      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message, stack: err.stack };
  }

  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify(result))
  );
}

// ─── MAIN POST ROUTER ─────────────────────────────────
function doPost(e) {
  let result;
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      // ── Individual record actions ──
      case 'addSale':
        result = upsertRow('APP_SALES', HEADERS.sales, saleToRow(data.sale), data.sale.id);
        syncDailySalesSummary(data.sale);
        break;
      case 'addInvoice':
        result = upsertRow('APP_INVOICES', HEADERS.invoices, invoiceToRow(data.invoice), data.invoice.id);
        break;
      case 'addProduct':
        result = upsertRow('APP_PRODUCTS', HEADERS.products, productToRow(data.product), data.product.id);
        break;
      case 'addCustomer':
        result = upsertRow('APP_CUSTOMERS', HEADERS.customers, customerToRow(data.customer), data.customer.id);
        break;
      case 'updateCustomer':
        result = upsertRow('APP_CUSTOMERS', HEADERS.customers, customerToRow(data.customer), data.customer.id);
        break;
      case 'addTeaEntry':
        result = upsertRow('APP_TEA', HEADERS.tea, teaToRow(data.entry), data.entry.id);
        syncSellingTeaSheet(data.entry);
        break;
      case 'addStudent':
        result = upsertRow('APP_STUDENTS', HEADERS.students, studentToRow(data.student), data.student.id);
        break;
      case 'updateStudent':
        result = upsertRow('APP_STUDENTS', HEADERS.students, studentToRow(data.student), data.student.id);
        break;
      case 'addStaff':
        result = upsertRow('APP_STAFF', HEADERS.staff, staffToRow(data.staff), data.staff.id);
        break;
      case 'updateStaff':
        result = upsertRow('APP_STAFF', HEADERS.staff, staffToRow(data.staff), data.staff.id);
        break;

      // ── Full sync actions ──
      case 'syncAll':
        result = syncAll(data);
        break;
      case 'updateForecast':
        result = syncForecast(data);
        break;

      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }

  return setCorsHeaders(
    ContentService.createTextOutput(JSON.stringify(result))
  );
}

// ─── SHEET HEADERS ────────────────────────────────────
const HEADERS = {
  sales: [
    'ID', 'Date', 'Customer', 'Phone', 'Product', 'Items',
    'Qty', 'Price', 'Discount', 'Total', 'Received', 'Pending',
    'Payment', 'Status', 'Profit', 'Invoice No'
  ],
  invoices: [
    'ID', 'Invoice No', 'Date', 'Customer', 'Phone', 'Address',
    'Reference', 'Payment', 'Items', 'Subtotal', 'Discount Total',
    'Total', 'Status', 'Quote'
  ],
  products: [
    'ID', 'Name', 'Category', 'Buy Qty', 'Buy Price', 'Ship Cost',
    'Total Cost', 'Cost Per Unit', 'Sell Price', 'Profit Per Unit',
    'Stock', 'Sold', 'Balance', 'Alert At', 'Unit'
  ],
  customers: [
    'ID', 'Name', 'Phone', 'Address', 'Product', 'Payment Mode',
    'Total Bill', 'Paid', 'Pending', 'Status', 'Notes', 'Date', 'Last Sale'
  ],
  tea: [
    'ID', 'Date', 'Time', 'Cups', 'Sell Price', 'Milk Cost',
    'Sugar Cost', 'Powder Cost', 'Gas Cost', 'Income', 'Expense',
    'Profit', 'Notes'
  ],
  students: [
    'ID', 'Name', 'Class', 'Phone', 'Monthly Fees', 'Paid',
    'Pending', 'Scholarship', 'Join Date'
  ],
  staff: [
    'ID', 'Name', 'Subject', 'Class', 'Monthly Salary', 'Paid',
    'Salary Due', 'Last Pay Date', 'Phone'
  ],
  forecast: [
    'Product', 'Category', '7 Day Sales', '30 Day Sales',
    'Avg Daily Sales', 'Stock', 'Stock Days Left', 'Forecast Tomorrow', 'Unit'
  ],
  dailySummary: [
    'Date', 'Orders', 'Total Income', 'Total Received',
    'Total Pending', 'Total Profit', 'Products Sold'
  ]
};

// ─── ROW MAPPERS ──────────────────────────────────────
function saleToRow(s) {
  return [
    s.id, s.date, s.customer, s.phone || '',
    s.product, JSON.stringify(s.items || []),
    s.qty, s.price, s.disc || 0, s.total,
    s.received, s.pending, s.payment, s.status,
    s.profit || 0, s.invoiceNo || ''
  ];
}

function invoiceToRow(inv) {
  const itemsStr = (inv.items || []).map(i =>
    `${i.qty}x ${i.name} @ ₹${i.sell} = ₹${i.total}`
  ).join(' | ');
  return [
    inv.id, inv.invNo, inv.date, inv.customer, inv.phone || '',
    inv.addr || '', inv.ref || '', inv.payment || '',
    itemsStr, inv.subtotal, inv.discTotal || 0,
    inv.total, inv.status, inv.quote || ''
  ];
}

function productToRow(p) {
  return [
    p.id, p.name, p.category, p.buyQty, p.buyPrice, p.shipCost || 0,
    p.totalCost, p.cpu, p.sellPrice, p.profitPerUnit,
    p.stock, p.sold || 0, p.balance, p.alertAt, p.unit
  ];
}

function customerToRow(c) {
  return [
    c.id, c.name, c.phone || '', c.addr || '',
    c.product || '', c.payment || '',
    c.total || 0, c.paid || 0, c.pending || 0,
    c.status || '', c.notes || '', c.date || '', c.lastSale || ''
  ];
}

function teaToRow(t) {
  return [
    t.id, t.date, t.time || '', t.cups, t.sellPrice,
    t.milk || 0, t.sugar || 0, t.powder || 0, t.gas || 0,
    t.income, t.expense, t.profit, t.notes || ''
  ];
}

function studentToRow(s) {
  return [
    s.id, s.name, s.class, s.phone || '',
    s.fees, s.paid || 0, s.pending || 0, s.scholar || 0, s.joinDate || ''
  ];
}

function staffToRow(s) {
  const salaryDue = Math.max((s.salary || 0) - (s.paid || 0), 0);
  return [
    s.id, s.name, s.subject || '', s.class || '',
    s.salary, s.paid || 0, salaryDue, s.payDate || '', s.phone || ''
  ];
}

// ─── CORE SHEET UTILITIES ─────────────────────────────

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);

  if (!sheet) {
    sheet = ss.insertSheet(name);
    Logger.log('Created new sheet: ' + name);
  }

  // Always ensure headers exist on row 1
  if (headers && sheet.getLastRow() === 0) {
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    // Style headers
    headerRange
      .setBackground('#1a0a2e')
      .setFontColor('#f7c948')
      .setFontWeight('bold')
      .setFontSize(10);
    sheet.setFrozenRows(1);
    // Auto-resize columns
    for (let i = 1; i <= headers.length; i++) {
      sheet.setColumnWidth(i, 130);
    }
  }

  return sheet;
}

function readSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];

  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// Upsert: update existing row if ID matches, else append
function upsertRow(sheetName, headers, rowData, recordId) {
  const sheet = getOrCreateSheet(sheetName, headers);

  if (recordId) {
    const data = sheet.getDataRange().getValues();
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(recordId)) {
        sheet.getRange(i + 1, 1, 1, rowData.length).setValues([rowData]);
        return { status: 'ok', action: 'updated', sheet: sheetName };
      }
    }
  }

  sheet.appendRow(rowData);
  return { status: 'ok', action: 'inserted', sheet: sheetName };
}

// Full rewrite of a sheet (for syncAll)
function rewriteSheet(sheetName, headers, rows) {
  const sheet = getOrCreateSheet(sheetName, headers);

  // Clear data rows but keep header
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  }

  return rows.length;
}

function getAllSheetNames() {
  return SpreadsheetApp.getActiveSpreadsheet()
    .getSheets()
    .map(s => s.getName());
}

// ─── SYNC ALL (full database push) ────────────────────
function syncAll(payload) {
  const results = {};

  try {
    // SALES
    if (payload.sales) {
      const rows = payload.sales.map(saleToRow);
      results.sales = rewriteSheet('APP_SALES', HEADERS.sales, rows);
      rebuildDailySummary(payload.sales);
    }

    // INVOICES
    if (payload.invoices) {
      const rows = payload.invoices.map(invoiceToRow);
      results.invoices = rewriteSheet('APP_INVOICES', HEADERS.invoices, rows);
    }

    // PRODUCTS
    if (payload.products) {
      const rows = payload.products.map(productToRow);
      results.products = rewriteSheet('APP_PRODUCTS', HEADERS.products, rows);
    }

    // CUSTOMERS
    if (payload.customers) {
      const rows = payload.customers.map(customerToRow);
      results.customers = rewriteSheet('APP_CUSTOMERS', HEADERS.customers, rows);
    }

    // STUDENTS
    if (payload.students) {
      const rows = payload.students.map(studentToRow);
      results.students = rewriteSheet('APP_STUDENTS', HEADERS.students, rows);
    }

    // STAFF
    if (payload.staff) {
      const rows = payload.staff.map(staffToRow);
      results.staff = rewriteSheet('APP_STAFF', HEADERS.staff, rows);
    }

    // TEA ENTRIES
    if (payload.teaEntries) {
      const rows = payload.teaEntries.map(teaToRow);
      results.tea = rewriteSheet('APP_TEA', HEADERS.tea, rows);
    }

    return {
      status: 'ok',
      message: '✅ All data synced to Google Sheets!',
      counts: results,
      timestamp: new Date().toISOString()
    };
  } catch (e) {
    return { status: 'error', message: 'syncAll failed: ' + e.message };
  }
}

// ─── DAILY SUMMARY SHEET ──────────────────────────────
function syncDailySalesSummary(sale) {
  try {
    const sheet = getOrCreateSheet('DAILY SUMMARY', HEADERS.dailySummary);
    const data = sheet.getDataRange().getValues();
    const saleDate = String(sale.date || '').substring(0, 10);

    // Find existing row for this date
    let rowIndex = -1;
    for (let i = 1; i < data.length; i++) {
      if (String(data[i][0]).substring(0, 10) === saleDate) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex > 0) {
      // Update existing row
      const row = data[rowIndex - 1];
      const updated = [
        saleDate,
        (Number(row[1]) || 0) + 1,
        (Number(row[2]) || 0) + (sale.total || 0),
        (Number(row[3]) || 0) + (sale.received || 0),
        (Number(row[4]) || 0) + (sale.pending || 0),
        (Number(row[5]) || 0) + (sale.profit || 0),
        row[6] || ''
      ];
      sheet.getRange(rowIndex, 1, 1, updated.length).setValues([updated]);
    } else {
      // New date row
      sheet.appendRow([
        saleDate, 1, sale.total || 0,
        sale.received || 0, sale.pending || 0,
        sale.profit || 0, sale.product || ''
      ]);
    }
  } catch(e) {
    Logger.log('Daily summary error: ' + e.message);
  }
}

function rebuildDailySummary(sales) {
  // Build day-by-day summary from all sales
  const byDate = {};
  sales.forEach(s => {
    const d = String(s.date || '').substring(0, 10);
    if (!d) return;
    if (!byDate[d]) byDate[d] = { orders: 0, income: 0, received: 0, pending: 0, profit: 0, products: [] };
    byDate[d].orders++;
    byDate[d].income  += Number(s.total)    || 0;
    byDate[d].received+= Number(s.received) || 0;
    byDate[d].pending += Number(s.pending)  || 0;
    byDate[d].profit  += Number(s.profit)   || 0;
    if (s.product) byDate[d].products.push(s.product);
  });

  const rows = Object.keys(byDate).sort().map(d => {
    const v = byDate[d];
    return [d, v.orders, v.income, v.received, v.pending, v.profit, [...new Set(v.products)].join(', ')];
  });

  rewriteSheet('DAILY SUMMARY', HEADERS.dailySummary, rows);
}

// ─── FORECAST SHEET ───────────────────────────────────
function syncForecast(data) {
  try {
    const rows = (data.rows || []);
    rewriteSheet('SALES FORECAST', HEADERS.forecast, rows);

    // Add timestamp row
    const sheet = getOrCreateSheet('SALES FORECAST', HEADERS.forecast);
    const lastRow = sheet.getLastRow();
    sheet.getRange(lastRow + 2, 1).setValue('Last updated: ' + new Date().toLocaleString('en-IN'));

    return { status: 'ok', message: '✅ Forecast synced!' };
  } catch(e) {
    return { status: 'error', message: e.message };
  }
}

// ─── SELLING TEA MIRROR ───────────────────────────────
function syncSellingTeaSheet(entry) {
  try {
    const sheet = getOrCreateSheet('Selling TEA', ['Date', 'Cups', 'Income', 'Expense', 'Profit', 'Notes']);
    sheet.appendRow([entry.date, entry.cups, entry.income, entry.expense, entry.profit, entry.notes || '']);
  } catch(e) {
    Logger.log('Selling TEA sync error: ' + e.message);
  }
}

// ─── GET ALL DATA (for full restore) ──────────────────
function getAllData() {
  return {
    status: 'ok',
    data: {
      sales:      readSheet('APP_SALES'),
      invoices:   readSheet('APP_INVOICES'),
      products:   readSheet('APP_PRODUCTS'),
      customers:  readSheet('APP_CUSTOMERS'),
      students:   readSheet('APP_STUDENTS'),
      staff:      readSheet('APP_STAFF'),
      teaEntries: readSheet('APP_TEA')
    },
    timestamp: new Date().toISOString()
  };
}

// ─── DAILY EMAIL REPORT (optional trigger) ────────────
// To enable: Apps Script → Triggers → Add Trigger
// Function: sendDailyReport | Time-driven | Day timer | 9 PM
function sendDailyReport() {
  const today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
  const sales = readSheet('APP_SALES').filter(r => String(r['Date'] || '').startsWith(today));
  if (!sales.length) return;

  const income  = sales.reduce((a, r) => a + (Number(r['Total'])  || 0), 0);
  const profit  = sales.reduce((a, r) => a + (Number(r['Profit']) || 0), 0);
  const pending = sales.reduce((a, r) => a + (Number(r['Pending'])|| 0), 0);

  const body = [
    'Meenatchi Traders — Daily Report (' + today + ')',
    '═══════════════════════════════════════',
    'Orders  : ' + sales.length,
    'Income  : ₹' + income.toFixed(2),
    'Profit  : ₹' + profit.toFixed(2),
    'Pending : ₹' + pending.toFixed(2),
    '',
    'Top Sales:',
    sales.slice(0, 5).map(s => '  • ' + s['Customer'] + ': ' + s['Product'] + ' × ' + s['Qty'] + ' = ₹' + s['Total']).join('\n'),
    '',
    '─ Meenatchi Traders Business Manager ─'
  ].join('\n');

  MailApp.sendEmail(
    Session.getActiveUser().getEmail(),
    'Meenatchi Traders Daily Report — ' + today,
    body
  );
}
