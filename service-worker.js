const CACHE='zovro-web-v15-languages-20261109';
const CORE=['./','./index.html','./privacy.html','./terms.html','./support.html','./manifest.webmanifest','./assets/zovro-icon.svg','./assets/zovro-icon-1024.png','./assets/zovro-official-brand.webp','./assets/brand/zovro-trades-background.webp','./assets/brand/zovro-logo-transparent.webp','./website-final.css','./website-final.js','./i18n-messages.js?v=languages-20261109','./i18n.js?v=languages-20261109'];

self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener('activate',event=>{
  event.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())
  );
});

self.addEventListener('fetch',event=>{
  const request=event.request;
  if(request.method!=='GET') return;
  const url=new URL(request.url);
  if(url.origin!==self.location.origin) return;
  // Never cache authenticated API data or explicit private reads.
  if(url.pathname.startsWith('/api/')||request.cache==='no-store') return;

  if(request.mode==='navigate'){
    event.respondWith(
      fetch(request).then(response=>{
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
        return response;
      }).catch(()=>caches.match('./index.html'))
    );
    return;
  }

  event.respondWith(
    fetch(request).then(response=>{
      if(response.ok){
        const copy=response.clone();
        caches.open(CACHE).then(cache=>cache.put(request,copy));
      }
      return response;
    }).catch(()=>caches.match(request))
  );
});
