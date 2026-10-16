# 参加する

バグ報告、操作の改善、説明の修正、新しい作品の提案をIssueやPRで歓迎します。

## 作品を追加する手順

1. `templates/study/index.html` を `works/<slug>/index.html` にコピーし、タイトル・説明・操作のポイント・出典を差し替えます。公開後も同じslugを使います。
2. 作品フォルダに `generator.js`、`controls.js`、`preview.webp`、`manifest.json` を置きます。ひな形の [UI定義](templates/study/controls.js) と [manifest](templates/study/manifest.json) を参照してください。
3. 生成器は `StudyCore.create({slug,title,schema,defaults,geometry,draw})` を使い、`window.StudyGenerator` とNode.jsの `module.exports` に公開します。純粋な計算にし、DOM操作は共通UIに任せます。`schema` は数値のmin/max/stepまたは選択肢のoptionsを持ちます。
4. `controls.js` には各変数の日本語ラベル、変化の効果を説明するhelp、必要な単位を定義します。連続値や段階的に試す値はrange、行列数や線分数など直接入力する値はnumber、選択肢はschema.optionsを使います。画面上の説明を変えるために生成器v1を変更しないでください。
5. 関連する重みにはgroupを付け、無効な組み合わせはactive関数で非表示・無効化します。非表示でも設定値は保持し、共有URLに全項目を含めます。数値や重みの合計が0のときの動作も説明してください。
6. 作品本文は「何が見えるか」「どの値でどう変わるか」を書き、出典と制作記録・共通利用条件へのリンクを添えます。資料の確認状況、参照した内容、独自に設計した内容、取り込んだ素材と条件は作品フォルダの `DESIGN.md` に記録します。未確認の資料を確認済みにしないでください。
7. 生成器のテストと、既定値・上下限の共有URL／SVGハッシュfixtureを追加して、以下の確認を通します。

manifestの必須項目はslug、title、description、UTCのaddedAt、tags、preview、sources（label/url）です。作品登録用の一覧を別途編集する必要はありません。

## 受入チェック

`npm ci` → `npm test` → `npm run build` → `npx playwright install chromium` → `npm run test:browser` を実行します。PRのVerify static siteでも同じ確認を行います。

- ラベルと説明があり、数値の範囲・刻み・単位が実装と合う。スライダーは矢印キー・Home・Endで操作でき、現在値が同期する。
- 数値欄の上下限超過と空欄を確定すると正規化される。条件外の重みは見えず、入力も無効になる。条件を戻すと値を保持する。
- SVG保存は緑色・全幅・高さ44px以上で、リセットや共有と間隔がある。計算済みスタイルと実ダウンロードで確認する。
- 乱数を使う作品にだけ「別のシード」があり、クリックでシードが変わる。リセットで全設定が初期値に戻り、以前の共有URL欄は閉じる。
- 共有URLから全設定と同じ図形を復元でき、不正URLには案内が出る。既存v1のSVGと旧共有URLの結果が変わらない。
- 全作品を1440pxと375pxで開き、横にはみ出さず、キーボード・保存・共有が動く。末尾 `/` と `index.html`、公開サブパス、Aboutと共通利用条件へのリンクも確認する。
- 作品の日本語が数値を変えた結果と一致し、制作内部のIssue参照や定型的な権利説明が作品鑑賞を妨げない。改善前後の画像も比較する。

既存fixtureの期待値を書き換えて互換性違反を通さないでください。生成器を更新するときも旧版を保持し、共有URLのバージョンで切り替えます。

## 素材と利用条件

提供権限のある素材を使い、由来と条件を制作記録に残してください。数学の原理やアイデアと、特定作品の図形・構図・画像・文章を区別して確認します。共通の条件は[利用条件](about/index.html#terms)、第三者素材の記録は[資料と実装の由来](THIRD_PARTY_NOTICES.md)にまとめます。投稿に不要な著作権譲渡は求めません。
