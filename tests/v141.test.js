/* v14.1: calendario de trabajo, selector de fecha/hora para móvil, lugar */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),$=i=>d.getElementById(i),q=s=>d.querySelector(s),click=el=>{if(!el)throw new Error("sin elemento: ")};
const ck=(s)=>{const el=q(s);if(!el)throw new Error("sin elemento "+s);el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
setTimeout(()=>{try{
console.log("\nv14.1");
ev(`S.notes=[];S.proj=[];S.ui.main="cal";CAL=today().slice(0,7);SEL=today();render()`);
t("el calendario abre en «Agenda» (sin deporte)",ev("CALF")==="org"&&q('.cfil button.on').textContent.trim()==="Agenda"&&!/Mi entreno/.test($("cday").textContent));
ck('[data-t="nxnew"][data-m="ev"]');
t("«＋ Compromiso» abre la hoja con hora de inicio y fin",ev("NX.sheet.ev")===1&&!!ev("NX.sheet.tm")&&!!ev("NX.sheet.te")&&/Hora de inicio y fin/.test($("nxs").textContent));
ck('[data-t="nxpo"][data-v="tm"]');t("selector de hora con rejilla de horas y minutos",d.querySelectorAll(".tph button").length===24&&d.querySelectorAll(".tpm button").length===12);
ck('.tph [data-v="16"]');ck('.tpm [data-v="45"]');t("elegir hora y minutos con toques",ev("NX.sheet.tm")==="16:45");
t("el fin se ajusta si queda antes del inicio",ev("NX.sheet.te")>"16:45",ev("NX.sheet.te"));
ck('[data-t="nxpo"][data-v="te"]');ck('[data-t="nxtq"][data-v="'+ev('addHM("16:45",90)')+'"]');t("duración rápida +1 h 30",ev("NX.sheet.te")==="18:15");
ck('[data-t="nxpo"][data-v="d"]');t("selector de día: mini calendario",d.querySelectorAll(".mcg button").length>=28);
const dd=ev('shift(today(),3)');if(dd.slice(0,7)!==ev("today().slice(0,7)"))ck('[data-t="nxpm"][data-v="1"]');ck('.mcg [data-v="'+dd+'"]');t("elegir fecha con un toque",ev("NX.sheet.due")===dd);
$("nx_x").value="Reunión con cliente";$("nx_lc").value="Calle Uría 12, Oviedo";
ck('[data-t="nxsave"]');
const n=ev("S.notes[0]");t("compromiso guardado con fecha, horas y lugar",n.ev===1&&n.tm==="16:45"&&n.te==="18:15"&&n.due===dd&&n.lc==="Calle Uría 12, Oviedo"&&n.x==="Reunión con cliente",JSON.stringify(n));
ev(`SEL="${dd}";render()`);
t("el día muestra hora, fin y lugar",/16:45/.test($("cday").textContent)&&/18:15/.test($("cday").textContent)&&/Calle Uría 12/.test($("cday").textContent)&&!!q('#cday [data-t="nxmapr"]'));
t("el compromiso no cuenta como tarea vencida",(()=>{ev(`S.notes[0].due=shift(today(),-2)`);return ev(`nxStats().late`)===0})());
ev(`S.notes[0].due="${dd}"`);
t("el aviso push incluye el lugar",(()=>{ev(`S.notes[0].rm=30;S.ui.np={}`);const o=ev("pnBuild()").find(r=>/^k:/.test(r.key));return !!o&&/Calle Uría/.test(o.body)})());
/* alta rápida con lugar */
ev(`S.ui.main="notas";S.ui.nv="hoy";render()`);$("nxq").value="comida con Marta viernes 14:00 en La Ería";ck('[data-t="nxq"]');
const m=ev("S.notes.find(x=>/Marta/.test(x.x))");t("«en <lugar>» se separa del título",m&&m.lc==="La Ería"&&m.tm==="14:00"&&m.x==="comida con Marta",JSON.stringify(m));
$("nxq").value="comprar en el súper";ck('[data-t="nxq"]');t("«en» sin fecha ni hora no se confunde con un lugar",ev("S.notes.find(x=>/súper/.test(x.x)).lc")==="");
/* sugerencia de lugares usados */
ck('[data-t="nxnew"]');t("la hoja ofrece los lugares que ya usaste",d.querySelectorAll(".plc button[data-t=nxlc]").length>=1);
ck('.plc [data-t="nxlc"]');t("tocar un lugar lo rellena",!!ev("NX.sheet.lc"));
ck('[data-t="nxclose"]:not(.nxbk)');
ck('[data-t="nxnew"]');ev(`NX.sheet.due="";NX.sheet.tm=""`);ck('[data-t="nxpo"][data-v="tm"]');ck('[data-t="nxtq"][data-v="18:00"]');
t("poner hora sin fecha pone la fecha de hoy",ev("NX.sheet.tm")==="18:00"&&ev("NX.sheet.due")===ev("today()"));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},800);
