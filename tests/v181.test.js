const {JSDOM}=require("jsdom"),fs=require("fs");
let ok=0,ko=0;const t=(n,c)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n)}};
const dom=new JSDOM(fs.readFileSync(__dirname+"/../index.html","utf8"),{runScripts:"dangerously",pretendToBeVisual:true,url:"http://localhost/"});
const w=dom.window;w.HTMLCanvasElement.prototype.getContext=()=>null;
const ev=s=>w.eval(s);
console.log("\nv18.1 · pizarra y jugada por voz");
setTimeout(async()=>{try{
ev(`S.ui.main="eq";S.ui.tv="piz";render()`);
ev(`TBD=newBoard("4-3-3");bdAuto(TBD)`);
let r=ev(`JSON.stringify(aiLocal("el 10 pasa al 9, el 9 remata"))`);
t("crea fotogramas",JSON.parse(r).n>=2);
t("hay fotogramas guardados",ev("TBD.fr.length")>=3);
r=ev(`JSON.stringify(aiLocal("corner a favor, el lanzador la saca al primer palo y luego el 4 remata"))`);
t("corner usa plantilla",!JSON.parse(r).err);
r=ev(`JSON.stringify(aiLocal("   "))`);t("vacío da error",!!JSON.parse(r).err);
ev(`TBD=newBoard("4-4-2");bdAuto(TBD)`);
ev(`TA.bsys({dataset:{v:"4-3-3"}})`);t("cambia formación",ev("TBD.sys")==="4-3-3");
const h=ev("tvPiz()");t("la pantalla muestra formaciones y la jugada",/data-v="4-4-2"/.test(h)&&/Cuéntale la jugada/.test(h));

// IA en la nube simulada
w.fetch=async(u,o)=>{w.__req=JSON.parse(o.body);return{ok:true,status:200,json:async()=>({nombre:"Prueba",frames:[{moves:{},arrows:[]},{moves:{[w.__req.fichas[0].id]:[10,10]},arrows:[{x1:1,y1:2,x2:3,y2:4,k:"p"}]}]})}};
ev(`SY={ses:{access:"x"}};TBD=newBoard("4-3-3");bdAuto(TBD)`);
const n=await ev(`aiCloud("el pivote la abre al extremo")`);
t("IA nube crea fotogramas",n===2&&ev("TBD.fr.length")===3);
t("envía sistema y fichas",w.__req.sistema==="4-3-3"&&w.__req.fichas.length>10);
ev(`TBD=newBoard("4-3-3");bdAuto(TBD);S.ui.aiCloud=true`);
t("sin minutos del equipo en Resultados",ev("tvMin()")==="");
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\n${ok} ok, ${ko} fallos`);process.exit(ko?1:0)},1500);
