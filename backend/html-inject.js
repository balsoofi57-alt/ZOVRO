'use strict';
const http=require('http');
const originalCreateServer=http.createServer.bind(http);

http.createServer=function(handler,...args){return originalCreateServer((req,res)=>{
  const url=new URL(req.url||'/','http://localhost');
  if(req.method==='GET'&&(url.pathname==='/'||url.pathname==='/index.html')){
    const chunks=[];
    const originalEnd=res.end.bind(res);
    res.write=(chunk,enc,cb)=>{if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));if(typeof cb==='function')cb();return true};
    res.end=(chunk,enc,cb)=>{
      if(chunk)chunks.push(Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk,enc));
      let body=Buffer.concat(chunks).toString('utf8');
      if(body.includes('</body>')){
        const tags=[];
        if(!body.includes('consent-client.js'))tags.push('<script src="consent-client.js"></script>');
        if(!body.includes('profile-security-client.js'))tags.push('<script src="profile-security-client.js"></script>');
        if(tags.length)body=body.replace('</body>',tags.join('\n')+'\n</body>');
      }
      return originalEnd(Buffer.from(body),undefined,cb);
    };
    return handler(req,res);
  }
  return handler(req,res);
},...args)};
