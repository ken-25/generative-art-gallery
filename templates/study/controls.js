/* Copy to works/<slug>/controls.js. Add a definition for every generator variable.
   Keys must match defaults/schema. Common palette/seed/columns/rows definitions
   are available in study-controls.js and need not be repeated. */
window.StudyControlDefinitions={
 amount:{label:'変化の量',help:'値を大きくすると、図形がどう変わるかを記入します。',control:'range',unit:''}
 // Weight example (adapt to your schema):
 // w0:{label:'方向1の重み',help:'合計に対する割合で選びます。',group:'方向の重み',active:s=>s.directions>=1}
};
