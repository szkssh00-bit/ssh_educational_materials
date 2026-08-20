# SSH Educational Materials Portal v6

## v6の管理方針

v6ではデータの流れを一本化しました。

```text
Google Drive
    ↓ Adminログイン時 / Drive同期ボタン
管理Spreadsheet
    ↓
Adminで編集・保存
    ↓
管理Spreadsheet
    ↓
公開Portal
```

公開PortalはGoogle Driveを直接読みません。
**管理Spreadsheetを唯一の公開マスタ**として使用します。

## 管理Spreadsheet

```text
https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/edit
```

主に次のシートを使用します。

- `公開パッケージ`
- `公開資料`
- `アクセスログ`
- `アクセス集計`
- `サイト集計`
- `サイト設定`
- `Drive同期履歴`

Adminで保存するとこのSpreadsheetへ即時書き込みます。

## Google Drive

同期元:

```text
https://drive.google.com/drive/folders/16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

Adminを開くたびに自動同期します。
必要なときはAdmin上部または資料タブの「Drive同期」を押して手動同期できます。

### Drive同期で行うこと

- サブフォルダを含めて再帰検索
- PDF検出
- `.gs` / `.js` 検出
- Google Form検出
- Google Spreadsheet検出
- Google Driveショートカットを実体IDへ解決
- ファイル名更新
- MIMEタイプ更新
- Driveパス保存
- Drive更新日時保存
- 最終同期時刻保存
- Driveから見つからなくなった資料を `MISSING` として表示
- 新規Driveファイルは非公開で登録

ショートカットの場合も、対象ファイルのIDとMIMEタイプを取得して管理します。

## パッケージ

関連資料は大きなパッケージ単位で表示します。

### 実験ツール貸出管理システム

- 実験ツール貸出・返却フォーム
- 実験ツール貸出管理台帳
- Google Apps Script
- 説明PDF等

### SKYSEF 2026

- SKYSEF Webサイト
- 今後追加するPDF・プログラム等

Driveサブフォルダを使った場合は、そのサブフォルダ名から非公開パッケージを自動生成します。
Adminで確認して公開できます。

## Admin

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec?page=admin
```

パスワード:

```text
5801
```

Admin上部から直接、

- Driveフォルダ
- 管理Spreadsheet

を開けます。

## 固定GAS

Script ID:

```text
15WnOsdwFLlIKHjsNR9Eo_6If4jbBzjAQLSVylmXVKJw2CAttywn6ILyn
```

Web App:

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec
```

## デプロイ

同じフォルダに:

```text
ssh_educational_materials_portal_v6.zip
deploy_portal_v6.cmd
```

を置き、CMDを実行します。

CMDは:

1. GitHub更新
2. GAS push
3. 既存Web App再デプロイ
4. public_data API確認
5. Admin画面確認

を行います。
