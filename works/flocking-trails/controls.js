window.StudyControlDefinitions={
 count:{label:'個体数',help:'群れをつくる個体の数。1では仲間がいないため、最初の向きにまっすぐ進みます。',control:'number',unit:''},
 separation:{label:'分離の重み',help:'近づきすぎた仲間から離れる強さ。近傍半径の半分より近い仲間に働きます。',control:'range',unit:''},
 alignment:{label:'整列の重み',help:'近くの仲間と進む向きをそろえる強さ。大きいと平行な帯になります。',control:'range',unit:''},
 cohesion:{label:'結合の重み',help:'近くの仲間の中心へ寄る強さ。大きいと渦や塊になります。3つの重みがすべて0では直線になります。',control:'range',unit:''},
 radius:{label:'近傍半径',help:'仲間として意識する距離。小さいと小さな群れに分かれ、大きいと全体がまとまります。',control:'range',unit:''},
 steps:{label:'軌跡の長さ',help:'計算して線に残すステップ数。画面の端を越えると反対側から現れ、線はそこで切れます。',control:'range',unit:''}
};
