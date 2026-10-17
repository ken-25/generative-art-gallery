window.StudyControlDefinitions={
 target:{label:'目標粒子数',help:'塊に付着させたい粒子の数。計算量の上限や格子の端に先に達したときは、そこで止めて実際の付着数を表示します。',control:'range',unit:''},
 stickiness:{label:'付着確率',help:'塊に隣り合ったときに付く確率。1ではすぐ付いて細い枝に、小さくすると奥まで入り込んで太い塊になります。',control:'range',unit:''},
 origin:{label:'中央の初期種',help:'最初に置いておく塊。点では四方へ、短い線では線の上下へ枝が伸びやすくなります。'}
};
