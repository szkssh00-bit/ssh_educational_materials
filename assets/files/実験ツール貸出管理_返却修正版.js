/**
 * 実験ツール貸出管理システム
 * 管理台帳一元管理版
 *
 * 重要方針：
 * - 01_管理台帳を正本とする。
 * - 1行＝1個体。
 * - 物品マスタ、個体台帳、貸出状況、表示制御をすべて01_管理台帳に集約する。
 * - フォームは01_管理台帳から動的に更新する。
 * - 管理者は01_管理台帳を直接修正できる。
 */

const SYSTEM_NAME = '実験ツール貸出管理システム';

const SHEET_DASHBOARD = '00_管理画面';
const SHEET_LEDGER = '01_管理台帳';
const SHEET_LOANS = '02_貸出履歴';
const SHEET_LOG = '03_操作ログ';
const SHEET_SUMMARY = '04_集計';
const SHEET_OVERDUE = '05_期限超過';
const SHEET_CHECK = '06_要確認';

const STATUS_AVAILABLE = '利用可能';
const STATUS_BORROWED = '貸出中';
const STATUS_CHECK = '要確認';
const STATUS_STOPPED = '使用停止';
const STATUS_RETIRED = '廃止';

const DISPLAY_ON = '表示';
const DISPLAY_OFF = '非表示';

const DEFAULT_ITEMS = [
  ['100mLメスフラスコ', 2],
  ['50mLメスフラスコ', 2],
  ['10mLメスフラスコ', 2],
  ['電子ノギス', 3],
  ['pH試験紙', 2],
  ['土壌計', 2],
  ['CO2計', 1],
  ['熱電対温度計', 4],
  ['防水温度プローブ', 14],
  ['温湿度計', 8],
  ['放射温度計', 2],
  ['照度計', 3],
  ['騒音計', 4],
  ['風速計', 4],
  ['糖度計', 3],
  ['EC計', 3],
  ['アルコール計', 3],
  ['EMF計(電磁波計)', 1],
  ['吊り下げ秤', 2],
  ['フォーズゲージ', 4],
  ['デジタルマルチメーター', 5],
  ['pHメーター', 3],
  ['体重計', 1],
  ['アルコールガス計', 3],
  ['電子天秤(0.1gスケール)', 5],
  ['電池式防犯カメラ', 2],
  ['匂いセンサー', 1]
];

/**
 * 初回セットアップ
 */
function setupToolLendingSystem() {
  const ss = SpreadsheetApp.create(SYSTEM_NAME);

  setupSheets_(ss);
  setupDashboard_(ss);
  setupLedger_(ss);
  setupLoanSheet_(ss);
  setupLogSheet_(ss);
  setupSummarySheets_(ss);

  const form = createMainForm_(ss);

  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: ss.getId(),
    FORM_ID: form.getId()
  });

  createTriggers_(form);

  normalizeLedger();
  refreshAllFormChoices();

  const dashboard = ss.getSheetByName(SHEET_DASHBOARD);
  dashboard.getRange('B2').setValue(ss.getUrl());
  dashboard.getRange('B3').setValue(form.getPublishedUrl());
  dashboard.getRange('B4').setValue(form.getEditUrl());

  Logger.log('管理用スプレッドシート: ' + ss.getUrl());
  Logger.log('フォーム回答URL: ' + form.getPublishedUrl());
  Logger.log('フォーム編集URL: ' + form.getEditUrl());
}

/**
 * 既存スプレッドシート上で構築する場合
 */
function setupToolLendingSystemInActiveSpreadsheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();

  setupSheets_(ss);
  setupDashboard_(ss);
  setupLedger_(ss);
  setupLoanSheet_(ss);
  setupLogSheet_(ss);
  setupSummarySheets_(ss);

  const form = createMainForm_(ss);

  PropertiesService.getScriptProperties().setProperties({
    SPREADSHEET_ID: ss.getId(),
    FORM_ID: form.getId()
  });

  createTriggers_(form);

  normalizeLedger();
  refreshAllFormChoices();

  const dashboard = ss.getSheetByName(SHEET_DASHBOARD);
  dashboard.getRange('B2').setValue(ss.getUrl());
  dashboard.getRange('B3').setValue(form.getPublishedUrl());
  dashboard.getRange('B4').setValue(form.getEditUrl());
}

/**
 * 必要シート作成
 */
function setupSheets_(ss) {
  const names = [
    SHEET_DASHBOARD,
    SHEET_LEDGER,
    SHEET_LOANS,
    SHEET_LOG,
    SHEET_SUMMARY,
    SHEET_OVERDUE,
    SHEET_CHECK
  ];

  names.forEach(name => {
    if (!ss.getSheetByName(name)) {
      ss.insertSheet(name);
    }
  });

  const blankSheets = ss.getSheets().filter(s => /^シート\d*$|^Sheet\d*$/.test(s.getName()));
  blankSheets.forEach(s => {
    if (s.getLastRow() === 0 || s.getLastRow() === 1) {
      ss.deleteSheet(s);
    }
  });
}

