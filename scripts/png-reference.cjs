/* Independent browser reference: render the original SVG at its intrinsic
   viewport, scale onto a separate canvas, and compare decoded PNG pixels.
   No ArtShare/pngBlob/pngSize code is called. */
module.exports=async ({svg,png})=>{
 const load=src=>new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=reject;image.src=src;});
 const sourceURL=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
 const canvases=[];
 try{
  const [actual,reference]=await Promise.all([load('data:image/png;base64,'+png),load(sourceURL)]);
  const pixels=image=>{const c=document.createElement('canvas');c.width=actual.width;c.height=actual.height;canvases.push(c);const context=c.getContext('2d');context.fillStyle='#fff';context.fillRect(0,0,c.width,c.height);context.drawImage(image,0,0,c.width,c.height);return context.getImageData(0,0,c.width,c.height).data;};
  const a=pixels(actual),b=pixels(reference),background=[b[0],b[1],b[2]];let total=0,inkError=0,ink=0;
  for(let y=1;y<actual.height-1;y++)for(let x=1;x<actual.width-1;x++){
   const i=4*(y*actual.width+x);let error=0,contrast=0;for(let c=0;c<3;c++){error+=Math.abs(a[i+c]-b[i+c]);contrast+=Math.abs(b[i+c]-background[c]);}total+=error;
   if(contrast>40){ink++;inkError+=error;}
  }
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',a)),v=>v.toString(16).padStart(2,'0')).join('');
  return {meanError:total/(3*(actual.width-2)*(actual.height-2)),inkError:ink?inkError/(3*ink):0,ink,pixelHash:hash};
 }finally{URL.revokeObjectURL(sourceURL);for(const c of canvases)c.width=c.height=1;}
};
