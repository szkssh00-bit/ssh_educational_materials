# SSH Educational Materials Portal v8

## v8の目的

v7ではGoogle接続確認は成功していても、その後の管理処理で例外が起きた場合、
ログイン直後の暫定エラー表示が残る問題がありました。

v8では、Google接続確認と管理データ処理を完全に分離しました。

Adminは次の6段階を個別に実行・表示します。

1. 管理Spreadsheetを開く
2. 管理シート構成を確認・作成
3. パッケージ・既知資料を初期化
4. Google Driveフォルダを走査
5. Drive → 公開資料シートへ同期
6. Admin Dashboardを読み込む

各段階に `OK` または具体的なエラーを表示します。

Drive同期だけが失敗した場合でも、管理Spreadsheetの既存資料はAdminで編集できます。

## Admin

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec?page=admin
```

パスワード:

```text
5801
```

## Google接続先

管理Spreadsheet:

```text
https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/edit
```

Drive:

```text
https://drive.google.com/drive/folders/16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

## 正常時の診断例

```text
1. 管理Spreadsheetを開く             OK
2. 管理シート構成を確認・作成       OK
3. パッケージ・既知資料を初期化     OK
4. Google Driveフォルダを走査        OK: count=...
5. Drive → 公開資料シートへ同期      OK
6. Admin Dashboardを読み込む          OK
```

## デプロイ

同じフォルダへ:

```text
ssh_educational_materials_portal_v8.zip
deploy_portal_v8.cmd
```

を置いてCMDを実行してください。

固定GAS Script ID:

```text
15WnOsdwFLlIKHjsNR9Eo_6If4jbBzjAQLSVylmXVKJw2CAttywn6ILyn
```

固定Web App URL:

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec
```