/**
 * 管理画面
 */
function setupDashboard_(ss) {
  const sheet = ss.getSheetByName(SHEET_DASHBOARD);
  sheet.clear();

  const rows = [
    ['項目', '設定値・URL'],
    ['管理用スプレッドシートURL', ''],
    ['フォーム回答URL', ''],
    ['フォーム編集URL', ''],
    ['', ''],
    ['管理者メール', 'fuchigami.yuta@sist.ac.jp'],
    ['CCメール', 'tsukagoshi.mitsuru@sist.ac.jp'],
    ['フォームタイトル', '実験ツール貸出・返却フォーム'],
    ['フォーム説明', '実験ツールの貸出または返却を記録してください。最初に処理区分を選ぶと必要な画面に進みます。'],
    ['期限超過チェック時刻', 8],
    ['', ''],
    ['運用ルール', ''],
    ['1', 'すべての物品情報は「01_管理台帳」に集約する。'],
    ['2', '新規物品は「01_管理台帳」の最終行に物品名と必要情報を追加する。'],
    ['3', '個体ID・物品コード・個体番号が空欄でも「管理台帳を整備」で自動採番する。'],
    ['4', '数量を増やす場合は同じ物品名の行を追加する。または選択行から「同種を1個追加」を使う。'],
    ['5', '数量を減らす場合は行を削除せず、管理状態を「廃止」またはフォーム表示を「非表示」にする。'],
    ['6', '借主・返却予定日・貸出状態は管理台帳上で直接修正できる。'],
    ['7', '修正後は「フォーム選択肢を更新」を実行する。']
  ];

  sheet.getRange(1, 1, rows.length, 2).setValues(rows);
  sheet.getRange('A1:B1').setFontWeight('bold').setBackground('#d9ead3');
  sheet.getRange(1, 1, rows.length, 2).setBorder(true, true, true, true, true, true);
  sheet.setColumnWidth(1, 250);
  sheet.setColumnWidth(2, 850);
}

/**
 * 管理台帳
 */
