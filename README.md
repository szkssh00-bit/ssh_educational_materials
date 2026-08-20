# SSH Educational Materials Portal v11

## v11: 説明文をSpreadsheetと正式に連動

パッケージと公開資料のdescriptionを、管理Spreadsheetの **「説明管理」シート** から直接編集できます。

管理Spreadsheet:

```text
https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/edit
```

v11デプロイ後、自動的に次のシートが作成されます。

```text
説明管理
```

列構成:

```text
対象種別 | 対象ID | 表示名 | 説明 | 更新日時
```

対象種別は:

```text
パッケージ
公開資料
```

です。

## 編集例

### パッケージ

現在:

```text
Google Driveフォルダ「【外部公開中】科学英語」から自動作成したパッケージです。
```

「説明管理」シートで:

```text
対象種別: パッケージ
表示名: 【外部公開中】科学英語
説明: （ここを自由に編集）
```

とすると、Adminと公開Portalのパッケージ説明に反映されます。

### 公開資料

例:

```text
表示名: 【外部公開中】実験ツール貸出・返却フォーム
説明: 貸出または返却を記録するGoogle Formです。
```

「説明」列を変更すると、Adminと公開Portalに反映されます。

## 同期ルール

説明文については「説明管理」シートが正式なマスタです。

```text
説明管理シート
   ↓
公開パッケージ / 公開資料
   ↓
Admin
   ↓
公開Portal
```

Adminで説明を編集して保存した場合も「説明管理」シートへ同時保存します。

Google Drive同期では:

- ファイル名
- Drive ID
- MIMEタイプ
- Driveパス
- Drive更新日時

などは更新しますが、**説明文は上書きしません**。

したがって、説明文を手作業で整えた後にDrive同期しても保持されます。

## Admin

```text
https://script.google.com/macros/s/AKfycbwq_w2GxPfrwuzjhAEXj9SkKp3kur1JMAZexrD_MjIx1tg2NUAX1YkoR9OHlv7OKex1fw/exec?page=admin
```

パスワード:

```text
5801
```

Admin上部に新しく:

```text
説明管理シート
```

ボタンを追加しています。

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
ssh_educational_materials_portal_v11.zip
deploy_portal_v11.cmd
```

を置き、`deploy_portal_v11.cmd` を実行してください。
