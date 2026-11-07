// Receives the website's booking and contact forms, saves each submission as a row in this Google Sheet,
// and emails it to OWNER_EMAIL. Setup steps are in docs/INTEGRATIONS.md ("Form handling: Google Apps Script").
// After editing this file: Deploy → Manage deployments → Edit (pencil) → Version: New version → Deploy.

const OWNER_EMAIL = 'yatinc@gmail.com';
const SHEETS = { order: 'Orders', contact: 'Contact messages' };
// Columns you fill in by hand while working an order. They're added to the Orders sheet but never written by the script.
const OWNER_COLUMNS = ['Payment verified', 'Notes'];

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    // Bots fill the hidden honeypot field. Pretend it worked so they don't retry.
    if (data._honey) return reply({ ok: true });
    const type = data.formType === 'contact' ? 'contact' : 'order';
    const subject = String(data._subject || (type === 'order' ? 'New order request' : 'New website message')).slice(0, 200);
    const fields = {};
    Object.keys(data).forEach((k) => {
      if (k.charAt(0) !== '_' && k !== 'formType') fields[k] = String(data[k]).slice(0, 5000);
    });

    const lock = LockService.getScriptLock();
    lock.waitLock(20000);
    try {
      appendRow(SHEETS[type], fields, type === 'order' ? OWNER_COLUMNS : []);
    } finally {
      lock.releaseLock();
    }

    const rows = Object.keys(fields)
      .map((k) => `<tr><th align="left" style="padding:4px 12px 4px 0;vertical-align:top">${esc(k)}</th><td style="padding:4px 0">${esc(fields[k]).replace(/\n/g, '<br>')}</td></tr>`)
      .join('');
    const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.email || '') ? fields.email : '';
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject,
      htmlBody: `<table style="font-family:sans-serif;font-size:14px;border-collapse:collapse">${rows}</table><p style="font-family:sans-serif;font-size:12px;color:#666">Saved to the "${SHEETS[type]}" sheet.</p>`,
      body: Object.keys(fields).map((k) => `${k}: ${fields[k]}`).join('\n'),
      replyTo: email || undefined,
      name: 'Website forms',
    });
    return reply({ ok: true });
  } catch (err) {
    console.error(err);
    return reply({ ok: false, error: String(err) });
  }
}

// Visiting the web app URL in a browser checks that it's deployed, without sending anything.
function doGet() {
  return reply({ ok: true, service: 'website-forms' });
}

function appendRow(name, fields, extraColumns) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  let headers = sheet.getLastColumn() ? sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0] : [];
  if (!headers.length) {
    headers = ['Received'];
    sheet.setFrozenRows(1);
  }
  // New field names get a new column, so changing the form never breaks the sheet.
  Object.keys(fields).concat(extraColumns).forEach((k) => {
    if (headers.indexOf(k) === -1) headers.push(k);
  });
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  // Prefix values that look like formulas so a submitted "=..." is stored as text.
  const row = headers.map((h) => (h === 'Received' ? new Date() : fields[h] == null ? '' : String(fields[h]).replace(/^([=+\-@])/, "'$1")));
  sheet.appendRow(row);
}

function reply(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
}
