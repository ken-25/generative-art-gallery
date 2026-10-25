/* Local-only prototype server. The prototype directory is not part of the site build. */
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
async function startPreview({port=0}={}){
 const project=path.resolve(__dirname,'..');
 const server=http.createServer(async(req,res)=>{try{
  const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(pathname==='/prototype'){res.writeHead(302,{Location:'/prototype/'}).end();return;}
  const prototype=pathname.startsWith('/prototype/'),root=path.join(project,prototype?'prototypes/shape-interview':'dist');
  let file=path.resolve(root,prototype?pathname.slice('/prototype/'.length):pathname.slice(1));
  if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  if((await fs.stat(file)).isDirectory())file=path.join(file,'index.html');
  const mime={'.html':'text/html; charset=utf-8','.mjs':'text/javascript','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.webp':'image/webp','.png':'image/png','.ico':'image/x-icon'};
  res.setHeader('Content-Type',mime[path.extname(file)]||'application/octet-stream');res.setHeader('Cache-Control','no-store');res.end(await fs.readFile(file));
 }catch{res.writeHead(404).end();}});
 await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
 return {server,url:`http://127.0.0.1:${server.address().port}/prototype/`};
}
module.exports={startPreview};
if(require.main===module)startPreview({port:Number(process.env.INTERVIEW_PORT||8010)}).then(({url})=>console.log(url)).catch(e=>{console.error(e);process.exitCode=1;});
