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

`http://localhost:8000/` を開きます。配信するのは `dist/` です。計測が既定オフの間はHTML/CSS/JavaScriptだけで動き、外部API・CDN・フォントは使いません。計測を明示的に有効化した場合のみGoogleの外部スクリプトを読み込みます。Playwrightは開発時のブラウザ検証用です。

## 操作と共有

スライダーと数値欄で設定を変えると、図形がすぐに変わります。シード・「別のシード」・「リセット」は「生成の設定」にまとめています。出力の入口は「保存」と「共有」の2つです。「保存」でPNG／SVGとPNGサイズを選び、ダウンロードやSVGコードのコピーができます。「共有」で設定入りURL、SNS、端末のリンク／PNG共有を選べます。開いただけではコピーせず、コピーできない環境では表示された内容を選択できます。

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

[共通の利用条件](about/index.html#terms)、[MITライセンス](LICENSE)、[ライセンス・クレジット](THIRD_PARTY_NOTICES.md)を参照してください。作品の数理や設定の仕様は、各作品フォルダの `DESIGN.md` にまとめています。

## PNG保存とSNS共有

全作品の共通パネルからSVGとPNGを保存できます。PNGは現在の設定・配色・背景を描き、長辺1600px／2400pxから選べます。縦横比は整数ピクセルに丸める範囲で維持し、最大4096px・800万画素に制限します。変換中の重複処理を防ぎ、Canvasと一時URLを解放します。PNG共有は準備済みのFileを保持し、変換中に共有の操作権限が切れた場合は次の明示クリックで再変換せず共有します。設定やサイズを変えると準備済み画像を破棄します。変換待ち中の入力変更は、すでにクリックした出力には影響しません。SVGの設定メタデータはPNGには埋め込みません。

「共有」でダイアログに設定入りURLと共有先を表示します。リンクのコピー、対応端末の標準共有、X・LINE・Facebookへのリンク共有を使えます。端末がファイル共有に対応している場合は現在のPNGも共有できます。非対応・中断・エラー時は画面に案内し、PNG保存とリンクコピーを利用できます。共有先の画面を開くだけで、自動投稿はしません。

共有URLの `#art=` はSNSクローラーに送信されません。カードには作品ごとの固定プレビューWebPを使用し、調整後の絵の動的カード生成は行いません。調整した画像を投稿する場合はPNGを添付してください。ビルドは作品とAbout／トップのtitle・description・canonical・OGP・Twitter summary Card、絶対画像URL・実際の画像寸法・altを生成します。既存の320pxプレビューを使い、各SNSによるトリミングやキャッシュ、実際のカード表示はプラットフォーム側の扱いによります。

## 任意のGoogleタグ

計測は既定で無効です。使用する変数は `GOOGLE_TAG_ID` と `GOOGLE_TAG_ENABLED` です。リポジトリまたは既存の `github-pages` Environmentの **Actions Variables** からPagesのbuild jobへ渡します。buildにも既存Environmentを指定しており、Environmentの保護ルールがある場合はbuildにも適用されます。

`GOOGLE_TAG_ID`だけを指定しても有効になりません。`GOOGLE_TAG_ENABLED` が文字列 `true` と完全一致する場合に限り有効化します。未設定・空欄・`false`・`TRUE`・`1`などは無効で、IDが存在してもHTMLの計測タグと配信物の計測ファイルを除外します。ゲート無効時はIDの内容も使用しません。有効化時のIDは `G-`／`GT-` と英大文字・数字の形式を検証し、不正または未設定なら値を表示せずビルドを失敗させます。タグIDはビルド後のHTMLに含まれる公開情報であり、秘密値を指定しないでください。変数名・IDの確認と設定はオーナーが行い、変更後は再ビルドします。

計測するのは固定URLのページ閲覧と保存・共有の操作種別です。コードはURLのquery／fragment、調整値、seed、コピーしたURL、入力内容をイベントに渡さず、canonicalをpage_locationに指定し、referrerも空にします。広告パーソナライズ／Google signalsは無効にします。フォームの送信先からquery／fragmentを除き、SNS導線は設定入りhrefを持つリンクではなくボタンにし、保存名も固定して自動計測の対象へ設定を載せないようにしています。Google管理画面側の拡張計測・カスタムタグの設定はこのコードから確認・変更できないため、拡張計測の無効化が未確認の間はゲートをオフのままにします。有効化前に拡張計測（とくに外部リンク・フォーム・履歴変更など）を無効にし、設定入りURLを自動収集しないことをオーナーが確認してください。

CIとローカル回帰はゲート無効で実行し、IDだけを設定しても計測が出ないことを確認します。タグ有効時の検査はテスト用IDとモックだけを使います。実際のGoogleへの送信やSNS投稿はテストしません。

参照: [Googleタグ](https://developers.google.com/tag-platform/gtagjs)、[Actions Variables](https://docs.github.com/en/actions/reference/workflows-and-actions/variables)、[Open Graph](https://ogp.me/)、[LINE共有](https://developers.line.biz/en/docs/line-social-plugins/install-guide/using-line-share-buttons/)。

PNGの回帰検査では、全12作品の初期設定と変更後の画像を、PNG変換処理を呼ばない独立したSVGラスタ参照と内部ピクセルで比較します。背景を保った空画像が失敗すること、描画が設定に応じて変わること、遅延した変換と操作権限切れ、準備済みFileの再利用・無効化も検査します。

## 一覧とスマホの操作画面

一覧は全12作品を静的HTMLで表示し、addedAt／slugの順で番号を付けます。新しいmanifestも自動登録し、分類項目は設けません。

幅900px以下の作品画面では、作品を画面高の約38%（上限300px）で上部に残します。操作パネルの内側にスクロール領域を作らず、ページ全体をスクロールします。visualViewportが使える端末では、画面の縮小に合わせてプレビューを小さくし、フォーカスした入力が作品の裏に隠れないよう調整します。保存するSVG／PNGの寸法・生成器は表示サイズから独立しています。

回帰では320×568、375×667、667×375、844×390とキーボード相当の縮小画面で、全作品のプレビュー高・操作位置・はみ出し・二重スクロールを確認します。これはブラウザのモバイルエミュレーションで、実機iPhoneでの検証を意味しません。

保存・共有は単一のダイアログを使い、幅900px以下では下から開きます。Escape・背景・閉じるボタンで閉じ、元のボタンにフォーカスを戻します。変換やコピーの途中で閉じても、自動保存・共有やフォーカス移動は発生しません。回帰ではTab循環、スクロール復元、連打、閉じて開き直す操作、設定変更とPNG準備の競合を確認します。Aboutの計測案内もビルドのゲートに従い、無効時は表示しません。
