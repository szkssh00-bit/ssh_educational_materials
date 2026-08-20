# SSH Educational Materials Portal v2

GitHub Pagesを公開サイト、Google Apps Scriptを「管理画面・Drive同期・アクセスログ・集計」のバックエンドとして使う構成です。

## 主な機能

公開ページ:
- Adminボタン
- Adminで公開設定した資料だけを表示
- 種別: PDF / Google Apps Script / Google Form / Spreadsheet / GitHub HP
- 資料ごとの説明コメント
- 資料ごとの閲覧数・ダウンロード数
- 資料ごとのプレビュー
- 検索・種別絞り込み

Admin:
- パスワード認証
- Google Driveフォルダ同期
- 公開 / 非公開
- 表示順
- タイトル
- 種別
- 説明コメント
- キーワード
- 元URL
- ダウンロード / 外部オープンURL
- ボタン表示
- プレビュー有効 / 無効
- プレビューURL
- プレビュー高さ
- 公開サイトのタイトル・説明文
- サイト閲覧数
- 資料閲覧数
- プレビュー回数
- ダウンロード数
- 外部オープン数
- 最新アクセスログ

## 使用するGoogleリソース

### 管理・ログ用スプレッドシート

`Code.gs` に設定済みです。

`1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE`

以下のシートを追加・利用します。

- 公開資料
- アクセスログ
- アクセス集計
- サイト集計
- サイト設定

既存の `アクセスログ` は `setupPortal()` で消去しません。

### 公開ファイル用Google Driveフォルダ

`Code.gs` に設定済みです。

`16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2`

Adminの「Driveを同期」でサブフォルダまで検索します。
新しく検出したファイルは **非公開** で資料マスタに追加します。
Adminで説明・プレビュー等を確認してから「公開する」をONにしてください。

---

# 初回設定

## 1. Apps Scriptに2ファイルを作る

GASプロジェクトに:

- `Code.gs`
- HTMLファイル `Admin`

を作ります。

このZIPの:

- `gas/Code.gs`
- `gas/Admin.html`

をそれぞれ貼り付けます。

## 2. Adminパスワードを設定

パスワードを公開GitHubへ書かないため、コードには `5801` を埋め込んでいません。

Apps Script:

`Project Settings → Script Properties`

で追加します。

- Property: `ADMIN_PASSWORD`
- Value: `5801`

## 3. setupPortal() を一度実行

Apps Scriptエディタで:

```javascript
setupPortal()
```

を一度実行し、Google DriveとSpreadsheetへのアクセス権限を許可します。

初期データとして:

- 実験ツール貸出管理システム（返却処理修正版）: 公開
- 提示されたGoogle Formプレビュー例: 非公開

を登録します。

Google Form例:

```text
https://docs.google.com/forms/d/1qW8XNY0Or272UG40cMuykOFQQ47p1hp6QgkK5pjwKEk/preview
```

## 4. GASをWebアプリとしてデプロイ

Apps Script:

`Deploy → New deployment → Web app`

公開サイトからアクセスできる設定でデプロイします。

発行された `/exec` URLをコピーしてください。

## 5. index.htmlへGAS URLを設定

`index.html` の:

```javascript
const GAS_WEB_APP_URL =
  'https://script.google.com/macros/s/PASTE_DEPLOYMENT_ID/exec';
```

を実際の `/exec` URLへ変更します。

これで公開ページ右上の **Admin** ボタンも自動的に管理画面へつながります。

---

# Adminの使い方

## Driveを同期

「Driveを同期」を押します。

指定Driveフォルダ内のファイルを再帰的に取得します。

自動判定:
- `.pdf` → PDF
- Google Form → Google Form
- Google Spreadsheet → Spreadsheet
- Google Apps Script / `.gs` / `.js` → Google Apps Script

未対応形式は種別が空欄になるため、Adminの編集画面で種別を設定してください。

## URL資料を追加

GitHub Pages等は「URL資料を追加」から追加します。

種別:

`GitHub HP`

元URL・アクションURL・プレビューURLに対象URLを設定します。

## プレビュー

自動候補:

PDF等:
```text
https://drive.google.com/file/d/FILE_ID/preview
```

Google Form:
```text
https://docs.google.com/forms/d/FORM_ID/preview
```

Spreadsheet:
```text
https://docs.google.com/spreadsheets/d/SHEET_ID/preview
```

GitHub HP:
```text
対象HPのURL
```

すべてAdminから上書きできます。

外部サイト側がiframeを禁止している場合は、その資料の
「プレビュー枠を表示する」をOFFにしてください。

## ダウンロード

PDF:
```text
https://drive.google.com/uc?export=download&id=FILE_ID
```

Spreadsheet:
```text
https://docs.google.com/spreadsheets/d/FILE_ID/export?format=xlsx
```

Google FormやGitHub HP等は「開く」を使用できます。

Google Apps Scriptについて:
- `.gs` / `.js` としてDriveに保存したファイルはダウンロードURLを自動生成
- Google Apps Scriptのネイティブプロジェクトは元URLを開く設定を基本とする

---

# アクセス計測

ログイベント:

- `page_view`: サイト閲覧
- `material_view`: 資料カード閲覧
- `preview_open`: プレビュー表示
- `download`: ダウンロード
- `open`: Google FormやGitHub HP等の外部オープン

公開サイトでは:
- 閲覧数
- DL数

を表示します。

Adminでは全指標を表示します。

アクセスの生ログは指定スプレッドシートの `アクセスログ` に残します。

---

# Drive共有権限について

GASがファイルを検出できても、公開サイトの閲覧者にDriveファイルの閲覧権限がなければ、
プレビューやダウンロードはできません。

公開対象のファイルは、想定する閲覧者がアクセスできる共有設定にしてください。

---

# パスワードについて

指定どおり `5801` を利用できます。

ただし4桁パスワードは管理画面の認証としては強くありません。
後から変更する場合、GitHubのHTMLを変更する必要はありません。

Apps Scriptの:

`Project Settings → Script Properties → ADMIN_PASSWORD`

だけを変更してください。
