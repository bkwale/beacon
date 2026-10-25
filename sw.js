const CACHE="beacon-shell-v1";
self.addEventListener("install",e=>self.skipWaiting());
self.addEventListener("activate",e=>e.waitUntil(self.clients.claim()));
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(
    fetch(e.request).then(r=>{
      if(e.request.mode==="navigate"){const c=r.clone();caches.open(CACHE).then(ca=>ca.put("./",c));}
      return r;
    }).catch(()=>caches.match(e.request).then(m=>m||caches.match("./")))
  );
});
