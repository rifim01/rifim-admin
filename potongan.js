// ═══════════ RIFIM Admin — Database Potongan ═══════════
const Potongan = {
  data: [],
  drivers: [],

  // ── Rumus potongan sesuai spreadsheet ──────────────
  hitung(cabang, price, waktuOrder, isMaxim, jenisTarif){
    const p = Number(price)||0;
    // Parse jam dari waktu order (HH:MM atau HH:MM:SS)
    let jam=0;
    const m=(waktuOrder||'').match(/(\d{1,2}):(\d{2})/);
    if(m) jam=parseInt(m[1])+parseInt(m[2])/60;

    let pot=0;
    if(cabang==='ID Rifim Airport Balikpapan'){
      pot=25000;
    }
    else if(cabang==='ID Rifim Airport Batam'){
      const siang=jam>=7.0&&jam<=18.5;
      pot=siang?(p>=70000?30000:20000):(p>=70000?25000:20000);
      if(isMaxim) pot+=Math.round(p*0.12);
    }
    else if(cabang==='ID Rifim Airport Manado'){
      pot=25000;
      if(isMaxim) pot+=Math.round(p*0.12);
    }
    else if(cabang==='ID Rifim Airport Pekanbaru'||cabang==='ID Rifim Pekanbaru'){
      const f=Number(jenisTarif)||1;
      if(f===1) pot=35000;
      else if(f===3) pot=20000;
      else if(f===2) pot=35000+Math.round((p-p)*0.12);
    }
    else if(cabang==='ID Rifim Airport Jambi'){
      const isP=(String(jenisTarif).toLowerCase()==='p');
      pot=p<70000?25000:(isP?35000:25000);
      if(isMaxim) pot+=Math.round(p*0.12);
    }
    return pot;
  },

  // ── Init ──────────────────────────────────────────
  init(){
    this.buildForm();
    this.loadFromLS();
    this.renderTable();
    this.loadDrivers();
  },

  buildForm(){
    const cs=$('pot-cabang'); if(!cs||cs.options.length>1) return;
    cs.innerHTML='<option value="">— Pilih Cabang —</option>';
    CABANG.forEach(c=>{ const o=document.createElement('option'); o.value=c; o.textContent=cabShort(c); cs.appendChild(o); });
  },

  async loadDrivers(){
    try{
      this.drivers=await API.sheet(API.SAL,'DB_DRIVER');
      this.buildDriverSel();
    }catch(e){ console.warn('Driver:',e.message); }
  },

  buildDriverSel(){
    const sel=$('pot-driver'); if(!sel) return;
    sel.innerHTML='<option value="">— Pilih Driver (opsional) —</option>';
    this.drivers.forEach(d=>{
      const keys=Object.keys(d);
      const id=d[keys[0]]||''; const nama=d[keys[1]]||''; const cab=d[keys[2]]||d[keys[3]]||'';
      const o=document.createElement('option'); o.value=JSON.stringify({id,nama,cabang:cab}); o.textContent=`${id} — ${nama}`; sel.appendChild(o);
    });
  },

  onDriverChange(){
    const sel=$('pot-driver'); if(!sel||!sel.value) return;
    try{
      const d=JSON.parse(sel.value);
      if(d.cabang){ const c=$('pot-cabang'); if(c) c.value=d.cabang; }
      this.preview();
    }catch{}
  },

  preview(){
    const price=Number($('pot-price')?.value)||0;
    const waktu=$('pot-waktu')?.value||'';
    const cabang=$('pot-cabang')?.value||'';
    const maxim=$('pot-maxim')?.checked||false;
    const tarif=$('pot-tarif')?.value||1;
    const pb=$('pot-pvbox'); if(!pb) return;
    if(!price||!cabang){ pb.style.display='none'; return; }
    const pot=this.hitung(cabang,price,waktu,maxim,tarif);
    st('pvPrice', rup(price)); st('pvPot', rup(pot)); st('pvNet', rup(price-pot));
    pb.style.display='block';
    App.updateDashStats();
  },

  addEntry(){
    const loginId=$('pot-loginid')?.value?.trim();
    const price=Number($('pot-price')?.value)||0;
    const waktu=$('pot-waktu')?.value||'';
    const cabang=$('pot-cabang')?.value||'';
    const maxim=$('pot-maxim')?.checked||false;
    const tarif=$('pot-tarif')?.value||1;
    const status=$('pot-status')?.value||'Pending';
    let drvId='',drvNama='';
    const drvSel=$('pot-driver');
    if(drvSel?.value){ try{ const d=JSON.parse(drvSel.value); drvId=d.id; drvNama=d.nama; }catch{} }

    if(!loginId){ al('pot-al','⚠️ Isi Login ID!','wn'); return; }
    if(!price){   al('pot-al','⚠️ Isi Price!','wn'); return; }
    if(!cabang){  al('pot-al','⚠️ Pilih Cabang!','wn'); return; }

    const pot=this.hitung(cabang,price,waktu,maxim,tarif);
    const e={id:uid(),tgl:today(),waktu,loginId,drvId,drvNama,cabang,price,pot,net:price-pot,maxim,tarif,status,ts:new Date().toISOString()};
    this.data.unshift(e);
    this.saveToLS();
    this.renderTable();
    this.clearForm();
    al('pot-al','✅ Berhasil ditambahkan!','ok');
    App.updateDashStats();
  },

  clearForm(){
    ['pot-loginid','pot-price','pot-waktu'].forEach(id=>{ const e=$(id); if(e) e.value=''; });
    const d=$('pot-driver'); if(d) d.value='';
    const m=$('pot-maxim'); if(m) m.checked=false;
    const pb=$('pot-pvbox'); if(pb) pb.style.display='none';
  },

  deleteEntry(id){
    if(!Auth.canEdit()){ alert('Hanya Nabilla & Owner!'); return; }
    this.data=this.data.filter(e=>e.id!==id);
    this.saveToLS(); this.renderTable(); App.updateDashStats();
  },

  reset(){
    if(!Auth.canEdit()){ alert('Hanya Nabilla & Owner!'); return; }
    if(!confirm('Reset semua data Database Potongan?\n(Data di Sheet tidak terhapus)')) return;
    this.data=[]; this.saveToLS(); this.renderTable();
    al('pot-al','✅ Data direset','ok'); App.updateDashStats();
  },

  async saveToSheet(){
    if(!Auth.canEdit()){ alert('Hanya Nabilla & Owner!'); return; }
    if(!this.data.length){ al('pot-al','⚠️ Tidak ada data!','wn'); return; }
    al('pot-al','⏳ Menyimpan ke DB_TRANSAKSI...','in');
    try{
      const rows=this.data.map(e=>[e.tgl,e.waktu,e.loginId,e.drvId,e.drvNama,e.cabang.replace('ID Rifim Airport ','').replace('ID Rifim ',''),e.price,e.pot,e.net,e.maxim?'Ya':'Tidak',e.status]);
      const res=await API.appendRows(API.SAL,'DB_TRANSAKSI',rows,false);
      if(res?.error) throw new Error(res.error);
      al('pot-al',`✅ ${rows.length} baris tersimpan ke DB_TRANSAKSI!`,'ok');
      ls.set('_ra_last_save',Date.now());
    }catch(e){ al('pot-al','❌ Gagal: '+e.message,'er'); }
  },

  exportPDF(){
    if(!this.data.length){ alert('Tidak ada data!'); return; }
    const rows=this.data.slice(0,200).map(e=>`<tr>
      <td>${e.tgl}</td><td>${e.waktu||'—'}</td><td>${e.loginId}</td>
      <td>${e.drvNama||'—'}</td>
      <td>${cabShort(e.cabang)}</td>
      <td style="text-align:right;">${rup(e.price)}</td>
      <td style="text-align:right;color:#C62828;">${rup(e.pot)}</td>
      <td style="text-align:right;color:#166534;">${rup(e.net)}</td>
      <td>${e.status}</td></tr>`).join('');
    exportPDF('Riwayat Database Potongan',
      `<table><thead><tr><th>Tgl</th><th>Waktu</th><th>Login ID</th><th>Driver</th><th>Cabang</th><th>Price</th><th>Potongan</th><th>Net</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>`);
  },

  renderTable(){
    const tbody=$('pot-tbody'); if(!tbody) return;
    if(!this.data.length){tbody.innerHTML='<tr><td colspan="10" class="tbl-empty">Belum ada data — isi form di atas</td></tr>';return;}
    tbody.innerHTML=this.data.slice(0,100).map(e=>`<tr>
      <td style="font-size:11px;white-space:nowrap;">${e.tgl}</td>
      <td style="font-size:11px;">${e.waktu||'—'}</td>
      <td style="font-family:var(--mono);font-size:11px;">${e.loginId}</td>
      <td>${e.drvNama||'—'}</td>
      <td><span class="bdg bdg-dim">${cabShort(e.cabang)}</span></td>
      <td style="text-align:right;font-weight:600;">${rup(e.price)}</td>
      <td style="text-align:right;color:var(--err);font-weight:700;">${rup(e.pot)}</td>
      <td style="text-align:right;color:var(--ok);font-weight:700;">${rup(e.net)}</td>
      <td><span class="bdg ${e.status==='Done'?'bdg-ok':'bdg-warn'}">${e.status}</span></td>
      <td>${Auth.canEdit()?`<button class="btn btn-err btn-sm rh" onclick="Potongan.deleteEntry('${e.id}')">🗑</button>`:''}</td>
      </tr>`).join('');
  },

  saveToLS(){
    const now=Date.now();
    this.data=this.data.filter(e=>(now-new Date(e.ts||e.tgl+'T00:00').getTime())<3*864e5);
    ls.set('_ra_pot',this.data);
  },

  loadFromLS(){
    const saved=ls.get('_ra_pot')||[];
    const now=Date.now();
    this.data=saved.filter(e=>(now-new Date(e.ts||e.tgl+'T00:00').getTime())<3*864e5);
    // Auto-save check (setelah 3 hari)
    const lastSave=ls.get('_ra_last_save')||0;
    if(now-lastSave>3*864e5&&this.data.length) this.saveToSheet();
  }
};
