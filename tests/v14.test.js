/* v14: chequeo configurable, agenda compacta, Organiza tipo Notion, recordatorios */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),$=i=>d.getElementById(i),click=el=>{if(!el)throw new Error("sin elemento");el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
const q=s=>d.querySelector(s);
setTimeout(()=>{try{
console.log("\nv14");
ev(`S.notes=[];S.proj=[];S.well={};S.ui.main="notas";S.ui.nv="proy";save();render()`);
click(q('[data-t="pjnew"]'));$("pjn").value="TFG";click(q('[data-t="pjnic"][data-v="🎓"]'));$("pjn").value="TFG";click(q('[data-t="pjmk"]'));
t("crea un proyecto y lo abre",ev("S.proj.length")===1&&ev("S.proj[0].n")==="TFG"&&ev("NX.pjf")===ev("S.proj[0].id"),ev("JSON.stringify(S.proj)"));
$("nxq").value="entregar borrador viernes 18:30 #uni";click(q('[data-t="nxq"]'));
const n=ev("S.notes[0]");t("la tarea nace dentro del proyecto con fecha, hora y aviso",n.pj===ev("S.proj[0].id")&&n.tm==="18:30"&&n.rm===10&&n.tags[0]==="uni",JSON.stringify(n));
$("nxq").value="mandar correo @tfg";click(q('[data-t="nxq"]'));t("@proyecto asigna el proyecto",ev("S.notes[1].pj")===ev("S.proj[0].id"));
t("tablero por estado con contadores",/Por hacer\s*2/.test(q(".nvseg.st").textContent));
click(q('[data-t="nxmv"]'));t("«Empezar» pasa a En curso",ev("S.notes.filter(x=>x.st==='e').length")===1);
click(q('[data-t="pjst"][data-v="e"]'));t("la pestaña En curso lista esa tarea",d.querySelectorAll(".nlistc .item.nr").length===1);
/* hoja de detalles: subtareas, repetir, recordatorio */
click(q('[data-t="nxopen"]'));t("abre la hoja de detalles",!!q(".nxs")&&d.body.classList.contains("nxo"));
$("nx_sb").value="Revisar bibliografía";click(q('[data-t="nxsba"]'));t("añade subtarea",ev("NX.sheet.sb.length")===1);
click(q('[data-t="nxsbt"]'));t("marca subtarea",ev("NX.sheet.sb[0].d")===true);
const sel=q('select[data-k="rp"]');sel.value="w";sel.dispatchEvent(new w.Event("change",{bubbles:true}));t("repetir cada semana",ev("NX.sheet.rp")==="w");
click(q('[data-t="nxpr"][data-v="3"]'));t("prioridad alta",ev("NX.sheet.pr")===3);
click(q('[data-t="nxsave"]'));t("Listo cierra la hoja",!q(".nxs")&&!d.body.classList.contains("nxo"));
/* recurrencia */
ev(`S.notes=[newTask({x:"Pagar alquiler",due:today(),rp:"m",sb:[{id:"s",x:"a",d:true}]})]`);const d0=ev("S.notes[0].due");
ev("setDone(S.notes[0],true)");t("tarea repetida no se cierra: salta al mes siguiente",ev("S.notes[0].done")===false&&ev("S.notes[0].due")>d0&&ev("S.notes[0].sb[0].d")===false);
t("fin de mes: 31 → último día del mes siguiente",ev(`nextDue("2026-01-31","m")`)==="2026-02-28"&&ev(`nextDue("2026-12-15","m")`)==="2027-01-15");
/* recordatorios → avisos push */
ev(`S.ui.np={};S.notes=[newTask({x:"Llamar a Marta",due:shift(today(),2),tm:"10:00",rm:30}),newTask({x:"Sin aviso",due:shift(today(),2),tm:"11:00"}),newTask({x:"Hecha",due:shift(today(),2),tm:"12:00",rm:0,done:true})]`);
const out=ev("pnBuild()").filter(r=>/^k:/.test(r.key));
t("solo las tareas abiertas con recordatorio generan aviso",out.length===1&&out[0].title==="Llamar a Marta",JSON.stringify(out));
t("el aviso sale 30 min antes de la hora",ev(`(()=>{const o=pnBuild().find(r=>/^k:/.test(r.key));const a=new Date(o.at),b=new Date(shift(today(),2)+"T10:00:00");return Math.round((b-a)/60000)})()`)===30);
ev(`S.notes[0].rm=1440;S.notes[0].tm=""`);t("sin hora, «1 día antes» → víspera a las 9:00",ev(`(()=>{const o=pnBuild().find(r=>/^k:/.test(r.key));const a=new Date(o.at);return a.getDate()===new Date(shift(today(),1)+"T09:00:00").getDate()&&a.getHours()===9})()`));
/* calendario: recordatorio con hora */
ev(`S.ui.main="cal";CAL=today().slice(0,7);SEL=today();render()`);click(q('[data-t="nxnew"][data-m="rec"]'));t("desde el calendario crea un recordatorio con hora y aviso",ev("NX.nw")===true&&ev("NX.sheet.rm")===0&&!!ev("NX.sheet.tm")&&ev("NX.sheet.due")===ev("today()"));
$("nx_x").value="Recoger paquete";click(q('[data-t="nxsave"]'));t("queda guardado y sale en el día",ev("S.notes.some(x=>x.x==='Recoger paquete'&&x.rm===0)")&&/Recoger paquete/.test($("cday").textContent));
/* sincronización: proyectos se fusionan */
t("la fusión conserva proyectos de los dos lados",ev(`(()=>{const A=JSON.parse(JSON.stringify(S)),B=JSON.parse(JSON.stringify(S));A.proj=[{id:"a",n:"A"}];B.proj=[{id:"b",n:"B"}];return syMerge(A,B).proj.length})()`)===2);
/* inicio: agenda compacta y chequeo */
ev(`S.well={};S.ui.main="panel";S.ui.hd="t";S.notes=[newTask({x:"Tarea de hoy",due:today(),tm:"09:00"}),newTask({x:"Tarea mañana",due:shift(today(),1)})];render()`);
t("agenda: una sola tarjeta con pestañas Hoy/Mañana",d.querySelectorAll("#htl .agd").length===1&&!!q('#htl [data-t="hdset"][data-v="m"]')&&/Tarea de hoy/.test($("htl").textContent)&&!/Tarea mañana/.test($("htl").textContent));
click(q('#htl [data-t="hdset"][data-v="m"]'));t("la pestaña Mañana cambia la lista",/Tarea mañana/.test($("htl").textContent)&&!/Tarea de hoy/.test($("htl").textContent));
click(q('#htl [data-t="nxt"]'));t("se completa desde el inicio",ev("S.notes.find(x=>x.x==='Tarea mañana').done")===true);
const alto=$("htl").getBoundingClientRect?1:1;t("el chequeo tiene 4 preguntas con ajustes",d.querySelectorAll("#pwell .ck2q").length===4&&!!q('#pwell [data-t="ck2cfg"]'));
click(q('#pwell [data-t="ck2cfg"]'));const ti=q('#pwell [data-c="ck2t"]');ti.value="07:45";ti.dispatchEvent(new w.Event("change",{bubbles:true}));t("cambiar la hora del aviso del chequeo",ev("pnPrefs().wt")==="07:45");
click(q('#pwell [data-t="ck2np"]'));t("activar/desactivar el aviso del chequeo",ev("pnPrefs().well")===false);
/* estudios */
ev(`S.ui.main="fut";S.ui.fv="hub";S.ui.dv="res";render()`);t("tarjeta «Estudios en los que me baso» con referencias",/Gabbett/.test($("fhub").textContent)&&/Hooper/.test($("fhub").textContent)&&/McLaren/.test($("fhub").textContent));
}catch(e){ko++;console.log("  ✗ excepción",e.message,e.stack.split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},800);
