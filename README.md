# generative-art-gallery

規則と偶然に触れる、日本語の静的アートギャラリー。トップは作品横断の入口です。最初の作品「秩序とゆらぎ」は Georg Nees の《Schotter》に着想を得て、seed付きの乱数と独自の図形配置を実装しています。参考画像は転載していません。乱数実装の由来はTHIRD_PARTY_NOTICES.mdを参照してください。2つ目の作品「四つの向き」は、Sébastien Truchet（1704年）の二色三角タイルの組合せ原理に基づく独自実装です。3つ目の作品「ふたつの振動」は Lissajous 曲線の数学的原理に基づく独自実装です。

## 開く

Node.js 22以上で `npm run build` を実行し、`python3 -m http.server 8000 --directory dist` で配信して `http://localhost:8000/` を開きます。実行時は静的HTML/CSS/JavaScriptのみで、外部API・CDN・フォント・バックエンドは不要です。作品の操作にはJavaScriptが必要です。一覧の作品名・説明・リンクは無効でも読めます。

## 操作と生成規則

初期値は12列 × 22行、位置の乱れ0.75、回転65°、増え方1.7、シード `study-001`。

- 位置: 0–2（辺の長さに対する最大移動比率）、回転: 0–180°。
- 増え方: 0.2–4。下への進み具合をこの指数で累乗し、移動・回転に乗じます。小さいほど早く乱れます。
- 列: 1–40、行: 1–60。整数に丸め、範囲外は上限・下限に補正。空欄・非数値は初期値を使います。編集中は入力を維持し、確定時に補正値を表示します。
- 行数1では進み具合を0とし、位置・回転とも乱れません。
- シード: 最大80文字。前後の空白を除き、空欄は初期シード。同じ設定・シード・生成器バージョンで再現します。「別のシード」「リセット」も利用できます。
- スライダーは矢印キー、ボタンは Enter / Space でも操作できます。

SVG 保存は単体の画像ファイルをダウンロードします。背景、図形、説明、`metadata` 内のJSON（`generator` / `version` / 全設定）を含み、外部リソースを参照しません。編集画面へのSVG再読み込み機能はありません。設定はSVGのテキストから確認できます。

## 四つの向き（Truchet タイル）

対角線で二色に分けた正方形タイルを、90度単位の4つの向き（濃い三角がある角: 左上・右上・右下・左下）から選んで並べます。初期値は12列 × 12行、各向きの重み25、シード `tile-001`。

- 列・行: 1–40。整数に丸め、範囲外は補正、空欄・非数値は初期値。
- 向きの重み: 各0–100。合計に対する割合で向きを選び、すべて0なら均等。
- シード・リセット・SVG保存・キーボード操作は「秩序とゆらぎ」と同じです。生成器は `works/truchet-tiles/truchet-generator.js` に独立させ、既存作品のシード結果に影響しません。
- 原資料の特定配列や図版のトレースではなく、配色・配列・UIは独自設計です。歴史的原作の複製や公認復刻ではありません。円弧型タイルは対象外です。

## ふたつの振動（Lissajous曲線）

x = A sin(a t + δ)、y = B sin(b t) を 0 ≤ t ≤ 2π で計算し、SVG の1本の線として描きます。初期値は a:b = 3:2、δ = 90°、A = B = 1、線幅1.6、配色「藍」。

- 周波数 a・b: 1–12 の整数（曲線は必ず閉じます）。位相差 δ: 0–360°（整数）。振幅 A・B: 0.1–1。線幅: 0.5–4。範囲外は補正、空欄・非数値は初期値。
- 点の数は 200 × max(a, b) + 1、上限2401点。乱数は使わず、同じ設定から同じ曲線を生成します。
- 1:1・δ = 0 で直線、A = B・1:1・δ = π/2 で円になります。プリセット（直線・円・8の字・3:2・5:4・9:8）、配色3種、リセット、SVG保存（`metadata` に `generator: "lissajous"` / `version` / 全設定）があります。

## 確認すること

トップから作品への遷移、設定の即時反映、同一シードの再現、リセット、SVG保存を確認してください。行列数の最小・最大・空欄、行数1、連続操作、キーボード操作、スマホ幅も確認対象です。保存SVGの `metadata` で設定を確認できます。

## 参考・出典

