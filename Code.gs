// ═══════════════════════════════════════════════════════
//  GOOGLE APPS SCRIPT BACKEND — Code.gs
//  Meenatchi Traders Business Manager
//
//  SETUP INSTRUCTIONS:
//  1. Open your Google Sheet
//  2. Go to Extensions → Apps Script
//  3. Paste this entire file into Code.gs
//  4. Save (Ctrl+S)
//  5. Deploy → New Deployment → Web App
//     - Execute as: Me
//     - Who has access: Anyone
//  6. Copy the Web App URL and paste into the app Settings
// ═══════════════════════════════════════════════════════

const SHEET_ID = SpreadsheetApp.getActiveSpreadsheet().getId();

// ─── MAIN ROUTER ──────────────────────────────────────
function doGet(e) {
  const action = e.parameter.action || 'test';
  let result;

  try {
    switch (action) {
      case 'test':
        result = { status: 'ok', message: 'Meenatchi Traders API is connected!', timestamp: new Date().toISOString() };
        break;
      case 'getProducts':
        result = getProducts();
        break;
      case 'getSales':
        result = getSales();
        break;
      case 'getCustomers':
        result = getCustomers();
        break;
      case 'getDailySales':
        result = getDailySales(e.parameter.date);
        break;
      case 'getTeaEntries':
        result = getTeaEntries();
        break;
      case 'getStudents':
        result = getStudents();
        break;
      case 'getStaff':
        result = getStaff();
        break;
      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result;
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    switch (action) {
      case 'addSale':
        result = addSale(data.sale);
        break;
      case 'updateSale':
        result = updateSale(data.sale);
        break;
      case 'addProduct':
        result = addProduct(data.product);
        break;
      case 'addCustomer':
        result = addCustomer(data.customer);
        break;
      case 'addTeaEntry':
        result = addTeaEntry(data.entry);
        break;
      case 'addStudent':
        result = addStudent(data.student);
        break;
      case 'addStaff':
        result = addStaff(data.staff);
        break;
      case 'syncAll':
        result = syncAll(data);
        break;
      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ─── SHEET HELPERS ────────────────────────────────────
function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    if (headers) {
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setBackground('#1a0a2e')
        .setFontColor('#f7c948')
        .setFontWeight('bold');
    }
  }
  return sheet;
}

function sheetToObjects(sheet, headers) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  const head = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    head.forEach((h, i) => { obj[h] = row[i]; });
    return obj;
  });
}

// ─── SALES ────────────────────────────────────────────
function addSale(sale) {
  const sheet = getOrCreateSheet('APP_SALES', [
    'ID', 'Date', 'Customer', 'Product', 'Qty', 'Price', 'Discount',
    'Total', 'Received', 'Pending', 'Payment', 'Status', 'Profit'
  ]);
  sheet.appendRow([
    sale.id, sale.date, sale.customer, sale.product,
    sale.qty, sale.price, sale.disc || 0, sale.total,
    sale.received, sale.pending, sale.payment, sale.status,
    sale.profit || 0
  ]);

  // Also update DAILY SALES sheet to match existing format
  updateDailySalesSheet(sale);

  return { status: 'ok', message: 'Sale added' };
}

function updateDailySalesSheet(sale) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DAILY SALES');
    if (!sheet) return;
    // Find or create row for today's date
    const data = sheet.getDataRange().getValues();
    const dateCol = 0;
    const today = sale.date;
    let rowIndex = -1;

    for (let i = 1; i < data.length; i++) {
      const cellDate = data[i][dateCol];
      if (cellDate && String(cellDate).includes(today)) {
        rowIndex = i + 1;
        break;
      }
    }

    if (rowIndex === -1) {
      sheet.appendRow([today, 0, 0, 0, 0, 0, 0, '=B' + (sheet.getLastRow()) + '*2.95+C' + (sheet.getLastRow()) + '*22.95+D' + (sheet.getLastRow()) + '*60.5']);
      rowIndex = sheet.getLastRow();
    }
  } catch (e) {
    Logger.log('DAILY SALES update error: ' + e.message);
  }
}

function getSales() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APP_SALES');
  if (!sheet) return { status: 'ok', data: [] };
  return { status: 'ok', data: sheetToObjects(sheet) };
}

