// ═══════════ RIFIM Admin — Database Saldo ═══════════
const SaldoDb = {
  data:   [],   // session entries
  doneLS: false,

  init(){
    this.buildCabangSel();
    this.loadFromLS();
    this.renderTable();
    this.startLiveClock();
    this.clearAutoFill();
  },

  clearAutoFill(){
    // Agresif clear browser autofill non-digit setelah 200ms
    setTimeout(()=>{
      ['sal-loginid','sal-nominal','sal-waktu-aist'].forEach(id=>{
        const el=$(id);
        if(el && el.value && !/\d/.test(el.value)) el.value='';
      });
    },200);
  },

  buildCabangSel(){
    const sel=$('sal-cabang'); if(!sel||sel.options.length>1) return;
    sel.innerHTML='<option value="">— Pilih Cabang —</option>';
    CABANG.forEach(c=>{
      const o=document.createElement('option');
      o.value=c; o.textContent=cabShort(c); sel.appendChild(o);
    });
  },

  startLiveClock(){
    const update=()=>{ const el=$('sal-live'); if(el) el.value=liveClock(); };
    update(); setInterval(update,1000);
  },

  onLoginInput(){
    const loginEl=$('sal-loginid'); if(!loginEl) return;
    const raw=loginEl.value.trim();
    // AUTO-HAPUS non-digit (browser autofill "erp" dll)
    if(raw && !/\d/.test(raw)){
      loginEl.value='';
      $('sal-driver-nama')&&($('sal-driver-nama').value='');
      $('sal-cabang')&&($('sal-cabang').value='');
      return;
    }
    if(!raw){ $('sal-driver-nama')&&($('sal-driver-nama').value=''); $('sal-cabang')&&($('sal-cabang').value=''); return; }
    // Parse AIST: "173140630: Hendosra"
    const loginId = raw.includes(':') ? raw.split(':')[0].trim() : raw.trim();
    const namaFromAIST = raw.includes(':') ? raw.split(':').slice(1).join(':').trim() : '';
    const found = Potongan.driverMap[loginId.toLowerCase()];
    if(found){
      $('sal-driver-nama').value = found.nama;
      $('sal-cabang').value = found.cabang;
    } else if(namaFromAIST){
      $('sal-driver-nama').value = namaFromAIST;
    }
  },

  onNominalInput(){
    const nom = Number(($('sal-nominal')?.value||'').replace(/\s/g,'')) || 0;
    const pl = $('sal-nominal-plus');
    if(pl) pl.value = nom ? (nom + 5000) : '';
  },

  addEntry(){
    const raw = $('sal-loginid')?.value?.trim()||'';
    if(raw && !/\d/.test(raw)){ al('sal-al','⚠️ Login ID tidak valid!','wn'); return; }
    const loginId = raw.includes(':') ? raw.split(':')[0].trim() : raw;
    const nama    = $('sal-driver-nama')?.value?.trim()||'';
    const cabang  = $('sal-cabang')?.value||'';
    const nominal = Number(($('sal-nominal')?.value||'').replace(/\s/g,'')) || 0;
    const nomPlus = nominal + 5000;
    const waktuAIST = $('sal-waktu-aist')?.value?.trim()||'';

    if(!loginId){ al('sal-al','⚠️ Isi Login ID!','wn'); return; }
    if(!nominal){ al('sal-al','⚠️ Isi Nominal!','wn'); return; }
    if(!cabang){  al('sal-al','⚠️ Pilih Cabang!','wn'); return; }

    const entry={
      loginId, nama, cabang, nominal, nomPlus,
      waktuAIST, waktuLive:$('sal-live')?.value||'',
      tgl:today(), ts:new Date().toISOString()
    };
    this.data.unshift(entry);
    this.renderTable();
    this.clearForm();
    al('sal-al',`✅ ${nama||loginId} — ${rup(nomPlus)} ditambahkan (${cabShort(cabang)})!`,'ok');
    // Auto-save background
    this.saveEntryBg(entry);
    this.saveToLS();
  },

  async saveEntryBg(e){
    try{
      const row=['', e.tgl, e.loginId, e.nama, e.cabang, 'Saldo Top-Up', e.nomPlus, '', '', ''];
      await API.appendRows(API.SAL,'DB_TRANSAKSI',[row],false);
    }catch(err){ console.warn('SaldoDb.save:',err.message); }
  },

  async saveAll(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    if(!this.data.length){al('sal-al','⚠️ Tidak ada data!','wn');return;}
    al('sal-al','⏳ Menyimpan ke SAL DB_TRANSAKSI...','in');
    try{
      const rows=this.data.map(e=>['', e.tgl, e.loginId, e.nama, e.cabang, 'Saldo Top-Up', e.nomPlus, '', '', '']);
      const res=await API.appendRows(API.SAL,'DB_TRANSAKSI',rows,false);
      if(res?.error) throw new Error(res.error);
      al('sal-al',`✅ ${rows.length} baris tersimpan ke SAL DB_TRANSAKSI!`,'ok');
      ls.set('_sa_last_save',Date.now());
    }catch(e){al('sal-al','❌ Gagal: '+e.message,'er');}
  },

  clearForm(){
    ['sal-loginid','sal-driver-nama','sal-nominal','sal-nominal-plus','sal-waktu-aist'].forEach(id=>{
      const el=$(id); if(el) el.value='';
    });
    const c=$('sal-cabang'); if(c) c.value='';
  },

  reset(){
    if(!confirm('Reset semua data sesi ini?')) return;
    this.data=[];
    ls.remove('_sa_data');
    this.renderTable();
    al('sal-al','✅ Data sesi di-reset!','ok');
  },

  renderTable(){
    const cnt=$('sal-cnt'), tb=$('sal-tb');
    if(cnt) cnt.textContent=`(${this.data.length} entri sesi ini)`;
    if(!tb) return;
    if(!this.data.length){
      tb.innerHTML='<tr><td colspan="9" class="tbl-empty">Belum ada data — paste dari AIST, klik Tambah</td></tr>';
      return;
    }
    tb.innerHTML=this.data.map((e,i)=>`<tr>
      <td style="text-align:center;font-size:11px;color:var(--t2)">${this.data.length-i}</td>
      <td style="font-size:11px;color:var(--t2)">${e.tgl}</td>
      <td style="font-size:11px;color:var(--t2)">${e.waktuAIST||'—'}</td>
      <td style="font-family:var(--mono);font-size:11px">${e.loginId}</td>
      <td style="font-size:12px">${e.nama||'—'}</td>
      <td><span class="bdg bdg-ok" style="font-size:10px">${cabShort(e.cabang)}</span></td>
      <td style="text-align:right;font-size:12px">${rup(e.nominal)}</td>
      <td style="text-align:right;color:var(--gold);font-weight:700">${rup(e.nomPlus)}</td>
      <td style="text-align:center">
        <button class="btn btn-ghost btn-sm rh" style="color:var(--red);padding:2px 6px;"
          onclick="SaldoDb.removeEntry(${i})">✕</button>
      </td>
    </tr>`).join('');
  },

  removeEntry(i){
    this.data.splice(i,1);
    this.renderTable();
    this.saveToLS();
  },

  saveToLS(){ try{ ls.set('_sa_data',JSON.stringify(this.data.slice(0,100))); }catch{} },
  loadFromLS(){ try{ const d=ls.get('_sa_data'); if(d) this.data=JSON.parse(d)||[]; }catch{} },

  exportPDF(){
    const tb=$('sal-tbl'); if(!tb) return;
    exportPDF('Database Saldo — RIFIM', tb.outerHTML, false);
  }
};