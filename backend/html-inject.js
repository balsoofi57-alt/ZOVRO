'use strict';
const http=require('http');
const originalCreateServer=http.createServer.bind(http);

http.createServer=function(handler,...args){return originalCreateServer((req,res)=>{
  const url=new URL(req.url||'/','http://localhost');
  if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html')){
    const chunks=[];
    const originalWrite=res.write.bind(res),originalEnd=res.end.bind(res);
    res.write=(chunk,enc,cb)=>{if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));if(typeof cb==='function')cb();return true};
    res.end=(chunk,enc,cb)=>{
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));
      const body=Buffer.concat(chunks).toString('utf8');
      if(body.includes('</body>')&&!body.includes('consent-client.js')){
        const out=body.replace('</body>','<script src="consent-client.js"></script>\n</body>');
        return originalEnd(Buffer.from(out),undefined,cb);
      }
      return originalEnd(Buffer.concat(chunks),undefined,cb);
    };
    return handler(req,res);
  }
  return handler(req,res);
},...args)};
