window.StudyControlDefinitions={
 preset:{label:'ルール',help:'よく知られたルールから選びます。30は不規則な模様、90は入れ子の三角形、110は複雑な構造、184は渋滞のような流れになります。「番号を指定」では0〜255を自由に選べます。'},
 rule:{label:'ルール番号',help:'左・自分・右の3セルの8通りの並びそれぞれに、次の状態（白か黒か）を割り当てた番号です。',control:'range',unit:'',active:s=>s.preset==='custom'},
 init:{label:'初期状態',help:'最初の行。中央の1セルだけを黒にするか、シードに従ってランダムに黒を置くかを選びます。'},
 density:{label:'初期密度',help:'ランダムな初期状態で黒にするセルの割合です。',control:'range',unit:'',active:s=>s.init==='random'},
 columns:{label:'列数',help:'1行のセルの数。左端と右端はつながっていて、互いに隣どうしとして扱います。',control:'number',unit:''},
 generations:{label:'世代数',help:'下へ積み重ねる行の数。1行ごとに1世代進みます。',control:'number',unit:''}
};
