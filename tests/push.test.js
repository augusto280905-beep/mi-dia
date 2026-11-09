const {JSDOM,VirtualConsole}=require("jsdom");const fs=require("fs");
const html=fs.readFileSync(process.argv[2],"utf8");
let ok=0,bad=0;const t=(n,c,i)=>{if(c){ok++;console.log("  ✓",n)}else{bad++;console.log("  ✗",n,i===undefined?"":"→ "+i)}};
const errs=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>errs.push(e.message));
const srv={rem:{},subs:{},calls:[],fnUp:true};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function mockFetch(url,o){o=o||{};const u=new URL(url),p=u.pathname,m=o.method||"GET",h=o.headers||{},body=o.body?JSON.parse(o.body):null;srv.calls.push(m+" "+p+u.search);
 const R=(s,j)=>Promise.resolve({ok:s>=200&&s<300,status:s,json:()=>Promise.resolve(j)});
 if(p==="/functions/v1/push-send")return srv.fnUp?R(200,{publicKey:"BEl62iUYgUivxIkv69yViEuiBIa-Ib9-SkvMeAtA3LFgDzkrxZJjSgSfSVRa5KJ9yZ3p4a1Z7q0v8mXQe5y6zBk"}):R(404,{});
 if(p==="/auth/v1/signup"){return R(200,{access_token:"A.u1",refresh_token:"R",expires_at:Math.floor(Date.now()/1000)+3600,user:{id:"u1",email:body.email}})}
 if(p==="/rest/v1/app_state"){if(m==="GET")return R(200,[]);return R(201,[{rev:1}])}
 if(!(h.Authorization||"").startsWith("Bearer A."))return R(401,{});
 if(p==="/rest/v1/push_subs"){srv.subs[body&&body.endpoint||u.search]=body;if(m==="DELETE"){srv.subs={}}return R(201,{})}
 if(p==="/rest/v1/reminders"){
  if(m==="GET")return R(200,Object.values(srv.rem).filter(r=>!r.sent));
  if(m==="POST"){(Array.isArray(body)?body:[body]).forEach(r=>{srv.rem[r.key]=r;(srv.posted=srv.posted||[]).push(r.key)});return R(201,{})}
  if(m==="DELETE"){const l=decodeURIComponent(u.searchParams.get("key")).replace(/^in\.\(|\)$/g,"").split(",").map(s=>s.replace(/"/g,""));l.forEach(k=>delete srv.rem[k]);return R(204,{})}}
 return R(404,{})}
function device(perm){const store={};let subbed=null;const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://x.github.io/mi-dia/",virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
 Object.defineProperty(w,"localStorage",{value:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}});
 w.scrollTo=()=>{};w.fetch=mockFetch;
 if(perm!=="nosupport"){w.PushManager=function(){};w.Notification={requestPermission:async()=>perm||"granted"};
  Object.defineProperty(w.navigator,"serviceWorker",{value:{ready:Promise.resolve({pushManager:{getSubscription:async()=>subbed,subscribe:async o=>{subbed={endpoint:"https://push.example/abc",unsubscribe:async()=>{subbed=null},toJSON:()=>({endpoint:"https://push.example/abc",keys:{p256dh:"P",auth:"A"}}),_k:o.applicationServerKey};return subbed}}}),addEventListener(){},register:()=>Promise.resolve({update(){}}),controller:null}})}
 }});return{w:dom.window,d:dom.window.document,store}}
