const {JSDOM,VirtualConsole}=require("jsdom");const fs=require("fs");
const html=fs.readFileSync(process.argv[2],"utf8");
let ok=0,bad=0;const t=(n,c,i)=>{if(c){ok++;console.log("  ✓",n)}else{bad++;console.log("  ✗",n,i===undefined?"":"→ "+i)}};
const errs=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>errs.push(e.message));
/* servidor simulado */
const srv={rows:{},pw:{},confirm:false,users:{},online:true,patchFail:0,calls:[]};
const KEYPUB="sb_publishable_KZkfAENfqUT7LwuTI3M7aw_dmJTnxyo";
function mockFetch(url,o){o=o||{};srv.calls.push((o.method||"GET")+" "+url.replace("https://mjbsqkchyjfqncrgtfsv.supabase.co",""));
 if(!srv.online)return Promise.reject(new TypeError("Failed to fetch"));
 const u=new URL(url),p=u.pathname,h=o.headers||{},body=o.body?JSON.parse(o.body):null;
 const R=(s,j)=>Promise.resolve({ok:s>=200&&s<300,status:s,json:()=>Promise.resolve(j)});
 if(h.apikey!==KEYPUB)return R(401,{message:"bad key"});
 const sess=uid=>({access_token:"A."+uid,refresh_token:"R",expires_at:Math.floor(Date.now()/1000)+3600,user:{id:uid,email:body.email}});
 if(p==="/auth/v1/signup"){if(srv.pw[body.email])return R(422,{msg:"User already registered"});srv.pw[body.email]=body.password;srv.users[body.email]="u-"+body.email;return srv.confirm?R(200,{id:"x"}):R(200,sess("u-"+body.email))}
 if(p==="/auth/v1/token"){if(srv.pw[body.email]&&srv.pw[body.email]===body.password)return R(200,sess(srv.users[body.email]));return R(400,{error_description:"Invalid login credentials"})}
 if(p==="/auth/v1/logout")return R(204,{});
 if(p.startsWith("/rest/v1/app_state")){const auth=h.Authorization||"";if(!auth.startsWith("Bearer A."))return R(401,{message:"JWT"});const uid=auth.slice(9);
  const m=(o.method||"GET");
  if(m==="GET"){const r=srv.rows[uid];return R(200,r?[{data:r.data,rev:r.rev}]:[])}
  if(m==="POST"){if(srv.rows[uid])return R(409,{message:"duplicate"});srv.rows[uid]={data:body.data,rev:1};return R(201,[{rev:1}])}
  if(m==="PATCH"){const rev=+u.searchParams.get("rev").replace("eq.","");const r=srv.rows[uid];
   if(srv.patchFail>0){srv.patchFail--;r.rev++;r.data=Object.assign({},r.data)}
   if(!r||r.rev!==rev)return R(200,[]);r.data=body.data;r.rev++;return R(200,[{rev:r.rev}])}}
 return R(404,{message:"nf"})}
function device(){const store={};const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://x.github.io/mi-dia/",virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
 Object.defineProperty(w,"localStorage",{value:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}});
 w.scrollTo=()=>{};w.fetch=mockFetch}});return{w:dom.window,d:dom.window.document,store}}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