// ─── PRODUCTS ─────────────────────────────────────────
function addProduct(product) {
  const sheet = getOrCreateSheet('APP_PRODUCTS', [
    'ID', 'Name', 'Category', 'BuyQty', 'BuyPrice', 'ShipCost',
    'TotalCost', 'CostPerUnit', 'SellPrice', 'ProfitPerUnit',
    'Stock', 'Sold', 'Balance', 'AlertAt', 'Unit'
  ]);
  sheet.appendRow([
    product.id, product.name, product.category,
    product.buyQty, product.buyPrice, product.shipCost,
    product.totalCost, product.cpu, product.sellPrice,
    product.profitPerUnit, product.stock, product.sold || 0,
    product.balance, product.alertAt, product.unit
  ]);
  return { status: 'ok', message: 'Product added' };
}

function getProducts() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APP_PRODUCTS');
  if (!sheet) return { status: 'ok', data: [] };
  return { status: 'ok', data: sheetToObjects(sheet) };
}

// ─── CUSTOMERS ────────────────────────────────────────
function addCustomer(customer) {
  const sheet = getOrCreateSheet('APP_CUSTOMERS', [
    'ID', 'Name', 'Phone', 'Address', 'Product', 'Payment',
    'Total', 'Paid', 'Pending', 'Status', 'Notes', 'Date'
  ]);
  sheet.appendRow([
    customer.id, customer.name, customer.phone, customer.addr,
    customer.product, customer.payment, customer.total,
    customer.paid, customer.pending, customer.status,
    customer.notes || '', customer.date
  ]);
  return { status: 'ok', message: 'Customer added' };
}

function getCustomers() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APP_CUSTOMERS');
  if (!sheet) return { status: 'ok', data: [] };
  return { status: 'ok', data: sheetToObjects(sheet) };
}

// ─── TEA SHOP ─────────────────────────────────────────
function addTeaEntry(entry) {
  const sheet = getOrCreateSheet('APP_TEA', [
    'ID', 'Date', 'Time', 'Cups', 'SellPrice', 'Milk', 'Sugar',
    'Powder', 'Gas', 'Income', 'Expense', 'Profit', 'Notes'
  ]);
  sheet.appendRow([
    entry.id, entry.date, entry.time, entry.cups, entry.sellPrice,
    entry.milk, entry.sugar, entry.powder, entry.gas,
    entry.income, entry.expense, entry.profit, entry.notes || ''
  ]);

  // Update Selling TEA sheet
  try {
    const teaSheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Selling TEA');
    if (teaSheet) {
      teaSheet.appendRow([entry.date, entry.cups, entry.income, entry.notes]);
    }
  } catch(e) {}

  return { status: 'ok', message: 'Tea entry added' };
}

function getTeaEntries() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APP_TEA');
  if (!sheet) return { status: 'ok', data: [] };
  return { status: 'ok', data: sheetToObjects(sheet) };
}

// ─── TUITION ──────────────────────────────────────────
function addStudent(student) {
  const sheet = getOrCreateSheet('APP_STUDENTS', [
    'ID', 'Name', 'Class', 'Phone', 'Fees', 'Paid', 'Pending', 'Scholar', 'JoinDate'
  ]);
  sheet.appendRow([
    student.id, student.name, student.class, student.phone,
    student.fees, student.paid, student.pending, student.scholar || 0, student.joinDate
  ]);
  return { status: 'ok', message: 'Student added' };
}

function addStaff(staff) {
  const sheet = getOrCreateSheet('APP_STAFF', [
    'ID', 'Name', 'Subject', 'Class', 'Salary', 'Paid', 'PayDate', 'Phone'
  ]);
  sheet.appendRow([
    staff.id, staff.name, staff.subject, staff.class,
    staff.salary, staff.paid || 0, staff.payDate, staff.phone || ''
  ]);
  return { status: 'ok', message: 'Staff added' };
}

function getStudents() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APP_STUDENTS');
  if (!sheet) return { status: 'ok', data: [] };
  return { status: 'ok', data: sheetToObjects(sheet) };
}

function getStaff() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('APP_STAFF');
  if (!sheet) return { status: 'ok', data: [] };
  return { status: 'ok', data: sheetToObjects(sheet) };
}

// ─── DAILY SALES READ ─────────────────────────────────
function getDailySales(date) {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('DAILY SALES');
  if (!sheet) return { status: 'ok', data: [] };
  const data = sheetToObjects(sheet);
  const filtered = date ? data.filter(r => String(r.Date || '').includes(date)) : data;
  return { status: 'ok', data: filtered };
}

