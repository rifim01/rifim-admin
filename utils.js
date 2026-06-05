// ═══════════ RIFIM Admin — Utils ═══════════
const $ = id => document.getElementById(id);
const $$ = sel => [...document.querySelectorAll(sel)];
const st = (id,v) => { const e=$(id); if(e) e.textContent=v; };
const ls = { get:k=>{try{return JSON.parse(localStorage.getItem(k))}catch{return null}}, set:(k,v)=>{ try{localStorage.setItem(k,JSON.stringify(v))}catch{} }, del:k=>localStorage.removeItem(k) };

function rup(n){ if(n==null) return '—'; return 'Rp '+Number(n).toLocaleString('id-ID'); }
function tgl(s){ if(!s) return '—'; const MO=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des']; const d=new Date(s+'T12:00'); return d.getDate()+' '+MO[d.getMonth()]+' '+d.getFullYear(); }
function today(){ return new Date().toISOString().slice(0,10); }
function uid(){ return Date.now().toString(36)+Math.random().toString(36).slice(2,6); }

function al(idOrEl, msg, type='in'){
  const e = typeof idOrEl==='string' ? $(idOrEl) : idOrEl;
  if(!e) return;
  const m={ok:'alert-ok',er:'alert-er',in:'alert-in',wn:'alert-wn'};
  if(!msg){ e.classList.remove('show'); return; }
  e.className='alert '+(m[type]||'alert-in')+' show'; e.textContent=msg;
}

function initRipple(){
  document.addEventListener('pointerdown', e=>{
    const h=e.target.closest('.rh'); if(!h) return;
    const r=h.getBoundingClientRect(), el=document.createElement('div');
    el.className='rpl-el';
    const sz=Math.max(r.width,r.height)*2.5;
    el.style.cssText=`width:${sz}px;height:${sz}px;left:${e.clientX-r.left-sz/2}px;top:${e.clientY-r.top-sz/2}px;`;
    h.appendChild(el); setTimeout(()=>el.remove(),650);
  });
}

function startClock(id){
  const u=()=>st(id, new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}));
  u(); setInterval(u,1000);
}

function exportPDF(title, html, landscape=true){
  const ap='<scri'+'pt>window.onload=()=>{window.print();window.close();}</scri'+'pt>';
  const pg=landscape?'A4 landscape':'A4';
  const doc=`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>${title}</title>
<style>body{font-family:Arial;padding:14px;font-size:10px;}h2{color:#C62828;margin-bottom:5px;}
p{color:#555;font-size:9px;margin-bottom:10px;}table{width:100%;border-collapse:collapse;}
th{background:#1e293b;color:#fff;padding:7px 10px;font-size:9px;text-align:left;}
td{padding:6px 10px;border-bottom:1px solid #e2e8f0;font-size:9px;}
@media print{@page{size:${pg};margin:8mm;}}</style></head>
<body><h2>${title}</h2><p>Dicetak: ${new Date().toLocaleString('id-ID')}</p>${html}${ap}</body></html>`;
  const w=window.open('','_blank'); if(w){w.document.write(doc);w.document.close();}
}

const CABANG = [
  'ID Rifim Airport Batam','ID Rifim Airport Jambi','ID Rifim Airport Balikpapan',
  'ID Rifim Airport Manado','ID Rifim Airport Pekanbaru','ID Rifim Batam','ID Rifim Jambi Luar'
];
const cabShort = c => c.replace('ID Rifim Airport ','✈ ').replace('ID Rifim ','🏢 ');
