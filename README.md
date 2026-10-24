# Generative Art Gallery

**[公開ギャラリーを開く →](https://ken-25.github.io/generative-art-gallery/)**

規則と偶然から生まれる形を、設定を動かして楽しむジェネラティブアートのギャラリーです。

## できること

- 数値・配色・シードなどを変えて、自分の好きな一枚を探す。
- 「共有」から設定入りのURLをコピーし、同じ図形と配色を共有する。
- 「保存」からPNG・SVG画像、CAD用のDXFファイルをダウンロードする。

## ローカルで動かす

Node.js 22以上とPython 3を用意し、次のコマンドを実行します。

```sh
git clone https://github.com/ken-25/generative-art-gallery.git
cd generative-art-gallery
npm ci
npm run build
python3 -m http.server 8000 --directory dist
```

[http://localhost:8000/](http://localhost:8000/) を開きます。ビルド結果は `dist/` に出力されます。

## 作品詳細の2D／3D表示

作品一覧から各作品の詳細を開きます。ローレンツの軌道と辺をたどる影は3D、重なる六つの辺・近い点の領域・書き換えて育つ枝は2Dを初期表示とし、同じ詳細ページ内で表示を切り替えられます。3Dでは作品に効く設定を調整し、共通の保存・共有からPNG・STLや設定入りURLを取得できます。旧2D共有URLと既存24作品のPNG・SVG・DXF保存は維持しています。構成と検証範囲は [表示と検証の記録](docs/3d-preview.md) を参照してください。

## テスト

```sh
npm test
npm run build
```

ブラウザー操作まで確認する場合:

```sh
npx playwright install --with-deps chromium
npm run test:browser
```

## 参加する

バグ報告、説明や操作の改善、新しい作品、おすすめ設定・配色の提案を歓迎します。IssueやPRを送る前に[参加ガイド](CONTRIBUTING.md)をご覧ください。アイコンと共通カラーの使い方は[ブランドガイド](BRAND.md)にまとめています。

## ライセンス

[MITライセンス](LICENSE)で公開しています。[第三者コードのライセンス・クレジット](THIRD_PARTY_NOTICES.md)もご覧ください。

3D の実画面検証（ビルド後に専用のローカルサーバーを自動起動）:

```sh
CHROMIUM_PATH=/usr/bin/chromium node scripts/sculpture-browser.cjs
```
