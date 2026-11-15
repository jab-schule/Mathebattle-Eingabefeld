(function(){
var W=window, D=document;
if(W.__mbk){ W.__mbk.toggle(); return; }
var inp=D.getElementById('term_input');
function toast(msg){
  var t=D.createElement('div');
  t.textContent=msg;
  t.style.cssText='position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:2147483001;background:#16181D;color:#fff;font:15px -apple-system,system-ui,sans-serif;padding:12px 16px;border-radius:10px;max-width:90vw;text-align:center';
  D.body.appendChild(t); setTimeout(function(){ t.remove(); },3500);
}
if(!inp){ toast('Auf dieser Seite gibt es kein Eingabefeld für einen Term.'); return; }
function varOf(el){ var m=/term_check\(\s*["']([^"']*)["']/.exec(el.getAttribute('onkeyup')||''); return m?m[1]:'x'; }
var VAR=varOf(inp);
var DEC=',';

/* ---------- Eingabe-Modell: Zeichen, Klammern, Brüche, Hochzahlen, Funktionen ---------- */
var KIDS={paren:1,frac:2,pow:1,fn:1};
function mkSeq(p){ return {items:[],parent:p}; }
function mkNode(t,name){ var n={t:t,name:name,kids:[],ps:null}; for(var k=0;k<KIDS[t];k++) n.kids.push(mkSeq(n)); return n; }
var root=mkSeq(null), cur={s:root,i:0};
function ins(it){ if(it.t) it.ps=cur.s; cur.s.items.splice(cur.i,0,it); }
function typeC(c){ ins({c:c}); cur.i++; }
function typeN(t,name){ var n=mkNode(t,name); ins(n); cur={s:n.kids[0],i:0}; }
function right(){
  var s=cur.s;
  if(cur.i<s.items.length){ var it=s.items[cur.i]; if(!it.t) cur.i++; else cur={s:it.kids[0],i:0}; }
  else if(s.parent){ var n=s.parent,k=n.kids.indexOf(s);
    if(k+1<n.kids.length) cur={s:n.kids[k+1],i:0}; else cur={s:n.ps,i:n.ps.items.indexOf(n)+1}; }
}
function left(){
  var s=cur.s;
  if(cur.i>0){ var it=s.items[cur.i-1]; if(!it.t) cur.i--; else { var l=it.kids[it.kids.length-1]; cur={s:l,i:l.items.length}; } }
  else if(s.parent){ var n=s.parent,k=n.kids.indexOf(s);
    if(k>0) cur={s:n.kids[k-1],i:n.kids[k-1].items.length}; else cur={s:n.ps,i:n.ps.items.indexOf(n)}; }
}
function empty(n){ return n.kids.every(function(s){ return !s.items.length; }); }
function back(){
  var s=cur.s;
  if(cur.i>0){ var it=s.items[cur.i-1];
    if(!it.t||empty(it)){ s.items.splice(cur.i-1,1); cur.i--; }
    else { var l=it.kids[it.kids.length-1]; cur={s:l,i:l.items.length}; } }
  else if(s.parent){ var n=s.parent,ps=n.ps,ix=ps.items.indexOf(n),k=n.kids.indexOf(s);
    if(empty(n)){ ps.items.splice(ix,1); cur={s:ps,i:ix}; }
    else if(n.t==='paren'){ var inner=n.kids[0].items; inner.forEach(function(it){ if(it.t) it.ps=ps; }); ps.items.splice.apply(ps.items,[ix,1].concat(inner)); cur={s:ps,i:ix}; }
    else if(k>0) cur={s:n.kids[k-1],i:n.kids[k-1].items.length};
    else cur={s:ps,i:ix}; }
}
function clearAll(){ root=mkSeq(null); cur={s:root,i:0}; }

/* ---------- Anzeige als Formel ---------- */
var SHOW={'\\cdot':'·','-':'−','+':'+'};
function esc(s){ return s.replace(/&/g,'&amp;').replace(/</g,'&lt;'); }
function html(seq,mark){
  var o='';
  for(var i=0;i<=seq.items.length;i++){
    if(mark && cur.s===seq && cur.i===i) o+='<span class="mbk-c"></span>';
    if(i===seq.items.length) break;
    var it=seq.items[i];
    if(!it.t){
      var c=it.c;
      if(c==='x'||c==='e'||/^[a-z]$/.test(c)) o+='<i>'+esc(c)+'</i>';
      else if(SHOW[c]) o+='<span class="mbk-op">'+SHOW[c]+'</span>';
      else o+=esc(c);
    } else if(it.t==='paren') o+='('+kid(it.kids[0],mark)+')';
    else if(it.t==='frac') o+='<span class="mbk-fr"><span>'+kid(it.kids[0],mark)+'</span><span>'+kid(it.kids[1],mark)+'</span></span>';
    else if(it.t==='pow') o+='<sup>'+kid(it.kids[0],mark)+'</sup>';
    else if(it.name==='wu') o+='√<span class="mbk-rt">'+kid(it.kids[0],mark)+'</span>';
    else o+=it.name+'('+kid(it.kids[0],mark)+')';
  }
  return o;
}
function kid(s,mark){ return (!s.items.length && !(mark && cur.s===s)) ? '<span class="mbk-ph"></span>' : html(s,mark); }

/* ---------- Übersetzen ins Mathebattle-Format ---------- */
function txt(seq){
  var o='';
  seq.items.forEach(function(it){
    if(!it.t) o+= it.c==='\\cdot' ? '*' : it.c===',' ? DEC : it.c==='π' ? 'pi' : it.c;
    else if(it.t==='paren') o+='('+txt(it.kids[0])+')';
    else if(it.t==='frac') o+='(('+txt(it.kids[0])+')/('+txt(it.kids[1])+'))';
    else if(it.t==='pow') o+='^('+txt(it.kids[0])+')';
    else o+=it.name+'('+txt(it.kids[0])+')';
  });
  return o;
}
function complete(seq){
  return seq.items.every(function(it,i){
    if(!it.t) return true;
    if(it.kids.some(function(k){ return !k.items.length || !complete(k); })) return false;
    if(it.t==='pow' && (i===0 || /^[+\-,]$|cdot/.test(seq.items[i-1].c||''))) return false;
    return true;
  });
}

/* ---------- Oberfläche ---------- */
var st=D.createElement('style');
st.textContent=
'#mbk{position:fixed;left:0;top:0;transform-origin:0 0;box-sizing:border-box;z-index:2147483000;background:#fff;color:#16181D;border-top:1.5px solid #E5E7EB;box-shadow:0 -6px 24px rgba(0,0,0,.08);font:15px -apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif;padding:10px max(12px,env(safe-area-inset-right)) calc(10px + env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left));-webkit-user-select:none;user-select:none}'+
'#mbk *{box-sizing:border-box}'+
'#mbk .mbk-in{max-width:560px;margin:0 auto;display:flex;flex-direction:column;gap:8px}'+
'#mbk .mbk-top{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:13px;color:#6B717C}'+
'#mbk .mbk-top button{border:0;background:none;color:#6B717C;font:inherit;text-decoration:underline;padding:4px;cursor:pointer}'+
'#mbk .mbk-f{background:#F3F4F6;border-radius:10px;min-height:56px;padding:8px 14px;display:flex;align-items:center;gap:8px;overflow-x:auto;font:22px "Times New Roman",Georgia,serif;white-space:nowrap}'+
'#mbk .mbk-f .mbk-pre{color:#6B717C;font-size:17px;font-style:italic;flex:none}'+
'#mbk .mbk-f i{font-style:italic}'+
'#mbk .mbk-op{margin:0 .18em}'+
'#mbk sup{font-size:.68em;vertical-align:.75em;line-height:0}'+
'#mbk .mbk-fr{display:inline-flex;flex-direction:column;align-items:center;vertical-align:middle;font-size:.85em;margin:0 .1em}'+
'#mbk .mbk-fr>span{padding:0 .15em;line-height:1.15}'+
'#mbk .mbk-fr>span:first-child{border-bottom:1.2px solid currentColor}'+
'#mbk .mbk-rt{border-top:1.2px solid currentColor;padding-left:.1em}'+
'#mbk .mbk-ph{display:inline-block;width:.6em;height:.75em;border:1.2px solid #9AA1AD;border-radius:2px;vertical-align:-.05em;margin:0 .05em}'+
'#mbk .mbk-c{display:inline-block;width:2px;height:1em;background:#2F55D4;vertical-align:-.15em;margin:0 1px;animation:mbkb 1.06s steps(1) infinite}'+
'@keyframes mbkb{50%{opacity:0}}'+
'#mbk .mbk-msg{font-size:14px}'+
'#mbk .mbk-msg:empty{display:none}'+
'#mbk.land .mbk-in{max-width:none;display:grid;grid-template-columns:minmax(0,1fr) auto;column-gap:10px;row-gap:6px;align-items:center}'+
'#mbk.land .mbk-top{grid-column:2;grid-row:1}'+
'#mbk.land .mbk-top span{display:none}'+
'#mbk.land .mbk-f{grid-column:1;grid-row:1;min-height:42px;padding:4px 12px;font-size:20px}'+
'#mbk.land .mbk-msg,#mbk.land .mbk-k{grid-column:1/-1}'+
'#mbk.land .mbk-k{grid-template-columns:repeat(10,1fr);gap:5px}'+
'#mbk.land .mbk-k button{height:38px}'+

'#mbk.land{padding-top:6px;padding-bottom:calc(6px + env(safe-area-inset-bottom))}'+
'#mbk .mbk-msg.err{color:#C2410C}'+
'#mbk .mbk-msg.hint{color:#2F55D4}'+
'#mbk .mbk-k{display:grid;grid-template-columns:repeat(6,1fr);gap:6px}'+
'#mbk .mbk-k button{height:44px;border:0;border-radius:10px;background:#F3F4F6;color:#16181D;font:500 18px -apple-system,system-ui,sans-serif;cursor:pointer;touch-action:manipulation;padding:0}'+
'#mbk .mbk-k button:active{background:#E3E5E9}'+
'#mbk .mbk-k .v{font:italic 21px "Times New Roman",Georgia,serif}'+
'#mbk .mbk-k .n{color:#6B717C}'+
'#mbk .mbk-k .fn{font-size:15px}'+
'#mbk .mbk-k .go{grid-column:span 2;background:#16181D;color:#fff;font-weight:600;font-size:16px}'+
'#mbk-open{position:fixed;left:0;top:0;transform-origin:0 0;z-index:2147483000;border:0;border-radius:12px;background:#16181D;color:#fff;font:600 15px -apple-system,system-ui,sans-serif;padding:12px 16px;cursor:pointer}'+
'';
D.head.appendChild(st);

var K=[
 ['7','c','7'],['8','c','8'],['9','c','9'],['+','c','+'],['−','c','-'],['⌫','back','','n'],
 ['4','c','4'],['5','c','5'],['6','c','6'],['·','c','\\cdot'],['( )','paren',''],['←','left','','n'],
 ['1','c','1'],['2','c','2'],['3','c','3'],[VAR,'c',VAR,'v'],['a/b','frac',''],['→','right','','n'],
 ['0','c','0'],[',','c',','],['e<sup>□</sup>','exp',''],['□<sup>□</sup>','pow',''],['√','fn','wu'],['π','c','π'],
 ['sin','fn','sin','fn'],['cos','fn','cos','fn'],['ln','fn','ln','fn'],['C','clear','','n'],['Lösen','go','','go']
];
var P=D.createElement('div'); P.id='mbk';
P.innerHTML='<div class="mbk-in"><div class="mbk-top"><span>Tastenfeld für Mathebattle</span><button type="button" data-a="hide">Ausblenden</button></div>'+
 '<div class="mbk-f"><span class="mbk-pre"></span><span class="mbk-out"></span></div>'+
 '<div class="mbk-msg" aria-live="polite"></div><div class="mbk-k"></div></div>';
var KB=P.querySelector('.mbk-k');
var BTN={};
K.forEach(function(k,ix){
  var b=D.createElement('button'); b.type='button'; b.innerHTML=k[0]; BTN[ix]=b;
  b.dataset.a=k[1]; b.dataset.v=k[2]; if(k[3]) b.className=k[3];
  if(k[1]==='clear') b.setAttribute('aria-label','Alles löschen');
  if(k[1]==='back') b.setAttribute('aria-label','Löschen');
  KB.appendChild(b);
});
/* Reihenfolge im Querformat: drei Reihen zu je zehn Tasten */
var LAND=[0,1,2,3,4,9,10,11,17,5, 6,7,8,15,16,20,21,22,23,27, 12,13,14,18,19,24,25,26,28];
var PORT=K.map(function(_,i){ return i; });
var layout='';
function arrange(land){
  var key=land?'l':'p'; if(key===layout) return; layout=key;
  (land?LAND:PORT).forEach(function(i){ KB.appendChild(BTN[i]); });
}
function prefix(){
  var pre=/([a-zA-Z]'*\([a-z]\)\s*=)\s*$/.exec((inp.previousSibling||{}).textContent||'');
  P.querySelector('.mbk-pre').textContent = pre ? pre[1].replace(/'/g,'′') : '=';
}
prefix();
var OUT=P.querySelector('.mbk-out'), MSG=P.querySelector('.mbk-msg');
var OPEN=D.createElement('button'); OPEN.id='mbk-open'; OPEN.type='button'; OPEN.textContent='Tastenfeld'; OPEN.hidden=true;
D.body.appendChild(P); D.body.appendChild(OPEN);
var spacer=D.createElement('div'); D.body.appendChild(spacer);
[P,OPEN,spacer,st].forEach(function(n){ n.setAttribute('data-mbk','1'); });
/* Das Tastenfeld liegt immer am unteren Rand des sichtbaren Ausschnitts und behält seine Größe,
   egal wie stark Safari die Seite verkleinert oder wie weit man hineinzoomt. */
var fitQueued=false;
function pad(){ fit(); }
function fit(){
  var vv=W.visualViewport, s=(vv&&vv.scale)||1, w=vv?vv.width:W.innerWidth, h=vv?vv.height:W.innerHeight,
      ox=vv?vv.offsetLeft:0, oy=vv?vv.offsetTop:0, k=1/s;
  var land=w>h*1.25;
  P.classList.toggle('land',land); arrange(land);
  P.style.width=(w*s)+'px';
  var ph=P.hidden?0:P.offsetHeight;
  P.style.transform='translate('+ox+'px,'+(oy+h-ph*k)+'px) scale('+k+')';
  if(!OPEN.hidden){ var ow=OPEN.offsetWidth, oh=OPEN.offsetHeight;
    OPEN.style.transform='translate('+(ox+w-(ow+16)*k)+'px,'+(oy+h-(oh+20)*k)+'px) scale('+k+')'; }
  spacer.style.height=(P.hidden?0:Math.round(ph*k+20))+'px';
}
function queueFit(){ if(fitQueued) return; fitQueued=true; requestAnimationFrame(function(){ fitQueued=false; fit(); }); }
if(W.visualViewport){ W.visualViewport.addEventListener('resize',queueFit); W.visualViewport.addEventListener('scroll',queueFit); }
W.addEventListener('resize',queueFit); W.addEventListener('scroll',queueFit); W.addEventListener('orientationchange',function(){ setTimeout(fit,300); });

function prep(){ inp.setAttribute('inputmode','none'); inp.setAttribute('readonly','readonly'); }
prep();

var timer=null;
function sync(now){
  inp.value=txt(root);
  clearTimeout(timer);
  var run=function(){ try{ if(typeof W.term_check==='function') W.term_check(VAR,{keyCode:0}); }catch(e){} };
  if(now) run(); else timer=setTimeout(run,300);
}
function msg(t,kind){ MSG.textContent=t||''; MSG.className='mbk-msg'+(kind==='hint'?' hint':kind?' err':''); pad(); }
function render(){ OUT.innerHTML=html(root,true)||'<span class="mbk-c"></span>'; pad(); }

/* ================= Prüfung bei Ableitungsaufgaben =================
   Bis zu MAX_TRIES Versuche: Falsche Antworten werden vorher abgefangen, erst der letzte Versuch geht ungeprüft an Mathebattle.
   Richtige, aber nicht vereinfachte Antworten bekommen einen Hinweis und kosten keinen Versuch. */
var MAX_TRIES=3;
var FUNCS={sin:Math.sin,cos:Math.cos,tan:Math.tan,ln:Math.log,lg:Math.log10,log:Math.log10,wu:Math.sqrt,sqrt:Math.sqrt,exp:Math.exp};
function tokens(s){
  var out=[], i=0, m;
  s=s.replace(/[−–]/g,'-').replace(/[·⋅×]/g,'*').replace(/π/g,'pi').replace(/÷|:/g,'/');
  while(i<s.length){
    var c=s[i];
    if(/\s/.test(c)){ i++; continue; }
    if((m=/^\d+(?:[.,]\d+)?|^[.,]\d+/.exec(s.slice(i)))){ out.push({t:'n', v:parseFloat(m[0].replace(',','.')), s:m[0]}); i+=m[0].length; continue; }
    if(/[a-zA-Z]/.test(c)){
      var rest=s.slice(i), hit=null;
      ['sqrt','sin','cos','tan','exp','log','ln','lg','wu','pi'].some(function(f){ if(rest.indexOf(f)===0){ hit=f; return true; } return false; });
      if(hit){ out.push(hit==='pi' ? {t:'c', v:'pi'} : {t:'f', v:hit}); i+=hit.length; continue; }
      out.push({t:'i', v:c}); i++; continue;
    }
    if('+-*/^()'.indexOf(c)>=0){ out.push({t:c}); i++; continue; }
    if(c==='['){ out.push({t:'('}); i++; continue; }
    if(c===']'){ out.push({t:')'}); i++; continue; }
    throw new Error('Zeichen '+c);
  }
  return out;
}
/* Ausdrucksbaum: num, var, con(e/pi), add{items:[{s,n}]}, mul{fs}, div{a,b}, pow{b,e}, fn{f,a}, neg{a}; grp=true bei Klammern */
function parseExpr(s, v){
  var T=tokens(s), p=0;
  function peek(){ return T[p]; }
  function startsAtom(t){ return t && (t.t==='n'||t.t==='i'||t.t==='c'||t.t==='f'||t.t==='('); }
  function expr(){
    var items=[], s=1;
    if(peek() && (peek().t==='+'||peek().t==='-')){ s=peek().t==='-'?-1:1; p++; }
    items.push({s:s, n:term()});
    while(peek() && (peek().t==='+'||peek().t==='-')){ var sg=peek().t==='-'?-1:1; p++; items.push({s:sg, n:term()}); }
    if(items.length===1) return items[0].s<0 ? {t:'neg', a:items[0].n} : items[0].n;
    return {t:'add', items:items};
  }
  function term(){
    var n=unary(), fs=[n];
    for(;;){
      var t=peek();
      if(t && t.t==='*'){ p++; fs.push(unary()); }
      else if(t && t.t==='/'){ p++; var d=unary(); var a=fs.length===1?fs[0]:{t:'mul',fs:fs}; fs=[{t:'div',a:a,b:d}]; }
      else if(startsAtom(t)){ fs.push(pow()); }
      else break;
    }
    return fs.length===1 ? fs[0] : {t:'mul', fs:fs};
  }
  function unary(){
    var t=peek();
    if(t && t.t==='-'){ p++; return {t:'neg', a:unary()}; }
    if(t && t.t==='+'){ p++; return unary(); }
    return pow();
  }
  function pow(){
    var b=atom();
    if(peek() && peek().t==='^'){ p++; return {t:'pow', b:b, e:unary()}; }
    return b;
  }
  function atom(){
    var t=T[p++];
    if(!t) throw new Error('Ende');
    if(t.t==='n') return {t:'num', v:t.v, s:t.s};
    if(t.t==='c') return {t:'con', v:t.v};
    if(t.t==='i'){ if(t.v===v) return {t:'var'}; if(t.v==='e') return {t:'con', v:'e'}; throw new Error('Unbekannt '+t.v); }
    if(t.t==='f'){ var a=(peek()&&peek().t==='(') ? atom() : pow(); return {t:'fn', f:t.v, a:a}; }
    if(t.t==='('){ var n=expr(); if(!peek()||peek().t!==')') throw new Error('Klammer'); p++; n.grp=true; return n; }
    throw new Error('Unerwartet');
  }
  var r=expr();
  if(p!==T.length) throw new Error('Rest');
  return r;
}
function ev(n,x){
  switch(n.t){
    case 'num': return n.v;
    case 'var': return x;
    case 'con': return n.v==='e'?Math.E:Math.PI;
    case 'neg': return -ev(n.a,x);
    case 'add': return n.items.reduce(function(s,it){ return s+it.s*ev(it.n,x); },0);
    case 'mul': return n.fs.reduce(function(s,f){ return s*ev(f,x); },1);
    case 'div': return ev(n.a,x)/ev(n.b,x);
    case 'pow': return (n.b.t==='con'&&n.b.v==='e') ? Math.exp(ev(n.e,x)) : Math.pow(ev(n.b,x), ev(n.e,x));
    case 'fn': return FUNCS[n.f](ev(n.a,x));
  }
  return NaN;
}
var PTS=[-2.3,-1.9,-1.45,-1.1,-0.7,-0.35,0.15,0.45,0.85,1.2,1.55,1.95,2.35];
function deriv(f,x){
  var h=1e-3*(1+Math.abs(x)), D=function(h){ return (ev(f,x+h)-ev(f,x-h))/(2*h); };
  return (4*D(h/2)-D(h))/3;
}
var close=function(a,b){ return Math.abs(a-b)<=1e-6*Math.max(1,Math.abs(a),Math.abs(b)); };
function judge(f,g){
  var P=[];
  PTS.forEach(function(x){ var fv=ev(f,x), d=deriv(f,x), gv=ev(g,x); if(isFinite(fv)&&isFinite(d)&&isFinite(gv)) P.push({f:fv,d:d,g:gv}); });
  if(P.length<3) return {kind:'nan'};
  if(P.every(function(q){ return close(q.g,q.d); })) return {kind:'ok'};
  var m='Das stimmt noch nicht.';
  if(P.every(function(q){ return close(q.g,-q.d); })) m='Das stimmt noch nicht. Bis auf das Vorzeichen passt es, prüf die Minuszeichen.';
  else if(P.every(function(q){ return close(q.g,q.f); })) m='Das ist noch f(x) selbst. Leite den Term ab.';
  else { var R=P.filter(function(q){ return Math.abs(q.d)>1e-9; }).map(function(q){ return q.g/q.d; });
    if(R.length>=3 && R.every(function(r){ return close(r,R[0]); }) && !close(R[0],0)) m='Das stimmt noch nicht. Ein Faktor fehlt oder ist zu viel. Hast du an die innere Ableitung gedacht?'; }
  return {kind:'wrong', msg:m};
}

/* Vereinfacht? Liefert '' oder einen Grund */
function isInt(n){ return n.t==='num' && Number.isInteger(n.v); }
function numLit(n){ if(n.t==='num') return true; if(n.t==='neg') return numLit(n.a); if(n.t==='div') return isInt(n.a)&&isInt(n.b); return false; }
function hasVar(n){ return n.t==='var' || ['neg','fn'].indexOf(n.t)>=0&&hasVar(n.a) || n.t==='add'&&n.items.some(function(i){ return hasVar(i.n); }) || n.t==='mul'&&n.fs.some(hasVar) || n.t==='div'&&(hasVar(n.a)||hasVar(n.b)) || n.t==='pow'&&(hasVar(n.b)||hasVar(n.e)); }
function hasCon(n){ return n.t==='con' || ['neg','fn'].indexOf(n.t)>=0&&hasCon(n.a) || n.t==='add'&&n.items.some(function(i){ return hasCon(i.n); }) || n.t==='mul'&&n.fs.some(hasCon) || n.t==='div'&&(hasCon(n.a)||hasCon(n.b)) || n.t==='pow'&&(hasCon(n.b)||hasCon(n.e)); }
function gcd(a,b){ a=Math.abs(a); b=Math.abs(b); while(b){ var t=a%b; a=b; b=t; } return a; }
function flatFactors(n){
  var out=[], neg=0;
  (function walk(m){
    if(m.t==='neg'){ neg++; walk(m.a); }
    else if(m.t==='mul'){ m.fs.forEach(walk); }
    else out.push(m);
  })(n);
  return {fs:out, neg:neg};
}
var FP=[-1.3,0.4,1.7];
function fp(n){ return FP.map(function(x){ var v=ev(n,x); return isFinite(v)?v.toPrecision(10):'NaN'; }).join('|'); }
function isE(n){ return n.t==='pow' && n.b.t==='con' && n.b.v==='e' || n.t==='fn' && n.f==='exp'; }
function eExp(n){ return n.t==='pow' ? n.e : n.a; }
function simp(n){
  var r='';
  function bad(x){ if(!r) r=x; }
  (function walk(m){
    if(r) return;
    if(!hasVar(m) && !hasCon(m) && !numLit(m) && m.t!=='fn'){ bad('multiply'); return; }
    switch(m.t){
      case 'num': return;
      case 'div':
        if(isInt(m.a)&&isInt(m.b)){ if(m.b.v===1 || gcd(m.a.v,m.b.v)>1 || m.a.v===0) bad('reduce'); return; }
        if(m.b.t==='num' && m.b.v===1) bad('neutral');
        walk(m.a); walk(m.b); return;
      case 'neg': if(m.a.t==='neg') bad('multiply'); walk(m.a); return;
      case 'pow':
        if(m.e.t==='num' && (m.e.v===1||m.e.v===0)) bad('neutral');
        walk(m.b); walk(m.e); return;
      case 'fn': walk(m.a); return;
      case 'mul': {
        var F=flatFactors(m).fs, nums=F.filter(numLit);
        if(nums.length>1) bad('multiply');
        if(nums.some(function(q){ return q.t==='num' && (q.v===1||q.v===0); })) bad('neutral');
        var bases={};
        F.forEach(function(q){ if(numLit(q)) return; var b=isE(q)?'e':fp(q.t==='pow'?q.b:q); if(bases[b]) bad('combinePow'); bases[b]=1; });
        F.forEach(walk); return; }
      case 'add': {
        var keys={}, eKeys={};
        m.items.forEach(function(it){
          var n0=it.n, F=flatFactors(n0).fs, rest=F.filter(function(q){ return !numLit(q); });
          if(n0.t==='num' && n0.v===0) bad('neutral');
          var key=rest.length ? fp(rest.length===1?rest[0]:{t:'mul',fs:rest}) : 'C';
          if(keys[key]) bad('combine'); keys[key]=1;
          var seen={};
          rest.forEach(function(q){ if(isE(q)){ var k=fp(eExp(q)); if(!seen[k]){ seen[k]=1; eKeys[k]=(eKeys[k]||0)+1; } } });
          walk(n0);
        });
        Object.keys(eKeys).forEach(function(k){ if(eKeys[k]>1) bad('factorE'); });
        return; }
    }
  })(n);
  return r;
}
var HINTS={
  multiply:'Richtig abgeleitet. Rechne jetzt noch die Zahlen aus.',
  reduce:'Richtig abgeleitet. Kürze noch den Bruch.',
  neutral:'Richtig abgeleitet. Lass Faktoren 1, Summanden 0 und Hochzahlen 1 weg.',
  combinePow:'Richtig abgeleitet. Fasse gleiche Faktoren zu einer Potenz zusammen.',
  combine:'Richtig abgeleitet. Fasse noch gleichartige Terme zusammen.',
  factorE:'Richtig abgeleitet. Klammere jetzt noch den e-Term aus.'
};

/* Aufgabe von der Seite lesen: MathML aus MathJax, in Text umwandeln, rechte Seite nach "=" nehmen */
function mmlText(node){
  if(node.nodeType===3) return '';
  var tag=(node.localName||'').toLowerCase(), kids=Array.prototype.slice.call(node.childNodes).filter(function(c){ return c.nodeType===1; });
  var txt=(node.textContent||'').trim(), all=function(){ return kids.map(mmlText).join(' '); };
  switch(tag){
    case 'mn': return ' '+txt+' ';
    case 'mi': if(/^[⋅·×]$/.test(txt)) return '*'; return ' '+txt+' ';
    case 'mo': if(/^[−\-]$/.test(txt)) return '-'; if(/^[⋅·×*]$/.test(txt)) return '*'; if(/^[÷:\/]$/.test(txt)) return '/';
      if(/^[+=()\[\]]$/.test(txt)) return txt; if(txt==='⁢') return '*'; return ' ';
    case 'mtext': return ' '+txt+' ';
    case 'msup': return '('+mmlText(kids[0])+')^('+mmlText(kids[1])+')';
    case 'msub': return mmlText(kids[0]);
    case 'mfrac': return '(('+mmlText(kids[0])+')/('+mmlText(kids[1])+'))';
    case 'msqrt': return 'wu('+all()+')';
    case 'mroot': return '(('+mmlText(kids[0])+')^(1/('+mmlText(kids[1])+')))';
    case 'mfenced': return '('+all()+')';
    case 'semantics': return kids.length?mmlText(kids[0]):'';
    case 'annotation': case 'annotation-xml': case 'mphantom': return '';
    default: return all();
  }
}
function taskF(){
  var q=D.querySelector('.exercise_question'), MJ=W.MathJax;
  if(!q || !MJ || !MJ.startup || !MJ.startup.document) return null;
  var text=q.textContent||'';
  if(!/Ableitung/.test(text) || /\d+\s*-?\s*te\s+Ableitung|zweite|dritte|höhere/i.test(text)) return null;
  if(!/^f'\(/.test(((inp.previousSibling||{}).textContent||'').trim())) return null;
  var parts=[];
  try{
    var list=MJ.startup.document.math, arr=[];
    if(list && typeof list[Symbol.iterator]==='function'){ for(var it of list) arr.push(it); }
    arr.forEach(function(it){
      var r=it.typesetRoot; if(!r || !q.contains(r)) return;
      var s=null; try{ s=MJ.startup.toMML(it.root); }catch(e){}
      if(!s && typeof it.math==='string') s=it.math;
      if(s){ var dn=new DOMParser().parseFromString(s.replace(/xmlns="[^"]*"/,''),'text/html').querySelector('math'); if(dn) parts.push(mmlText(dn)); }
    });
  }catch(e){ return null; }
  var all=parts.join(' '), i=all.lastIndexOf('=');
  if(i<0) return null;
  try{ return parseExpr(all.slice(i+1), VAR); }catch(e){ return null; }
}
/* Die Aufgabe wird einmal gelesen und gemerkt. Mathebattle setzt bei jeder Vorschau die Formeldarstellung neu auf,
   danach ist sie kurz nicht lesbar. */
var TASK=null;
function currentTask(){
  var key=(inp && inp.form && inp.form.action)||location.href;
  if(TASK && TASK.key===key) return TASK.f;
  var f=taskF(); if(f) TASK={key:key, f:f};
  return f;
}
function triesKey(){ return 'mbk-tries:'+((inp && inp.form && inp.form.action)||location.pathname); }
function getTries(){ try{ return +localStorage.getItem(triesKey())||0; }catch(e){ return 0; } }
function setTries(n){ try{ localStorage.setItem(triesKey(), String(n)); }catch(e){} }
var LABEL=P.querySelector('.mbk-top span');
var labelTimer=null;
function label(tries){
  var f=inp && currentTask();
  clearTimeout(labelTimer);
  tries=tries||0;
  var q=D.querySelector('.exercise_question');
  if(inp && !f && tries<20 && q && /Ableitung/.test(q.textContent||'')) labelTimer=setTimeout(function(){ label(tries+1); },300);
  LABEL.textContent = f && MAX_TRIES>1 ? 'Ableitung · Versuch '+Math.min(MAX_TRIES,getTries()+1)+' von '+MAX_TRIES : 'Tastenfeld für Mathebattle';
}
var bypass=false;
/* Gehört dieses Formular zur Antwort? */
function isAnswerForm(f){ return !!(inp && f && (f===inp.form || (f.contains && f.contains(inp)) || (f.elements && f.elements.namedItem && f.elements.namedItem(inp.name||'term')))); }
/* Alle Wege zum Abschicken abfangen: form_submit, form.submit(), Submit-Button und Ajax-Anfragen mit der Antwort */
function hookAll(){
  if(typeof W.form_submit==='function' && !W.form_submit.__mbk){
    var of=W.form_submit;
    W.form_submit=function(){ if(!bypass && inp && !guard()) return; var b=bypass; bypass=true; try{ return of.apply(this, arguments); } finally{ bypass=b; } };
    W.form_submit.__mbk=1;
  }
  var $j=W.jQuery;
  if($j && $j.ajax && !$j.ajax.__mbk){
    var oa=$j.ajax;
    $j.ajax=function(u,o){
      var opt=typeof u==='object'?u:(o||{}), url=(typeof u==='string'?u:opt.url)||'', type=String(opt.type||opt.method||'GET').toUpperCase();
      if(!bypass && inp && inp.value && type==='POST' && !/show_term|show_para|highscore|help_need/i.test(url)){
        var d=opt.data, ds=typeof d==='string'?d:(d? ($j.param?$j.param(d):JSON.stringify(d)) : '');
        if(ds.indexOf(encodeURIComponent(inp.value))>=0 || ds.indexOf(inp.value)>=0){ if(!guard()) return $j.Deferred().promise(); }
      }
      return oa.apply(this, arguments);
    };
    $j.ajax.__mbk=1;
  }
}
function realSubmit(){
  bypass=true;
  try{ if(typeof W.form_submit==='function') W.form_submit(); else if(inp.form) inp.form.submit(); }
  finally{ bypass=false; }
}
/* Prüft die Eingabe im Mathebattle-Feld. true heißt: abschicken. */
function guard(){
  var nw=D.getElementById('no_wertung'); if(nw && nw.value==='1') return true;
  if(MAX_TRIES<2) return true;
  var f=currentTask(); if(!f) return true;
  var g; try{ g=parseExpr(inp.value, VAR); }catch(e){ return true; }
  var res=judge(f,g);
  if(res.kind==='ok'){ var s=simp(g); if(s){ msg(HINTS[s],'hint'); return false; } return true; }
  if(res.kind!=='wrong') return true;
  var n=getTries();
  if(n>=MAX_TRIES-1) return true;
  n++; setTries(n); label();
  var left=MAX_TRIES-n;
  msg(res.msg+' '+(left===1 ? 'Noch 1 Versuch, dann wertet Mathebattle direkt.' : 'Noch '+left+' Versuche.'), true);
  if(P.hidden) toggle();
  return false;
}

function go(){
  if(!root.items.length){ msg('Tippe zuerst deinen Term ein.',true); return; }
  if(!complete(root)){ msg('Der Term ist noch unvollständig. Fülle alle leeren Kästchen aus.',true); return; }
  sync(true); msg('Wird geprüft …');
  var t0=Date.now();
  (function wait(){
    var busy=W.jQuery && W.jQuery.active>0;
    if(busy && Date.now()-t0<4000){ setTimeout(wait,120); return; }
    var af=D.getElementById('as_function'), bl=D.getElementById('bloesen');
    var bad=!af || /Fehler/.test(af.textContent) || (af.innerHTML.indexOf('FF0000')>=0) || (bl && getComputedStyle(bl).display==='none');
    if(bad){ msg('Mathebattle kann den Term so nicht lesen. Prüfe Klammern und Rechenzeichen.',true); return; }
    msg('');
    if(guard()) realSubmit();
  })();
}
function act(a,v){
  msg('');
  if(a==='c') typeC(v);
  else if(a==='paren') typeN('paren');
  else if(a==='frac') typeN('frac');
  else if(a==='pow') typeN('pow');
  else if(a==='exp'){ typeC('e'); typeN('pow'); }
  else if(a==='fn') typeN('fn',v);
  else if(a==='left') left();
  else if(a==='right') right();
  else if(a==='back') back();
  else if(a==='clear') clearAll();
  else if(a==='go'){ go(); return; }
  else if(a==='hide'){ toggle(); return; }
  render(); sync(false);
}
P.addEventListener('click',function(e){ var b=e.target.closest('button'); if(b && P.contains(b)) act(b.dataset.a,b.dataset.v); });
OPEN.addEventListener('click',function(){ toggle(); });
var userHidden=false;
function toggle(){
  if(!inp) return;
  P.hidden=!P.hidden; OPEN.hidden=!P.hidden; userHidden=P.hidden;
  if(P.hidden){ inp.removeAttribute('readonly'); inp.removeAttribute('inputmode'); }
  else { prep(); clearAll(); render(); inp.value=''; sync(true); }
  pad();
}

/* ---------- Seitenwechsel ohne Neuladen, damit das Tastenfeld bleibt ---------- */
var origSubmit=HTMLFormElement.prototype.submit, busy=false;
function sameOrigin(u){ try{ return new URL(u, location.href).origin===location.origin; }catch(e){ return false; } }
function hard(url, form){ if(form) origSubmit.call(form); else location.href=url; }
function load(url, opts, form, push){
  if(busy) return; busy=true;
  D.documentElement.style.cursor='progress'; msg('Lädt …');
  fetch(url, Object.assign({credentials:'same-origin'}, opts||{})).then(function(r){
    var ct=r.headers.get('content-type')||'';
    if(!r.ok || ct.indexOf('text/html')<0) throw new Error('kein HTML');
    return r.text().then(function(t){ return {html:t, url:r.url, post:!!(opts && opts.method==='POST') && !r.redirected}; });
  }).then(function(res){
    swap(res.html);
    if(push!==false && !res.post) history.pushState({mbk:1}, '', res.url);
    W.scrollTo(0,0);
  }).catch(function(){ busy=false; hard(url, form); return; }).then(function(){
    busy=false; D.documentElement.style.cursor='';
  });
}
function swap(html){
  var nd=new DOMParser().parseFromString(html, 'text/html');
  D.title=nd.title;
  var have={};
  D.querySelectorAll('link[rel=stylesheet]').forEach(function(l){ have[l.href]=1; });
  nd.querySelectorAll('link[rel=stylesheet]').forEach(function(l){ if(!have[l.href]) D.head.appendChild(D.importNode(l,true)); });
  Array.prototype.slice.call(D.body.childNodes).forEach(function(n){ if(!(n.nodeType===1 && n.hasAttribute('data-mbk'))) n.remove(); });
  var loaded={};
  D.querySelectorAll('script[src]').forEach(function(s){ loaded[s.src]=1; });
  Array.prototype.slice.call(nd.body.childNodes).forEach(function(n){ D.body.insertBefore(D.importNode(n,true), P); });
  D.body.className=nd.body.className;
  /* Skripte der neuen Seite ausführen */
  Array.prototype.slice.call(D.body.querySelectorAll('script')).forEach(function(old){
    if(old.closest('[data-mbk]')) return;
    if(old.src && loaded[old.src]){ old.remove(); return; }
    var s=D.createElement('script');
    Array.prototype.forEach.call(old.attributes, function(a){ s.setAttribute(a.name, a.value); });
    if(!old.src) s.textContent=old.textContent;
    old.parentNode.replaceChild(s, old);
  });
  attach();
  try{ if(W.MathJax && MathJax.typesetPromise){ if(MathJax.startup && MathJax.startup.document) MathJax.startup.document.clear(); MathJax.typesetPromise().then(function(){ label(); }); } }catch(e){}
}
function attach(){
  inp=D.getElementById('term_input'); TASK=null;
  msg('');
  if(!inp){ P.hidden=true; OPEN.hidden=true; pad(); return; }
  VAR=varOf(inp);
  var vb=BTN[15]; vb.innerHTML=VAR; vb.dataset.v=VAR;
  if(!userHidden) prep(); prefix(); clearAll(); render();
  P.hidden=userHidden; OPEN.hidden=!userHidden; pad();
  hookAll();
  if(W.MathJax && MathJax.startup && MathJax.startup.promise) MathJax.startup.promise.then(function(){ setTimeout(label,50); }); else label();
}
HTMLFormElement.prototype.submit=function(){
  var f=this, m=(f.method||'get').toLowerCase(), a=f.action||location.href;
  if(isAnswerForm(f) && !bypass && !guard()) return;
  if(!sameOrigin(a) || f.target){ return origSubmit.call(f); }
  W.onbeforeunload=null;
  if(m==='post') load(a, {method:'POST', body:new URLSearchParams(new FormData(f))}, f);
  else { var q=new URLSearchParams(new FormData(f)).toString(); load(a.split('?')[0]+(q?'?'+q:''), null, f); }
};
D.addEventListener('submit', function(e){
  var f=e.target; if(e.defaultPrevented || !f || f.target || !sameOrigin(f.action||location.href)) return;
  e.preventDefault();
  if(isAnswerForm(f) && !bypass && !guard()) return;
  var fd=new FormData(f); if(e.submitter && e.submitter.name) fd.append(e.submitter.name, e.submitter.value||'');
  if((f.method||'get').toLowerCase()==='post') load(f.action, {method:'POST', body:new URLSearchParams(fd)}, f);
  else load(f.action.split('?')[0]+'?'+new URLSearchParams(fd).toString(), null, f);
});
D.addEventListener('click', function(e){
  if(e.defaultPrevented || e.button!==0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
  var a=e.target.closest && e.target.closest('a[href]'); if(!a || a.closest('[data-mbk]')) return;
  var h=a.getAttribute('href')||'';
  if(!h || h[0]==='#' || /^javascript:/i.test(h) || a.target || a.hasAttribute('download') || !sameOrigin(a.href)) return;
  if(/logout|\.(pdf|png|jpe?g|zip)$/i.test(a.href)) return;
  e.preventDefault(); load(a.href);
});
W.addEventListener('popstate', function(){ load(location.href, null, null, false); });

D.addEventListener('keydown',function(e){
  if(P.hidden || e.metaKey || e.ctrlKey || e.altKey) return;
  if(!inp) return;
  var t=e.target; if(t && t!==inp && (t.tagName==='INPUT'||t.tagName==='TEXTAREA')) return;
  var k=e.key, map={'+':'+','-':'-','*':'\\cdot',',':',','.':','};
  map[VAR]=VAR;
  var a=null,v='';
  if(/^[0-9]$/.test(k)){ a='c'; v=k; }
  else if(map[k]){ a='c'; v=map[k]; }
  else if(k==='e'){ a='exp'; }
  else if(k==='^'){ a='pow'; }
  else if(k==='('){ a='paren'; }
  else if(k===')'){ a='right'; }
  else if(k==='/'){ a='frac'; }
  else if(k==='Backspace'){ a='back'; }
  else if(k==='ArrowLeft'){ a='left'; }
  else if(k==='ArrowRight'){ a='right'; }
  else if(k==='Enter'){ a='go'; }
  if(!a) return;
  e.preventDefault(); e.stopPropagation(); act(a,v);
},true);

W.__mbk={toggle:toggle, _t:{parseExpr:parseExpr, judge:judge, simp:simp, taskF:function(){ return taskF(); }, task:function(){ return currentTask(); }}};
render(); fit(); label(); hookAll();
})();