(async()=>{console.log("Notificaciones");
 const A=device(),w=A.w,d=A.d,ev=s=>w.eval(s);
 const T=ev("today()");const mk=(n)=>ev(`shift("${T}",${n})`);
 t("tarjeta de notificaciones visible",!!d.getElementById("pnc")&&/Activar en este dispositivo/.test(d.getElementById("pnc").textContent));
 /* sin sesión */
 ev("pnEnable()");await sleep(20);
 t("sin cuenta pide entrar primero",/Primero entra/.test(d.getElementById("pnc").textContent)&&!ev("PN.on"));
 d.getElementById("sye").value="a@x.com";d.getElementById("syp").value="secreto1";ev('syAction("signup")');await sleep(80);
 t("sesión iniciada",!!ev("SY.ses"));
 /* datos de prueba */
 const dTask=mk(2),dMatch=mk(3);
 ev(`S.notes.push({id:"t1",x:"Llamar al fisio",task:true,done:false,pin:false,due:"${dTask}",tags:[],c:1});S.notes.push({id:"t2",x:"Hecha",task:true,done:true,pin:false,due:"${dTask}",tags:[],c:1});
  S.next.push({id:"m1",d:"${dMatch}",t:"17:00",riv:"Rival FC",loc:"V",comp:""});S.sched.from="${T}";S.sched.dows=[0,1,2,3,4,5,6];S.sched.t="20:00";S.sched.e="21:30";S.sched.skip=["${mk(1)}"];S.sched.on=true;save()`);
 const B=JSON.parse(ev("JSON.stringify(pnBuild())"));const K=k=>B.find(x=>x.key===k);
 
 t("las tareas (ahora en Notion) ya no generan avisos",!B.some(x=>/^(td|k|o):/.test(x.key)),JSON.stringify(B.map(x=>x.key)));
 t("recordatorio del cuestionario diario",!!K("w:"+mk(1)));
 t("entreno: aviso 1 h antes a las 19:00",K("e:"+mk(2))&&new Date(K("e:"+mk(2)).at).getHours()===19&&new Date(K("e:"+mk(2)).at).getMinutes()===0);
 t("entreno cancelado no avisa",!K("e:"+mk(1))&&!K("r:"+mk(1)));
 t("registrar sesión: 15 min después de acabar (21:45)",K("r:"+mk(2))&&new Date(K("r:"+mk(2)).at).getHours()===21&&new Date(K("r:"+mk(2)).at).getMinutes()===45);
 t("partido: víspera 20:00 y día 2 h antes (15:00)",K("m1:m1")&&new Date(K("m1:m1").at).getHours()===20&&K("m0:m1")&&new Date(K("m0:m1").at).getHours()===15&&/Rival FC/.test(K("m0:m1").title));
 
 
 t("todo dentro de 15 días y en el futuro",B.every(x=>{const a=new Date(x.at).getTime();return a>Date.now()&&a<Date.now()+15*864e5}));
 t("claves únicas",new Set(B.map(x=>x.key)).size===B.length);
 ev(`S.well[today()]={f:3,s:3,e:3,d:3,sh:7};S.ui.np={well:false};`);
 const B2=JSON.parse(ev("JSON.stringify(pnBuild())"));
 t("respeta preferencias (cuestionario apagado)",!B2.some(x=>x.key.startsWith("w:")));
 ev("S.ui.np={}");
 /* activar */
 ev("pnEnable()");await sleep(80);
 t("activar: suscripción guardada en la nube",ev("PN.on")===true&&Object.keys(srv.subs).length===1&&srv.subs["https://push.example/abc"].user_id==="u1");
 t("activar: no guarda claves secretas del servidor",!/private/.test(JSON.stringify(srv.subs)));
 await sleep(5200);
 t("avisos programados subidos",!!srv.rem["m1:m1"]&&Object.keys(srv.rem).length>=B.length-2,Object.keys(srv.rem).length+" vs "+B.length);
 /* completar tarea → se borra el aviso; sin reenviar lo que no cambió */
 srv.calls.length=0;srv.posted=[];
 ev(`S.notes.find(n=>n.id==="t1").done=true;save()`);await sleep(7800);
 t("completar la tarea borra su aviso",!srv.rem["td:"+dTask],srv.calls.join(" | ")+" busy="+ev("pnBusy")+" msg="+ev("pnMsg"));
 t("solo cambia lo necesario (sin reenviar todo)",(srv.posted||[]).every(k=>/^inf:/.test(k))&&(srv.posted||[]).length<=3,(srv.posted||[]).join(",")+" | "+srv.calls.join(" | "));
 /* prueba */
 ev("pnTest()");await sleep(60);
 t("botón de prueba crea un aviso inmediato",Object.keys(srv.rem).some(k=>k.startsWith("test:"))&&new Date(Object.values(srv.rem).find(r=>r.key.startsWith("test:")).at).getTime()<=Date.now());
 srv.calls.length=0;ev("pnSync()");await sleep(60);
 t("la sincronización no borra el aviso de prueba pendiente",Object.keys(srv.rem).some(k=>k.startsWith("test:")));
 /* desactivar */
 ev("pnDisable()");await sleep(60);
 t("desactivar: borra la suscripción",ev("PN.on")===false&&Object.keys(srv.subs).length===0);
 /* casos límite */
 const N=device("denied");N.d.getElementById("sye").value="b@x.com";N.d.getElementById("syp").value="secreto1";N.w.eval('syAction("signup")');await sleep(80);
 N.w.eval("pnEnable()");await sleep(40);
 t("permiso denegado: mensaje claro",!N.w.eval("PN.on")&&/Permiso denegado/.test(N.d.getElementById("pnc").textContent));
 const U=device("nosupport");U.d.getElementById("sye").value="c@x.com";U.d.getElementById("syp").value="secreto1";U.w.eval('syAction("signup")');await sleep(80);
 U.w.eval("pnEnable()");await sleep(30);
 t("sin soporte (Safari sin instalar): explica cómo instalar",/pantalla de inicio/.test(U.d.getElementById("pnc").textContent));
 srv.fnUp=false;const F=device();F.d.getElementById("sye").value="d@x.com";F.d.getElementById("syp").value="secreto1";F.w.eval('syAction("signup")');await sleep(80);
 F.w.eval("pnEnable()");await sleep(60);
 t("servidor de avisos no desplegado: lo dice",!F.w.eval("PN.on")&&/no responde/.test(F.d.getElementById("pnc").textContent),F.d.getElementById("pnc").textContent);
 t("sin errores de JS",errs.length===0,errs.join("\n"));
 console.log("\nRESULTADO:",ok,"correctas,",bad,"fallos");process.exit(0)})();
