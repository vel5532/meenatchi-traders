// ═══════════════════════════════════════════════════════
//  MEENATCHI TRADERS — Google Apps Script v4.0
//  Full persistence: sales, products, customers, invoices,
//  tea, students, staff, suppliers + referrals, rewards,
//  birthdays, productRules, profitTargets, settings
// ═══════════════════════════════════════════════════════

function setCorsHeaders(output) {
  return output.setMimeType(ContentService.MimeType.JSON);
}

// ─── MAIN GET ROUTER ──────────────────────────────────
function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) || 'test';
  let result;
  try {
    switch (action) {
      case 'test':
        result = { status: 'ok', message: 'Meenatchi Traders v4.0 connected!', version: '4.0', timestamp: new Date().toISOString(), sheets: getAllSheetNames() };
        break;
      case 'loadAll':
      case 'getAll':
        result = getAllData();
        break;
      case 'getSales':      result = { status: 'ok', data: readSheet('APP_SALES') };      break;
      case 'getProducts':   result = { status: 'ok', data: readSheet('APP_PRODUCTS') };   break;
      case 'getCustomers':  result = { status: 'ok', data: readSheet('APP_CUSTOMERS') };  break;
      case 'getInvoices':   result = { status: 'ok', data: readSheet('APP_INVOICES') };   break;
      case 'getStudents':   result = { status: 'ok', data: readSheet('APP_STUDENTS') };   break;
      case 'getStaff':      result = { status: 'ok', data: readSheet('APP_STAFF') };      break;
      case 'getTeaEntries': result = { status: 'ok', data: readSheet('APP_TEA') };        break;
      case 'getSuppliers':  result = { status: 'ok', data: readSheet('APP_SUPPLIERS') };  break;
      default:
        result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }
  return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(result)));
}

// ─── MAIN POST ROUTER ─────────────────────────────────
function doPost(e) {
  let result;
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;
    switch (action) {
      case 'addSale':        result = upsertRow('APP_SALES',     HEADERS.sales,     saleToRow(data.sale),         data.sale.id);     syncDailySalesSummary(data.sale); break;
      case 'addInvoice':     result = upsertRow('APP_INVOICES',  HEADERS.invoices,  invoiceToRow(data.invoice),   data.invoice.id);  break;
      case 'addProduct':
      case 'updateProduct':  result = upsertRow('APP_PRODUCTS',  HEADERS.products,  productToRow(data.product),   data.product.id);  break;
      case 'addCustomer':
      case 'updateCustomer': result = upsertRow('APP_CUSTOMERS', HEADERS.customers, customerToRow(data.customer), data.customer.id); break;
      case 'addSupplier':
      case 'updateSupplier': result = upsertRow('APP_SUPPLIERS', HEADERS.suppliers, supplierToRow(data.supplier), data.supplier.id); break;
      case 'addTeaEntry':    result = upsertRow('APP_TEA',       HEADERS.tea,       teaToRow(data.entry),         data.entry.id);    syncSellingTeaSheet(data.entry); break;
      case 'addStudent':
      case 'updateStudent':  result = upsertRow('APP_STUDENTS',  HEADERS.students,  studentToRow(data.student),   data.student.id);  break;
      case 'addStaff':
      case 'updateStaff':    result = upsertRow('APP_STAFF',     HEADERS.staff,     staffToRow(data.staff),       data.staff.id);    break;
      case 'syncAll':        result = syncAll(data);   break;
      case 'updateForecast': result = syncForecast(data); break;
      default:               result = { status: 'error', message: 'Unknown action: ' + action };
    }
  } catch (err) {
    result = { status: 'error', message: err.message };
  }
  return setCorsHeaders(ContentService.createTextOutput(JSON.stringify(result)));
}

