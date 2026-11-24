/* Shared Desmos-style keypad + math helpers (needs math.js loaded first) */
window.MathPad=(()=>{
let sys=false,abc;
const norm=s=>s.replace(/[×·]/g,'*').replace(/÷/g,'/').replace(/[−–]/g,'-').replace(/π/g,'pi').replace(/√/g,'sqrt')
  .replace(/²/g,'^2').replace(/³/g,'^3').replace(/\blog\(/g,'log10(').replace(/\bln\(/g,'log(')
  .replace(/^\s*(y|z|f\([a-z,]*\))\s*=/,'');
// diff(expr) -> symbolic derivative w.r.t. x
const prep=s=>{s=norm(s);const m=s.match(/^\s*diff\((.*)\)\s*$/);return m?math.derivative(m[1],'x').toString():s};
const pretty=s=>s.replace(/\s?\^\s?2(?![\d.])/g,'²').replace(/\s?\^\s?3(?![\d.])/g,'³').replace(/\bpi\b/g,'π').replace(/ \* /g,'·');
const syms=(node,skip)=>{const s=new Set();node.traverse(n=>{if(n.isSymbolNode&&!skip.includes(n.name)&&!(n.name in math))s.add(n.name)});return [...s].sort()};
function sliders(box,names,params,cb){
  box.innerHTML='';
  names.forEach(n=>{
    params[n]??=1;
    const l=document.createElement('label'),b=document.createElement('b'),i=document.createElement('input');
    i.type='range';i.min=-10;i.max=10;i.step=.1;i.value=params[n];b.textContent=params[n];
    l.append(n+' = ',b,i);
    i.oninput=()=>{params[n]=+i.value;b.textContent=i.value;cb()};
    box.append(l);
  });
}
const field=i=>{i.classList.add('mi');i.inputMode=sys?'text':'none'};
const css=`#kp{position:fixed;left:0;right:0;bottom:0;z-index:50;background:var(--surface);border-top:1px solid var(--border);padding:.4rem;display:flex;gap:.4rem;user-select:none;-webkit-user-select:none}
#kp .g{display:grid;gap:.3rem;flex:4;grid-template-columns:repeat(4,1fr)}#kp .g.r{flex:2.3;grid-template-columns:1fr 1fr}
#kp button{padding:0;height:2.5rem;font-size:1.05rem;border-radius:7px;font-family:Georgia,serif}
#kp .n{background:var(--border)}#kp .w{grid-column:span 2}#kp .e{background:var(--accent);color:#0b0f19;border-color:var(--accent)}
#fp{position:fixed;left:.4rem;right:.4rem;z-index:51;max-height:45vh;overflow:auto;background:var(--surface);border:1px solid var(--border);border-radius:10px;padding:.6rem}
#fp .h{font-size:.75rem;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin:.4rem 0 .3rem}
#fp .fg{display:grid;grid-template-columns:repeat(3,1fr);gap:.3rem}#fp button{height:2.4rem;font-family:Georgia,serif;font-size:1rem}
#kt{position:fixed;right:.8rem;bottom:.8rem;z-index:40;width:3rem;height:3rem;border-radius:50%;background:var(--accent);color:#0b0f19;border:0;font-size:1.3rem}
[hidden]{display:none!important}`;
function attach(){
  document.head.insertAdjacentHTML('beforeend','<style>'+css+'</style>');
  let cur=null;
  const all=()=>document.querySelectorAll('input.mi');
  const div=c=>{const d=document.createElement('div');d.className=c;return d};
  const B=(l,fn,c='')=>{const b=document.createElement('button');b.textContent=l;b.className=c;b.onpointerdown=b.onmousedown=e=>e.preventDefault();b.onclick=fn;return b};
  const tgt=()=>cur&&document.contains(cur)?cur:(cur=document.querySelector('input.mi'));
  const ins=(t,back=0)=>{const c=tgt();if(!c)return;c.setRangeText(t,c.selectionStart,c.selectionEnd,'end');
    if(back){const p=c.selectionStart-back;c.setSelectionRange(p,p)}c.focus();c.dispatchEvent(new Event('input'))};
  const mv=d=>{const c=tgt();if(!c)return;const p=Math.max(0,c.selectionStart+d);c.setSelectionRange(p,p);c.focus()};
  const del=()=>{const c=tgt();if(!c)return;const s=c.selectionStart,e=c.selectionEnd;
    if(s!==e)c.setRangeText('',s,e,'end');else if(s>0)c.setRangeText('',s-1,s,'end');c.focus();c.dispatchEvent(new Event('input'))};
  const kp=div(''),fp=document.createElement('div'),tg=B('⌨',()=>show());
  kp.id='kp';fp.id='fp';tg.id='kt';kp.hidden=fp.hidden=true;
  const setSys=v=>{sys=v;abc.classList.toggle('e',v);all().forEach(i=>i.inputMode=v?'text':'none')};
  const refocus=()=>{if(cur){cur.blur();cur.focus()}};
  const hide=()=>{kp.hidden=fp.hidden=true;tg.hidden=false;document.body.style.paddingBottom=''};
  const show=()=>{setSys(false);kp.hidden=false;tg.hidden=true;document.body.style.paddingBottom=kp.offsetHeight+'px';refocus()};
  const L=[['x'],['y'],['a²','^2'],['aᵇ','^()',1],['('],[')'],['|a|','abs()',1],[','],['√','sqrt()',1],['π'],['e'],['a'],['sin','sin()',1],['cos','cos()',1],['tan','tan()',1],['ABC']];
  const M=['7','8','9','÷','4','5','6','×','1','2','3','−','0','.','=','+'];
  const g1=div('g'),g2=div('g'),g3=div('g r');
  abc=B('ABC',()=>{setSys(true);hide();refocus()});
  L.forEach(([l,t,b])=>g1.append(l==='ABC'?abc:B(l,()=>ins(t??l,b||0))));
  M.forEach(k=>g2.append(B(k,()=>ins(k),'n')));
  g3.append(B('funcs',()=>{fp.hidden=!fp.hidden;fp.style.bottom=kp.offsetHeight+6+'px'},'w n'),B('←',()=>mv(-1),'n'),B('→',()=>mv(1),'n'),
    B('⌫',del,'w n'),B('↵',()=>{hide();cur&&cur.blur()},'w e'));
  const F={Trig:['sin','cos','tan','asin','acos','atan'],Hyperbolic:['sinh','cosh','tanh'],Calculus:['exp','ln','log','diff'],Other:['abs','sqrt','floor','ceil','round','sign','max','min','mod']};
  Object.entries(F).forEach(([k,v])=>{const h=div('h');h.textContent=k;const g=div('fg');
    v.forEach(n=>g.append(B(n,()=>{ins(n+'()',1);fp.hidden=true})));fp.append(h,g)});
  kp.append(g1,g2,g3);document.body.append(kp,fp,tg);
  document.addEventListener('focusin',e=>{if(e.target.matches('input.mi')){cur=e.target;if(matchMedia('(pointer:coarse)').matches&&!sys&&kp.hidden)show()}});
}
return{norm,prep,pretty,syms,sliders,field,attach};
})();
