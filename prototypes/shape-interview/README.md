# 形を見て選ぶローカル試作

対象は「重なる六つの辺」1作品です。外部AI/API・認証・外部送信は使わず、選択とseedから決定的に候補を作ります。

```sh
npm run build
node scripts/interview-preview.cjs
```

表示されたlocalhostの `/prototype/` を開きます。試作フォルダはbuildのコピー対象外で、通常サイトのナビゲーションにも追加していません。

流れは、最初の3候補 → 保持する特徴 → 次の3候補 → 仕上げ。保持するのは層数・ひねりの幅・色の設定値で、六角形のずれ方はseedによって変わります。戻って最初の形を選び直すと、保持項目と後続の候補は選び直しになります。

レシピJSONまたはローカルのレシピURLから、選択・保持項目・候補の順番と形を復元できます。STLは既存のgeometry-v1とSTLExporterを直接使い、「作品ページで仕上げる」は同じ設定を既存3D詳細へ渡します。

```sh
node --test scripts/interview.test.mjs
CHROMIUM_PATH=/usr/bin/chromium node scripts/interview-browser.cjs
```

実エージェントとの会話、自由文解釈、全作品への展開は含みません。実機での操作性と、候補の違いが人にとって十分分かりやすいかは、利用者との検証が必要です。
