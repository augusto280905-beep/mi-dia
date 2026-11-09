/* v16: liga real de futnavarra y minutos de partido */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;w.scrollTo=()=>{};
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s);
setTimeout(()=>{try{
console.log("\nv16 · liga y minutos");
t("fechas de futnavarra: J9 el 15-11-2026",ev(`FIX.find(f=>f[0]===9)[1]`)==="2026-11-15");
t("hora de la jornada 8: 19:00",ev(`fxTime(FIX.find(f=>f[0]===8))`)==="19:00");
ev(`S.sess=[];S.ui.fxm={}`);
ev(`const t0=document.createElement("input");t0.dataset.m="1";t0.dataset.k="m";t0.value="90";TC.fxm(t0)`);
t("anotar minutos crea una sesión de partido con carga",ev(`S.sess.some(x=>x.id==="fxm1"&&x.k==="par"&&x.m===90)`));
ev(`TA.fxst({dataset:{m:"2"}})`);
t("marcar titular pone 90 min y titular",ev(`S.sess.some(x=>x.id==="fxm2"&&x.st===true&&x.m===90)`));
ev(`const t1=document.createElement("input");t1.dataset.m="1";t1.dataset.k="m";t1.value="0";TC.fxm(t1)`);
t("0 minutos quita el partido de la carga",!ev(`S.sess.some(x=>x.id==="fxm1")`));
const h=ev("ligaMin()");
t("la tarjeta resume los minutos",/Mis minutos/.test(h)&&/dorsal 22/.test(h)&&/Titular/.test(h));
t("la liga muestra los minutos",/Mis minutos/.test(ev("renderLiga()")));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
},800);

setTimeout(()=>{try{
console.log("\nv16 · entrenador personal e inicio");
ev(`S.sess=[];S.well={};S.next=[{id:"z1",d:shift(today(),3),t:"19:00",riv:"Rival X",loc:"L",comp:"x"}];S.sched.on=false;render()`);
t("a 3 días del partido toca fuerza",ev("coachDay(today()).k")==="fuerza");
ev(`S.next=[{id:"z1",d:shift(today(),1),t:"19:00",riv:"Rival X",loc:"L",comp:"x"}]`);
t("la víspera toca activación",ev("coachDay(today()).k")==="act");
ev(`S.next=[{id:"z1",d:today(),t:"19:00",riv:"Rival X",loc:"L",comp:"x"}]`);
t("el día del partido no suma carga",ev("coachDay(today()).k")==="partido");
ev(`S.next=[];S.sess=[{id:"p1",d:shift(today(),-1),t:"",k:"par",m:90,r:7,st:true,riv:"R",gf:1,gc:0}]`);
t("el día después de jugar toca recuperar",ev("coachDay(today()).k")==="rec");
ev(`S.sess=[{id:"p1",d:shift(today(),-1),t:"",k:"par",m:20,r:7,st:false,riv:"R",gf:1,gc:0}]`);
t("si jugaste pocos minutos toca compensatorio",ev("coachDay(today()).k")==="comp");
ev(`S.sess=[];S.next=[{id:"z1",d:shift(today(),3),t:"19:00",riv:"Rival X",loc:"L",comp:"x"}];S.well[today()]={sh:5,shs:"w"}`);
t("con poco sueño la sesión sale ajustada y lo dice",ev("coachDay(today()).lite")===true&&/dormiste/.test(ev("coachCard()")));
const c=ev("coachCard()");
t("explica el porqué con base",/Por qué esto hoy/.test(c)&&/Base:/.test(c)&&/Walsh/.test(c));
t("muestra la semana con 7 días",(c.match(/class="cwd/g)||[]).length===7);
ev(`S.ui.main="panel";render()`);
t("Hoy abre con el plan del día y «Como jugador»",!!q("#hhero h2")&&/Como jugador/.test(q("#htl").textContent)&&!q("#hq input"));
t("el chequeo ya no está en la pantalla principal (solo dentro de Más datos)",!!q("details.more #pwell")&&!q("#hhero #pwell"));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},1500);
