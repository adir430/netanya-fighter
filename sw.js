/* Netanya Fighter service worker: lets the game open instantly and work without a connection.
   The page itself is fetched network-first (so a new version shows up as soon as you are online),
   everything else is cache-first. Bump VERSION (build.py does it) to refresh the cache. */
const VERSION='nf-3.8';
const FONTS='nf-fonts';
const CORE=['./','index.html','manifest.webmanifest','icon-192.png','icon-512.png','icon-maskable-512.png','apple-touch-icon.png','favicon-48.png'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('nf-')&&k!==VERSION&&k!==FONTS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET')return;
  let u; try{ u=new URL(r.url); }catch(_){ return; }
  if(u.origin===self.location.origin){
    if(r.mode==='navigate'){
      e.respondWith(fetch(r).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(VERSION).then(c=>c.put('index.html',cp)); } return res; })
        .catch(()=>caches.match('index.html').then(m=>m||caches.match('./'))));
      return;
    }
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{ if(res&&res.ok){ const cp=res.clone(); caches.open(VERSION).then(c=>c.put(r,cp)); } return res; })));
    return;
  }
  if(u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'){
    e.respondWith(caches.open(FONTS).then(c=>c.match(r).then(m=>{
      const f=fetch(r).then(res=>{ if(res&&(res.ok||res.type==='opaque'))c.put(r,res.clone()); return res; }).catch(()=>m);
      return m||f;
    })));
  }
});