- [Kunsthalle Bremen — Und jetzt Du!](https://www.kunsthalle-bremen.de/de/view/exhibitions/exb-page/und-jetzt-du): Georg Nees《Schotter》に言及する展覧会資料。
- [Carnegie Mellon University — Creative Code](https://ems.andrew.cmu.edu/2022f/deliverables/2-creative-code/index.html): ジェネラティブデザインに関する教育資料。

- [Gallica (BnF) — Mémoire sur les combinaisons](https://gallica.bnf.fr/ark:/12148/bpt6k3486m/f517): Truchet の原資料の所在（原図は未実見）。
- [Académie des sciences — Truchet の追悼文](https://www.academie-sciences.fr/pdf/dossiers/Fontenelle/font_pdf/p93_101_vol3527.pdf)
- [European Mathematical Society — 解説記事](https://euromathsoc.org/magazine/articles/248)
- [Archives des Yvelines — Jules-Antoine Lissajous 人物典拠](https://bibliotheque-archives.yvelines.fr/concept?id=5fa2e490-3cd9-449a-9759-b7b4d4d4d926)、[Gallica — 1857年原資料の所在](https://gallica.bnf.fr/ark:/12148/bpt6k65708374/f151)、[Smithsonian — 関連装置](https://americanhistory.si.edu/collections/object/nmah_1822842): Lissajous曲線の参考。歴史的原作の複製・公認復刻ではありません。

外部資料は参考リンクとして掲載し、画像やコードは取り込んでいません。

## 静的ビルドと作品の追加

Node.js 22以上で `npm test`、`npm run build`。公開対象は `dist/` のみで、生成物はコミットしません。ローカルでは `python3 -m http.server 8000 --directory dist` などで確認します。ビルド用テンプレートは `templates/index.html` です。ルートの `index.html` は配信設定切替前の既存3作品を維持する移行用ページで、新規作品の登録先ではありません。

新規作品は `works/<slug>/` 内に `index.html`、専用JS/CSS、静止プレビュー、`manifest.json` を追加します。manifestは既存作品を参照し、slug（フォルダ名と一致）、title、description、UTCのaddedAt、tags、preview、sources（label/url）を記載してください。共通の登録リストやREADMEへの作品別追記は不要です。addedAt昇順・slug昇順で表示し、番号はその時点の表示順であり永久IDではありません。公開済みslugを変更しないでください。

`SITE_URL` は公開先の末尾 `/` 付き絶対URLです。既定値は `https://ken-25.github.io/generative-art-gallery/`。canonical・OGP・sitemapに使用します。詳細URLの末尾 `/` と `index.html` はともに維持します。共有画像には各作品の静止WebPを使用します。

### GitHub Pages配信

`.github/workflows/verify.yml` はPRのテスト・ビルド検証用です。`.github/workflows/pages.yml` はmainへのpushと手動実行でテスト・ビルドを行い、生成した `dist/` だけを公式Pages Actionsで配信します。手動で別ブランチを指定しても公開ジョブは実行しません。

配信方式を移行する際は、リポジトリのSettings → Pages → Build and deployment → Sourceを **GitHub Actions** に変更します。その後mainのDeploy Pagesを手動実行し、成功したdeployジョブのURLで確認してください。mainへマージした際の実行が設定切替前に失敗した場合も、切替後にmainで再実行できます。ワークフロー追加だけではSourceは切り替わりません。設定変更やマージは実施者が確認して行います。

ビルドはNode.js 22で `npm test` → `npm run build`、`SITE_URL=https://ken-25.github.io/generative-art-gallery/` を使用します。配信には既存の `GITHUB_TOKEN` の `pages: write`・`id-token: write` を公開ジョブだけに付与し、`github-pages` environmentの保護ルールを適用します。追加Secretsや外部サービスは不要です。同じブランチの実行は `pages-${{ github.ref }}` で直列化し、実行中の公開をキャンセルしません。別ブランチの手動ビルドはmainの配信待ち実行を置き換えません。

公開後は全作品の一覧・末尾 `/` と `index.html` の固定URL、共有URLの復元、About、SVG保存を公開サブパス上で確認します。canonical・OGP・sitemapも公開URLと照合します。サブパスに形式的なrobots.txtは追加しません。

## 同じ絵を共有する

各作品の「この絵を共有」で現在の正規化済み全設定をコピーします。自動コピーできない環境では表示されたURLを手動コピーできます。`#art=<encodeURIComponent(JSON)>` に `{format:1,generator:1,settings:{全設定}}` を格納します。キー順は生成器のdefaults順に固定し、seedも省略しません。fragmentはサーバーへ送信されません。通常の入力操作ではURLや履歴を更新しません。canonicalは設定なしの固定作品URLです。

形式1・生成器1は初回の互換経路です。各作品の現在の生成器（乱数・正規化・既定値を含む）はversion 1として保持し、将来変更する場合は旧実装を残して明示的にバージョン分岐してください。未対応バージョン・欠落・未知キー・不正値・範囲外は復元を拒否し、初期設定の表示と案内を行います。黙って補正して同じ絵と表示しません。上限8192文字。

同じ絵とは図形・配色の再生成を意味し、端末間でのピクセル描画の完全一致を意味しません。永続的に残すにはSVG保存も利用してください。

## 利用条件と参加

当プロジェクトが許諾できるコードと自作説明文には[MIT](LICENSE)を適用します。商用利用・改変・再配布ができ、著作権表示と許諾文の保持が必要です。第三者素材・参照作品は一括MITの対象ではなく、[由来点検と第三者条件](THIRD_PARTY_NOTICES.md)を維持します。

保存した絵は当サイト側が許諾できる範囲で商用利用・加工・共有を認めます。コードのMITが生成物へ自動的に同じ義務を課すものではなく、ユーザーや第三者の権利を取得・放棄させる条項はありません。全法域での権利や適法性の包括的保証はしません。目的と楽しみ方は[About](about/index.html)、制作・投稿の確認項目は[参加ガイド](CONTRIBUTING.md)を参照してください。
