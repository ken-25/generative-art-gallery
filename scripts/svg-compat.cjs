/* Browsers may differ from Node by an ulp in Math.exp/sin/cos. Keep structure,
   text, colors and metadata exact; compare numeric SVG attributes to 1e-9 units.
   Node fixtures independently require the complete original byte hash. */
module.exports=svg=>svg.replace(/\b(viewBox|cx|cy|r|x|y|x1|x2|y1|y2|width|height|stroke-width|points|d|transform)="([^"]*)"/g,(_,key,value)=>`${key}="${value.replace(/-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/gi,n=>String(Number(Number(n).toFixed(9))))}"`);
