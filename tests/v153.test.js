/* v15.3: sueño del reloj × carga */
const {JSDOM}=require("jsdom"),fs=require("fs");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/"});
const w=dom.window,d=w.document;let ok=0,ko=0;w.scrollTo=()=>{};
const t=(n,c,x)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n,x||"")}};
const ev=s=>w.eval(s),q=s=>d.querySelector(s),qa=s=>d.querySelectorAll(s);
setTimeout(()=>{try{
console.log("\nv15.3");
ev(`S.sess=[];S.well={};render()`);
t("sin datos: mensaje de espera",/3 noches/.test(ev("sleepLoadCard()")));
ev(`const T=today();S.sess=[];S.ui.sn=8;
for(let i=1;i<=13;i++){const dd=shift(T,-i);S.well[dd]={sh:i%2?5.5:7.5,shs:"w"};if(i%2===0)S.sess.push({id:"s"+i,d:dd,k:"ent",m:90,r:7})}
S.well[T]={sh:6,shs:"w"}`);
const L=ev("slLoad()");
t("slLoad cuenta noches del reloj",L.watch>=10&&L.nights>=10);
t("calcula deuda de sueño de 7 noches",L.def>0&&L.a7>5&&L.a7<8);
t("minutos de entreno de 7 días",L.min7>=270);
const h=ev("sleepLoadCard()");
t("la tarjeta tiene 14 columnas y chips de horas",(h.match(/class="slc/g)||[]).length===14&&/class="sc /.test(h));
t("incluye conclusiones con base",/slsay/.test(h)&&/Base:/.test(h));
t("cita a Walsh 2021",/Walsh/.test(h));
ev(`S.ui.main="fut";S.ui.dv="res";S.ui.fv="hub";render()`);
t("aparece en Deporte → Resumen",!!q(".sl-c")&&!!q(".slg"),ev("S.ui.main+' '+S.ui.dv"));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
},800);

setTimeout(()=>{try{
console.log("\nv15.3 · entreno extra");
ev(`const T=today();S.sess=[];S.well={};S.ui.sn=8;S.mol={};
for(let i=1;i<=28;i++){const dd=shift(T,-i);if(i%2===0)S.sess.push({id:"b"+i,d:dd,k:"ent",m:90,r:6})}`);
ev(`S.well[today()]={sh:8,shs:"w"}`);
const sets0=ev(`buildGym(["cu","is","gl"],60,"mt").ex.reduce((a,x)=>a+x.s,0)`);
t("con sueño suficiente no hay aviso de sueño",ev("slPoor()")===null);
ev(`S.well[today()]={sh:5,shs:"w"}`);
t("con 5 h de sueño detecta poco sueño",!!ev("slPoor()"));
t("el estado baja a «con cuidado»",ev("recommend(loadStats()).lv")!=="ok"&&/dormiste/.test(ev("recommend(loadStats()).why.join(' ')")));
const sets1=ev(`buildGym(["cu","is","gl"],60,"mt").ex.reduce((a,x)=>a+x.s,0)`);
t("con poco sueño salen menos series",sets1<sets0,sets0+" vs "+sets1);
ev(`GS.plan=buildGym(["pe","es"],60,"mt");GS.plan.lv="warn"`);
const why=ev("loadWhy(GS.plan)");
t("explica el sueño con su fuente",/Cómo llegas hoy: sueño/.test(why)&&/Walsh/.test(why)&&/criterio propio/.test(why));
t("explica la carga con su fuente",/Gabbett/.test(why));
ev(`S.ui.main="fut";S.ui.fv="gym";render()`);
t("el gimnasio muestra «Cómo llegas hoy»",!!q(".xarr")&&/Sueño anoche/.test(q(".xarr").textContent),ev("S.ui.main+' '+S.ui.fv"));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
},1400);

setTimeout(()=>{try{
console.log("\nv15.3 · inicio");
ev(`S.well={};S.sess=[];const T=today();for(let i=0;i<7;i++)S.well[shift(T,-i)]={sh:6+i%3*.5,shs:"w"};S.ui.main="panel";render()`);
t("el inicio tiene las tendencias de sueño y carga",!!q("#hpro .hptg"));
t("sugiere cuántas horas dormir esta noche",/apunta a/.test(q("#hpro").textContent));
t("dibuja las dos tendencias (sueño y carga)",qa("#hpro .hpt").length===2&&qa("#hpro .spk").length>=1);
t("sin sesiones la carga no rompe",/UA/.test(q("#hpro").textContent));
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\nRESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(ko?1:0)},2000);
