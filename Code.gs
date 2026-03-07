// ═══════════════════════════════════════════════════════════
//  MEENATCHI TRADERS — Google Apps Script Backend v2.0
//  Fixed CORS + Full Sync + Load All Data
// ═══════════════════════════════════════════════════════════

<script>
async function autoSync() {
  try {
    const url = localStorage.getItem("apps_script_url");
    if (!url) return;

    const res = await fetch(url);
    const data = await res.json();

    if (data) {
      console.log("Auto Sync Updated");
      location.reload();
    }
  } catch (e) {
    console.log("Sync error", e);
  }
}

/* Auto sync every 10 seconds */
setInterval(autoSync, 10000);
</script>

function doGet(e) {
  const action = (e && e.parameter && e.parameter.action) ? e.parameter.action : 'test';
  let result;
  try {
    switch (action) {
      case 'test':
        result = { status: 'ok', message: 'Meenatchi Traders connected!', sheet: SpreadsheetApp.getActiveSpreadsheet().getName(), time: new Date().toISOString() };
        break;
      case 'loadAll':
        result = loadAllData();
        break;
      default:
        result = { status: 'error', message: 'Unknown: ' + action };
    }
  } catch(err) { result = { status: 'error', message: err.toString() }; }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  let result;
  try {
    const data = JSON.parse(e.postData.contents);
    switch (data.action) {
      case 'syncAll': result = syncAll(data); break;
      default: result = { status: 'error', message: 'Unknown: ' + data.action };
    }
  } catch(err) { result = { status: 'error', message: err.toString() }; }
  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
}

// HEADERS
const H = {
  products:   ['ID','Name','Category','BuyQty','BuyPrice','ShipCost','TotalCost','CPU','SellPrice','ProfitPerUnit','Stock','Sold','Balance','AlertAt','Unit'],
  sales:      ['ID','Date','Customer','Product','Qty','Price','Discount','Total','Received','Pending','Payment','Status','Profit'],
  customers:  ['ID','Name','Phone','Address','Product','Payment','Total','Paid','Pending','Status','Notes','Date'],
  invoices:   ['ID','InvNo','Date','Customer','Phone','Ref','Payment','Items','Total','Quote','Status'],
  tea:        ['ID','Date','Cups','SellPrice','Milk','Sugar','Powder','Gas','Income','Expense','Profit','Notes'],
  students:   ['ID','Name','Class','Phone','Fees','Paid','Pending','Scholar','JoinDate'],
  staff:      ['ID','Name','Subject','Class','Salary','Paid','PayDate','Phone']
};

// ROW CONVERTERS
function R(data) {
  return {
    product:  p => [p.id,p.name,p.category,p.buyQty,p.buyPrice,p.shipCost,p.totalCost,p.cpu,p.sellPrice,p.profitPerUnit,p.stock,p.sold||0,p.balance,p.alertAt,p.unit],
    sale:     s => [s.id,s.date,s.customer,s.product,s.qty,s.price,s.disc||0,s.total,s.received||0,s.pending||0,s.payment,s.status,s.profit||0],
    customer: c => [c.id,c.name,c.phone||'',c.addr||'',c.product||'',c.payment||'',c.total||0,c.paid||0,c.pending||0,c.status||'',c.notes||'',c.date||''],
    invoice:  i => [i.id,i.invNo,i.date,i.customer,i.phone||'',i.ref||'',i.payment,JSON.stringify(i.items||[]),i.total||0,i.quote||'',i.status||'Generated'],
    tea:      t => [t.id,t.date,t.cups,t.sellPrice,t.milk||0,t.sugar||0,t.powder||0,t.gas||0,t.income||0,t.expense||0,t.profit||0,t.notes||''],
    student:  s => [s.id,s.name,s.class||'',s.phone||'',s.fees||0,s.paid||0,s.pending||0,s.scholar||0,s.joinDate||''],
    staff:    s => [s.id,s.name,s.subject||'',s.class||'',s.salary||0,s.paid||0,s.payDate||'',s.phone||'']
  };
}

function getOrCreateSheet(name, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    const r = sh.getRange(1, 1, 1, headers.length);
    r.setValues([headers]);
    r.setBackground('#1a0a2e').setFontColor('#f7c948').setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  return sh;
}

function readSheet(name) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName(name);
  if (!sh) return [];
  const vals = sh.getDataRange().getValues();
  if (vals.length <= 1) return [];
  const heads = vals[0];
  return vals.slice(1).map(row => {
    const o = {};
    heads.forEach((h, i) => { o[h] = row[i]; });
    return o;
  });
}