// ─── HEADERS ──────────────────────────────────────────
const HEADERS = {
  sales:     ['ID','Date','Customer','Phone','Product','Items','Qty','Price','Discount','Total','Received','Pending','Payment','Status','Profit','Invoice No','IsReseller'],
  invoices:  ['ID','Invoice No','Date','Customer','Phone','Address','Reference','Payment','Items','Subtotal','Discount Total','Total','Status','Quote'],
  products:  ['ID','Name','Category','BuyQty','BuyPrice','ShipCost','BulkUnit','TotalCost','CPU','SellPrice','ResellerPrice','ProfitPerUnit','Stock','Sold','Balance','AlertAt','Unit','PackVariants'],
  customers: ['ID','Name','Phone','Address','Product','Payment','Total','Paid','Pending','Status','Notes','Date','Last Sale'],
  tea:       ['ID','Date','Time','Cups','Sell Price','Milk','Sugar','Powder','Gas','Income','Expense','Profit','Notes'],
  students:  ['ID','Name','Class','Phone','Fees','Paid','Pending','Scholar','Join Date'],
  staff:     ['ID','Name','Subject','Class','Salary','Paid','Salary Due','Pay Date','Phone'],
  suppliers: ['ID','Name','Phone','Products','City','Terms','Min Order','Notes','Total Purchased'],
  meta:      ['Key','Value','UpdatedAt'],
  forecast:  ['Product','Category','7 Day Sales','30 Day Sales','Avg Daily Sales','Stock','Stock Days Left','Forecast Tomorrow','Unit'],
  dailySummary: ['Date','Orders','Total Income','Total Received','Total Pending','Total Profit','Products Sold']
};

// ─── ROW MAPPERS ──────────────────────────────────────
function saleToRow(s)     { return [s.id,s.date,s.customer,s.phone||'',s.product||'',JSON.stringify(s.items||[]),s.qty||0,s.price||0,s.disc||0,s.total||0,s.received||0,s.pending||0,s.payment||'',s.status||'',s.profit||0,s.invoiceNo||'',s.isReseller?1:0]; }
function invoiceToRow(inv){ return [inv.id,inv.invNo,inv.date,inv.customer,inv.phone||'',inv.addr||'',inv.ref||'',inv.payment||'',JSON.stringify(inv.items||[]),inv.subtotal||0,inv.discTotal||0,inv.total||0,inv.status||'',inv.quote||'']; }
function productToRow(p)  { return [p.id,p.name,p.category||'',p.buyQty||0,p.buyPrice||0,p.shipCost||0,p.bulkUnit||'kg',p.totalCost||0,p.cpu||0,p.sellPrice||0,p.resellerPrice||0,p.profitPerUnit||0,p.stock||0,p.sold||0,p.balance||0,p.alertAt||10,p.unit||'pcs',JSON.stringify(p.packVariants||[])]; }
function customerToRow(c) { return [c.id,c.name,c.phone||'',c.addr||'',c.product||'',c.payment||'',c.total||0,c.paid||0,c.pending||0,c.status||'',c.notes||'',c.date||'',c.lastSale||'']; }
function supplierToRow(s) { return [s.id,s.name,s.phone||'',s.products||'',s.city||'',s.terms||'',s.minOrder||0,s.notes||'',s.totalPurchased||0]; }
function teaToRow(t)      { return [t.id,t.date,t.time||'',t.cups||0,t.sellPrice||0,t.milk||0,t.sugar||0,t.powder||0,t.gas||0,t.income||0,t.expense||0,t.profit||0,t.notes||'']; }
function studentToRow(s)  { return [s.id,s.name,s.class||'',s.phone||'',s.fees||s.monthlyFee||0,s.paid||s.paidAmount||0,s.pending||0,s.scholar||0,s.joinDate||'']; }
function staffToRow(s)    { return [s.id,s.name,s.subject||'',s.class||'',s.salary||0,s.paidSalary||s.paid||0,Math.max((s.salary||0)-(s.paidSalary||s.paid||0),0),s.payDate||'',s.phone||'']; }

// ─── APP_META: key-value JSON blob store ──────────────
function saveMeta(key, value) {
  const sheet = getOrCreateSheet('APP_META', HEADERS.meta);
  const data = sheet.getDataRange().getValues();
  const now = new Date().toISOString();
  const jsonVal = JSON.stringify(value);
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      sheet.getRange(i+1,1,1,3).setValues([[key,jsonVal,now]]);
      return;
    }
  }
  sheet.appendRow([key,jsonVal,now]);
}

