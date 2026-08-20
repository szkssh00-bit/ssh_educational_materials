# SSH Educational Materials Portal v10

## 修正内容

v9のAdminで発生した:

```text
Admin統合処理 ERROR: renderConnection is not defined
```

を修正しました。

原因は、Admin通信を `adminBootstrap()` に統合した際に、
クライアント側の `renderConnection()` 定義だけが削除されていたことです。

v10では:

- `renderConnection()` を復元
- 接続表示エラーが起きても6段階診断を消さない
- サーバー診断結果を先に表示
- Admin JavaScript自己診断を追加
- DateオブジェクトをGAS→ブラウザ返却前に文字列化
- `adminBootstrap()` による一括同期を維持

しています。

## Admin

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec?page=admin
```

パスワード:

```text
5801
```

正常ならログイン直後に:

```text
OAuth認証            認証済み
管理Spreadsheet      OK: SSH_educational_materials
Google Drive         OK: 外部公開中の教材
```

に続いて、

```text
1. 管理Spreadsheetを開く
2. 管理シート構成を確認・作成
3. パッケージ・既知資料を初期化
4. Google Driveフォルダを走査
5. Drive → 公開資料シートへ同期
6. Admin Dashboardを読み込む
```

の診断結果が表示されます。

## 管理Spreadsheet

```text
https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/edit
```

## Google Drive

```text
https://drive.google.com/drive/folders/16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

## デプロイ

同じフォルダに:

```text
ssh_educational_materials_portal_v10.zip
deploy_portal_v10.cmd
```

を置いて `deploy_portal_v10.cmd` を実行します。

固定Script ID:

```text
15WnOsdwFLlIKHjsNR9Eo_6If4jbBzjAQLSVylmXVKJw2CAttywn6ILyn
```

固定Web App URL:

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec
```
