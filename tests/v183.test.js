const {JSDOM}=require("jsdom"),fs=require("fs");
let ok=0,ko=0;const t=(n,c)=>{if(c){ok++;console.log("  ✓",n)}else{ko++;console.log("  ✗",n)}};
const dom=new JSDOM(fs.readFileSync(__dirname+"/../index.html","utf8"),{runScripts:"dangerously",pretendToBeVisual:true,url:"http://localhost/"});
const w=dom.window,d=w.document;w.HTMLCanvasElement.prototype.getContext=()=>null;w.scrollTo=()=>{};
const ev=s=>w.eval(s),click=el=>{if(!el)throw new Error("sin elemento");el.dispatchEvent(new w.MouseEvent("click",{bubbles:true,cancelable:true}))};
console.log("\nv18.3 · preparar entreno");
setTimeout(()=>{try{
ev(`S.ui.main="eq";S.ui.tv="ent";render();TA.ptoday({dataset:{d:today()}})`);
const n0=ev("TPD.bl.length");t("el entreno de hoy trae bloques",n0>=3);
t("hay botón Quitar en cada bloque",d.querySelectorAll('[data-t="bkdel"]').length===n0);
click(d.querySelector('[data-t="bkdel"]'));t("Quitar elimina un bloque",ev("TPD.bl.length")===n0-1);
t("el borrado de pizarras sigue siendo otro",ev("TA.bdel!==TA.bkdel"));
const ex=ev("S.team.ex[0].id");
click(d.querySelector(`[data-t="pkadd"][data-id="${ex}"]`));t("+ añade el ejercicio",ev("TPD.bl.length")===n0);
click(d.querySelector(`[data-t="pkrem"][data-id="${ex}"]`));t("✕ lo quita desde la biblioteca",ev("TPD.bl.length")===n0-1);
const m=ev("TPD.bl[0].min");click(d.querySelector('[data-t="bkmin"][data-v="5"]'));t("+5 min",ev("TPD.bl[0].min")===m+5);
t("hay selección de jugadores",!!d.querySelector('[data-t="bjt"]'));
const c=d.querySelector('[data-t="pkcat"]');click(c);t("filtra por categoría",ev("PKC")!=="");
}catch(e){ko++;console.log("  ✗ excepción",e.message,(e.stack||"").split("\n")[1])}
console.log(`\n${ok} ok, ${ko} fallos`);process.exit(ko?1:0)},1500);