function setupLedger_(ss) {
  const sheet = ss.getSheetByName(SHEET_LEDGER);

  if (sheet.getLastRow() > 1) {
    return;
  }

  sheet.clear();

  const headers = [
    '個体ID',
    '物品コード',
    '物品名',
    '個体番号',
    '管理状態',
    'フォーム表示',
    '現在の借主',
    '学年組番号',
    '使用目的',
    '貸出日時',
    '返却予定日',
    '貸出ID',
    '最終返却日時',
    '最終返却時状態',
    '管理備考',
    '最終更新'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);

  const rows = [];

  DEFAULT_ITEMS.forEach((item, index) => {
    const itemName = item[0];
    const quantity = item[1];
    const code = createItemCode_(index + 1);

    for (let i = 1; i <= quantity; i++) {
      rows.push([
        `${code}-${String(i).padStart(2, '0')}`,
        code,
        itemName,
        i,
        STATUS_AVAILABLE,
        DISPLAY_ON,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        new Date()
      ]);
    }
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([
      STATUS_AVAILABLE,
      STATUS_BORROWED,
      STATUS_CHECK,
      STATUS_STOPPED,
      STATUS_RETIRED
    ], true)
    .build();

  const displayRule = SpreadsheetApp.newDataValidation()
    .requireValueInList([DISPLAY_ON, DISPLAY_OFF], true)
    .build();

  sheet.getRange(2, 5, 1000, 1).setDataValidation(statusRule);
  sheet.getRange(2, 6, 1000, 1).setDataValidation(displayRule);

  formatSheet_(sheet, headers.length);
  sheet.setFrozenRows(1);
}

/**
 * 貸出履歴
 */
function setupLoanSheet_(ss) {
  const sheet = ss.getSheetByName(SHEET_LOANS);

  if (sheet.getLastRow() > 1) {
    return;
  }

  sheet.clear();

  const headers = [
    '貸出ID',
    '状態',
    '個体ID',
    '物品コード',
    '物品名',
    '借主氏名',
    '学年組番号',
    '使用目的',
    '貸出日時',
    '返却予定日',
    '返却日時',
    '返却時状態',
    '貸出時備考',
    '返却時備考'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatSheet_(sheet, headers.length);
}

/**
 * 操作ログ
 */
function setupLogSheet_(ss) {
  const sheet = ss.getSheetByName(SHEET_LOG);

  if (sheet.getLastRow() > 1) {
    return;
  }

  sheet.clear();

  const headers = [
    '記録日時',
    '処理',
    '処理結果',
    '貸出ID',
    '個体ID',
    '物品コード',
    '物品名',
    '氏名',
    '学年組番号',
    '備考'
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  formatSheet_(sheet, headers.length);
}

/**
 * 集計系シート
 */
function setupSummarySheets_(ss) {
  setupSummarySheet_(ss);
  setupOverdueSheet_(ss);
  setupCheckSheet_(ss);
}

/**
 * 集計
 */
function setupSummarySheet_(ss) {
  const sheet = ss.getSheetByName(SHEET_SUMMARY);
  sheet.clear();

  sheet.getRange('A1:I1').setValues([[
    '物品コード',
    '物品名',
    '総数',
    '利用可能',
    '貸出中',
    '要確認',
    '使用停止',
    '廃止',
    '現在の借主'
  ]]);

  sheet.getRange('A2').setFormula(
    `=SORT(UNIQUE(FILTER('${SHEET_LEDGER}'!B:C,'${SHEET_LEDGER}'!B:B<>"",'${SHEET_LEDGER}'!F:F="表示")),2,TRUE)`
  );

  sheet.getRange('C2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="","",COUNTIFS('${SHEET_LEDGER}'!B:B,A2:A,'${SHEET_LEDGER}'!F:F,"表示")))`
  );

  sheet.getRange('D2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="","",COUNTIFS('${SHEET_LEDGER}'!B:B,A2:A,'${SHEET_LEDGER}'!E:E,"利用可能",'${SHEET_LEDGER}'!F:F,"表示")))`
  );

  sheet.getRange('E2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="","",COUNTIFS('${SHEET_LEDGER}'!B:B,A2:A,'${SHEET_LEDGER}'!E:E,"貸出中",'${SHEET_LEDGER}'!F:F,"表示")))`
  );

  sheet.getRange('F2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="","",COUNTIFS('${SHEET_LEDGER}'!B:B,A2:A,'${SHEET_LEDGER}'!E:E,"要確認",'${SHEET_LEDGER}'!F:F,"表示")))`
  );

  sheet.getRange('G2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="","",COUNTIFS('${SHEET_LEDGER}'!B:B,A2:A,'${SHEET_LEDGER}'!E:E,"使用停止",'${SHEET_LEDGER}'!F:F,"表示")))`
  );

  sheet.getRange('H2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="","",COUNTIFS('${SHEET_LEDGER}'!B:B,A2:A,'${SHEET_LEDGER}'!E:E,"廃止")))`
  );

  sheet.getRange('I2').setFormula(
    `=ARRAYFORMULA(IF(A2:A="","",BYROW(A2:A,LAMBDA(code,IF(code="","",IFERROR(TEXTJOIN("、",TRUE,FILTER('${SHEET_LEDGER}'!G:G,'${SHEET_LEDGER}'!B:B=code,'${SHEET_LEDGER}'!E:E="貸出中")),""))))))`
  );

  formatSheet_(sheet, 9);
}

/**
 * 期限超過
 */
function setupOverdueSheet_(ss) {
  const sheet = ss.getSheetByName(SHEET_OVERDUE);
  sheet.clear();

  sheet.getRange('A1').setValue('期限超過一覧');
  sheet.getRange('A2:K2').setValues([[
    '個体ID',
    '物品コード',
    '物品名',
    '借主氏名',
    '学年組番号',
    '使用目的',
    '貸出日時',
    '返却予定日',
    '超過日数',
    '貸出ID',
    '管理備考'
  ]]);

  sheet.getRange('A3').setFormula(
    `=FILTER({'${SHEET_LEDGER}'!A:A,'${SHEET_LEDGER}'!B:B,'${SHEET_LEDGER}'!C:C,'${SHEET_LEDGER}'!G:G,'${SHEET_LEDGER}'!H:H,'${SHEET_LEDGER}'!I:I,'${SHEET_LEDGER}'!J:J,'${SHEET_LEDGER}'!K:K,TODAY()-'${SHEET_LEDGER}'!K:K,'${SHEET_LEDGER}'!L:L,'${SHEET_LEDGER}'!O:O},'${SHEET_LEDGER}'!E:E="貸出中",'${SHEET_LEDGER}'!K:K<TODAY())`
  );

  sheet.getRange('A1').setFontWeight('bold');
  sheet.getRange('A2:K2').setFontWeight('bold').setBackground('#f4cccc');
  sheet.setColumnWidths(1, 11, 150);
}

/**
 * 要確認
 */
function setupCheckSheet_(ss) {
  const sheet = ss.getSheetByName(SHEET_CHECK);
  sheet.clear();

  sheet.getRange('A1').setValue('要確認・使用停止・廃止一覧');
  sheet.getRange('A3').setFormula(
    `=FILTER('${SHEET_LEDGER}'!A:P,('${SHEET_LEDGER}'!E:E="要確認")+('${SHEET_LEDGER}'!E:E="使用停止")+('${SHEET_LEDGER}'!E:E="廃止"))`
  );

  sheet.getRange('A1').setFontWeight('bold');
  sheet.setColumnWidths(1, 16, 150);
}

/**
 * フォーム作成
 */
function createMainForm_(ss) {
  const settings = getDashboardSettings_(ss);

  const form = FormApp.create(settings.formTitle);

  form.setDescription(settings.formDescription);
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());
  form.setProgressBar(true);

  const actionItem = form.addMultipleChoiceItem()
    .setTitle('処理区分')
    .setRequired(true);

  const borrowSection = form.addPageBreakItem()
    .setTitle('貸出')
    .setHelpText('借りたい物品、氏名、返却予定日を入力してください。')
    .setGoToPage(FormApp.PageNavigationType.SUBMIT);

  form.addListItem()
    .setTitle('借りたい物品')
    .setChoiceValues(['初期設定中'])
    .setRequired(true);

  form.addTextItem()
    .setTitle('氏名')
    .setRequired(true);

  form.addTextItem()
    .setTitle('学年組番号')
    .setHelpText('例：2年3組15番')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('使用目的')
    .setHelpText('例：課題研究、授業実験、部活動など')
    .setRequired(true);

  form.addDateItem()
    .setTitle('返却予定日')
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('貸出時備考')
    .setRequired(false);

  const returnSection = form.addPageBreakItem()
    .setTitle('返却')
    .setHelpText('現在貸出中の記録から、返却する物品を選んでください。')
    .setGoToPage(FormApp.PageNavigationType.SUBMIT);

  form.addListItem()
    .setTitle('返却する貸出記録')
    .setChoiceValues(['現在貸出中の物品はありません'])
    .setRequired(true);

  form.addMultipleChoiceItem()
    .setTitle('返却時状態')
    .setChoiceValues(['正常', '破損', '部品不足', '要確認', '紛失'])
    .setRequired(true);

  form.addParagraphTextItem()
    .setTitle('返却時備考')
    .setRequired(false);

  actionItem.setChoices([
    actionItem.createChoice('貸出', borrowSection),
    actionItem.createChoice('返却', returnSection)
  ]);

  return form;
}

/**
 * 管理台帳整備
 * 空欄の物品コード、個体番号、個体IDを補完する。
 */
function normalizeLedger() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = getSystemSpreadsheet_();
    const sheet = ss.getSheetByName(SHEET_LEDGER);

    const lastRow = sheet.getLastRow();
    if (lastRow < 2) return;

    const range = sheet.getRange(2, 1, lastRow - 1, 16);
    const values = range.getValues();

    const nameToCode = {};
    let maxCodeNo = 0;

    values.forEach(row => {
      const code = String(row[1] || '').trim();
      const name = String(row[2] || '').trim();

      if (code) {
        const m = code.match(/^TOOL(\d+)$/);
        if (m) maxCodeNo = Math.max(maxCodeNo, Number(m[1]));
      }

      if (code && name && !nameToCode[name]) {
        nameToCode[name] = code;
      }
    });

    const codeToMaxUnit = {};

    values.forEach(row => {
      const code = String(row[1] || '').trim();
      const unitNo = Number(row[3]) || 0;

      if (!code) return;
      if (!codeToMaxUnit[code]) codeToMaxUnit[code] = 0;
      codeToMaxUnit[code] = Math.max(codeToMaxUnit[code], unitNo);
    });

    for (let i = 0; i < values.length; i++) {
      const row = values[i];

      let unitId = String(row[0] || '').trim();
      let code = String(row[1] || '').trim();
      const name = String(row[2] || '').trim();
      let unitNo = Number(row[3]) || 0;
      let status = String(row[4] || '').trim();
      let display = String(row[5] || '').trim();

      if (!name) continue;

      if (!code) {
        if (nameToCode[name]) {
          code = nameToCode[name];
        } else {
          maxCodeNo++;
          code = createItemCode_(maxCodeNo);
          nameToCode[name] = code;
        }
      }

      if (!codeToMaxUnit[code]) codeToMaxUnit[code] = 0;

      if (!unitNo) {
        codeToMaxUnit[code]++;
        unitNo = codeToMaxUnit[code];
      }

      if (!unitId) {
        unitId = `${code}-${String(unitNo).padStart(2, '0')}`;
      }

      if (!status) {
        status = STATUS_AVAILABLE;
      }

      if (!display) {
        display = DISPLAY_ON;
      }

      row[0] = unitId;
      row[1] = code;
      row[3] = unitNo;
      row[4] = status;
      row[5] = display;
      row[15] = new Date();
    }

    range.setValues(values);
    setupSummarySheets_(ss);
    refreshAllFormChoices();

  } finally {
    lock.releaseLock();
  }
}

/**
 * 選択行と同じ物品を1個追加
 */
function addOneSameItemFromSelectedRow() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getActiveSheet();

  if (sheet.getName() !== SHEET_LEDGER) {
    SpreadsheetApp.getUi().alert('01_管理台帳で追加元の行を選択してください。');
    return;
  }

  const row = sheet.getActiveRange().getRow();

  if (row < 2) {
    SpreadsheetApp.getUi().alert('追加元の物品行を選択してください。');
    return;
  }

  const values = sheet.getRange(row, 1, 1, 16).getValues()[0];

  const code = values[1];
  const name = values[2];

  if (!code || !name) {
    SpreadsheetApp.getUi().alert('物品コードと物品名がある行を選択してください。');
    return;
  }

  const all = sheet.getDataRange().getValues();
  let maxUnitNo = 0;

  for (let i = 1; i < all.length; i++) {
    if (all[i][1] === code) {
      maxUnitNo = Math.max(maxUnitNo, Number(all[i][3]) || 0);
    }
  }

  const newUnitNo = maxUnitNo + 1;
  const unitId = `${code}-${String(newUnitNo).padStart(2, '0')}`;

  sheet.appendRow([
    unitId,
    code,
    name,
    newUnitNo,
    STATUS_AVAILABLE,
    DISPLAY_ON,
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '',
    '選択行から同種個体を追加',
    new Date()
  ]);

  refreshAllFormChoices();
}

