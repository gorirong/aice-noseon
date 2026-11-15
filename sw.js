// 휴대폰에 파일을 받아 두고, 인터넷이 없을 때 거기서 꺼내 주는 일꾼
const VER = 'aice-noseon-5304be9dec';
const FILES = ["./", "index.html", "manifest.json", "icon-192.png", "icon-512.png", "py/joblib-1.4.0-py3-none-any.whl.wasm", "py/numpy-1.26.4-cp312-cp312-pyodide_2024_0_wasm32.whl.wasm", "py/openblas-0.3.26.zip.wasm", "py/pandas-2.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl.wasm", "py/pyodide-lock.json", "py/pyodide.asm.js", "py/pyodide.asm.wasm", "py/pyodide.js", "py/python_dateutil-2.9.0.post0-py2.py3-none-any.whl.wasm", "py/python_stdlib.zip.wasm", "py/pytz-2024.1-py2.py3-none-any.whl.wasm", "py/scikit_learn-1.4.2-cp312-cp312-pyodide_2024_0_wasm32.whl.p0.wasm", "py/scikit_learn-1.4.2-cp312-cp312-pyodide_2024_0_wasm32.whl.p1.wasm", "py/scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl.p0.wasm", "py/scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl.p1.wasm", "py/scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl.p2.wasm", "py/scipy-1.12.0-cp312-cp312-pyodide_2024_0_wasm32.whl.p3.wasm", "py/six-1.16.0-py2.py3-none-any.whl.wasm", "py/threadpoolctl-3.4.0-py3-none-any.whl.wasm"];
const FONT = /^https:\/\/fonts\.(googleapis|gstatic)\.com\//;
async function tell(msg){ (await self.clients.matchAll({includeUncontrolled:true})).forEach(c=>c.postMessage(msg)); }
async function fillCache(){
  const c = await caches.open(VER);
  let done = 0, failed = false;
  for(const f of FILES){
    if(!(await c.match(f))){
      try{ const r = await fetch(f, {cache:'reload'}); if(!r.ok) throw 0; await c.put(f, r); }
      catch(e){ failed = true; }
    }
    done++; if(done % 3 === 0 || done === FILES.length) tell({type:'progress', done, total: FILES.length});
  }
  tell({type: failed ? 'fail' : 'ready'});
  return !failed;
}
self.addEventListener('install', e=>{ self.skipWaiting(); });
self.addEventListener('activate', e=>{
  e.waitUntil((async()=>{
    for(const k of await caches.keys()) if(k !== VER && k.startsWith('aice-noseon-')) await caches.delete(k);
    await self.clients.claim();
  })());
});
let filling = null;
self.addEventListener('message', e=>{
  if(e.data === 'check' && !filling){
    filling = (async()=>{
      const c = await caches.open(VER);
      const have = await Promise.all(FILES.map(f=>c.match(f)));
      if(have.every(Boolean)) return;
      await fillCache();
    })().finally(()=>{ filling = null; });
    e.waitUntil(filling);
  }
});
self.addEventListener('fetch', e=>{
  const u = e.request.url;
  if(e.request.method !== 'GET') return;
  if(FONT.test(u)){
    e.respondWith(caches.open(VER + '-font').then(async c=>{
      const hit = await c.match(e.request); if(hit) return hit;
      try{ const r = await fetch(e.request); c.put(e.request, r.clone()); return r; } catch(x){ return new Response('', {status:504}); }
    }));
    return;
  }
  if(new URL(u).origin !== location.origin) return;
  e.respondWith((async()=>{
    const c = await caches.open(VER);
    const hit = await c.match(e.request, {ignoreSearch:true});
    if(hit) return hit;
    try{ return await fetch(e.request); }
    catch(x){ return (await c.match('./')) || new Response('인터넷이 없어요', {status:503}); }
  })());
});
