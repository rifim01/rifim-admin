// ═══════════ RIFIM Admin — Dashboard ═══════════
const Dashboard = {
  saldoList: [],

  async load(){
    this.updateStats();
    this.buildSaldoCab();
    this.startLiveClock();
    await Promise.allSettled([this.checkConn(), this.loadSaldo()]);
  },

  updateStats(){
    st('d-pot-cnt',   Potongan.data.length);
    st('d-pot-total', rup(Potongan.data.reduce((s,e)=>s+e.pot,0)));
    st('d-trx-sal',   Saldo.raw.transaksi.length||'—');
    st('d-drv-sal',   Saldo.raw.driver.length||Potongan.allDrivers.length||'—');
  },

  async loadSaldo(){
    try{ const hr=await API.sheet(API.SAL,'DASHBOARD_HARIAN'); st('d-sal-harian',hr.length||'0'); }catch{}
    try{
      const rk=await API.sheet(API.SAL,'RANK_DRIVER');
      if(rk.length){ const k=Object.keys(rk[0]); st('d-rank-top',rk[0][k[1]]||rk[0][k[0]]||'—'); }
    }catch{}
    try{ const lp=await API.sheet(API.SAL,'DB_LAPORAN_CABANG'); st('d-laporan',lp.length||'0'); }catch{}
    try{
      // Gabungkan semua driver airport
      const sheets=['ID Rifim Airport Batam','ID Rifim Airport Jambi','ID Rifim Airport Balikpapan',
                    'ID Rifim Airport Manado','ID Rifim Airport Pekanbaru'];
      let total=0;
      for(const s of sheets){ try{ const d=await API.sheet(API.DRV_AIRPORT,s); total+=d.length; }catch{} }
      st('d-drv-airport',total||'0');
    }catch{}
  },

  buildSaldoCab(){
    const sel=$('saldo-cab'); if(!sel||sel.options.length>1) return;
    sel.innerHTML='<option value="">— Pilih Cabang —</option>';
    CABANG.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=cabShort(c);sel.appendChild(o);});
  },

  startLiveClock(){
    const el=$('saldo-waktu-live'); if(!el) return;
    const u=()=>{ el.textContent=new Date().toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit'}); };
    u(); if(!this._clk) this._clk=setInterval(u,1000);
  },

  // Auto-fill nama driver dari Login ID
  onLoginInput(){
    const loginEl=$('saldo-loginid'); if(!loginEl) return;
    const val=loginEl.value.trim().toLowerCase();
    const namaEl=$('saldo-driver-nama');
    const cabEl=$('saldo-cab');
    if(!val){ if(namaEl)namaEl.value=''; return; }
    // Cari di allDrivers dari Potongan module
    const found=Potongan.driverMap[val];
    if(found){
      if(namaEl) namaEl.value=found.nama;
      if(cabEl&&found.cabang) cabEl.value=found.cabang;
    } else {
      if(namaEl) namaEl.value='';
    }
  },

  // Auto-fill nominal +5000
  onNominalInput(){
    const nomEl=$('saldo-nominal'); if(!nomEl) return;
    const nom=Number(nomEl.value)||0;
    const plusEl=$('saldo-nominal-plus');
    if(plusEl) plusEl.value=nom>0?(nom+5000):'';
  },

  addSaldo(){
    const loginId=$('saldo-loginid')?.value?.trim();
    const nominal=Number($('saldo-nominal')?.value)||0;
    const nomPlus=Number($('saldo-nominal-plus')?.value)||0;
    const cabang=$('saldo-cab')?.value||'';
    const waktuAIST=$('saldo-waktu-aist')?.value?.trim()||'';
    const drvNama=$('saldo-driver-nama')?.value?.trim()||'';
    if(!loginId){al('saldo-al','⚠️ Isi Login ID!','wn');return;}
    if(!nominal){al('saldo-al','⚠️ Isi Nominal!','wn');return;}
    if(!cabang){al('saldo-al','⚠️ Pilih Cabang!','wn');return;}
    const entry={loginId,drvNama,nominal,nomPlus,cabang,waktuAIST,tgl:today(),ts:new Date().toISOString()};
    this.saldoList.push(entry);
    al('saldo-al',`✅ Saldo ${rup(nomPlus||nominal)} untuk ${loginId} (${drvNama||'—'}) ditambahkan!`,'ok');
    // Save ke SAL
    this.saveSaldoEntry(entry);
    this.clearSaldoForm();
  },

  async saveSaldoEntry(e){
    try{
      await API.appendRows(API.SAL,'DB_TRANSAKSI',[[e.tgl,e.waktuAIST,e.loginId,e.drvNama,cabShort(e.cabang),e.nomPlus||e.nominal,'Saldo Top-Up','']],false);
    }catch(err){console.warn('Saldo save:',err.message);}
  },

  clearSaldoForm(){
    ['saldo-loginid','saldo-nominal','saldo-nominal-plus','saldo-waktu-aist'].forEach(id=>{const e=$(id);if(e)e.value='';});
    const dn=$('saldo-driver-nama');if(dn)dn.value='';
    const c=$('saldo-cab');if(c)c.value='';
  },

  async checkConn(){
    const checks=[
      {id:'conn-sal',   sheetId:API.SAL,          sheet:'DB_DRIVER',           label:'File SAL'},
      {id:'conn-staff', sheetId:API.STAFF,         sheet:'MASTER DATA STAFF',   label:'Database Staff'},
      {id:'conn-drvap', sheetId:API.DRV_AIRPORT,  sheet:'ID Rifim Airport Batam',label:'Driver Airport'},
      {id:'conn-drvex', sheetId:API.DRV_EXTERNAL, sheet:'ID Rifim Batam',       label:'Driver External'},
    ];
    for(const c of checks){
      const el=$(c.id); if(!el) continue;
      el.innerHTML='<span class="dot dot-warn dot-pulse"></span> Cek...';
      try{
        const d=await API.sheet(c.sheetId,c.sheet);
        el.innerHTML=d.length>0
          ?`<span class="dot dot-ok"></span> ${d.length} data`
          :'<span class="dot dot-warn"></span> Kosong';
      }catch{ el.innerHTML='<span class="dot dot-err"></span> Gagal'; }
    }
  }
};