/**
 * フォーム選択肢更新
 */
function refreshAllFormChoices() {
  const ss = getSystemSpreadsheet_();
  const formId = PropertiesService.getScriptProperties().getProperty('FORM_ID');

  if (!formId) {
    throw new Error('FORM_IDが設定されていません。setupToolLendingSystem()を先に実行してください。');
  }

  const form = FormApp.openById(formId);

  updateFormSettings_(ss, form);
  repairFormNavigation_(form);
  refreshBorrowChoices_(ss, form);
  refreshReturnChoices_(ss, form);
}

/**
 * 既存フォームの分岐を修復
 * 貸出・返却の各セクション入力後は、そのまま送信する。
 */
function repairFormNavigation_(form) {
  getFormItemByTitle_(form, '貸出')
    .asPageBreakItem()
    .setGoToPage(FormApp.PageNavigationType.SUBMIT);

  getFormItemByTitle_(form, '返却')
    .asPageBreakItem()
    .setGoToPage(FormApp.PageNavigationType.SUBMIT);
}

/**
 * フォーム設定反映
 */
function updateFormSettings_(ss, form) {
  const settings = getDashboardSettings_(ss);

  form.setTitle(settings.formTitle);
  form.setDescription(settings.formDescription);
}

/**
 * 貸出選択肢
 */
