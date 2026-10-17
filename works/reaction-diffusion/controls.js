window.StudyControlDefinitions={
 preset:{label:'模様',help:'安定して模様が育つ給餌率と除去率の組。斑点は丸い粒、迷路は曲がりくねった帯、珊瑚は枝分かれする帯になります。「値を指定」で自由に選べます。'},
 feed:{label:'給餌率',help:'物質Aを外から補う速さ。値によって模様が粒・帯・消滅へと変わります。',control:'range',unit:'',active:s=>s.preset==='custom'},
 kill:{label:'除去率',help:'物質Bが取り除かれる速さ。大きいとBが消え、小さいと一面に広がります。',control:'range',unit:'',active:s=>s.preset==='custom'},
 seeds:{label:'初期種の数',help:'最初に物質Bを置く小さな正方形の数。シードで位置が決まります。',control:'number',unit:''},
 iterations:{label:'反復回数',help:'反応と拡散を計算する回数。少ないと種の周りだけ、増やすと画面全体に模様が広がります。',control:'range',unit:'回'},
 threshold:{label:'輪郭の閾値',help:'物質Bの濃さがこの値以上の領域を塗ります。小さいと太く、大きいと細い模様になります。',control:'range',unit:''}
};
