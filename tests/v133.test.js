/* v13.3: duraciones, calendario, registro completo, pendientes, doble sesión */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),click=el=>{if(!el)throw new Error("sin elemento");el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
setTimeout(()=>{try{
console.log("\nv13.3");
t("martes 90 min y jueves 120 por defecto",ev("tdur(1)")===90&&ev("tdur(3)")===120);
ev(`S.team.sch={dows:[1,3],t:"18:45",durs:{3:100}};`);t("la duración se puede cambiar por día",ev("tdur(3)")===100&&ev("tdur(1)")===90);
ev(`S.team.sch=null`);
ev(`S.ui.main="cal";CAL=today().slice(0,7);SEL=today();render()`);
t("calendario con filtros y cuadrícula nueva",d.querySelectorAll("#cgrid .cfil button").length===4&&d.querySelectorAll("#cgrid .cd2").length>=28);
click(d.querySelector('#cgrid .cfil button[data-v="eq"]'));t("filtrar por área funciona",ev("CALF")==="eq");click(d.querySelector('#cgrid .cfil button[data-v="all"]'));
const T=ev("today()");
ev(`S.sess=[];S.ui.pkd={};S.ui.pk="";S.sched={on:true,from:"2020-01-01",dows:[0,1,2,3,4,5,6],t:"00:00",e:"00:30",skip:[]};save();render()`);
t("hay entrenos pendientes de contar",ev("pendDays().length")>=2);
t("la pestaña Deporte lleva el aviso",d.querySelector('#mtabs button[data-v="fut"]').classList.contains("pend"));
ev(`S.ui.main="fut";S.ui.fv="hub";S.ui.dv="res";render()`);
t("el formulario completo aparece en Deporte",!!d.querySelector(".card.post")&&/Respiración/.test(d.body.textContent)&&/Qué trabajasteis/.test(d.body.textContent));
const pd=ev("PF.dt");
ev("PF.r=7");
click(d.querySelector('[data-t="pfs"][data-k="rb"][data-v="4"]'));click(d.querySelector('[data-t="pfs"][data-k="rl"][data-v="5"]'));
click(d.querySelector('[data-t="pfs"][data-k="pa"][data-v="p"]'));click(d.querySelector('[data-t="pfc"][data-v="pos"]'));
click(d.querySelector('[data-t="pfsave"]'));
const s=ev("S.sess[S.sess.length-1]");
t("guarda respiración, piernas, participación y contenido",s&&s.rb===4&&s.rl===5&&s.pa==="p"&&s.cx&&s.cx[0]==="pos"&&s.d===pd,JSON.stringify(s));
t("ese día deja de estar pendiente",!ev("pendDays()").includes(pd));
ev(`S.sess=[];S.sched={on:false,from:"2020-01-01",dows:[],t:"00:00",e:"00:30",skip:[]};S.ui.pkd={}`);
const ds=[0,1,2,3,4].map(i=>ev(`shift(today(),-${i})`));
ev(`S.sess=[${ds.slice(0,4).map((x,i)=>`{id:"i${i}",k:"ent",d:"${x}",m:90,r:7,rb:2,rl:4,en:3,fl:${i<3?5:3},pf:3,pa:"${i<2?"p":"t"}",cx:["pos"]}`).join(",")}];`);
const I=ev("sessInsights()");t("resumen de entrenos con medias y etiquetas",I&&I.n===4&&I.tags.pos===4&&I.legs===4,JSON.stringify(I&&[I.n,I.legs]));
ev(`S.ui.main="fut";S.ui.fv="hub";S.ui.dv="res";render()`);
t("el panel muestra «Tus entrenos»",/Tus entrenos/.test(d.body.textContent));
t("recomienda soltar piernas cargadas",ev("healthRecs(hmod())").some(r=>/piernas acaban muy cargadas/.test(r.t)));
/* doble sesión */
ev(`S.sess=[];S.sched={on:true,from:"2020-01-01",dows:[0,1,2,3,4,5,6],t:"23:00",e:"23:59",skip:[]};save()`);
t("el fútbol previsto de hoy cuenta como carga esperada",ev("expFootUA(today())")>0);
ev("S.sess=[{id:'z',k:'ent',d:today(),m:60,r:6}]");t("si ya lo has contado, deja de reservar carga",ev("expFootUA(today())")===0);
}catch(e){ko++;console.log("  ✗ excepción",e.message)}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},800);