async function login(D,mail,pw,kind){const {w,d}=D;d.getElementById("sye").value=mail;d.getElementById("syp").value=pw||"secreto1";w.eval('syAction("'+(kind||"login")+'")');await sleep(80)}
(async()=>{
 console.log("Sincronización");
 const A=device(),aw=A.w;
 aw.eval('S.notes.push({id:"n1",x:"nota A",task:false,done:false,pin:false,due:"",tags:[],c:1});save()');
 aw.eval("syUi()");
 t("muestra formulario de email sin sesión",!!A.d.getElementById("sye"));
 aw.eval('syAction("login")');await sleep(10);
 t("email vacío pide revisar",/Revisa el email/.test(A.d.getElementById("syn").textContent));
 await login(A,"aitor@x.com","123","signup");
 t("contraseña corta se rechaza",/al menos 6/.test(A.d.getElementById("syn").textContent)&&!aw.eval("SY.ses"));
 await login(A,"aitor@x.com","secreto1","login");
 t("entrar sin cuenta da error claro",/incorrectos/.test(A.d.getElementById("syn").textContent)&&!aw.eval("SY.ses"));
 await login(A,"aitor@x.com","secreto1","signup");
 t("sesión iniciada y fila creada en la nube",!!srv.rows["u-aitor@x.com"]&&srv.rows["u-aitor@x.com"].data.notes.length===1,JSON.stringify(Object.keys(srv.rows)));
 t("al día tras primera subida",aw.eval("SY.dirty")===false&&aw.eval("SY.base")===1);
 t("la interfaz muestra email y estado",/aitor@x\.com/.test(A.d.getElementById("syn").textContent)&&/al día/.test(A.d.getElementById("syn").textContent));
 t("no se guarda el token en los datos de la app",!/A\.u-/.test(A.store["midia:v3"]));
 /* dispositivo B, vacío */
 const B=device(),bw=B.w;
 await login(B,"aitor@x.com","secreto1","login");
 t("B vacío descarga los datos de A",bw.eval("S.notes.length")===1&&bw.eval("S.notes[0].x")==="nota A");
 t("B persistió localmente lo descargado",JSON.parse(B.store["midia:v3"]).notes.length===1);
 /* B edita → A recibe */
 bw.eval('S.notes.push({id:"n2",x:"nota B",task:true,done:false,pin:false,due:"",tags:[],c:2});save()');
 t("B marca cambios pendientes",bw.eval("SY.dirty")===true);
 await bw.eval("sync()");await sleep(20);
 t("B sube (rev 2)",srv.rows["u-aitor@x.com"].rev===2&&srv.rows["u-aitor@x.com"].data.notes.length===2);
 await aw.eval("sync()");await sleep(20);
 t("A (sin cambios) toma lo de B",aw.eval("S.notes.length")===2);
 /* conflicto: ambos editan offline */
 srv.online=false;
 aw.eval('S.notes.push({id:"n3",x:"solo A",task:false,done:false,pin:false,due:"",tags:[],c:3});save()');
 bw.eval('S.notes.push({id:"n4",x:"solo B",task:false,done:false,pin:false,due:"",tags:[],c:4});S.well["2026-11-01"]={f:3};save()');
 await aw.eval("sync()");await sleep(20);
 t("sin conexión: mensaje y cambios retenidos",/Sin conexión/.test(A.d.getElementById("syn").textContent)&&aw.eval("SY.dirty")===true);
 t("sin conexión: los datos locales siguen intactos",aw.eval("S.notes.length")===3);
 srv.online=true;
 await bw.eval("sync()");await sleep(20);
 await aw.eval("sync()");await sleep(20);
 await bw.eval("sync()");await sleep(20);
 const ids=x=>x.eval("S.notes.map(n=>n.id).sort().join()");
 t("A y B convergen con la unión de los cambios",ids(aw)==="n1,n2,n3,n4"&&ids(bw)==="n1,n2,n3,n4",ids(aw)+" | "+ids(bw));
 t("la nube también tiene todo",srv.rows["u-aitor@x.com"].data.notes.length===4);
 t("se fusionan los mapas por fecha",aw.eval('S.well["2026-11-01"]&&S.well["2026-11-01"].f')===3);
 /* carrera de revisión: el servidor cambia entre GET y PATCH */
 srv.patchFail=1;
 aw.eval('S.notes.push({id:"n5",x:"carrera",task:false,done:false,pin:false,due:"",tags:[],c:5});save()');
 await aw.eval("sync()");await sleep(30);
 t("reintenta tras conflicto de revisión y no pierde nada",srv.rows["u-aitor@x.com"].data.notes.some(n=>n.id==="n5")&&aw.eval("SY.dirty")===false,aw.eval("syMsg"));
 /* contraseña incorrecta */
 const C=device();await login(C,"aitor@x.com","mala-clave","login");
 t("contraseña incorrecta no inicia sesión",!C.w.eval("SY.ses")&&/incorrectos/.test(C.d.getElementById("syn").textContent));
 await login(C,"aitor@x.com","secreto1","signup");
 t("crear cuenta con email existente avisa",/ya tiene cuenta/.test(C.d.getElementById("syn").textContent));
 srv.confirm=true;const C2=device();await login(C2,"nuevo@x.com","secreto1","signup");
 t("si Supabase exige confirmar, avisa de revisar el email",!C2.w.eval("SY.ses")&&/Revisa tu email/.test(C2.d.getElementById("syn").textContent));srv.confirm=false;
 /* usuarios aislados */
 const D=device();await login(D,"otro@x.com","secreto2","signup");
 t("otro usuario no ve los datos de aitor",D.w.eval("S.notes.length")===0);
 /* cerrar sesión */
 aw.eval('syAction("out")');await sleep(10);
 t("cerrar sesión conserva datos locales",!aw.eval("SY.ses")&&aw.eval("S.notes.length")===5&&!!A.d.getElementById("sye"));
 /* persistencia de sesión tras recargar */
 const sync0=B.store["aitx:sync"];const B2=(()=>{const st=Object.assign({},B.store);const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://x.github.io/mi-dia/",virtualConsole:vc,beforeParse(w){Object.defineProperty(w,"localStorage",{value:{getItem:k=>k in st?st[k]:null,setItem:(k,v)=>{st[k]=String(v)},removeItem:k=>{delete st[k]}}});w.scrollTo=()=>{};w.fetch=mockFetch}});return dom.window})();
 await sleep(60);
 t("al recargar mantiene la sesión y sincroniza",!!B2.eval("SY.ses")&&B2.eval("S.notes.length")===5,B2.eval("S.notes.length"));
 t("sin errores de JS",errs.length===0,errs.join("\n"));
 console.log("\nRESULTADO:",ok,"correctas,",bad,"fallos");process.exit(0)})();