function refreshBorrowChoices_(ss, form) {
  const stock = createStockSummary_(ss);

  const choices = stock.map(item => {
    const borrowerText = item.borrowers.length > 0
      ? `｜貸出中: ${item.borrowers.join('、')}`
      : '';

    if (item.available <= 0) {
      return `【貸出不可】${item.code}｜${item.name}｜残数 0/${item.total}${borrowerText}`;
    }

    return `${item.code}｜${item.name}｜残数 ${item.available}/${item.total}${borrowerText}`;
  });

  getFormItemByTitle_(form, '借りたい物品')
    .asListItem()
    .setChoiceValues(choices.length ? choices : ['貸出可能な物品はありません']);
}

/**
 * 返却選択肢
 */
function refreshReturnChoices_(ss, form) {
  const sheet = ss.getSheetByName(SHEET_LEDGER);
  const values = sheet.getDataRange().getValues();

  const choices = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    const unitId = row[0];
    const code = row[1];
    const name = row[2];
    const status = row[4];
    const borrower = row[6];
    const studentInfo = row[7];
    const borrowDate = row[9];
    const dueDate = row[10];
    const loanId = row[11];

    if (status === STATUS_BORROWED && loanId) {
      choices.push(
        `${loanId}｜${name}｜借主: ${borrower}（${studentInfo}）｜貸出日: ${formatDate_(borrowDate)}｜返却予定: ${formatDate_(dueDate)}｜個体ID: ${unitId}`
      );
    }
  }

  getFormItemByTitle_(form, '返却する貸出記録')
    .asListItem()
    .setChoiceValues(choices.length ? choices : ['現在貸出中の物品はありません']);
}

/**
 * フォーム送信
 */
function handleFormSubmit(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);

  try {
    const ss = getSystemSpreadsheet_();
    const data = getFormResponseObject_(e);
    const action = data['処理区分'];

    if (action === '貸出') {
      processBorrowSubmit_(ss, data);
    } else if (action === '返却') {
      processReturnSubmit_(ss, data);
    } else {
      appendOperationLog_(ss, '不明', 'エラー：処理区分が取得できません', '', '', '', '', '', '', JSON.stringify(data));
    }

    setupSummarySheets_(ss);
    refreshAllFormChoices();

  } finally {
    lock.releaseLock();
  }
}

/**
 * 貸出処理
 */
