# 由来点検と第三者の条件

2026-10-16に、初回実装04db76f、Truchet追加e42feb1、Lissajous追加436f7e5と現在のHTML/CSS/JS、画像、説明を確認しました。外部パッケージ、フォント、原図スキャン、写真の同梱はありません。プレビューPNGは本サイトの生成器から作成しています。外部参考資料はリンクで案内し、資料自体をMITに変更しません。コード作成には生成AIが使われています。履歴と照合だけで全コードの完全な独自性や権利状態を保証するものではありません。

## 乱数実装

`works/order-and-chance/generator.js` と `works/truchet-tiles/truchet-generator.js` のrandom関数は、シード文字列にFNV-1a型の32ビット演算を行い、Mulberry32と同じ演算系列を使用します。「独自乱数アルゴリズム」という説明は適切ではありません。元の作成時に参照したページの履歴は残っていないため、直接のコピー元は確定できません。

照合したJavaScript実装: [bryc/code, PRNGs.md — Mulberry32](https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32)。2026-10-16取得時のファイル冒頭には `License: Public domain.` と明記されています。原型の作者としてTommy Ettinger、JavaScriptの公開例としてbrycを記録します。本プロジェクトのMITは第三者由来の部分に新たな独占権や表示義務を主張しません。公有の扱いは法域により異なり得ます。

FNVアルゴリズムの資料: https://www.isthe.com/chongo/tech/comp/fnv/ 。本実装はUTF-16のcharCodeAtではなくcodePointAtを使うため、一般的なFNV実装と同一の文字列ハッシュとは主張しません。

## 数学・作品の参照

各作品のmanifest.sourcesとページ本文に資料を記録しています。TruchetとLissajousのGallica原資料は所在確認のみで、原図は未実見です。Nees《Schotter》への着想を含め、参照作品・資料・第三者の具体的表現は本プロジェクトのMIT許諾対象ではありません。図形・式の独自実装と、特定の作品の表現の複製を区別します。

## 適用範囲

LICENSEは本プロジェクトが許諾できるコードと自作説明文に適用します。第三者由来の部分は上記または個別の表示を維持します。新たな素材を取り込む場合は由来と利用条件を別記してください。不明な素材を許諾済みとして取り込まないでください。
