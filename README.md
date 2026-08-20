# SSH Educational Materials Portal v5

## 変更点

v5では、公開資料を単発カードとして並べる方式をやめ、**パッケージ単位**で公開します。

例:

### 実験ツール貸出管理システム
- 実験ツール貸出・返却フォーム
- 実験ツール貸出管理台帳
- Google Apps Script本体
- 将来追加する説明PDF等

### SKYSEF 2026
- SKYSEF Webサイト
- 将来追加する募集要項・プログラム・PDF等

関連資料は同じ大きなカードの中にまとめて表示されます。

## Admin

URL:

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec?page=admin
```

パスワード:

```text
5801
```

`ADMIN_PASSWORD` がScript Propertiesに存在しない場合も、GASが自動で `5801` を設定します。

## Adminでできること

### パッケージ
- 公開 / 非公開
- 表示順
- パッケージ名
- 説明
- キーワード
- パッケージ削除

### 資料
- 所属パッケージ
- 公開 / 非公開
- 表示順
- タイトル
- 種別
- 説明コメント
- キーワード
- Driveファイル
- 元URL
- アクションURL
- ダウンロード / 開く
- プレビューON/OFF
- プレビューURL
- プレビュー高さ

## Google Drive

公開資料ファイルはGitHubではなく次のDriveフォルダを使用します。

```text
https://drive.google.com/drive/folders/16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

Adminの「Driveを同期」で検出します。

`実験ツール貸出管理_返却修正版.js` など、ファイル名に「実験ツール貸出管理」「貸出管理」等が含まれるDriveファイルは、自動的に `実験ツール貸出管理システム` パッケージへ割り当てます。

## 初期パッケージ

### 実験ツール貸出管理システム

Google Form:

```text
https://docs.google.com/forms/d/1qW8XNY0Or272UG40cMuykOFQQ47p1hp6QgkK5pjwKEk/preview
```

Spreadsheet:

```text
https://docs.google.com/spreadsheets/d/1YOHteYmQ5jSFrfC0few4639s-RPDDC0FxZLMHmRo_yQ/edit?gid=1863612530#gid=1863612530
```

### SKYSEF 2026

```text
https://szkssh00-bit.github.io/SKYSEF/#top
```

## 固定GAS

Script ID:

```text
15WnOsdwFLlIKHjsNR9Eo_6If4jbBzjAQLSVylmXVKJw2CAttywn6ILyn
```

Web App:

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec
```

## GitHubへ公開するもの

- `index.html`
- `README.md`

GASソース、Adminソース、資料ファイルはGitHubへ公開しません。

## デプロイ

同じフォルダに:

```text
ssh_educational_materials_portal_v5.zip
deploy_portal_v5.cmd
```

を置き、CMDを実行します。

GitHub更新、GAS push、既存Webアプリ再デプロイ、公開API/Adminの検証まで一括実行します。