function processBorrowSubmit_(ss, data) {
  const ledger = ss.getSheetByName(SHEET_LEDGER);

  const selected = data['借りたい物品'] || '';
  const parsed = parseBorrowChoice_(selected);

  const name = data['氏名'] || '';
  const studentInfo = data['学年組番号'] || '';
  const purpose = data['使用目的'] || '';
  const dueDate = data['返却予定日'] || '';
  const note = data['貸出時備考'] || '';
  const timestamp = new Date();

  if (!parsed.code || selected.indexOf('貸出不可') !== -1) {
    appendOperationLog_(ss, '貸出', 'エラー：貸出不可または不正な物品が選択されました', '', '', parsed.code, parsed.name, name, studentInfo, selected);
    return;
  }

  const target = findFirstAvailableLedgerRow_(ledger, parsed.code);

  if (!target) {
    appendOperationLog_(ss, '貸出', 'エラー：利用可能な個体がありません', '', '', parsed.code, parsed.name, name, studentInfo, '');
    return;
  }

  const loanId = createLoanId_();

  ledger.getRange(target.row, 5).setValue(STATUS_BORROWED);
  ledger.getRange(target.row, 7).setValue(name);
  ledger.getRange(target.row, 8).setValue(studentInfo);
  ledger.getRange(target.row, 9).setValue(purpose);
  ledger.getRange(target.row, 10).setValue(timestamp);
  ledger.getRange(target.row, 11).setValue(dueDate);
  ledger.getRange(target.row, 12).setValue(loanId);
  ledger.getRange(target.row, 15).setValue(note);
  ledger.getRange(target.row, 16).setValue(timestamp);

  const loanSheet = ss.getSheetByName(SHEET_LOANS);

  loanSheet.appendRow([
    loanId,
    STATUS_BORROWED,
    target.unitId,
    target.code,
    target.name,
    name,
    studentInfo,
    purpose,
    timestamp,
    dueDate,
    '',
    '',
    note,
    ''
  ]);

  appendOperationLog_(ss, '貸出', '貸出処理完了', loanId, target.unitId, target.code, target.name, name, studentInfo, note);
}

/**
 * 返却処理
 */
function processReturnSubmit_(ss, data) {
  const ledger = ss.getSheetByName(SHEET_LEDGER);
  const loanSheet = ss.getSheetByName(SHEET_LOANS);

  const selected = data['返却する貸出記録'] || '';
  const loanId = extractLoanId_(selected);
  const condition = data['返却時状態'] || '';
  const returnNote = data['返却時備考'] || '';
  const timestamp = new Date();

  if (!loanId || selected === '現在貸出中の物品はありません') {
    appendOperationLog_(ss, '返却', 'エラー：返却対象が選択されていません', '', '', '', '', '', '', selected);
    return;
  }

  const ledgerRow = findLedgerRowByLoanId_(ledger, loanId);

  if (!ledgerRow) {
    appendOperationLog_(ss, '返却', 'エラー：貸出IDが管理台帳に見つかりません', loanId, '', '', '', '', '', selected);
    return;
  }

  const nextStatus = condition === '正常' ? STATUS_AVAILABLE : STATUS_CHECK;

  ledger.getRange(ledgerRow.row, 5).setValue(nextStatus);
  ledger.getRange(ledgerRow.row, 7).setValue('');
  ledger.getRange(ledgerRow.row, 8).setValue('');
  ledger.getRange(ledgerRow.row, 9).setValue('');
  ledger.getRange(ledgerRow.row, 10).setValue('');
  ledger.getRange(ledgerRow.row, 11).setValue('');
  ledger.getRange(ledgerRow.row, 12).setValue('');
  ledger.getRange(ledgerRow.row, 13).setValue(timestamp);
  ledger.getRange(ledgerRow.row, 14).setValue(condition);
  ledger.getRange(ledgerRow.row, 15).setValue(returnNote);
  ledger.getRange(ledgerRow.row, 16).setValue(timestamp);

  updateLoanAsReturned_(loanSheet, loanId, timestamp, condition, returnNote);

  appendOperationLog_(
    ss,
    '返却',
    condition === '正常' ? '返却処理完了' : '返却処理完了：状態確認が必要',
    loanId,
    ledgerRow.unitId,
    ledgerRow.code,
    ledgerRow.name,
    ledgerRow.borrower,
    ledgerRow.studentInfo,
    returnNote
  );

  if (condition !== '正常') {
    sendAbnormalReturnMail_(ss, {
      loanId,
      unitId: ledgerRow.unitId,
      code: ledgerRow.code,
      name: ledgerRow.name,
      borrower: ledgerRow.borrower,
      studentInfo: ledgerRow.studentInfo,
      condition,
      returnNote,
      timestamp
    });
  }
}

/**
 * 貸出履歴を返却済みにする
 */
function updateLoanAsReturned_(sheet, loanId, timestamp, condition, returnNote) {
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === loanId && values[i][1] === STATUS_BORROWED) {
      const row = i + 1;
      sheet.getRange(row, 2).setValue('返却済み');
      sheet.getRange(row, 11).setValue(timestamp);
      sheet.getRange(row, 12).setValue(condition);
      sheet.getRange(row, 14).setValue(returnNote);
      return;
    }
  }
}