function loadMeta(key) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName('APP_META');
  if (!sheet || sheet.getLastRow() <= 1) return null;
  var data = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]) === key) {
      try { return JSON.parse(String(data[i][1])); } catch(e) { return null; }
    }
  }
  return null;
}

// ─── SHEET UTILITIES ──────────────────────────────────
function getOrCreateSheet(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) { sheet = ss.insertSheet(name); }
  if (headers && sheet.getLastRow() === 0) {
    var hr = sheet.getRange(1,1,1,headers.length);
    hr.setValues([headers]);
    hr.setBackground('#1a0a2e').setFontColor('#f7c948').setFontWeight('bold').setFontSize(10);
    sheet.setFrozenRows(1);
    for (var i = 1; i <= headers.length; i++) sheet.setColumnWidth(i,130);
  }
  return sheet;
}

function readSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet || sheet.getLastRow() <= 1) return [];
  var data = sheet.getDataRange().getValues();
  var headers = data[0];
  return data.slice(1).map(function(row){
    var obj = {};
    headers.forEach(function(h,i){ obj[h] = row[i]; });
    return obj;
  });
}

function upsertRow(sheetName, headers, rowData, recordId) {
  var sheet = getOrCreateSheet(sheetName, headers);
  if (recordId) {
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]) === String(recordId)) {
        sheet.getRange(i+1,1,1,rowData.length).setValues([rowData]);
        return { status:'ok', action:'updated', sheet:sheetName };
      }
    }
  }
  sheet.appendRow(rowData);
  return { status:'ok', action:'inserted', sheet:sheetName };
}

function rewriteSheet(sheetName, headers, rows) {
  var sheet = getOrCreateSheet(sheetName, headers);
  // Always enforce correct headers (fixes column mismatch from old sheets)
  if (headers && sheet.getLastRow() >= 1) {
    var existingHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    // If header count differs or first headers don't match, rewrite headers
    if (existingHeaders.length !== headers.length || existingHeaders[0] !== headers[0] || existingHeaders[2] !== headers[2]) {
      // Delete entire sheet content and rewrite with correct headers
      sheet.clearContents();
      var hr = sheet.getRange(1,1,1,headers.length);
      hr.setValues([headers]);
      hr.setBackground('#1a0a2e').setFontColor('#f7c948').setFontWeight('bold').setFontSize(10);
      sheet.setFrozenRows(1);
    }
  }
  var lastRow = sheet.getLastRow();
  if (lastRow > 1) sheet.deleteRows(2, lastRow-1);
  if (rows.length > 0) sheet.getRange(2,1,rows.length,rows[0].length).setValues(rows);
  return rows.length;
}

// Run this ONCE from Apps Script editor to fix all column headers
function fixAllSheetHeaders() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheetConfigs = [
    { name: 'APP_SALES',     headers: HEADERS.sales },
    { name: 'APP_INVOICES',  headers: HEADERS.invoices },
    { name: 'APP_PRODUCTS',  headers: HEADERS.products },
    { name: 'APP_CUSTOMERS', headers: HEADERS.customers },
    { name: 'APP_TEA',       headers: HEADERS.tea },
    { name: 'APP_STUDENTS',  headers: HEADERS.students },
    { name: 'APP_STAFF',     headers: HEADERS.staff },
    { name: 'APP_SUPPLIERS', headers: HEADERS.suppliers },
    { name: 'APP_META',      headers: HEADERS.meta }
  ];
  sheetConfigs.forEach(function(cfg) {
    var sheet = ss.getSheetByName(cfg.name);
    if (sheet) {
      sheet.clearContents();
      var hr = sheet.getRange(1,1,1,cfg.headers.length);
      hr.setValues([cfg.headers]);
      hr.setBackground('#1a0a2e').setFontColor('#f7c948').setFontWeight('bold').setFontSize(10);
      sheet.setFrozenRows(1);
      Logger.log('Reset headers: ' + cfg.name);
    }
  });
  return 'Done! All sheet headers fixed. Now sync from the app.';
}

