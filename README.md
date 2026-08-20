# SSH Educational Materials Portal v4

## 運用方針

公開ページ本体はGitHub Pagesで公開しますが、**公開資料ファイル自体はGitHubへ置きません**。

資料は原則として次のGoogle Driveフォルダへ保存します。

```text
https://drive.google.com/drive/folders/16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

Adminの「Driveを同期」で資料マスタへ登録し、Adminから公開/非公開、説明、プレビュー等を設定します。

## Admin

パスワード:

```text
5801
```

Adminアクセス時および `setupPortal()` 実行時に、GASがScript Propertiesの `ADMIN_PASSWORD` を `5801` に設定します。

したがって `ADMIN_PASSWORD が設定されていません` というエラーはv4では発生しません。

## 初期登録するプレビュー

### Google Form

```text
https://docs.google.com/forms/d/1qW8XNY0Or272UG40cMuykOFQQ47p1hp6QgkK5pjwKEk/preview
```

公開: ON  
プレビュー: ON

### Google Spreadsheet

元URL:

```text
https://docs.google.com/spreadsheets/d/1YOHteYmQ5jSFrfC0few4639s-RPDDC0FxZLMHmRo_yQ/edit?gid=1863612530#gid=1863612530
```

プレビュー:

```text
https://docs.google.com/spreadsheets/d/1YOHteYmQ5jSFrfC0few4639s-RPDDC0FxZLMHmRo_yQ/preview?gid=1863612530
```

主ボタンはExcel形式ダウンロードです。

### SKYSEF HP

```text
https://szkssh00-bit.github.io/SKYSEF/#top
```

公開: ON  
プレビュー: ON

GitHub Pagesサイト側のiframe制限がなければ、サイト内プレビューとして表示します。

## 実験ツール貸出管理システム

旧GitHub公開版:

```text
assets/files/実験ツール貸出管理_返却修正版.js
```

は公開資料マスタから自動削除します。

今後は `実験ツール貸出管理_返却修正版.js` をGoogle Driveの公開ファイル用フォルダへアップロードし、Adminの「Driveを同期」を押してください。

このZIPには、Driveへ手動アップロードしやすいように:

```text
drive_upload/実験ツール貸出管理_返却修正版.js
```

を含めています。

## 閲覧数

公開ページには資料ごとに:

- 閲覧
- DL
- Open

を表示します。

AdminではさらにPreview回数も確認できます。

## GitHubへ公開されるもの

v4のデプロイCMDはGitHubへ:

- `index.html`
- `README.md`

だけを反映します。

以下はGitHubへ公開しません。

- `gas/`
- `drive_upload/`
- 公開資料ファイル

GASはclaspで直接Apps Scriptへpushします。

## 固定GAS

Script ID:

```text
15WnOsdwFLlIKHjsNR9Eo_6If4jbBzjAQLSVylmXVKJw2CAttywn6ILyn
```

Web App:

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec
```
