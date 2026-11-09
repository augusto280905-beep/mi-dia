/* v18: app solo de deporte (jugador + entrenador) */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;w.scrollTo=()=>{};
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s);
setTimeout(()=>{try{
console.log("\nv18 · solo deporte");
t("tres pestañas: Hoy, Jugador, Entrenador",[...qa("#mtabs button")].map(b=>b.textContent.trim()).join()==="Hoy,Jugador,Entrenador");
t("no hay captura de tareas en Hoy",!q("#hq input")&&!/Apuntar/.test(q("#htl").textContent+q("#hhero").textContent));
ev(`S.notes.push({id:"n1",x:"Tarea de Notion",task:true,done:false,pin:false,due:today(),tags:[],c:1});S.ui.main="panel";render()`);
t("las tareas guardadas no aparecen en Hoy",!/Tarea de Notion/.test(q('[data-main="panel"]').textContent));
t("las tareas no generan avisos",!ev(`JSON.stringify(pnBuild())`).includes("n1"));
t("las tareas siguen guardadas (no se pierden datos)",ev(`S.notes.some(n=>n.id==="n1")`));
/* hoy */
ev(`S.sched={on:true,from:today(),dows:[0,1,2,3,4,5,6],t:"20:00",e:"21:30",skip:[]};S.sess=[];S.ui.pk="";render()`);
t("Hoy separa «Como jugador» y (con equipo) «Como entrenador»",/Como jugador/.test(q("#htl").textContent));
ev(`S.team.sch=Object.assign({},S.team.sch||{},{dows:[0,1,2,3,4,5,6]});S.team.plan=[];render()`);
t("entreno del equipo hoy sin preparar → botón Preparar",!!q('#htl [data-t="hgo"][data-g="ptoday"]'));
q('#htl [data-t="hgo"][data-g="ptoday"]').dispatchEvent(new w.MouseEvent("click",{bubbles:true}));
t("«Preparar» abre el Entrenador con la sesión",ev("S.ui.main")==="eq"&&ev("S.ui.tv")==="ent");
ev(`S.ui.main="panel";S.team.games=[{id:"gx",d:shift(today(),3),riv:"Rival",loc:"L",h:"17:00"}];render()`);
t("próximo partido del equipo con botón de convocatoria",!!q('#hmatch [data-t="hgo"][data-g="con"]'));
/* calendario deportivo */
ev(`S.ui.main="cal";render()`);
t("calendario: solo Todo / Jugador / Entrenador",qa("#cgrid .cfil button").length===3);
t("calendario: no hay botones de tarea ni compromiso",!qa('[data-main="cal"] [data-t="nxnew"]').length&&!/＋ Tarea|＋ Compromiso/.test(q('[data-main="cal"]').textContent));
ev(`S.ui.main="notas";render()`);
t("la pantalla de notas ya no se abre (vuelve a Hoy)",ev("S.ui.main")==="panel");
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},1500);
