# SSH Educational Materials Portal v3

GitHub Pagesを公開サイト、Google Apps Scriptを管理・Drive同期・アクセスログ・集計のバックエンドとして使用します。

## 固定GAS WebアプリURL

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec
```

`index.html` にはこのURLを設定済みです。今後は同じDeployment IDを再デプロイするため、GASを更新してもこのURLを維持します。

## 構成

- `index.html`
  - GitHub Pages公開ページ
  - Adminボタン
  - 公開資料一覧
  - 閲覧数・ダウンロード数
  - 資料プレビュー
- `gas/Code.gs`
  - GASバックエンド
  - 公開資料マスタ
  - Google Drive同期
  - アクセスログ・集計
  - Admin API
- `gas/Admin.html`
  - 管理画面
- `gas/appsscript.json`
  - Apps Script manifest
- `assets/files/`
  - GitHub側に置く資料
- `README.md`

## Googleリソース

管理・ログ用Spreadsheet ID:

```text
1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE
```

公開ファイル用Drive Folder ID:

```text
16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

## Adminパスワード

GitHubへパスワードを公開しないため、`5801` はコードへ直接埋め込みません。

Apps Script:

`Project Settings → Script Properties`

に次を設定します。

```text
ADMIN_PASSWORD = 5801
```

## 初回GASセットアップ

Apps Scriptで一度だけ:

```javascript
setupPortal()
```

を実行してください。

## 一括デプロイ

同じフォルダに次を置きます。

```text
ssh_educational_materials_portal_v3.zip
deploy_github_and_gas.cmd
```

`deploy_github_and_gas.cmd` を実行すると:

1. ZIPを展開
2. GitHubリポジトリをclone
3. GitHub Pages用ファイルをcommit / push
4. GAS用ファイルを一時フォルダへ準備
5. `clasp push --force`
6. Deployment ID `AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw` を再デプロイ
7. 固定 `/exec` URLを維持

まで一括実行します。

## 初回だけCMDが尋ねる値

### 1. Apps Script Script ID

Deployment IDとは別です。

Apps Script:

`Project Settings → IDs → Script ID`

から取得します。

入力値はCMDと同じフォルダの:

```text
gas_script_id.local.txt
```

へ保存されます。ZIPにもGitHubにも含まれません。

### 2. GitHub commit email

`szkssh00-bit` アカウントに登録しているメールアドレスを入力します。

```text
github_commit_email.local.txt
```

へ保存され、このリポジトリだけのcommit author設定に使われます。

## 必要環境

- Git for Windows
- PowerShell
- Node.js 20以上
- npm
- Apps Script API 有効

Apps Script API:

```text
https://script.google.com/home/usersettings
```

`clasp` はCMDから `npx --yes @google/clasp` で呼び出すため、グローバルインストールは不要です。

## 重要

`clasp push --force` は、対象Apps Scriptプロジェクトのソースをローカル側の内容で更新します。

したがって、このGASプロジェクトはSSH Educational Materials Portal専用として扱ってください。
Apps Scriptエディタで別機能のコードを同じプロジェクトへ追加した場合、CMDデプロイ時に失われる可能性があります。

## 管理画面で扱える種別

- PDF
- Google Apps Script
- Google Form
- Spreadsheet
- GitHub HP

## プレビュー例

Google Drive PDF等:

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

GitHub HPは対象URLをそのままプレビューURLとして設定できます。
ただし、相手側サイトがiframe表示を禁止している場合はAdminでプレビューをOFFにしてください。