function writeSheet(name, headers, rows) {
  const sh = getOrCreateSheet(name, headers);
  const last = sh.getLastRow();
  if (last > 1) sh.deleteRows(2, last - 1);
  if (rows.length > 0) sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  try { sh.autoResizeColumns(1, headers.length); } catch(e) {}
}

function loadAllData() {
  return {
    status: 'ok',
    data: {
      products:   readSheet('APP_PRODUCTS'),
      sales:      readSheet('APP_SALES'),
      customers:  readSheet('APP_CUSTOMERS'),
      invoices:   readSheet('APP_INVOICES'),
      teaEntries: readSheet('APP_TEA'),
      students:   readSheet('APP_STUDENTS'),
      staff:      readSheet('APP_STAFF')
    },
    timestamp: new Date().toISOString()
  };
}

function syncAll(payload) {
  try {
    const conv = R().product ? R() : null;
    const converters = {
      product:  p => [p.id,p.name,p.category,p.buyQty,p.buyPrice,p.shipCost,p.totalCost,p.cpu,p.sellPrice,p.profitPerUnit,p.stock,p.sold||0,p.balance,p.alertAt,p.unit],
      sale:     s => [s.id,s.date,s.customer,s.product,s.qty,s.price,s.disc||0,s.total,s.received||0,s.pending||0,s.payment,s.status,s.profit||0],
      customer: c => [c.id,c.name,c.phone||'',c.addr||'',c.product||'',c.payment||'',c.total||0,c.paid||0,c.pending||0,c.status||'',c.notes||'',c.date||''],
      invoice:  i => [i.id,i.invNo,i.date,i.customer,i.phone||'',i.ref||'',i.payment,JSON.stringify(i.items||[]),i.total||0,i.quote||'',i.status||'Generated'],
      tea:      t => [t.id,t.date,t.cups,t.sellPrice,t.milk||0,t.sugar||0,t.powder||0,t.gas||0,t.income||0,t.expense||0,t.profit||0,t.notes||''],
      student:  s => [s.id,s.name,s.class||'',s.phone||'',s.fees||0,s.paid||0,s.pending||0,s.scholar||0,s.joinDate||''],
      staff:    s => [s.id,s.name,s.subject||'',s.class||'',s.salary||0,s.paid||0,s.payDate||'',s.phone||'']
    };

    if (payload.products   ?.length) writeSheet('APP_PRODUCTS',  H.products,  payload.products.map(converters.product));
    if (payload.sales      ?.length) writeSheet('APP_SALES',     H.sales,     payload.sales.map(converters.sale));
    if (payload.customers  ?.length) writeSheet('APP_CUSTOMERS', H.customers, payload.customers.map(converters.customer));
    if (payload.invoices   ?.length) writeSheet('APP_INVOICES',  H.invoices,  payload.invoices.map(converters.invoice));
    if (payload.teaEntries ?.length) writeSheet('APP_TEA',       H.tea,       payload.teaEntries.map(converters.tea));
    if (payload.students   ?.length) writeSheet('APP_STUDENTS',  H.students,  payload.students.map(converters.student));
    if (payload.staff      ?.length) writeSheet('APP_STAFF',     H.staff,     payload.staff.map(converters.staff));

    // Log the sync
    const logSh = getOrCreateSheet('SYNC_LOG', ['Timestamp','Sales','Products','Customers','Status']);
    logSh.appendRow([new Date().toISOString(), (payload.sales||[]).length, (payload.products||[]).length, (payload.customers||[]).length, 'OK']);

    return { status: 'ok', message: 'Synced successfully!', timestamp: new Date().toISOString() };
  } catch(e) {
    return { status: 'error', message: e.toString() };
  }
}

// Daily email report — add a Time trigger: 9PM every day
function sendDailyReport() {
  const today = Utilities.formatDate(new Date(), 'Asia/Kolkata', 'yyyy-MM-dd');
  const sales = readSheet('APP_SALES').filter(r => String(r.Date||'').startsWith(today));
  if (!sales.length) return;
  const income  = sales.reduce((a,r) => a+(Number(r.Total)||0), 0);
  const profit  = sales.reduce((a,r) => a+(Number(r.Profit)||0), 0);
  const pending = sales.reduce((a,r) => a+(Number(r.Pending)||0), 0);
  const body = `Meenatchi Traders Daily Report — ${today}\n\nOrders: ${sales.length}\nIncome: Rs.${income.toFixed(2)}\nProfit: Rs.${profit.toFixed(2)}\nPending: Rs.${pending.toFixed(2)}\n\n${sales.slice(0,5).map(s=>`- ${s.Customer}: ${s.Product} x${s.Qty} = Rs.${s.Total}`).join('\n')}`;
  MailApp.sendEmail(Session.getActiveUser().getEmail(), `Meenatchi Traders Report ${today}`, body);
}
