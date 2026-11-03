/* v15.2: tareas más visuales (progreso, galería de proyectos, tarjetas/lista, botón +) */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;w.scrollTo=()=>{};
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s);
const ck=s=>{const el=q(s);if(!el)throw new Error("sin elemento "+s);el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
setTimeout(()=>{try{
console.log("\nv15.2");
ev(`S.notes=[];S.proj=[{id:"p1",n:"Cliente",ic:"💼",k:0,a:false,nt:"",c:1}];S.ui.tk=undefined;S.ui.nv="hoy";S.ui.main="notas";
const T=today();S.notes.push(newTask({x:"A",due:T,pj:"p1",tm:"17:00"}),newTask({x:"B",due:T}),newTask({x:"C",due:T}),newTask({x:"Vieja",due:shift(T,-1)}),newTask({x:"Futura",due:shift(T,3)}));
S.notes[1].done=true;S.notes[1].dn=Date.now();render()`);
t("anillo de progreso con hechas/total de hoy",!!q(".nph .rng")&&/1\/3/.test(q(".npr").textContent)&&/2 por hacer/i.test(q(".npt h2").textContent));
t("muestra vencidas y próximos 7 días en el resumen",/1 vencida/.test(q(".npc").textContent)&&/en 7 días/.test(q(".npc").textContent));
t("las tareas salen como tarjetas por defecto",qa("#nx .tkg .tkc").length>=3&&q(".tkv .on").dataset.v==="c");
t("la tarjeta con hora muestra el chip de hora",/17:00/.test(q("#nx").textContent));
t("galería de proyectos con avance",qa(".nxg .pjm").length>=2&&/Cliente/.test(q(".nxg").textContent));
ck('.tkv [data-v="l"]');t("se puede cambiar a vista de lista",qa("#nx .tkg").length===0&&qa("#nx .nsec .item").length>=3&&ev("S.ui.tk")==="l");
ck('.tkv [data-v="c"]');t("y volver a tarjetas",qa("#nx .tkg").length>=1);
t("botón + flotante para crear con detalles",!!q(".fab"));
ck('.fab');t("el + abre la hoja de nueva tarea",!!ev("NX.sheet")&&ev("NX.sheet.task")===true);
ev("NX.sheet=null;render()");
ck('.nxg [data-t="nxpjgo"]');t("tocar un proyecto de la galería lo abre",ev("S.ui.nv")==="proy"&&ev("NX.pjf")==="p1");
ev(`S.ui.nv="hoy";NX.pjf="";S.notes.forEach(n=>n.done=true);render()`);
t("con todo hecho el anillo lo dice",/Todo hecho/.test(q(".npt h2").textContent));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},800);
