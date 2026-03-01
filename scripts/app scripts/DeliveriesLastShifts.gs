// Code.gs

const SHEET_ID = "1_17ujg_-bt3LdYR4Ie9tQgR_sdV9154XOFKCgjL__rU";
const SHEET_NAME = "Delivery";

// A=1, B=2, ...
const COL = {
  user: 1,        // A Usuário (email)
  city: 2,        // B Cidade
  dateStart: 3,   // C Data Inicio
  timeStart: 4,   // D Hora de Início
  dateEnd: 6,     // F Data Fim (fallback sort)
  dur: 7,         // G Duração (DURAÇÃO TOTAL DO TURNO)
  deliveries: 16, // P Total de Entregas
  encomIni: 17,   // Q Encomendas Inicial (saída)
  incid: 18,      // R Incidências
};

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || "").trim();
    const username = String((e && e.parameter && e.parameter.username) || "").trim();
    const monthOffset = parseInt(String((e && e.parameter && e.parameter.monthOffset) || "0"), 10) || 0;

    if (!action) return json_({ ok: false, error: "Missing action" });

    if (action === "getDeliveryMonthShifts") {
      if (!username) return json_({ ok: false, error: "Missing username" });
      const res = getDeliveryMonthShifts_(username, monthOffset);
      return json_({ ok: true, monthLabel: res.monthLabel, history: res.history });
    }

    if (action === "getLastDeliveryShift") {
      if (!username) return json_({ ok: false, error: "Missing username" });
      return json_({ ok: true, last: getLastDeliveryShift_(username) });
    }

    return json_({ ok: false, error: "Unknown action: " + action });
  } catch (err) {
    return json_({ ok: false, error: String(err && err.message ? err.message : err) });
  }
}

// ========= CORE =========

function getDeliveryMonthShifts_(username, monthOffset) {
  const data = getData_();
  const values = data.values;
  const display = data.display;

  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth() - (monthOffset || 0), 1);
  const ty = target.getFullYear();
  const tm = target.getMonth();

  const items = [];

  for (var i = 0; i < values.length; i++) {
    const rowV = values[i];
    const rowD = display[i];

    if (!matchUser_(rowV[COL.user - 1], username)) continue;

    const d = dateOnly_(rowV[COL.dateStart - 1], rowD[COL.dateStart - 1]);
    if (!d) continue;

    if (d.getFullYear() === ty && d.getMonth() === tm) {
      items.push({ _ts: rowTimestamp_(rowV, rowD), item: mapRow_(rowV, rowD) });
    }
  }

  items.sort(function (a, b) { return b._ts - a._ts; });

  return {
    monthLabel: monthLabelPT_(monthOffset),
    history: items.map(function (x) { return x.item; }),
  };
}

function getLastDeliveryShift_(username) {
  const data = getData_();
  const values = data.values;
  const display = data.display;

  let best = null;
  let bestTs = -1;

  for (var i = 0; i < values.length; i++) {
    const rowV = values[i];
    const rowD = display[i];

    if (!matchUser_(rowV[COL.user - 1], username)) continue;

    const ts = rowTimestamp_(rowV, rowD);
    if (ts > bestTs) {
      bestTs = ts;
      best = mapRow_(rowV, rowD);
    }
  }
  return best;
}

function mapRow_(rowV, rowD) {
  const dateStr = formatDatePT_(rowV[COL.dateStart - 1], rowD[COL.dateStart - 1]) || "—";
  const city = String(rowV[COL.city - 1] || rowD[COL.city - 1] || "").trim() || "—";

  const entregas = safeInt_(rowV[COL.deliveries - 1]);
  const saida = safeInt_(rowV[COL.encomIni - 1]);
  const incid = safeInt_(rowV[COL.incid - 1]);

  // ✅ DURAÇÃO: ler SEMPRE do DISPLAY da coluna G
  const durDisplay = String(rowD[COL.dur - 1] || "").trim(); // ex: "09:16:00"
  const durationSeconds = durationDisplayToSeconds_(durDisplay);

  return {
    date: dateStr,
    city,
    entregas,
    saida,
    incidencias: incid,
    durationSeconds, // usado no entregas/h
  };
}