/**
 * 期限超過チェック
 */
function dailyOverdueCheck() {
  const ss = getSystemSpreadsheet_();
  const settings = getDashboardSettings_(ss);
  const sheet = ss.getSheetByName(SHEET_LEDGER);
  const values = sheet.getDataRange().getValues();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const overdue = [];

  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const status = row[4];
    const dueDate = row[10];

    if (status !== STATUS_BORROWED) continue;
    if (!(dueDate instanceof Date)) continue;

    const d = new Date(dueDate);
    d.setHours(0, 0, 0, 0);

    if (d < today) {
      overdue.push({
        unitId: row[0],
        code: row[1],
        name: row[2],
        borrower: row[6],
        studentInfo: row[7],
        purpose: row[8],
        dueDate: formatDate_(d),
        diffDays: Math.floor((today - d) / (1000 * 60 * 60 * 24)),
        loanId: row[11]
      });
    }
  }

  if (overdue.length === 0) return;

  let body = '返却予定日を過ぎている実験ツールがあります。\n\n';

  overdue.forEach((item, index) => {
    body += `${index + 1}. ${item.name}\n`;
    body += `個体ID：${item.unitId}\n`;
    body += `物品コード：${item.code}\n`;
    body += `貸出ID：${item.loanId}\n`;
    body += `借主：${item.borrower}（${item.studentInfo}）\n`;
    body += `返却予定日：${item.dueDate}\n`;
    body += `超過日数：${item.diffDays}日\n`;
    body += `使用目的：${item.purpose}\n\n`;
  });

  body += `管理用スプレッドシート：\n${ss.getUrl()}`;

  MailApp.sendEmail({
    to: settings.adminEmail,
    cc: settings.ccEmail,
    subject: '【実験ツール管理】返却期限超過一覧',
    body
  });
}

/**
 * 異常返却メール
 */
function sendAbnormalReturnMail_(ss, info) {
  const settings = getDashboardSettings_(ss);

  const subject = `【実験ツール管理】返却時状態の確認が必要です：${info.name}`;

  const body =
    `返却時状態が「正常」以外で登録されました。\n\n` +
    `物品名：${info.name}\n` +
    `物品コード：${info.code}\n` +
    `個体ID：${info.unitId}\n` +
    `貸出ID：${info.loanId}\n\n` +
    `借主：${info.borrower}（${info.studentInfo}）\n` +
    `返却時状態：${info.condition}\n` +
    `返却日時：${formatDateTime_(info.timestamp)}\n\n` +
    `返却時備考：\n${info.returnNote || '記載なし'}\n\n` +
    `管理用スプレッドシート：\n${ss.getUrl()}`;

  MailApp.sendEmail({
    to: settings.adminEmail,
    cc: settings.ccEmail,
    subject,
    body
  });
}

/**
 * 集計作成
 */
function createStockSummary_(ss) {
  const sheet = ss.getSheetByName(SHEET_LEDGER);
  const values = sheet.getDataRange().getValues();

  const map = {};

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    const code = row[1];
    const name = row[2];
    const status = row[4];
    const display = row[5];
    const borrower = row[6];

    if (!code || !name) continue;
    if (display !== DISPLAY_ON) continue;

    if (!map[code]) {
      map[code] = {
        code,
        name,
        total: 0,
        available: 0,
        borrowed: 0,
        borrowers: []
      };
    }

    if (status !== STATUS_RETIRED) {
      map[code].total++;
    }

    if (status === STATUS_AVAILABLE) {
      map[code].available++;
    }

    if (status === STATUS_BORROWED) {
      map[code].borrowed++;
      if (borrower && !map[code].borrowers.includes(borrower)) {
        map[code].borrowers.push(borrower);
      }
    }
  }

  return Object.values(map).sort((a, b) => a.name.localeCompare(b.name, 'ja'));
}

/**
 * 最初の利用可能個体を探す
 */
function findFirstAvailableLedgerRow_(sheet, code) {
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    if (
      row[1] === code &&
      row[4] === STATUS_AVAILABLE &&
      row[5] === DISPLAY_ON
    ) {
      return {
        row: i + 1,
        unitId: row[0],
        code: row[1],
        name: row[2]
      };
    }
  }

  return null;
}

/**
 * 貸出IDから管理台帳行を探す
 */
function findLedgerRowByLoanId_(sheet, loanId) {
  const values = sheet.getDataRange().getValues();

  for (let i = 1; i < values.length; i++) {
    const row = values[i];

    if (row[11] === loanId && row[4] === STATUS_BORROWED) {
      return {
        row: i + 1,
        unitId: row[0],
        code: row[1],
        name: row[2],
        borrower: row[6],
        studentInfo: row[7]
      };
    }
  }

  return null;
}

/**
 * 管理画面設定取得
 */