function getAllSheetNames() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheets().map(function(s){ return s.getName(); });
}

// ─── SYNC ALL ─────────────────────────────────────────
function syncAll(payload) {
  var results = {};
  try {
    if (payload.sales)        { results.sales      = rewriteSheet('APP_SALES',     HEADERS.sales,     payload.sales.map(saleToRow));         rebuildDailySummary(payload.sales); }
    if (payload.invoices)     { results.invoices   = rewriteSheet('APP_INVOICES',  HEADERS.invoices,  payload.invoices.map(invoiceToRow));   }
    if (payload.products)     { results.products   = rewriteSheet('APP_PRODUCTS',  HEADERS.products,  payload.products.map(productToRow));   }
    if (payload.customers)    { results.customers  = rewriteSheet('APP_CUSTOMERS', HEADERS.customers, payload.customers.map(customerToRow)); }
    if (payload.students)     { results.students   = rewriteSheet('APP_STUDENTS',  HEADERS.students,  payload.students.map(studentToRow));   }
    if (payload.staff)        { results.staff      = rewriteSheet('APP_STAFF',     HEADERS.staff,     payload.staff.map(staffToRow));        }
    if (payload.teaEntries)   { results.tea        = rewriteSheet('APP_TEA',       HEADERS.tea,       payload.teaEntries.map(teaToRow));     }
    if (payload.suppliers)    { results.suppliers  = rewriteSheet('APP_SUPPLIERS', HEADERS.suppliers, payload.suppliers.map(supplierToRow)); }

    // Save JSON blobs to APP_META
    if (payload.referrals         !== undefined) saveMeta('referrals',         payload.referrals);
    if (payload.rewardPacks       !== undefined) saveMeta('rewardPacks',       payload.rewardPacks);
    if (payload.rewardRedemptions !== undefined) saveMeta('rewardRedemptions', payload.rewardRedemptions);
    if (payload.birthdays         !== undefined) saveMeta('birthdays',         payload.birthdays);
    if (payload.productRules      !== undefined) saveMeta('productRules',      payload.productRules);
    if (payload.profitTargets     !== undefined) saveMeta('profitTargets',     payload.profitTargets);
    if (payload.invoiceCounter    !== undefined) saveMeta('invoiceCounter',    payload.invoiceCounter);
    if (payload.settings          !== undefined) saveMeta('settings',          payload.settings);

    return { status:'ok', message:'All data synced!', counts:results, timestamp:new Date().toISOString() };
  } catch(e) {
    return { status:'error', message:'syncAll failed: '+e.message };
  }
}

// ─── GET ALL DATA ─────────────────────────────────────
function getAllData() {
  return {
    status: 'ok',
    data: {
      sales:             readSheet('APP_SALES'),
      invoices:          readSheet('APP_INVOICES'),
      products:          readSheet('APP_PRODUCTS'),
      customers:         readSheet('APP_CUSTOMERS'),
      students:          readSheet('APP_STUDENTS'),
      staff:             readSheet('APP_STAFF'),
      teaEntries:        readSheet('APP_TEA'),
      suppliers:         readSheet('APP_SUPPLIERS'),
      referrals:         JSON.stringify(loadMeta('referrals')         || []),
      rewardPacks:       JSON.stringify(loadMeta('rewardPacks')       || []),
      rewardRedemptions: JSON.stringify(loadMeta('rewardRedemptions') || []),
      birthdays:         JSON.stringify(loadMeta('birthdays')         || {}),
      productRules:      JSON.stringify(loadMeta('productRules')      || []),
      profitTargets:     JSON.stringify(loadMeta('profitTargets')     || []),
      invoiceCounter:    loadMeta('invoiceCounter') || 1001,
      settings:          JSON.stringify(loadMeta('settings')          || {})
    },
    timestamp: new Date().toISOString()
  };
}

