# generative-art-gallery

規則と偶然を、手で動かして楽しむ静的アートギャラリーです。12作品の数値や配色を変え、設定入りのURLやSVG画像を保存できます。

## ローカルで開く

Node.js 22以上を使います。

```sh
npm ci
npm test
npm run build
python3 -m http.server 8000 --directory dist
```

`http://localhost:8000/` を開きます。配信するのは `dist/` です。閲覧時はHTML/CSS/JavaScriptだけで動き、外部API・CDN・フォントは使いません。Playwrightは開発時のブラウザ検証用です。

## 操作と共有

スライダーと数値欄で設定を変えると、図形がすぐに変わります。「別のシード」は乱数を使う作品に表示します。「リセット」で初期設定に戻り、「この絵を共有」で現在の設定を含むURLをコピーできます。コピーできない環境では表示されたURLを選択してください。「SVGを保存」は図形と設定のメタデータを含む単体ファイルを保存します。

共有URLの形式は `#art=<encodeURIComponent(JSON)>`、内容は `{format:1,generator:1,settings:{全設定}}` です。設定のキー順を固定し、非表示の重みとシードも省略しません。fragmentはサーバーへ送信されません。通常の入力ではURLを書き換えません。

未対応のバージョン、設定の欠落・未知の項目・不正値・範囲外の値は復元せず、初期設定と案内を表示します。fragmentの上限は8192文字です。共有は図形と配色の再生成を目的とし、端末間のピクセル単位の一致は保証しません。長く残す画像にはSVGを使ってください。

## 共通UIと作品の追加

[参加ガイド](CONTRIBUTING.md)の手順と [作品ページのひな形](templates/study/index.html) を使います。作品は `works/<slug>/` に置き、`manifest.json` から自動で一覧に登録します。addedAt、slugの順で並び、作品番号は表示順です。公開済みslugは変更しないでください。

`assets/study-core.js` は生成器の正規化・SVG生成を、`assets/study-ui.js` は操作パネルを担当します。既存9作品のUI定義は `assets/study-controls.js` にあります。新しい作品は同じ形式の定義を作品フォルダの `controls.js` に置けます。ラベル・説明・単位・入力方式・グループ・表示条件を定義し、共通部品で描画します。保存・共有・リセットの配置は全作品共通です。

## 検証

```sh
npm test
npm run build
npx playwright install chromium
npm run test:browser
```

システムのChromiumを使う場合は `CHROMIUM_PATH=/usr/bin/chromium npm run test:browser` とします。ブラウザ検証は一時サーバーを起動し、公開時と同じ `/generative-art-gallery/` サブパスで実行します。共通schemaの全キーを期待値にし、要素が0件でも欠落があっても失敗します。初期3作品は明示的なlegacy contractで検査します。ブラウザ内で型・境界・step・ラベル・説明・出力の欠損や誤りを作る検査も行い、見逃さないことを確認します。1440pxと375pxで、入力・値表示・キーボード・ボタンの計算済みスタイル・共有・SVGダウンロード・リセットを確認します。画像を保存する場合は `GALLERY_QA_DIR` に保存先を指定します。

生成器v1の既定値・正規化・乱数・SVGの幾何と配色は互換性を維持します。`scripts/fixtures/all-works-v1.json` は全作品の既定値と上下限の共有URL、SVGのSHA-256を保持します。Node.jsではSVG全体のバイト列を厳密比較し、ブラウザ間の数学関数の丸め差については座標属性だけを小数点以下9桁で比較します。色・構造・メタデータはそのまま比較します。新作品のfixtureは追加し、既存の期待値をUI修正に合わせて更新しないでください。将来生成規則を変えるときは旧実装を残し、明示的にバージョンを分けます。

## GitHub Pages

`npm run build` の公開先は `SITE_URL` で指定します。既定値は `https://ken-25.github.io/generative-art-gallery/`。末尾 `/` 付きの絶対URLを使い、canonical・OGP・sitemapに反映します。作品の末尾 `/` と `index.html` の両方を維持します。

`.github/workflows/verify.yml` はPRのテストとビルド、ブラウザ回帰確認を行います。`.github/workflows/pages.yml` はmainへのpushと手動実行で検証し、生成した `dist/` だけを配信します。公開ジョブはmainだけで実行し、同じブランチの実行を直列化します。

初回のPages設定は、実施者がSettings → Pages → Build and deployment → Sourceを **GitHub Actions** に変更します。設定前にDeploy Pagesが失敗した場合は、設定後にmainで再実行します。追加Secretsは不要です。

## 利用条件・資料

[共通の利用条件](about/index.html#terms)、[MITライセンス](LICENSE)、[資料と実装の由来](THIRD_PARTY_NOTICES.md)を参照してください。作品ページは操作と出典を中心にし、資料の確認状況や作品固有の制作記録は詳細側にまとめています。
