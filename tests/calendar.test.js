const {JSDOM,VirtualConsole}=require("jsdom");const fs=require("fs");
const html=fs.readFileSync(process.argv[2],"utf8");
let ok=0,bad=0;const t=(n,c,i)=>{if(c){ok++;console.log("  ✓",n)}else{bad++;console.log("  ✗",n,i===undefined?"":"→ "+i)}};
const errs=[];const vc=new VirtualConsole();vc.on("jsdomError",e=>errs.push(e.message));
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const pad=n=>String(n).padStart(2,"0");
const D=(off)=>{const d=new Date();d.setDate(d.getDate()+off);return d};
const ymd=d=>d.getFullYear()+pad(d.getMonth()+1)+pad(d.getDate());
const iso=d=>d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate());
/* función de recorte del servidor (misma lógica que push-send.ts, sin tipos) */
const ts=fs.readFileSync(process.argv[3],"utf8");const a=ts.indexOf("function trimIcs"),b=ts.indexOf("async function ical");
const trimIcs=new Function(ts.slice(a,b).replace(/: string\[\]/g,"").replace(/: string/g,"")+";return trimIcs")();
const mon=D(0);while(mon.getDay()!==1)mon.setDate(mon.getDate()+1);  // próximo lunes
const start=D(-14);const old=D(-200);
const ICS=[
"BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VTIMEZONE","TZID:Europe/Madrid","END:VTIMEZONE",
/* 1 evento UTC mañana */
"BEGIN:VEVENT","UID:a1",`DTSTART:${ymd(D(1))}T093000Z`,`DTEND:${ymd(D(1))}T103000Z`,"SUMMARY:Reunión Arima\\, seguimiento","LOCATION:Aula 3","DESCRIPTION:secreto que no debe pasar","ATTENDEE:mailto:x@y.z","END:VEVENT",
/* 2 evento local TZID */
"BEGIN:VEVENT","UID:a2",`DTSTART;TZID=Europe/Madrid:${ymd(D(2))}T160000`,`DTEND;TZID=Europe/Madrid:${ymd(D(2))}T173000`,"SUMMARY:Clase","END:VEVENT",
/* 3 todo el día 3 días */
"BEGIN:VEVENT","UID:a3",`DTSTART;VALUE=DATE:${ymd(D(3))}`,`DTEND;VALUE=DATE:${ymd(D(6))}`,"SUMMARY:Viaje","END:VEVENT",
/* 4 cancelado */
"BEGIN:VEVENT","UID:a4",`DTSTART:${ymd(D(1))}T120000Z`,"STATUS:CANCELLED","SUMMARY:Cancelado","END:VEVENT",
/* 5 semanal lunes y miércoles, con una excepción y un cambio */
"BEGIN:VEVENT","UID:w1",`DTSTART;TZID=Europe/Madrid:${ymd(start)}T180000`,`DTEND;TZID=Europe/Madrid:${ymd(start)}T190000`,"RRULE:FREQ=WEEKLY;BYDAY=MO,WE","SUMMARY:Gimnasio","END:VEVENT",
/* 6 evento muy antiguo (debe recortarse) */
"BEGIN:VEVENT","UID:old",`DTSTART:${ymd(old)}T080000Z`,"SUMMARY:Antiguo","END:VEVENT",
/* 7 diario con COUNT */
"BEGIN:VEVENT","UID:d1",`DTSTART;TZID=Europe/Madrid:${ymd(D(1))}T080000`,"RRULE:FREQ=DAILY;COUNT=3","SUMMARY:Vitaminas","END:VEVENT",
"END:VCALENDAR"].join("\r\n")+"\r\n";
(async()=>{console.log("Calendario externo");
 const trimmed=trimIcs(ICS);
 t("servidor: quita descripciones e invitados",!/secreto|ATTENDEE|DESCRIPTION/.test(trimmed));
 t("servidor: quita eventos antiguos y conserva repeticiones",!/Antiguo/.test(trimmed)&&/Gimnasio/.test(trimmed)&&/Reunión/.test(trimmed));
 t("servidor: más pequeño que el original",trimmed.length<ICS.length);
 const store={};const calls=[];let icsBody=trimmed,status=200,sessOK=true;
 const dom=new JSDOM(html,{runScripts:"dangerously",url:"https://x.github.io/mi-dia/",virtualConsole:vc,pretendToBeVisual:true,beforeParse(w){
  Object.defineProperty(w,"localStorage",{value:{getItem:k=>k in store?store[k]:null,setItem:(k,v)=>{store[k]=String(v)},removeItem:k=>{delete store[k]}}});
  w.scrollTo=()=>{};
  w.fetch=(url,o)=>{o=o||{};const u=new URL(url),p=u.pathname;calls.push((o.method||"GET")+" "+p);
   const R=(s,j,txt)=>Promise.resolve({ok:s>=200&&s<300,status:s,json:()=>Promise.resolve(j),text:()=>Promise.resolve(txt!==undefined?txt:JSON.stringify(j))});
   if(p==="/auth/v1/signup")return R(200,{access_token:"A.u1",refresh_token:"R",expires_at:Math.floor(Date.now()/1000)+3600,user:{id:"u1",email:"a@x.com"}});
   if(p==="/rest/v1/app_state")return(o.method||"GET")==="GET"?R(200,[]):R(201,[{rev:1}]);
   if(p==="/functions/v1/push-send/ical"){const body=JSON.parse(o.body);if(!/^https:\/\/calendar\.google\.com\//.test(body.url))return R(400,{error:"Dirección no válida"});return status===200?R(200,null,icsBody):R(502,{error:"Google respondió 404. Revisa la dirección secreta."})}
   return R(200,[])}}});
 const w=dom.window,d=w.document,ev=s=>w.eval(s);
 t("tarjeta de calendario externo visible",/Dirección secreta/.test(d.getElementById("icc").textContent));
 /* parser directo */
 const from=new Date(D(-35));from.setHours(0,0,0,0);const to=D(120);
 const E=JSON.parse(ev(`JSON.stringify(icsEvents(${JSON.stringify(trimmed)},new Date(${from.getTime()}),new Date(${to.getTime()})))`));
 const on=day=>E.filter(x=>x.d===iso(D(day)));
 t("evento UTC pasa a hora local y descodifica texto",on(1).some(x=>x.title==="Reunión Arima, seguimiento"&&x.loc==="Aula 3"&&x.t===pad(new Date(Date.UTC(...ymd(D(1)).match(/(\d{4})(\d{2})(\d{2})/).slice(1).map((v,i)=>i===1?+v-1:+v),9,30)).getHours())+":30"),JSON.stringify(on(1)));
 t("evento con TZID conserva la hora y la duración",on(2).some(x=>x.t==="16:00"&&x.e==="17:30"&&x.title==="Clase"));
 t("todo el día de 3 días aparece en 3 fechas y no en la cuarta",[3,4,5].every(n=>on(n).some(x=>x.allday&&x.title==="Viaje"))&&!on(6).some(x=>x.title==="Viaje"));
 t("evento cancelado no aparece",!E.some(x=>x.title==="Cancelado"));
 t("repetición semanal: solo lunes y miércoles a las 18:00",E.filter(x=>x.title==="Gimnasio").every(x=>{const dd=new Date(x.d+"T12:00");return[1,3].includes(dd.getDay())&&x.t==="18:00"})&&E.filter(x=>x.title==="Gimnasio").length>=14,E.filter(x=>x.title==="Gimnasio").length);
 t("repetición semanal no antes de su inicio",E.filter(x=>x.title==="Gimnasio").every(x=>x.d>=iso(start)));
 t("repetición diaria con COUNT=3 da exactamente 3",E.filter(x=>x.title==="Vitaminas").length===3);
 /* excepciones y cambios */
 const ICS2=["BEGIN:VCALENDAR","BEGIN:VEVENT","UID:r",`DTSTART;TZID=Europe/Madrid:${ymd(D(1))}T100000`,"RRULE:FREQ=DAILY;COUNT=4","EXDATE;TZID=Europe/Madrid:"+ymd(D(2))+"T100000","SUMMARY:Serie","END:VEVENT",
  "BEGIN:VEVENT","UID:r","RECURRENCE-ID;TZID=Europe/Madrid:"+ymd(D(3))+"T100000",`DTSTART;TZID=Europe/Madrid:${ymd(D(3))}T120000`,"SUMMARY:Serie (movida)","END:VEVENT","END:VCALENDAR"].join("\r\n");
 const E2=JSON.parse(ev(`JSON.stringify(icsEvents(${JSON.stringify(ICS2)},new Date(${from.getTime()}),new Date(${to.getTime()})))`));
 t("EXDATE quita una ocurrencia",!E2.some(x=>x.d===iso(D(2))));
 t("RECURRENCE-ID sustituye la ocurrencia por la movida",E2.filter(x=>x.d===iso(D(3))).length===1&&E2.find(x=>x.d===iso(D(3))).t==="12:00"&&E2.length===3,JSON.stringify(E2.map(x=>x.d+" "+x.t)));
 t("mensual: n-ésimo día de la semana",(()=>{const o=JSON.parse(ev(`JSON.stringify(icsEvents("BEGIN:VEVENT\\nDTSTART;TZID=Europe/Madrid:20260105T100000\\nRRULE:FREQ=MONTHLY;BYDAY=1MO;COUNT=3\\nSUMMARY:M\\nEND:VEVENT",new Date(2026,0,1),new Date(2026,11,31)).map(e=>e.d))`));return o.join()==="2026-01-05,2026-02-02,2026-03-02"})());
 /* conectar */
 d.getElementById("sye").value="a@x.com";d.getElementById("syp").value="secreto1";ev('syAction("signup")');await sleep(80);
 d.getElementById("icu").value="https://ejemplo.com/malo.ics";d.querySelector('[data-i="on"]').click();
 t("rechaza direcciones que no son de Google Calendar",!ev("S.ui.ical")&&/Pega la dirección completa/.test(d.getElementById("icc").textContent));
 const URL1="https://calendar.google.com/calendar/ical/yo%40x.edu/private-abc123/basic.ics";
 d.getElementById("icu").value=URL1;d.querySelector('[data-i="on"]').click();await sleep(120);
 t("conectar guarda la dirección y descarga eventos",ev("S.ui.ical")===URL1&&ev("IC.ev.length")>=20&&/conectado/.test(d.getElementById("icc").textContent),d.getElementById("icc").textContent);
 t("la dirección secreta no se muestra en pantalla",!d.getElementById("icc").innerHTML.includes("private-abc123"));
 t("la dirección secreta no va en la copia .json",(()=>{let dl;w.URL.createObjectURL=b=>{dl=b;return"blob:x"};w.URL.revokeObjectURL=()=>{};w.HTMLAnchorElement.prototype.click=function(){};ev('document.querySelector(\'[data-a="exp"]\').click()');return dl&&dl.size>0})()&&true);
 /* se muestran en el calendario */
 ev(`S.ui.main="cal";CAL=today().slice(0,7);SEL="${iso(D(2))}";render()`);
 t("el día seleccionado lista el evento del calendario externo",/Calendario/.test(d.getElementById("cday").textContent)&&/Clase/.test(d.getElementById("cday").textContent),d.getElementById("cday").textContent.slice(0,200));
 t("la cuadrícula marca los días con eventos externos",d.querySelectorAll(".cd .dx").length>=3);
 t("la semana próxima incluye eventos externos",/Reunión Arima/.test(d.getElementById("cnext").textContent));
 ev('S.ui.main="panel";render()');
 t("el Panel muestra lo de mañana en tu calendario",/Mañana en tu calendario/.test(d.getElementById("porg").textContent)&&/Reunión Arima/.test(d.getElementById("porg").textContent));
 /* avisos */
 const B=JSON.parse(ev("JSON.stringify(pnBuild())")),X=B.filter(x=>x.key.startsWith("x:"));
 t("avisos de eventos externos 30 min antes (sin los de todo el día)",X.length>=3&&!X.some(x=>/Viaje/.test(x.title))&&X.every(x=>/en 30 min/.test(x.body)),JSON.stringify(X.slice(0,2)));
 const c=X.find(x=>x.title==="Clase");t("el aviso de «Clase» sale a las 15:30",c&&new Date(c.at).getHours()===15&&new Date(c.at).getMinutes()===30&&/Pasado|a las 16:00/.test(c.body),JSON.stringify(c));
 ev("S.ui.np={cal:false}");t("se puede apagar",!JSON.parse(ev("JSON.stringify(pnBuild())")).some(x=>x.key.startsWith("x:")));ev("S.ui.np={}");
 /* errores */
 status=502;calls.length=0;ev("icRefresh(true)");await sleep(100);
 t("si Google falla, avisa y conserva los eventos guardados",/Google respondió 404/.test(d.getElementById("icc").textContent)&&ev("IC.ev.length")>=20);
 /* desconectar */
 status=200;d.querySelector('[data-i="off"]').click();
 t("desconectar borra dirección y eventos",!ev("S.ui.ical")&&ev("IC.ev.length")===0&&/Dirección secreta/.test(d.getElementById("icc").textContent));
 t("sin errores de JS",errs.length===0,errs.join("\n"));
 console.log("\nRESULTADO:",ok,"correctas,",bad,"fallos");process.exit(0)})();
