// ═══════════════════════════════════════════════════════════════
//  MEENATCHI TRADERS — Google Apps Script (Code.gs)
//  Handles read/write to Google Sheets from the web app
//
//  SETUP:
//  1. Open Google Sheet → Extensions → Apps Script
//  2. Paste this entire file content
//  3. Deploy → New Deployment → Web App → Anyone can access
//  4. Copy the Web App URL into app Settings
// ═══════════════════════════════════════════════════════════════

const SHEET_NAME_SALES     = 'DAILY SALES';
const SHEET_NAME_PRODUCTS  = 'Products';
const SHEET_NAME_CUSTOMERS = 'Customers';
const SHEET_NAME_INVOICES  = 'Invoices';
const SHEET_NAME_TEA       = 'Selling TEA';
const SHEET_NAME_STUDENTS  = 'Tuition';
const SHEET_NAME_STAFF     = 'Staff';
const SHEET_NAME_GIFTS     = 'Gift Redemptions';

// ── Entry point for GET requests ──────────────
function doGet(e) {
  const action = e.parameter.action || '';
  let result = { status: 'error', message: 'Unknown action' };

  try {
    if (action === 'getSales')     result = { status: 'ok', data: getSheetData(SHEET_NAME_SALES) };
    if (action === 'getProducts')  result = { status: 'ok', data: getSheetData(SHEET_NAME_PRODUCTS) };
    if (action === 'getCustomers') result = { status: 'ok', data: getSheetData(SHEET_NAME_CUSTOMERS) };
    if (action === 'getInvoices')  result = { status: 'ok', data: getSheetData(SHEET_NAME_INVOICES) };
    if (action === 'getTea')       result = { status: 'ok', data: getSheetData(SHEET_NAME_TEA) };
    if (action === 'getStudents')  result = { status: 'ok', data: getSheetData(SHEET_NAME_STUDENTS) };
    if (action === 'getStaff')     result = { status: 'ok', data: getSheetData(SHEET_NAME_STAFF) };
    if (action === 'getGifts')     result = { status: 'ok', data: getSheetData(SHEET_NAME_GIFTS) };
    if (action === 'ping')         result = { status: 'ok', message: 'Connected! Meenatchi Traders Sheet.' };
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Entry point for POST requests ─────────────
function doPost(e) {
  const payload = JSON.parse(e.postData.contents || '{}');
  const action  = payload.action || '';
  let result    = { status: 'error', message: 'Unknown action' };

  try {
    if (action === 'addSale')       result = addRow(SHEET_NAME_SALES, saleToRow(payload.sale));
    if (action === 'addCustomer')   result = addRow(SHEET_NAME_CUSTOMERS, customerToRow(payload.customer));
    if (action === 'addInvoice')    result = addRow(SHEET_NAME_INVOICES, invoiceToRow(payload.invoice));
    if (action === 'addGift')       result = addRow(SHEET_NAME_GIFTS, giftToRow(payload.gift));
    if (action === 'syncAll')       result = syncAll(payload);
    if (action === 'clearSheet')    result = clearSheet(payload.sheetName);
  } catch (err) {
    result = { status: 'error', message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── Read sheet as JSON array ───────────────────
function getSheetData(sheetName) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data  = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0].map(h => String(h).trim());
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i] !== undefined ? row[i] : ''; });
    return obj;
  }).filter(row => Object.values(row).some(v => v !== ''));
}

// ── Add a row to a sheet ───────────────────────
function addRow(sheetName, rowData) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);

  // Create headers if empty
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(Object.keys(rowData));
  }

  sheet.appendRow(Object.values(rowData));
  return { status: 'ok', message: 'Row added to ' + sheetName };
}

// ── Clear sheet (keep headers) ─────────────────
function clearSheet(sheetName) {
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return { status: 'error', message: 'Sheet not found: ' + sheetName };
  if (sheet.getLastRow() > 1) {
    sheet.deleteRows(2, sheet.getLastRow() - 1);
  }
  return { status: 'ok', message: 'Sheet cleared: ' + sheetName };
}

// ── Full sync: write all data ──────────────────
function syncAll(payload) {
  try {
    if (payload.sales)     writeBatch(SHEET_NAME_SALES,     payload.sales.map(saleToRow));
    if (payload.products)  writeBatch(SHEET_NAME_PRODUCTS,  payload.products.map(productToRow));
    if (payload.customers) writeBatch(SHEET_NAME_CUSTOMERS, payload.customers.map(customerToRow));
    if (payload.gifts)     writeBatch(SHEET_NAME_GIFTS,     payload.gifts.map(giftToRow));
    return { status: 'ok', message: 'Full sync complete!' };
  } catch(err) {
    return { status: 'error', message: err.toString() };
  }
}

// ── Write full batch (clear + rewrite) ────────
function writeBatch(sheetName, rows) {
  if (!rows || !rows.length) return;
  const ss    = SpreadsheetApp.getActiveSpreadsheet();
  let sheet   = ss.getSheetByName(sheetName);
  if (!sheet) sheet = ss.insertSheet(sheetName);
  sheet.clearContents();
  sheet.appendRow(Object.keys(rows[0]));
  rows.forEach(row => sheet.appendRow(Object.values(row)));
}

// ── Row converters ─────────────────────────────
function saleToRow(s) {
  return {
    ID: s.id||'', Date: s.date||'', Customer: s.customer||'',
    Phone: s.phone||'', Product: s.product||'', Qty: s.qty||0,
    Price: s.price||0, Disc: s.disc||0, Total: s.total||0,
    Received: s.received||0, Pending: s.pending||0,
    Payment: s.payment||'', Status: s.status||'', Profit: s.profit||0
  };
}

function productToRow(p) {
  return {
    ID: p.id||'', Name: p.name||'', Category: p.category||'',
    BuyQty: p.buyQty||0, BuyPrice: p.buyPrice||0, ShipCost: p.shipCost||0,
    TotalCost: p.totalCost||0, CPU: p.cpu||0, SellPrice: p.sellPrice||0,
    ProfitPerUnit: p.profitPerUnit||0, Stock: p.stock||0, Sold: p.sold||0,
    Balance: p.balance||0, AlertAt: p.alertAt||0, Unit: p.unit||'pcs'
  };
}

function customerToRow(c) {
  return {
    ID: c.id||'', Name: c.name||'', Phone: c.phone||'', Address: c.addr||'',
    Product: c.product||'', Payment: c.payment||'', Total: c.total||0,
    Paid: c.paid||0, Pending: c.pending||0, Status: c.status||'',
    Notes: c.notes||'', Date: c.date||''
  };
}

function invoiceToRow(inv) {
  return {
    ID: inv.id||'', InvNo: inv.invNo||'', Date: inv.date||'',
    Customer: inv.customer||'', Phone: inv.phone||'', Ref: inv.ref||'',
    Payment: inv.payment||'', Items: JSON.stringify(inv.items||[]),
    Total: inv.total||0, Quote: inv.quote||'', Status: inv.status||''
  };
}

function giftToRow(g) {
  return {
    ID: g.id||'', Date: g.date||'', Customer: g.customer||'',
    Phone: g.phone||'', Product: g.product||'', Qty: g.qty||0,
    PointsUsed: g.pointsUsed||0, TotalSpent: g.totalSpent||0,
    Notes: g.notes||'', RedeemedBy: g.redeemedBy||''
  };
}
