/* v16.1: equipos por ejercicio y minutos de los chavales */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window;let ok=0,ko=0;w.scrollTo=()=>{};
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s);
setTimeout(()=>{try{
console.log("\nv16.1 · entrenador: equipos por ejercicio y minutos");
ev(`S.team.games=[];S.team.plan=[{id:"pp1",d:today(),bl:[{n:"Rondo",m:15},{n:"Partido",m:30}]}];TSV="pp1"`);
ev(`TA.btn({dataset:{i:"1",n:"3"}})`);
const b=ev(`S.team.plan[0].bl[1]`);
t("3 equipos en el bloque 2",b.tn===3&&b.tm.length===3);
t("reparte a todos sin repetir",ev(`(()=>{const a=S.team.plan[0].bl[1].tm.flat();return new Set(a).size===a.length&&a.length>=18})()`));
ev(`TA.bmix({dataset:{i:"1"}})`);
t("mezclar mantiene 3 equipos",ev(`S.team.plan[0].bl[1].tm.length`)===3);
t("el texto incluye equipos por ejercicio",/EQUIPOS POR EJERCICIO/.test(ev(`planText(S.team.plan[0])`)));
ev(`TA.btn({dataset:{i:"1",n:"0"}})`);
t("«Todos» quita los equipos",ev(`S.team.plan[0].bl[1].tm`)===undefined);
ev(`const P=S.team.pl;S.team.games=[{id:"g1",d:shift(today(),-3),gf:2,ga:1,conv:[P[0].id,P[1].id],xi:[P[0].id],st:{[P[0].id]:{m:90,g:1,a:0},[P[1].id]:{m:20,g:0,a:0}}}]`);
const m=ev(`minStats()`);
t("suma minutos por jugador",m.tot===110&&m.jug===2);
const h=ev(`tvMin()`);
t("el panel muestra minutos y titularidades",/Minutos y titularidades/.test(h)&&/90'/.test(h));
t("tvRes incluye el panel de minutos",/Minutos y titularidades/.test(ev(`tvRes()`)));


ev(`S.ui.tph="data:image/jpeg;base64,AA=="`);ev(`TA.tpclr()`);t("se puede quitar",!ev(`S.ui.tph`));
t("Deporte tiene pestañas Dashboard y Entrenar",/Dashboard/.test(ev(`saludHub()`))&&/Entrenar/.test(ev(`saludHub()`)));
ev(`S.ui.dv="ent";S.ui.main="fut";S.ui.fv="gym";GS.plan=null;render()`);
t("Entrenar dice qué toca y deja montarlo",/Qué te toca hoy/.test(w.document.getElementById("gymv").textContent));
ev(`S.sess=[];S.next=[{id:"z",d:shift(today(),4),riv:"X",t:"19:00"}];gymAuto()`);
t("montar recomendado crea el plan con técnica y vídeo",!!ev(`GS.plan`)&&/Ver vídeo/.test(w.document.getElementById("gymv").innerHTML)&&/Error típico/.test(w.document.getElementById("gymv").textContent));
const id=ev(`GS.sid`);t("el entreno montado se guarda y aparece como preparado",!!id&&ev(`gyList().length`)===1&&/Entrenos preparados/.test(ev(`gySaved(false)`)));
ev(`GS.plan=null;GS.sid="";render()`);ev(`TA.gopen({dataset:{id:gyList()[0].id}})`);
t("se puede abrir más tarde",!!ev(`GS.plan`));
const h2=w.document.getElementById("gymv").textContent;
t("cada ejercicio explica el porqué en breve",/Por qué:/.test(h2));
const sid=ev(`GS.plan.ex[0].id`),n=ev(`GS.plan.ex[0].s`);ev(`TA.gexd({dataset:{id:"${sid}",s:"${n}"}})`);
t("marcar un ejercicio como hecho",ev(`Array.from({length:${n}},(_,j)=>j).every(j=>GS.done["${sid}-"+j])`));
ev(`S.ui.tst={};tstSet("leg",5)`);t("un test con piernas pesadas regula la carga",!!ev(`slPoor()`)&&/Tu test/.test(ev(`slPoor().txt`)));
ev(`S.ui.tst={}`);
t("el test diario ya no está en el dashboard",!/Test de hoy|Salto vertical/.test(ev(`depLean()`)));
t("dashboard sin minutos de partido y con carga semanal",!/Minutos de partido/.test(ev(`depLean()`))&&/class="card road"/.test(ev(`depLean()`))&&/Explora/.test(ev(`depLean()`)));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log("\nRESULTADO:",ok,"correctas,",ko,"fallos");process.exit(ko?1:0)},900);
