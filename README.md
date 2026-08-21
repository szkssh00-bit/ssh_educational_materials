# SSH Educational Materials Portal v12

## 変更点

### 1. 公開Portalのヘッダーをスリム化

タイトルサイズ、上下余白、ブランド表示、Adminボタン、統計ボックスを縮小しました。

サイト文言は初回v12適用時に次へ更新します。

| 項目 | 値 |
| --- | --- |
| siteTitle | 静岡北中学校・高等学校　SSH開発教材・支援資料　普及サイト |
| siteSubtitle | SSHの活動を通して開発した教材・研究支援ツール・プログラムを公開します。 |
| introTitle | 公開資料について |
| introText | 本校では探究活動として課題研究などを実施しています。授業実施のために開発した教材や支援資料をダウンロード・閲覧ができます。 |
| footerText | Shizuoka Kita SSH Educational Materials |

このプリセットは **v12初回だけ** 適用します。その後にAdminやSpreadsheetから変更した値は再同期しても上書きしません。

## 2. descriptionの正本を単純化

v12以降の正式な編集元:

- パッケージ説明 → `公開パッケージ` シートの **説明** 列
- 公開資料説明 → `公開資料` シートの **説明コメント** 列

Adminも同じ列を直接読み書きします。

```text
Spreadsheetの説明列
        ↕
      Admin
        ↓
   公開Portal
```

Google Drive同期では説明列を更新しません。

したがって、Spreadsheetで説明を変更した後にAdminからDrive同期してもロールバックしません。

旧v11の `説明管理` シートはv12初回に `説明管理_旧_v11` へ退避します。

## 3. 自動パッケージ説明を廃止

今後Driveフォルダから新規パッケージを作る場合、説明は空欄で作成します。

次のような自動文章は生成しません。

```text
Google Driveフォルダ「【外部公開中】課題研究」から自動作成したパッケージです。
```

既存データにこの形式の自動説明が残っている場合も、v12初回にその自動生成文だけを空欄へ整理します。
手入力した説明は消しません。

## 4. 公開カウンターは10以上のみ表示

資料ごとの:

- 閲覧
- Preview
- DL

は、それぞれ **10以上になった項目だけ** 公開Portalに表示します。

例:

```text
閲覧 9 / Preview 0 / DL 3
→ 何も表示しない

閲覧 12 / Preview 4 / DL 10
→ 閲覧 12　DL 10
```

パッケージ集計の閲覧・DLも10未満は表示しません。

Adminでは従来通り実数を確認できます。

## Admin

パスワード:

```text
5801
```

Admin上部に:

- パッケージ表
- 資料表

への直接リンクを追加しています。

管理Spreadsheet:

```text
https://docs.google.com/spreadsheets/d/1vaYebYAsHXijZfabMmebltdSj5PbM8wd29WfzNFPqvE/edit
```

## デプロイ

同じフォルダに:

```text
ssh_educational_materials_portal_v12.zip
deploy_portal_v12.cmd
```

を置いて `deploy_portal_v12.cmd` を実行してください。
