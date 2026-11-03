/* v15: sesiones del entrenador como tarjetas, vista guardada y 2/3/4 equipos */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;w.scrollTo=()=>{};
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s);
const ck=s=>{const el=q(s);if(!el)throw new Error("sin elemento "+s);el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
setTimeout(()=>{try{
console.log("\nv15");
ev(`S.team.plan=[];S.team.att=[];S.ui.main="eq";S.ui.tv="ent";TPD=null;TSV=null;render()`);
ev(`S.team.plan.push({id:"pa1",d:shift(today(),-2),h:"18:45",tp:"Salida de balón",obj:"Salida limpia",bl:[{id:"b1",ex:"",n:"Calentamiento",min:15,nt:""},{id:"b2",ex:"",n:"Posesión 6v6",min:25,nt:""},{id:"b3",ex:"",n:"Vuelta a la calma",min:10,nt:""}],nt:"",bj:["sp_aitor"],tn:2,tm:[],tg:[]});render()`);
t("la sesión guardada sale como tarjeta con barra de bloques",qa(".scard").length===1&&qa(".scard .sbar i").length===3&&/Hecha/.test(q(".scard").textContent));
t("la tarjeta muestra tema, duración y nº de bloques",/Salida de balón/.test(q(".scard").textContent)&&/50 min/.test(q(".scard").textContent)&&/3 bloques/.test(q(".scard").textContent));
ck('[data-t="sview"]');
t("al tocar se abre la vista de la sesión con línea de tiempo",qa(".sti").length===3&&/Guardada/.test(q(".sv").textContent)&&/18:45/.test(q(".stl").textContent)&&/19:00/.test(q(".stl").textContent));
t("la línea de tiempo suma las horas (19:00–19:25, 19:25–19:35)",/19:25/.test(q(".stl").textContent)&&/19:35/.test(q(".stl").textContent));
t("hay botones de 2, 3 y 4 equipos",qa('[data-t="svteams"]').length===3);
ck('[data-t="svteams"][data-n="3"]');ck('[data-t="svmix"]');
const tm=ev('S.team.plan[0].tm');
t("3 equipos equilibrados (±1), sin la baja ni los porteros",tm.length===3&&Math.max(...tm.map(x=>x.length))-Math.min(...tm.map(x=>x.length))<=1&&!tm.flat().includes("sp_aitor")&&qa(".tmx").length===3,JSON.stringify(tm.map(x=>x.length)));
ck('[data-t="svteams"][data-n="2"]');t("cambiar a 2 equipos borra el reparto anterior",ev('S.team.plan[0].tm.length')===0&&ev('S.team.plan[0].tn')===2);
ck('[data-t="svmix"]');t("2 equipos",ev('S.team.plan[0].tm.length')===2&&qa(".tmx").length===2);
ck('[data-t="svteams"][data-n="4"]');ck('[data-t="svmix"]');t("4 equipos",ev('S.team.plan[0].tm.length')===4);
ck('[data-t="svback"]');t("«← Entrenos» vuelve a las tarjetas",qa(".scard").length===1&&!q(".sv"));
ck('[data-t="sview"]');ck('[data-t="svedit"]');t("«Editar» abre el formulario con la sesión",!!ev("TPD")&&ev("TPD.id")==="pa1"&&!!q(".bk"));
ck('[data-t="psave"]');t("al guardar se abre la tarjeta de la sesión (no la lista)",!!q(".sv")&&ev("TSV")==="pa1");
ck('[data-t="svback"]');ck('[data-t="pnew"]');t("en el formulario, los equipos se eligen con botones",qa('[data-t="tnset"]').length===3&&!q('select[data-c="tn"]'));
ck('[data-t="tnset"][data-n="3"]');ck('[data-t="tmake"]');t("el formulario también reparte 3 equipos",ev("TPD.tm.length")===3);
ev(`TPD=null;S.team.plan.push({id:"pa2",d:shift(today(),3),tp:"ABP",bl:[],bj:[],tn:2,tm:[],tg:[]});TSV=null;render()`);
t("las próximas salen aparte de las hechas",/Próximos/.test(q("#view,main,body").textContent)&&/Hechos/.test(d.body.textContent)&&qa(".scard").length===2);
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},800);
