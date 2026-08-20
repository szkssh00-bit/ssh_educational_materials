# SSH Educational Materials Portal v9

## v9で修正した問題

v8でGoogle接続状態が正常でも「管理処理診断」が未実行のまま止まる場合がありました。

主な修正:

1. `google.script.run` へ返すDashboardデータから `Date` オブジェクトを除去
2. DateはISO文字列へ変換してからブラウザへ返す
3. 接続確認とDashboard読込を別呼び出しにせず統合
4. ログイン後は `adminBootstrap()` 1回で以下を実行
   - OAuth状態確認
   - Spreadsheet接続確認
   - Drive接続確認
   - 管理シート作成/確認
   - 初期パッケージ登録
   - Drive走査
   - Drive→Spreadsheet同期
   - Dashboard生成
5. Drive同期・再読込もそれぞれ1つのGAS呼び出しに統合

## Admin

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec?page=admin
```

パスワード:

```text
5801
```

## 正常時の管理処理診断

```text
1. 管理Spreadsheetを開く
   OK

2. 管理シート構成を確認・作成
   OK

3. パッケージ・既知資料を初期化
   OK: packages=..., materials=...

4. Google Driveフォルダを走査
   OK: count=...

5. Drive → 公開資料シートへ同期
   OK

6. Admin Dashboardを読み込む
   OK
```

## 管理Spreadsheet

```text
https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/edit
```

## Drive

```text
https://drive.google.com/drive/folders/16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

## デプロイ

同じフォルダに:

```text
ssh_educational_materials_portal_v9.zip
deploy_portal_v9.cmd
```

を置いて `deploy_portal_v9.cmd` を実行してください。

固定Script ID:

```text
15WnOsdwFLlIKHjsNR9Eo_6If4jbBzjAQLSVylmXVKJw2CAttywn6ILyn
```

固定Web App URL:

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec
```
