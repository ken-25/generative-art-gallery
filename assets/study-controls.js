/* UI definitions only: generator v1 stays unchanged. */
(() => {
 'use strict';
 const common={palette:['配色','背景と線・図形の色の組み合わせを選びます。'],seed:['シード','同じシードと設定から、同じ図形と配色を再現できます。'],columns:['列数','横に並べる数。増やすほど細かな配置になります。','number'],rows:['行数','縦に並べる数。増やすほど細かな配置になります。','number'],count:['線分の数','描く線分の数。0では線を描きません。','number'],width:['線幅','線の太さを変えます。','range',''],margin:['余白','画面の端に残す余白です。','range',''],angle:['基準角度','最初の線の向きを回転させます。','range','°'],bands:['帯の数','図形を並べる帯の数です。','number']};
 const works={
 'recursive-regions':{
 depth:['分割の深さ','三角形を繰り返し分ける回数の上限です。0では分割しません。'],minArea:['最小の面積','小さな領域の分割を止める基準。大きくすると粗い構成になります。','range',''],bias:['分割の偏り','最初の辺を選ぶ確率と、短い線の基本角度を変えます。'],density:['線の密度','領域に置く短い線の量。0では線を描きません。'],contrast:['一つおきの領域の線の密度','2番目・4番目と、一つおきの領域に適用します。0ではその領域に線を描かず、1ではほかの領域と同じ密度になります。']},
 'line-trails':{
 steps:['最大歩数','1本の線が進む歩数の上限。画面の端に達すると止まります。','number'],direction:['進む向き','右または下へ進む向きを選びます。'],back:['戻る確率','進行方向と逆向きに戻る確率です。'],length:['一歩の長さ','1回に進む距離の基準です。','range',''],bend:['曲がりの大きさ','進行方向に対して横に振れる幅。増やすほど折れ曲がります。'],spacing:['帯の間隔','小さくすると、帯が中央に集まります。']},
 'octahedral-paths':{
 cells:['立体の数','横に並べる立体の数です。','number'],edges:['描く辺の数','各立体で選ぶ辺の数。最大12本です。'],connected:['辺の選び方','辺をつなげて選ぶか、つながりに関係なく選ぶかを切り替えます。'],yaw:['横の回転','立体を横方向に回して見せる角度です。','range','°'],pitch:['縦の回転','立体を縦方向に回して見せる角度です。','range','°'],variation:['立体ごとの角度差','隣の立体に進むごとの横の回転角。0ではすべて同じ向きです。','range','°']},
 'layered-lines':{
 groups:['線の組数','重ねる平行線の組数。0では線を描きません。'],delta:['組ごとの角度差','隣り合う線の組の角度差です。','range','°'],spacing:['線の間隔','小さくすると、平行線が密になります。','range',''],phase:['並びのずれ','線の並びを、線間隔に対する割合でずらします。'],ratioA:['左領域の幅比','左領域の幅を、3領域の比率で決めます。','range','','領域の幅'],ratioB:['中央領域の幅比','中央領域の幅を、3領域の比率で決めます。','range','','領域の幅'],ratioC:['右領域の幅比','右領域の幅を、3領域の比率で決めます。','range','','領域の幅']},
 'density-field':{
 centerX:['山の横位置','最初の山の横位置。0が左端、1が右端です。'],centerY:['山の縦位置','最初の山の縦位置。0が上端、1が下端です。'],spread:['山の広がり','大きくすると、広い範囲に変化が現れます。'],peaks:['山の数','密度の山を1〜3個に切り替えます。'],amount:['変形量','点の位置と大きさの変化量。0では均一に並びます。'],size:['点の大きさ','円の大きさの基準です。']},
 'hex-transitions':{states:['色の種類数','使う色を2〜4種類から選びます。'],scan:['並べる順序','次の色を決めながら、タイルをたどる順序です。']},
 'flow-and-silence':{
 flow:['流れの強さ','位置に応じて線の角度が変わる強さ。0では基本の流れが水平になります。'],jitter:['角度のゆらぎ','基本の流れに加える、ランダムな角度の変化です。'],length:['平均の長さ','線分の長さの基準です。','range',''],spread:['長さのばらつき','0ではすべて同じ長さになります。'],maskWidth:['空白帯の幅','線を描かない帯の幅。0では空白帯を設けません。','range',''],maskAngle:['空白帯の向き','空白帯に直交する向き。0°では縦の帯、90°では横の帯です。','range','°'],maskPosition:['空白帯の位置','空白帯を中心から移動させる距離です。','range','']},
 'nested-hexagons':{
 stacks:['帯ごとの組数','1つの帯に並べる六角形の組数です。','number'],layers:['重ねる数','1組に重ねる六角形の数です。'],gap:['層の間隔','六角形の半径の差。配置に合わせて全体が縮小されます。','range',''],rotation:['回転のゆらぎ','六角形の向きが変わる範囲です。','range','°'],shift:['中心のずれ','六角形の中心がずれる範囲です。','range',''],dropout:['抜ける確率','六角形を描かずに抜く確率。1ではすべて描きません。'],correlation:['層どうしの連動','大きくすると、隣り合う層の中心と向きが似た変化になります。']},
 'probability-segments':{
 directions:['方向の数','線分の向きを1〜6種類から選びます。'],mean:['平均の長さ','線分の長さの基準です。','range',''],spread:['長さのばらつき','0ではすべて同じ長さになります。'],densityA:['左領域の重み','左領域に置く線分の割合。3領域の重みの合計に対する比率です。','range','','領域の重み'],densityB:['中央領域の重み','中央領域に置く線分の割合。すべて0では線を描きません。','range','','領域の重み'],densityC:['右領域の重み','右領域に置く線分の割合です。','range','','領域の重み']}
 };
 function definition(G,key){
  let data=window.StudyControlDefinitions?.[key]||works[G.slug]?.[key]||common[key],active;
  if(G.slug==='hex-transitions'&&/^w\d\d$/.test(key)){
   const [from,to]=key.slice(1).split('').map(Number);
   data=[`色${to+1}へ`,'同じ組の重みの合計に対する比率です。すべて0なら同じ色を保ちます。','range','',`色${from+1}の次`];active=s=>from<s.states&&to<s.states;
  }
  if(G.slug==='probability-segments'&&/^w\d$/.test(key)){data=[`方向${Number(key.slice(1))+1}の重み`,'重みに比例して線分を配置します。すべて0では線を描きません。','range','','方向の重み'];active=s=>Number(key.slice(1))<s.directions;}
  if(!data)throw Error(`Missing control explanation: ${G.slug}/${key}`);
  if(!Array.isArray(data))return {control:'range',unit:'',...data};
  const [label,help,control='range',unit='',group]=data;return {label,help,control,unit,group,active};
 }
 window.StudyControls=Object.freeze({definition});
})();
