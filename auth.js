// ═══════════ RIFIM Admin — Auth ═══════════
const Auth = {
  USERS: [
    {nama:'Nabilla',        pw:'rifim2024', jabatan:'Admin Editor',   role:'editor'},
    {nama:'Govinda',        pw:'rifim2024', jabatan:'Admin',           role:'admin'},
    {nama:'febriany sandra',pw:'rifim2024', jabatan:'Admin',           role:'admin'},
    {nama:'Owner / Bobby',  pw:'owner2024', jabatan:'Direktur Utama', role:'owner'},
  ],
  current: null,
  canEdit(){ return this.current && (this.current.role==='owner'||this.current.role==='editor'); },
  isOwner(){ return this.current?.role==='owner'; },

  load(){
    const s = ls.get('_ra_u');
    if(s){ const u=this.USERS.find(x=>x.nama===s); if(u){this.current=u;return true;} }
    return false;
  },
  login(nama,pw){
    const u=this.USERS.find(x=>x.nama===nama&&x.pw===pw);
    if(!u) return false;
    this.current=u; ls.set('_ra_u',u.nama); return true;
  },
  logout(){ this.current=null; ls.del('_ra_u'); },

  populateSel(id){
    const el=$(id); if(!el) return;
    el.innerHTML='<option value="">— Pilih nama —</option>';
    this.USERS.forEach(u=>{ const o=document.createElement('option'); o.value=u.nama; o.textContent=`${u.nama} (${u.jabatan})`; el.appendChild(o); });
    el.value='';
  },

  updateAccess(){
    const ok=this.canEdit();
    $$('[data-access]').forEach(el=>{
      const need=el.dataset.access;
      el.style.display=(need==='editor'?ok:need==='owner'?this.isOwner():true)?'':'none';
    });
  }
};