// ─── DAILY SUMMARY ────────────────────────────────────
function syncDailySalesSummary(sale) {
  try {
    var sheet = getOrCreateSheet('DAILY SUMMARY', HEADERS.dailySummary);
    var data = sheet.getDataRange().getValues();
    var saleDate = String(sale.date||'').substring(0,10);
    var rowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).substring(0,10) === saleDate) { rowIndex = i+1; break; }
    }
    if (rowIndex > 0) {
      var row = data[rowIndex-1];
      sheet.getRange(rowIndex,1,1,7).setValues([[saleDate,(Number(row[1])||0)+1,(Number(row[2])||0)+(sale.total||0),(Number(row[3])||0)+(sale.received||0),(Number(row[4])||0)+(sale.pending||0),(Number(row[5])||0)+(sale.profit||0),row[6]||'']]);
    } else {
      sheet.appendRow([saleDate,1,sale.total||0,sale.received||0,sale.pending||0,sale.profit||0,sale.product||'']);
    }
  } catch(e) { Logger.log('Daily summary error: '+e.message); }
}

function rebuildDailySummary(sales) {
  var byDate = {};
  sales.forEach(function(s){
    var d = String(s.date||'').substring(0,10);
    if (!d) return;
    if (!byDate[d]) byDate[d] = {orders:0,income:0,received:0,pending:0,profit:0,products:[]};
    byDate[d].orders++;
    byDate[d].income   += Number(s.total)||0;
    byDate[d].received += Number(s.received)||0;
    byDate[d].pending  += Number(s.pending)||0;
    byDate[d].profit   += Number(s.profit)||0;
    if (s.product) byDate[d].products.push(s.product);
  });
  var rows = Object.keys(byDate).sort().map(function(d){
    var v = byDate[d];
    return [d,v.orders,v.income,v.received,v.pending,v.profit,v.products.filter(function(x,i,a){return a.indexOf(x)===i;}).join(', ')];
  });
  rewriteSheet('DAILY SUMMARY', HEADERS.dailySummary, rows);
}

// ─── FORECAST ─────────────────────────────────────────
function syncForecast(data) {
  try {
    rewriteSheet('SALES FORECAST', HEADERS.forecast, data.rows||[]);
    var sheet = getOrCreateSheet('SALES FORECAST', HEADERS.forecast);
    sheet.getRange(sheet.getLastRow()+2,1).setValue('Last updated: '+new Date().toLocaleString('en-IN'));
    return { status:'ok', message:'Forecast synced!' };
  } catch(e) { return { status:'error', message:e.message }; }
}

function syncSellingTeaSheet(entry) {
  try {
    var sheet = getOrCreateSheet('Selling TEA',['Date','Cups','Income','Expense','Profit','Notes']);
    sheet.appendRow([entry.date,entry.cups,entry.income,entry.expense,entry.profit,entry.notes||'']);
  } catch(e) { Logger.log('Selling TEA error: '+e.message); }
}

// ─── DAILY EMAIL (optional trigger) ───────────────────
function sendDailyReport() {
  var today = Utilities.formatDate(new Date(),'Asia/Kolkata','yyyy-MM-dd');
  var sales = readSheet('APP_SALES').filter(function(r){ return String(r['Date']||'').startsWith(today); });
  if (!sales.length) return;
  var income  = sales.reduce(function(a,r){ return a+(Number(r['Total'])||0);   },0);
  var profit  = sales.reduce(function(a,r){ return a+(Number(r['Profit'])||0);  },0);
  var pending = sales.reduce(function(a,r){ return a+(Number(r['Pending'])||0); },0);
  var body = ['Meenatchi Traders — Daily Report ('+today+')','Orders: '+sales.length,'Income: Rs.'+income.toFixed(2),'Profit: Rs.'+profit.toFixed(2),'Pending: Rs.'+pending.toFixed(2),'','— Meenatchi Traders v4.0 —'].join('\n');
  MailApp.sendEmail(Session.getActiveUser().getEmail(),'Meenatchi Traders Daily Report — '+today,body);
}