// ─── SYNC ALL ─────────────────────────────────────────
function syncAll(payload) {
  try {
    // Sync sales
    if (payload.sales && payload.sales.length > 0) {
      const salesSheet = getOrCreateSheet('APP_SALES', [
        'ID', 'Date', 'Customer', 'Product', 'Qty', 'Price', 'Discount',
        'Total', 'Received', 'Pending', 'Payment', 'Status', 'Profit'
      ]);
      // Clear and rewrite
      const lastRow = salesSheet.getLastRow();
      if (lastRow > 1) salesSheet.deleteRows(2, lastRow - 1);
      const rows = payload.sales.map(s => [
        s.id, s.date, s.customer, s.product, s.qty, s.price,
        s.disc || 0, s.total, s.received, s.pending,
        s.payment, s.status, s.profit || 0
      ]);
      if (rows.length > 0) salesSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }

    // Sync products
    if (payload.products && payload.products.length > 0) {
      const prodSheet = getOrCreateSheet('APP_PRODUCTS', [
        'ID', 'Name', 'Category', 'BuyQty', 'BuyPrice', 'ShipCost',
        'TotalCost', 'CostPerUnit', 'SellPrice', 'ProfitPerUnit',
        'Stock', 'Sold', 'Balance', 'AlertAt', 'Unit'
      ]);
      const lastRow = prodSheet.getLastRow();
      if (lastRow > 1) prodSheet.deleteRows(2, lastRow - 1);
      const rows = payload.products.map(p => [
        p.id, p.name, p.category, p.buyQty, p.buyPrice, p.shipCost,
        p.totalCost, p.cpu, p.sellPrice, p.profitPerUnit,
        p.stock, p.sold || 0, p.balance, p.alertAt, p.unit
      ]);
      if (rows.length > 0) prodSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }

    // Sync customers
    if (payload.customers && payload.customers.length > 0) {
      const custSheet = getOrCreateSheet('APP_CUSTOMERS', [
        'ID', 'Name', 'Phone', 'Address', 'Product', 'Payment',
        'Total', 'Paid', 'Pending', 'Status', 'Notes', 'Date'
      ]);
      const lastRow = custSheet.getLastRow();
      if (lastRow > 1) custSheet.deleteRows(2, lastRow - 1);
      const rows = payload.customers.map(c => [
        c.id, c.name, c.phone || '', c.addr || '', c.product || '',
        c.payment || '', c.total || 0, c.paid || 0, c.pending || 0,
        c.status || '', c.notes || '', c.date || ''
      ]);
      if (rows.length > 0) custSheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
    }

    return { status: 'ok', message: 'Synced all data successfully', timestamp: new Date().toISOString() };
  } catch (e) {
    return { status: 'error', message: 'Sync failed: ' + e.message };
  }
}

// ─── DAILY REPORT EMAIL ───────────────────────────────
function sendDailyReport() {
  // Set up a time-driven trigger for this in Apps Script:
  // Triggers → Add Trigger → sendDailyReport → Day timer → 9:00 PM

  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const salesSheet = ss.getSheetByName('APP_SALES');
  if (!salesSheet) return;

  const today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
  const data = sheetToObjects(salesSheet);
  const todaySales = data.filter(r => String(r.Date || '').startsWith(today));

  if (!todaySales.length) return;

  const totalIncome = todaySales.reduce((a, r) => a + (Number(r.Total) || 0), 0);
  const totalProfit = todaySales.reduce((a, r) => a + (Number(r.Profit) || 0), 0);

  const body = `
    Meenatchi Traders — Daily Report (${today})
    =============================================
    Orders: ${todaySales.length}
    Total Income: ₹${totalIncome.toFixed(2)}
    Total Profit: ₹${totalProfit.toFixed(2)}

    Top Sales:
    ${todaySales.slice(0, 5).map(s => `- ${s.Customer}: ${s.Product} × ${s.Qty} = ₹${s.Total}`).join('\n')}

    Generated by Meenatchi Traders Business Manager
  `;

  // Replace with owner email
  const ownerEmail = Session.getActiveUser().getEmail();
  MailApp.sendEmail(ownerEmail, `Meenatchi Traders Daily Report — ${today}`, body);
}
