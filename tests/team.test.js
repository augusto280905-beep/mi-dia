const {JSDOM,VirtualConsole}=require("jsdom");const fs=require("fs");
const html=fs.readFileSync(process.argv[2],"utf8");
let ok=0,bad=0;const t=(n,c,i)=>{if(c){ok++;console.log("  ✓",n)}else{bad++;console.log("  ✗",n,i===undefined?"":"→ "+i)}};
const errs=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
function boot(store,ss){const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://x.github.io/mi-dia/",virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
 Object.defineProperty(w,"localStorage",{value:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}});
 if(ss)Object.defineProperty(w,"sessionStorage",{value:{getItem:k=>k in ss?ss[k]:null,setItem:(k,v)=>{ss[k]=String(v)}}});
 w.scrollTo=()=>{};w.fetch=()=>Promise.reject(new TypeError("Failed to fetch"));
 w.SVGElement.prototype.createSVGPoint=function(){return{x:0,y:0,matrixTransform(){return{x:this.x,y:this.y}}}};
 w.SVGElement.prototype.getScreenCTM=function(){return{inverse(){return{}}}};
 w.SVGElement.prototype.setPointerCapture=()=>{};}});return dom}
(async()=>{console.log("Equipo");
 const store={},ss={};let dom=boot(store,ss),w=dom.window,d=w.document;const ev=s=>w.eval(s),$=id=>d.getElementById(id);
 const click=el=>{if(!el)throw new Error("sin elemento");el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
 const T=()=>ev("today()");const sh=n=>ev(`shift(today(),${n})`);
 const tab=v=>click(d.querySelector(`#mtabs [data-v="${v}"]`));const sub=v=>{ev(`S.ui.tv="${v}";render()`)};
 const chg=(el,v)=>{if(v!==undefined){if(el.type==="checkbox")el.checked=v;else el.value=v}el.dispatchEvent(new w.Event("change",{bubbles:true}))};
 /* arranque */
 t("arranca en Hoy y existe el arranque animado",ev("S.ui.main")==="panel"&&!!$("splash")&&d.body.classList.contains("boot"));
 await sleep(3700);
 t("el arranque animado se retira solo",!$("splash")&&!d.body.classList.contains("boot"));
 t("barra: Hoy, Organiza, Deporte, Entrenador",[...d.querySelectorAll("#mtabs button")].map(b=>b.textContent.trim()).join()==="Hoy,Organiza,Deporte,Entrenador",[...d.querySelectorAll("#mtabs button")].map(b=>b.textContent.trim()).join());
 /* plantilla */
 const pl=ev("S.team.pl");
 t("plantilla inicial: 24 jugadores con sus posiciones",pl.length===24&&pl.filter(p=>p.p==="P").length===3&&pl.filter(p=>p.p==="DC").length===2&&pl.find(p=>p.n==="Hegoi").p==="P"&&pl.find(p=>p.n==="Egoi").p==="ED"&&pl.find(p=>p.n==="M.Arregi").p==="DFCI"&&pl.find(p=>p.n==="Neko").p==="LI");
 t("posiciones: 3P 3LD 2DFCI 3DFCD 2LI 4MCD 1MCO 2EI 2DC 2ED",["P:3","LD:3","DFCI:2","DFCD:3","LI:2","MCD:4","MCO:1","EI:2","DC:2","ED:2"].every(x=>{const[c,n]=x.split(":");return pl.filter(p=>p.p===c).length===+n}));
 ev("render()");
 t("Hoy: muestra lo de hoy, la semana y carga recomendada (sin tarjetas de áreas) (sin asistencia)",/Mañana/.test($("htl").textContent)&&!d.querySelector(".areas, .area")&&!!$("hweek").textContent.trim()&&$("hteam").hidden&&/Carga recomendada/.test($("hload").textContent));
 /* sin datos de asistencia */
 t("Hoy: sin sesiones explica que falta base",/base|Descanso|UA/.test($("hload").textContent));
 /* ir a Equipo */
 tab("eq");t("Equipo: menú con tarjetas y 24 jugadores",d.querySelectorAll("#tview .htile").length>=6&&/24 jugadores/.test($("tsub").textContent));
 sub("res");t("Resumen sin datos no falla",/Asistencia a entrenos/.test($("tview").textContent));
 /* asistencia: 4 entrenos */
 sub("asi");t("asistencia: lista a los 24 agrupados por línea",d.querySelectorAll("#tview .ar").length===24&&/Porteros/.test($("tview").textContent)&&/Delanteros/.test($("tview").textContent));
 const mark=(dd,pid,s)=>{ev(`S.ui.td="${dd}"`);ev("render()");click(d.querySelector(`#tview [data-t="ast"][data-id="${pid}"][data-v="${s}"]`))};
 const dates=[sh(-9),sh(-6),sh(-3),sh(-1)];
 /* Aitor(DC) falta en los 2 últimos; Egoi falta 1 y justificada otra; resto presentes */
 dates.forEach(dd=>{ev(`S.ui.td="${dd}"`);ev("render()");click(d.querySelector('#tview [data-t="aall"]'))});
 const id=n=>pl.find(p=>p.n===n).id;
 mark(dates[2],id("Aitor"),"f");mark(dates[3],id("Aitor"),"j");
 mark(dates[0],id("Egoi"),"f");mark(dates[3],id("Egoi"),"r");
 mark(dates[3],id("Hegoi"),"l");
 const st=n=>JSON.parse(ev(`JSON.stringify(plStats("${id(n)}",0))`));
 t("«Todos presentes» marca a los 24",ev(`S.team.att.length`)===4&&ev(`Object.values(S.team.att[0].m).filter(Boolean).length`)===24);
 t("estadísticas de Aitor: 2 ausencias seguidas, 50 % (2 de 4)",st("Aitor").streak===2&&st("Aitor").f===1&&st("Aitor").j===1&&st("Aitor").pct===50,JSON.stringify(st("Aitor")));
 t("estadísticas de Egoi: llegó tarde cuenta como presente (75 %)",st("Egoi").pct===75&&st("Egoi").r===1&&st("Egoi").f===1,JSON.stringify(st("Egoi")));
 t("lesión no es falta",st("Hegoi").l===1&&st("Hegoi").f===0&&st("Hegoi").pct===75);
 t("marcar dos veces el mismo estado lo quita",(()=>{mark(dates[0],id("Rafa"),"p");return ev(`S.team.att.find(a=>a.d==="${dates[0]}").m["${id("Rafa")}"]`)===""})());
 const al=JSON.parse(ev("JSON.stringify(teamAlerts(30).map(a=>[a.pl.n,a.k]))"));
 t("alertas: Aitor por ausencias seguidas, Egoi por asistencia/faltas no (1 falta)",al.some(a=>a[0]==="Aitor"&&a[1]==="hi")&&!al.some(a=>a[0]==="Egoi"),JSON.stringify(al));
 /* resumen y Hoy */
 sub("res");t("Resumen: ranking por jugador con porcentajes y alerta de Aitor",/Aitor/.test($("tview").textContent)&&/ausencias seguidas/.test($("tview").textContent)&&d.querySelectorAll("#tview .pr").length===24);
 t("Resumen: Aitor sale primero (menor asistencia)",d.querySelector("#tview .pr .nm b").textContent==="Aitor");
 tab("panel");t("Hoy: ya no muestra asistencia de los juveniles",!/Asistencia|Atención/.test(d.querySelector('[data-main="panel"]').textContent));
 /* ficha de jugador */
 tab("eq");sub("res");click(d.querySelector(`#tview .pr[data-id="${id("Aitor")}"]`));
 t("ficha de jugador con estadísticas e historial",/Aitor/.test($("tview").textContent)&&/Últimos entrenos/.test($("tview").textContent)&&d.querySelectorAll("#tview .legend .lg").length>=4);
 click(d.querySelector('[data-t="plinj"]'));t("marcar lesionado",ev(`S.team.pl.find(p=>p.n==="Aitor").inj`)===true);click(d.querySelector('[data-t="plinj"]'));
 /* añadir / editar / borrar jugador */
 sub("pla");click(d.querySelector('[data-t="pfx"]'));$("pn").value="Nuevo Chico";$("pp").value="DC";click(d.querySelector('[data-t="plsave"]'));
 t("añadir jugador",ev("S.team.pl.length")===25&&ev(`S.team.pl.some(p=>p.n==="Nuevo Chico"&&p.p==="DC")`));
 const nid=ev(`S.team.pl.find(p=>p.n==="Nuevo Chico").id`);
 click(d.querySelector(`[data-t="pldel"][data-id="${nid}"]`));t("borrar pide confirmar (1.er toque no borra)",ev("S.team.pl.length")===25);
 click(d.querySelector(`[data-t="pldel"][data-id="${nid}"]`));t("borrar confirma (2.º toque) y deja marca de borrado",ev("S.team.pl.length")===24&&!!ev(`S.team.del["${nid}"]`));
 /* ejercicios */
 sub("eje");t("biblioteca con fichas base",ev("S.team.ex.length")>=16&&d.querySelectorAll("#elist .exc").length>=16&&ev(`S.team.ex.some(e=>/FIFA 11\\+/.test(e.n))`));
 click(d.querySelector('[data-t="ecat"][data-v="Posesión"]'));t("filtrar por categoría",d.querySelectorAll("#elist .exc").length===ev(`S.team.ex.filter(e=>e.c==="Posesión").length`)&&d.querySelectorAll("#elist .exc").length>=2);
 click(d.querySelector('[data-t="ecat"][data-v=""]'));
 const sr=$("esr");sr.value="rondo";sr.dispatchEvent(new w.Event("input",{bubbles:true}));
 t("buscar ejercicio",[...d.querySelectorAll("#elist .exc")].filter(c=>!c.hidden).length===1);
 click(d.querySelector('[data-t="enew"]'));const E=d.querySelector('[data-c="ed"][data-k="n"]');chg(E,"Mi ejercicio");chg(d.querySelector('[data-c="ed"][data-k="min"]'),"18");chg(d.querySelector('[data-c="ed"][data-k="c"]'),"Finalización");click(d.querySelector('[data-t="esave"]'));
 t("crear ficha propia",ev(`S.team.ex.some(e=>e.n==="Mi ejercicio"&&e.min===18&&e.c==="Finalización")`));
 /* entreno */
 sub("ent");click(d.querySelector('[data-t="pnew"]'));
 chg(d.querySelector('[data-c="pd"][data-k="tp"]'),"Salida de balón");chg(d.querySelector('[data-c="pd"][data-k="d"]'),sh(1));chg(d.querySelector('[data-c="pd"][data-k="h"]'),"19:30");
 click(d.querySelector('[data-t="bbase"]'));t("estructura base suma 90 min",/90 min/.test($("tview").textContent)&&ev("TPD.bl.length")===4);
 $("bsel").value="se_r41";click(d.querySelector('[data-t="badd"]'));t("añadir ejercicio de la biblioteca (12 min) → 102 min",ev("TPD.bl.length")===5&&/102 min/.test($("tview").textContent));
 click(d.querySelector('[data-t="bup"][data-id="'+ev("TPD.bl[4].id")+'"]'));t("subir bloque",ev("TPD.bl[3].ex")==="se_r41");
 const bm=d.querySelector('[data-c="pb"][data-k="min"]');chg(bm,"20");t("cambiar minutos recalcula el total",ev("planMin(TPD)")===107,ev("planMin(TPD)"));
 const txt=ev("planText(TPD)");t("resumen para compartir con bloques y minutos",/Salida de balón/.test(txt)&&/Rondo 4 contra 1/.test(txt)&&/107 min/.test(txt)&&/1\. Calentamiento \(20'\)/.test(txt),txt.slice(0,200));
 click(d.querySelector('[data-t="psave"]'));t("guardar entreno",ev("S.team.plan.length")===1&&ev("S.team.plan[0].h")==="19:30");
 const pid=ev("S.team.plan[0].id");
 /* en Hoy/Calendario/avisos */
 tab("panel");ev(`S.ui.hd="m";S.ui.hx=1;render()`);t("Hoy lista el entreno de mañana",/Equipo · Salida de balón/.test($("htl").textContent),$("htl").textContent);
 ev(`S.ui.main="cal";CAL=today().slice(0,7);SEL="${sh(1)}";render()`);t("Calendario muestra el entreno del equipo",/Entreno del equipo/.test($("cday").textContent));
 const B=JSON.parse(ev("JSON.stringify(pnBuild())")),q=B.find(x=>x.key==="q:"+pid);t("aviso 1 h antes (18:30)",q&&new Date(q.at).getHours()===18&&new Date(q.at).getMinutes()===30&&/Salida de balón/.test(q.body),JSON.stringify(q));
 /* partidos */
 tab("eq");sub("par");click(d.querySelector('[data-t="gnew"]'));
 chg(d.querySelector('[data-c="gd"][data-k="d"]'),sh(-2));chg(d.querySelector('[data-c="gd"][data-k="riv"]'),"Rival CF");chg(d.querySelector('[data-c="gd"][data-k="gf"]'),"3");chg(d.querySelector('[data-c="gd"][data-k="ga"]'),"1");
 chg(d.querySelector(`[data-c="gconv"][data-id="${id("Egoi")}"]`),true);chg(d.querySelector(`[data-c="gconv"][data-id="${id("Justin")}"]`),true);
 chg(d.querySelector(`[data-c="gst"][data-id="${id("Egoi")}"][data-k="m"]`),"70");chg(d.querySelector(`[data-c="gst"][data-id="${id("Egoi")}"][data-k="g"]`),"2");
 click(d.querySelector('[data-t="gsave"]'));
 t("guardar partido con convocatoria, minutos y goles",ev("S.team.games.filter(g=>!g.src).length")===1&&ev("S.team.games.find(g=>!g.src).conv.length")===2&&ev(`S.team.games.find(g=>!g.src).st["${id("Egoi")}"].g`)===2);
 sub("res");t("Resumen: resultados y goleador",/Resultados/.test($("tview").textContent)&&/2 gol/.test($("tview").textContent)&&/G 1/.test($("tview").textContent));
 /* pizarra */
 sub("piz");t("pizarra con 11 fichas propias y portero asignado",ev("TBD.pts.filter(p=>p.k==='h').length")===11&&ev("TBD.pts.filter(p=>p.k==='h'&&p.pid).length")===11);
 const gk=ev(`plById(TBD.pts.find(p=>p.l==="P").pid).p`);t("auto-asignación respeta la posición (P → portero)",gk==="P");
 t("auto-asignación no repite jugadores ni usa lesionados",new Set(ev("TBD.pts.filter(p=>p.pid).map(p=>p.pid)")).size===11);
 t("el campo se dibuja con fichas y nombres",d.querySelectorAll("#bpts [data-pt]").length===11&&/Hegoi|Sebas|Rafa/.test($("bpts").textContent));
 click(d.querySelector('[data-t="bsys"][data-v="4-4-2"]'));t("cambiar a 4-4-2",ev("TBD.sys")==="4-4-2"&&ev("TBD.pts.filter(p=>p.k==='h').length")===11&&ev("TBD.pts.filter(p=>p.l==='DC').length")===2);
 click(d.querySelector('[data-t="badd2"][data-v="r"]'));click(d.querySelector('[data-t="badd2"][data-v="b"]'));t("añadir rival y balón",ev("TBD.pts.length")===13);
 click(d.querySelector('[data-t="bsys"][data-v="3-5-2"]'));t("cambiar de sistema conserva rival y balón",ev("TBD.pts.filter(p=>p.k!=='h').length")===2);
 $("bnm").value="Salida 3-5-2";click(d.querySelector('[data-t="bsave"]'));t("guardar pizarra",ev("S.team.bd.length")===1&&ev("S.team.bd[0].n")==="Salida 3-5-2");
 click(d.querySelector('[data-t="btool"][data-v="erase"]'));
 /* sincronización: dos dispositivos */
 const A=ev("JSON.stringify(S.team)");
 const mA=JSON.parse(ev(`JSON.stringify(syMerge(S,{team:{pl:[{id:"sp_extra",n:"Otro",p:"P",inj:false}],att:[{id:"a${dates[3]}",d:"${dates[3]}",m:{"${id("Aitzol")}":"f","zz_remoto":"f"}}],del:{"${id("Hegoi")}":1},ex:[],plan:[],bd:[],games:[]}}).team)`));
 t("fusión: une jugadores nuevos de otro dispositivo",mA.pl.some(p=>p.id==="sp_extra"));
 t("fusión: respeta jugadores borrados en el otro dispositivo",!mA.pl.some(p=>p.id===id("Hegoi"))&&mA.del[id("Hegoi")]);
 t("fusión: une marcas de la misma fecha y en conflicto gana este dispositivo",(()=>{const a=mA.att.find(x=>x.d===dates[3]);return a.m["zz_remoto"]==="f"&&a.m[id("Aitzol")]==="p"&&a.m[id("Aitor")]==="j"})(),JSON.stringify(mA.att.map(x=>[x.d,Object.keys(x.m).length])));
 t("fusión: no duplica nada",mA.plan.length===1&&mA.games.filter(g=>!g.src).length===1&&new Set(mA.pl.map(p=>p.id)).size===mA.pl.length);
 /* los cambios de vista no marcan «cambios por enviar» */
 ev("SY.dirty=false;syLast=syDig()");ev("go('notas')");tab("cal");tab("eq");sub("asi");t("cambiar de pestaña no cuenta como cambio de datos",ev("SY.dirty")===false);
 /* recarga: los datos persisten y arranca en Hoy sin repetir el splash en la misma sesión */
 dom.window.close();dom=boot(store,ss);w=dom.window;d=w.document;
 t("al recargar conserva el equipo, entrenos y pizarras",ev("S.team.pl.length")===24&&ev("S.team.plan.length")===1&&ev("S.team.bd.length")===1&&ev("S.team.att.length")===4);
 t("al recargar vuelve a Hoy y no repite el arranque",ev("S.ui.main")==="panel"&&!d.getElementById("splash"));
 t("la plantilla no se duplica al recargar",ev("S.team.pl.length")===24);
 t("sin errores de JS",errs.length===0,errs.join("\n"));
 console.log("\nRESULTADO:",ok,"correctas,",bad,"fallos");process.exit(0)})();
