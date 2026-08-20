/**
 * SSH Educational Materials - Access Logger
 *
 * GitHub Pages から送信された以下のイベントを
 * Google スプレッドシートへ記録します。
 *
 * - page_view     : サイト閲覧
 * - material_view : 資料カード閲覧
 * - download      : ダウンロード
 *
 * 記録先:
 * https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/
 */

const SPREADSHEET_ID = '1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE';
const LOG_SHEET_NAME = 'アクセスログ';

const ALLOWED_EVENTS = new Set([
  'page_view',
  'material_view',
  'download'
]);

function doGet(e) {
  const params = (e && e.parameter) ? e.parameter : {};

  if (params.mode === 'stats') {
    return createStatsResponse_(params.callback || '');
  }

  const eventName = String(params.event || '').trim();

  if (!ALLOWED_EVENTS.has(eventName)) {
    return ContentService
      .createTextOutput('ignored')
      .setMimeType(ContentService.MimeType.TEXT);
  }

  appendAccessLog_({
    eventName,
    materialId: params.material_id || '',
    title: params.title || '',
    fileName: params.file_name || '',
    pageUrl: params.page_url || '',
    referrer: params.referrer || ''
  });

  return ContentService
    .createTextOutput('ok')
    .setMimeType(ContentService.MimeType.TEXT);
}


/**
 * 必要なら最初に一度だけ手動実行できます。
 * 「アクセスログ」シートを作成し、ヘッダーを設定します。
 */
function setupAccessLogSheet() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  getOrCreateLogSheet_(ss);
}


/**
 * ログを1行追記
 */
function appendAccessLog_(data) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = getOrCreateLogSheet_(ss);

    sheet.appendRow([
      new Date(),
      safeCell_(data.eventName, 50),
      safeCell_(data.materialId, 150),
      safeCell_(data.title, 300),
      safeCell_(data.fileName, 300),
      safeCell_(data.pageUrl, 1000),
      safeCell_(data.referrer, 1000)
    ]);
  } finally {
    lock.releaseLock();
  }
}


/**
 * ログシートを取得。なければ作成。
 */
function getOrCreateLogSheet_(ss) {
  let sheet = ss.getSheetByName(LOG_SHEET_NAME);

  if (!sheet) {
    sheet = ss.insertSheet(LOG_SHEET_NAME);
  }

  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, 7).setValues([[
      '日時',
      'イベント',
      '資料ID',
      '資料名',
      'ファイル名',
      'ページURL',
      '参照元'
    ]]);

    sheet.getRange(1, 1, 1, 7)
      .setFontWeight('bold')
      .setBackground('#d9ead3');

    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 170);
    sheet.setColumnWidth(2, 130);
    sheet.setColumnWidth(3, 220);
    sheet.setColumnWidth(4, 360);
    sheet.setColumnWidth(5, 320);
    sheet.setColumnWidth(6, 420);
    sheet.setColumnWidth(7, 420);
  }

  return sheet;
}


/**
 * 現在の集計値をJSONPで返す。
 *
 * GitHub Pages → Apps Script という別オリジン通信でも
 * 静的サイトから簡単に読み込めるようJSONPを使用しています。
 */
function createStatsResponse_(callback) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = getOrCreateLogSheet_(ss);
  const values = sheet.getDataRange().getValues();

  let pageViews = 0;
  const materialViews = {};
  const downloads = {};

  for (let i = 1; i < values.length; i++) {
    const eventName = String(values[i][1] || '');
    const materialId = String(values[i][2] || '');

    if (eventName === 'page_view') {
      pageViews++;
      continue;
    }

    if (!materialId) continue;

    if (eventName === 'material_view') {
      materialViews[materialId] = (materialViews[materialId] || 0) + 1;
    }

    if (eventName === 'download') {
      downloads[materialId] = (downloads[materialId] || 0) + 1;
    }
  }

  const payload = {
    pageViews,
    materialViews,
    downloads,
    generatedAt: new Date().toISOString()
  };

  const json = JSON.stringify(payload);
  const safeCallback = safeCallbackName_(callback);

  if (safeCallback) {
    return ContentService
      .createTextOutput(`${safeCallback}(${json});`)
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }

  return ContentService
    .createTextOutput(json)
    .setMimeType(ContentService.MimeType.JSON);
}


/**
 * JSONPコールバック名を検証。
 */
function safeCallbackName_(value) {
  const s = String(value || '').trim();

  if (!s) return '';

  return /^[A-Za-z_$][0-9A-Za-z_$]{0,100}$/.test(s)
    ? s
    : '';
}


/**
 * スプレッドシートへの式注入を防ぎつつ、文字列長も制限。
 */
function safeCell_(value, maxLength) {
  let s = String(value == null ? '' : value);

  if (s.length > maxLength) {
    s = s.slice(0, maxLength);
  }

  if (/^[=+\-@]/.test(s)) {
    s = "'" + s;
  }

  return s;
}