// ========= DATA READ (values + display) =========

function getData_() {
  const ss = SpreadsheetApp.openById(SHEET_ID);
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) throw new Error('Sheet "' + SHEET_NAME + '" não existe.');

  const lastRow = sheet.getLastRow();
  const lastCol = sheet.getLastColumn();
  if (lastRow < 2) return { values: [], display: [] };

  const range = sheet.getRange(2, 1, lastRow - 1, lastCol);
  return {
    values: range.getValues(),
    display: range.getDisplayValues(),
  };
}

// ========= MATCH USER =========

function matchUser_(rowUser, inputUser) {
  const rowNorm = normalizeUser_(rowUser);
  const inpNorm = normalizeUser_(inputUser);
  if (rowNorm && inpNorm && rowNorm === inpNorm) return true;

  const rowLocal = localPart_(rowUser);
  const inpLocal = localPart_(inputUser);
  return rowLocal && inpLocal && rowLocal === inpLocal;
}

function normalizeUser_(u) {
  const s = String(u || "").trim().toLowerCase();
  return s.replace(/:+\s*$/, "");
}

function localPart_(u) {
  const s = normalizeUser_(u);
  if (!s) return "";
  const at = s.indexOf("@");
  return at > 0 ? s.slice(0, at) : s;
}

// ========= DATE/TIME HELPERS =========

function safeInt_(v) {
  const n = parseInt(String(v || "").trim(), 10);
  return isFinite(n) ? n : 0;
}

function formatDatePT_(v, displayStr) {
  // Prefer display "dd/MM/yyyy"
  const s = String(displayStr || "").trim();
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s;

  // fallback date object
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) {
    return Utilities.formatDate(v, Session.getScriptTimeZone(), "dd/MM/yyyy");
  }
  return "";
}

function parseDatePT_(s) {
  const m = String(s || "").trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  const dd = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const yy = parseInt(m[3], 10);
  const d = new Date(yy, mm - 1, dd);
  if (d.getFullYear() !== yy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

function dateOnly_(v, displayStr) {
  if (Object.prototype.toString.call(v) === "[object Date]" && !isNaN(v.getTime())) {
    return new Date(v.getFullYear(), v.getMonth(), v.getDate());
  }
  const d = parseDatePT_(displayStr);
  return d ? new Date(d.getFullYear(), d.getMonth(), d.getDate()) : null;
}

function rowTimestamp_(rowV, rowD) {
  const d = dateOnly_(rowV[COL.dateStart - 1], rowD[COL.dateStart - 1]);
  const timeDisp = String(rowD[COL.timeStart - 1] || "").trim();

  if (d) {
    let h = 0, m = 0, s = 0;
    const mt = timeDisp.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
    if (mt) {
      h = parseInt(mt[1], 10) || 0;
      m = parseInt(mt[2], 10) || 0;
      s = parseInt(mt[3] || "0", 10) || 0;
    }
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m, s).getTime();
  }

  // fallback
  const df = rowV[COL.dateEnd - 1];
  const num = Number(df);
  if (isFinite(num) && num > 1000000000) return num;

  return 0;
}

// ========= DURATION (COL G) =========

function durationDisplayToSeconds_(displayStr) {
  const s = String(displayStr || "").trim();
  // aceita "H:mm:ss", "HH:mm:ss", e também "H:mm"
  const m = s.match(/^(\d{1,3}):(\d{2})(?::(\d{2}))?$/);
  if (!m) return 0;

  const h = parseInt(m[1], 10) || 0;
  const mi = parseInt(m[2], 10) || 0;
  const se = parseInt(m[3] || "0", 10) || 0;
  return (h * 3600) + (mi * 60) + se;
}

// ========= MONTH LABEL =========

function monthLabelPT_(monthOffset) {
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const now = new Date();
  const d = new Date(now.getFullYear(), now.getMonth() - (monthOffset || 0), 1);
  return months[d.getMonth()] + " " + d.getFullYear();
}

// ========= JSON =========

function json_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}