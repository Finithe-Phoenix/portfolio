import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
const root=resolve(process.env.SITE_DIR||'dist');
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.mjs':'text/javascript','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.xml':'application/xml','.pdf':'application/pdf'};
const port=Number(process.env.PORT||4175);
export function serverFor(directory=root) {
 return createServer(async(req,res)=>{
  try {
   const url=new URL(req.url,'http://localhost');
   let path=decodeURIComponent(url.pathname);
   if(path==='/portfolio') {res.writeHead(302,{Location:'/portfolio/'});res.end();return;}
   if(path.startsWith('/portfolio/'))path=path.slice('/portfolio'.length);
   if(path.endsWith('/'))path+='index.html';
   const file=resolve(directory,'.'+path);
   if(!file.startsWith(directory+sep)){res.writeHead(403);res.end('Forbidden');return;}
   const data=await readFile(file);
   res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':'no-store'});res.end(data);
  }catch {res.writeHead(404);res.end('Not found');}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/,'$1').replace(/\//g,sep)){
 serverFor().listen(port,'127.0.0.1',()=>console.log('Portfolio: http://127.0.0.1:'+port+'/portfolio/'));
}
