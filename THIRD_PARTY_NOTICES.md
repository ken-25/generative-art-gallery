# ライセンス・クレジット

本プロジェクトの自作コードと自作の説明文には[MITライセンス](LICENSE)を適用します。第三者の資料・素材は、それぞれのライセンスに従います。

プレビューWebPは本サイトの生成器から作成しています。サイトの配信物には、外部パッケージ、フォント、原図スキャン、写真を同梱していません。

## 乱数の仕様と参考資料

`works/order-and-chance/generator.js` と `works/truchet-tiles/truchet-generator.js` のrandom関数は、シード文字列にFNV-1a型の32ビット演算を行い、Mulberry32と同じ演算系列を使用します。

Mulberry32の原型はTommy Ettinger、JavaScriptの公開例はbrycによるものです。[bryc/code, PRNGs.md — Mulberry32](https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32)のライセンス表示は `License: Public domain.` です。

FNVアルゴリズムの資料: https://www.isthe.com/chongo/tech/comp/fnv/ 。本実装の文字列処理にはcodePointAtを使います。

`assets/study-core.js` を使う9作品は、文字列を31倍の漸化式で数値化し、線形合同法（LCG）で疑似乱数を生成します。「密度の丘」と「角度の重なり」はその共通部品を読み込みますが、描画に乱数を使いません。Lissajous曲線も乱数を使いません。

## 作品の参考資料

各作品の参考資料はmanifest.sourcesと作品ページに掲載しています。参照作品・資料は本プロジェクトのMIT許諾対象ではありません。

## 開発時の検証ツール

Playwrightをブラウザ回帰テストに使います（Apache-2.0）。開発用の依存関係で、サイトの配信物には含めません。バージョンと配布元はpackage-lock.jsonに固定しています。
