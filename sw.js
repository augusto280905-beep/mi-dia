const C="aitxorapp-v32",F=["./","index.html","manifest.webmanifest","pulso-180.png","pulso-192.png","pulso-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>Promise.all(F.map(u=>fetch(u,{cache:"reload"}).then(r=>{if(r.ok)return c.put(u,r)})))).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C).map(x=>caches.delete(x)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",e=>{if(e.request.method!=="GET"||new URL(e.request.url).origin!==location.origin)return;
 e.respondWith(fetch(e.request,{cache:"no-store"}).then(r=>{if(r.ok){const c=r.clone();caches.open(C).then(x=>x.put(e.request,c))}return r}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))))});
self.addEventListener("push",e=>{let d={};try{d=e.data.json()}catch(x){d={title:"Aitxorapp",body:e.data?e.data.text():""}}
 e.waitUntil(self.registration.showNotification(d.title||"Aitxorapp",{body:d.body||"",icon:"pulso-192.png",badge:"pulso-192.png",tag:d.tag||undefined,data:{url:d.url||"./"}}))});
self.addEventListener("notificationclick",e=>{e.notification.close();e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(l=>{for(const c of l){if("focus"in c)return c.focus()}return clients.openWindow(e.notification.data&&e.notification.data.url||"./")}))});
