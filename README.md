# SSH Educational Materials Website

GitHub Pagesで公開する、SSH教育・研究支援資料ポータルです。

## 収録ファイル

- `index.html`
  - 公開ページ本体
  - 資料一覧、検索、カテゴリ絞り込み
  - サイト閲覧数、資料閲覧数、ダウンロード数表示
  - Google Drive直リンク対応
- `assets/files/実験ツール貸出管理_返却修正版.js`
  - 最初の公開資料
- `gas/Code.gs`
  - Google Apps Script側のアクセスログ記録・集計API
- `upload_to_github.cmd`
  - WindowsからGitHubへアップロードするためのCMD

## 1. GASを設定する

1. Google Apps Scriptで新しいプロジェクトを作成します。
2. `gas/Code.gs` の内容を貼り付けます。
3. `setupAccessLogSheet()` を一度実行し、権限を許可します。
4. 「デプロイ」→「新しいデプロイ」→「ウェブアプリ」を選択します。
5. 実行するユーザーは自分、アクセスできるユーザーは公開サイトから呼び出せる設定にします。
6. 発行された `/exec` URLをコピーします。
7. `index.html` の次の行を置き換えます。

```js
const GAS_WEB_APP_URL = 'https://script.google.com/macros/s/PASTE_DEPLOYMENT_ID/exec';
```

記録先スプレッドシートIDは、`gas/Code.gs` に設定済みです。

## 2. Google Drive上のPDF等を追加する

`index.html` の `MATERIALS` 配列へ資料を追加します。

```js
{
  id: 'chemistry-material-001',
  title: '資料タイトル',
  category: '化学',
  type: 'PDF',
  version: '2026-08-20',
  fileName: 'sample.pdf',
  description: '資料の説明。',
  keywords: ['化学', '実験'],
  driveFileId: 'GOOGLE_DRIVE_FILE_ID',
  downloadUrl: ''
}
```

Google DriveファイルURLが

```text
https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view
```

なら、`driveFileId` は

```text
1AbCdEfGhIjKlMnOp
```

です。

ページ側で次の直接ダウンロードURLを自動生成します。

```text
https://drive.google.com/uc?export=download&id=FILE_ID
```

Google Drive側の共有設定も、想定する利用者が閲覧できる状態にしてください。

## 3. GitHubへアップロードする

このフォルダ内の

```text
upload_to_github.cmd
```

をダブルクリックします。

このCMDは、既存のGitHubリポジトリを最初にcloneしてからファイルを上書きコピーするため、
既存リポジトリを強制的に初期化する方式ではありません。

対象リポジトリ:

```text
https://github.com/szkssh00-bit/ssh_educational_materials
```

## 4. GitHub Pagesを有効化する

GitHubのリポジトリ画面で

```text
Settings → Pages
```

を開き、GitHub Pagesの公開元をリポジトリの既定ブランチのルートに設定します。

公開URLは通常、次の形式になります。

```text
https://szkssh00-bit.github.io/ssh_educational_materials/
```

## 5. ログの内容

スプレッドシートに `アクセスログ` シートを自動作成し、次を記録します。

- 日時
- イベント
  - `page_view`
  - `material_view`
  - `download`
- 資料ID
- 資料名
- ファイル名
- ページURL
- 参照元

個人名、メールアドレス、IPアドレスは記録しません。

## 6. 集計の考え方

- サイト閲覧数:
  - ページが読み込まれるたびに `page_view`
- 資料閲覧数:
  - 資料カードの50%以上が画面内に入ったときに `material_view`
  - 同一タブの同一セッション中は、同じ資料を重複加算しません
- ダウンロード数:
  - ダウンロードボタンを押したときに `download`

GASの `mode=stats` で累積値を集計し、GitHub Pages側へJSONP形式で返します。
