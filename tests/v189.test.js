const fs=require("fs"),{JSDOM}=require("jsdom");
const html=fs.readFileSync(process.argv[2]||"index.html","utf8");
let ok=0,ko=0;const t=(n,c)=>{c?ok++:ko++;console.log((c?"  ✓ ":"  ✗ ")+n)};
const dom=new JSDOM(html,{runScripts:"dangerously",pretendToBeVisual:true,url:"https://x.test/",beforeParse(w){w.matchMedia=w.matchMedia||(()=>({matches:false,addListener(){},removeListener(){},addEventListener(){},removeEventListener(){}}));w.IntersectionObserver=class{observe(){}disconnect(){}unobserve(){}};w.scrollTo=()=>{};w.navigator.share=undefined;w.HTMLCanvasElement.prototype.getContext=()=>null}});
const w=dom.window,ev=s=>w.eval(s);
setTimeout(()=>{try{
 ev(`teamSeed&&teamSeed();tfxSeed();const g=S.team.games.find(x=>x.id==="tf8");S.ui.cg=g.id;S.ui.main="eq";S.ui.tv="con";g.conv=S.team.pl.slice(0,14).map(p=>p.id);g.xi=g.conv.slice(0,11);save();render()`);
 const d=w.document;
 t("hay once con puntos arrastrables",d.querySelectorAll("#xisvg .xdot").length===11);
 t("hay 4 jugadas de balón parado",d.querySelectorAll(".es27j").length===4);
 t("J8 está en domingo 15",ev(`S.team.games.find(x=>x.id==="tf8").d`)==="2026-11-15");
 /* mover un jugador */
 ev(`(function(){const g=cvGame();g.xp={3:[20,40]};})()`);
 t("posición propia respetada",/translate\(20 40\)/.test(ev(`xiSvg(cvGame())`)));
 /* escribir jugada */
 ev(`(function(){const g=cvGame(),e=esGet(g);e.bp[0].t="9 primer palo";e.bp[0].tp="Córner a favor";e.bp[0].lz=g.xi[0];e.plan="Presión alta";})()`);
 const tx=ev(`esTexto(cvGame())`);
 t("texto con once, plan y jugada",/ONCE/.test(tx)&&/Presión alta/.test(tx)&&/9 primer palo/.test(tx)&&/Córner a favor/.test(tx));
 ev(`TA.esadd()`);t("añadir jugada",ev(`cvGame().es.bp.length`)===5);
 ev(`TA.cvsys({dataset:{v:"4-4-2"}})`);t("cambiar sistema recoloca",ev(`cvGame().xp`)==null);
 t("la estrategia sigue tras cambiar sistema",ev(`cvGame().es.plan`)==="Presión alta");
 t("render con estrategia sin errores",/Estrategia del partido/.test(ev(`tvCon()`)));
}catch(e){ko++;console.log("  ✗ error",e.message)}
console.log(`RESULTADO: ${ok} correctas, ${ko} fallos`);process.exit(0)},800);
