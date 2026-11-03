/* v15.1: calendario visual (semana/mes, agenda con bloques, tareas en tarjetas) */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;w.scrollTo=()=>{};
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s);
const ck=s=>{const el=q(s);if(!el)throw new Error("sin elemento "+s);el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
setTimeout(()=>{try{
console.log("\nv15.1");
ev(`S.notes=[];S.proj=[{id:"p1",n:"Cliente",ic:"💼",k:0,a:false,nt:"",c:1}];S.ui.cv=undefined;S.ui.main="cal";CALF="org";CAL=today().slice(0,7);SEL=today();
const T=today();S.notes.push(newTask({x:"Reunión",ev:1,due:T,tm:"10:00",te:"11:30",lc:"Oficina",pj:"p1"}),newTask({x:"Presupuesto",due:T,tm:"17:00",pr:3}),newTask({x:"Revisar contrato",due:T,pj:"p1"}),newTask({x:"Llamar banco",due:shift(T,-1)}),newTask({x:"Entrega",ev:1,due:shift(T,1),tm:"09:00",te:"10:00"}));render()`);
t("abre en vista Semana con 7 días en fila",qa("#cgrid .wdy").length===7&&!qa("#cgrid .cd2").length&&q(".cvs .on").textContent==="Semana");
t("el día de hoy está marcado y seleccionado",!!q(".wdy.today.sel"));
t("la agenda muestra bloques con hora de inicio y fin",qa("#cday .dti").length===2&&/10:00/.test(d.getElementById("cday").textContent)&&/11:30/.test(d.getElementById("cday").textContent));
t("el bloque más largo es más alto (duración)",parseInt(q("#cday .dti").style.minHeight)>64);
t("las tareas sin hora salen como tarjetas",qa("#cday .tkg .tkc").length===2&&/Revisar contrato/.test(d.getElementById("cday").textContent));
t("las vencidas salen aparte con aviso",/Vencidas/.test(d.getElementById("cday").textContent)&&!!q("#cday .tkc.late"));
t("resumen del día con agenda, tareas y vencidas",/agenda/.test(q(".dsum").textContent)&&/vencidas/.test(q(".dsum").textContent));
t("el compromiso con lugar tiene botón de mapa",!!q('#cday [data-t="nxmapr"]'));
const t0=ev("SEL");ck('[data-a="cnext"]');t("› avanza una semana",ev("SEL")===ev(`shift("${t0}",7)`));
ck('[data-a="cprev"]');ck('[data-a="cprev"]');t("‹ retrocede una semana",ev("SEL")===ev(`shift("${t0}",-7)`));
ck('[data-a="ctoday"]');t("«Hoy» vuelve a esta semana",ev("SEL")===ev("today()"));
ck('.cvs [data-v="m"]');t("«Mes» muestra la cuadrícula completa",qa("#cgrid .cd2").length>=28&&!qa("#cgrid .wdy").length&&ev("S.ui.cv")==="m");
ck('.cvs [data-v="w"]');t("«Semana» vuelve",qa("#cgrid .wdy").length===7);
const dd=ev("shift(today(),1)");ck(`.wdy[data-v="${dd}"]`);t("tocar un día lo selecciona",ev("SEL")===dd&&/Entrega/.test(d.getElementById("cday").textContent));
t("próximos días: tarjetas que se deslizan",qa("#cnext .ndw .nxd").length>=1);
ev(`SEL=shift(today(),5);render()`);t("día sin nada: estado vacío amable",/Día libre/.test(d.getElementById("cday").textContent));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},800);