function getDashboardSettings_(ss) {
  const sheet = ss.getSheetByName(SHEET_DASHBOARD);
  const values = sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), 2).getValues();

  const map = {};

  values.forEach(row => {
    if (row[0]) {
      map[String(row[0])] = row[1];
    }
  });

  return {
    adminEmail: String(map['管理者メール'] || 'fuchigami.yuta@sist.ac.jp'),
    ccEmail: String(map['CCメール'] || ''),
    formTitle: String(map['フォームタイトル'] || '実験ツール貸出・返却フォーム'),
    formDescription: String(map['フォーム説明'] || '実験ツールの貸出または返却を記録してください。'),
    dailyHour: Number(map['期限超過チェック時刻'] || 8)
  };
}

/**
 * トリガー作成
 */
function createTriggers_(form) {
  const triggers = ScriptApp.getProjectTriggers();

  triggers.forEach(trigger => {
    const fn = trigger.getHandlerFunction();

    if (
      fn === 'handleFormSubmit' ||
      fn === 'dailyOverdueCheck'
    ) {
      ScriptApp.deleteTrigger(trigger);
    }
  });

  ScriptApp.newTrigger('handleFormSubmit')
    .forForm(form)
    .onFormSubmit()
    .create();

  ScriptApp.newTrigger('dailyOverdueCheck')
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();
}

/**
 * フォーム回答をオブジェクト化
 */
function getFormResponseObject_(e) {
  const response = e.response;
  const itemResponses = response.getItemResponses();

  const data = {};

  itemResponses.forEach(itemResponse => {
    const title = itemResponse.getItem().getTitle();
    data[title] = itemResponse.getResponse();
  });

  return data;
}

/**
 * フォーム項目取得
 */
function getFormItemByTitle_(form, title) {
  const items = form.getItems();

  for (let i = 0; i < items.length; i++) {
    if (items[i].getTitle() === title) {
      return items[i];
    }
  }

  throw new Error(`フォーム項目が見つかりません: ${title}`);
}

/**
 * 貸出選択肢解析
 */
function parseBorrowChoice_(text) {
  if (!text) return { code: '', name: '' };

  let s = String(text).trim();
  s = s.replace(/^【貸出不可】/, '');

  const parts = s.split('｜');

  return {
    code: String(parts[0] || '').trim(),
    name: String(parts[1] || '').trim()
  };
}

/**
 * 返却選択肢から貸出ID取得
 */
function extractLoanId_(text) {
  if (!text) return '';

  const s = String(text).trim();

  if (s === '現在貸出中の物品はありません') {
    return '';
  }

  // 返却選択肢の先頭にある貸出IDだけを厳密に取得する。
  // 例: L20260820123456-123｜電子ノギス｜...
  const match = s.match(/^(L\d{14}-\d{3})(?:｜|$)/);
  return match ? match[1] : '';
}

/**
 * 操作ログ
 */
function appendOperationLog_(ss, action, result, loanId, unitId, code, name, person, studentInfo, note) {
  const sheet = ss.getSheetByName(SHEET_LOG);

  sheet.appendRow([
    new Date(),
    action,
    result,
    loanId,
    unitId,
    code,
    name,
    person,
    studentInfo,
    note
  ]);
}

/**
 * 貸出ID作成
 */
function createLoanId_() {
  const timestamp = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    'yyyyMMddHHmmss'
  );

  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

  return `L${timestamp}-${random}`;
}

/**
 * 物品コード作成
 */
function createItemCode_(num) {
  return `TOOL${String(num).padStart(3, '0')}`;
}

/**
 * スプレッドシート取得
 */
function getSystemSpreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');

  if (!id) {
    throw new Error('SPREADSHEET_IDが設定されていません。setupToolLendingSystem()を先に実行してください。');
  }

  return SpreadsheetApp.openById(id);
}

/**
 * 日付表示
 */
function formatDate_(value) {
  if (!value) return '';

  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy/MM/dd');
  }

  return String(value);
}

/**
 * 日時表示
 */
function formatDateTime_(value) {
  if (!value) return '';

  if (value instanceof Date) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy/MM/dd HH:mm:ss');
  }

  return String(value);
}

/**
 * シート整形
 */
function formatSheet_(sheet, columnCount) {
  sheet.setFrozenRows(1);

  sheet.getRange(1, 1, 1, columnCount)
    .setFontWeight('bold')
    .setBackground('#d9ead3');

  sheet.autoResizeColumns(1, columnCount);

  const lastRow = Math.max(sheet.getLastRow(), 1);

  sheet.getRange(1, 1, lastRow, columnCount)
    .setBorder(true, true, true, true, true, true);
}

/**
 * メニュー
 */
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('貸出管理')
    .addItem('管理台帳を整備', 'normalizeLedger')
    .addItem('選択行の同種を1個追加', 'addOneSameItemFromSelectedRow')
    .addItem('フォーム選択肢を更新', 'refreshAllFormChoices')
    .addItem('期限超過チェックを実行', 'dailyOverdueCheck')
    .addToUi();
}