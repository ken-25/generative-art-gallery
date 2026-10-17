window.StudyControlDefinitions={
 cRe:{label:'cの実部',help:'z→z²+cのcの横方向の値。左の図の十字の位置が動き、右の図の形が変わります。',control:'range',unit:''},
 cIm:{label:'cの虚部',help:'cの縦方向の値。0に近いほど右の図は左右対称に近い形、離れるほどねじれた形になります。',control:'range',unit:''},
 centerX:{label:'表示中心の実部',help:'右の図（Julia集合）で中心に表示する位置の横方向の値です。',control:'range',unit:''},
 centerY:{label:'表示中心の虚部',help:'右の図で中心に表示する位置の縦方向の値です。',control:'range',unit:''},
 zoom:{label:'拡大率',help:'右の図の拡大率。1では−1.6〜1.6の範囲を表示します。左の図は全体を表示したままです。',control:'range',unit:'倍'},
 iterations:{label:'最大反復数',help:'外へ逃げるかを調べる反復の上限。増やすと境界が細かくなり、少ないと集合が太って見えます。',control:'range',unit:'回'}
};
