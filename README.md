# SSH Educational Materials Portal v7

## 今回の修正点

v7では、Adminが「0件」のままになる原因を判別できるように、
Google OAuth認証と接続テストをAdmin画面に組み込みました。

Adminログイン後に次を個別確認します。

1. OAuth認証
2. 管理Spreadsheet接続
3. Google Drive接続

未認証の場合は資料一覧を0件として表示せず、
`Google権限を認証` ボタンを表示します。

## Admin

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec?page=admin
```

パスワード:

```text
5801
```

### 初回

Adminへログインします。

OAuth認証が不足している場合:

```text
OAuth認証: 認証が必要
Spreadsheet: 未確認
Drive: 未確認
```

と表示されます。

`Google権限を認証` を押してください。

重要:
**claspでこのWebアプリをデプロイしたGoogleアカウント**で認証します。

認証後にAdminへ戻り、

`接続を再確認`

を押します。

正常なら:

```text
OAuth認証: 認証済み
管理Spreadsheet: OK
Google Drive: OK
```

となり、その後にDrive同期と資料マスタ読込を実行します。

## OAuth scopes

`appsscript.json` に明示しています。

```text
https://www.googleapis.com/auth/spreadsheets
https://www.googleapis.com/auth/drive.readonly
```

## 管理Spreadsheet

```text
https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/edit
```

## Drive

```text
https://drive.google.com/drive/folders/16Y0OUmmDkbL_pkXGK3wZOXhzA6B5QuK2
```

## データフロー

```text
Drive
 ↓ Admin同期
管理Spreadsheet
 ↓ Admin編集・保存
管理Spreadsheet
 ↓
公開Portal
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

## デプロイ

同じフォルダへ:

```text
ssh_educational_materials_portal_v7.zip
deploy_portal_v7.cmd
```

を置いてCMDを実行してください。

v7では、デプロイ直後にOAuth認証がまだ必要な場合でも
「GASデプロイ失敗」とは判定しません。

Admin画面が新しくデプロイされたことを確認した後、
Admin内のGoogle認証へ進みます。
