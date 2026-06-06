// ═══════════ RIFIM Admin — Dashboard ═══════════
const Dashboard = {
  saldoData: [],

  async load(){
    this.updateStats();
    this.buildSaldoCab();
    await Promise.allSettled([this.checkConn(), this.loadSaldo()]);
  },

  updateStats(){
    st('d-pot-cnt',   Potongan.data.length);
    st('d-pot-total', rup(Potongan.data.reduce((s,e)=>s+e.pot,0)));
    st('d-trx-sal',   Saldo.raw.transaksi.length||'—');
    st('d-drv-sal',   Saldo.raw.driver.length||Potongan.allDrivers.length||'—');
  },

  async loadSaldo(){
    // Load stats tambahan dari SAL
    try{
      const hr = await API.sheet(API.SAL,'DASHBOARD_HARIAN');
      st('d-sal-harian', hr.length||'0');
    }catch{}
    try{
      const rk = await API.sheet(API.SAL,'RANK_DRIVER');
      if(rk.length){
        const keys=Object.keys(rk[0]);
        st('d-rank-top', rk[0][keys[1]]||rk[0][keys[0]]||'—');
      }
    }catch{}
    try{
      const lp = await API.sheet(API.SAL,'DB_LAPORAN_CABANG');
      st('d-laporan', lp.length||'0');
    }catch{}
    try{
      const ap = await API.sheet(API.DRV_AIRPORT,'ID Rifim Airport Batam');
      st('d-drv-airport', ap.length||'0');
    }catch{}
  },

  buildSaldoCab(){
    const sel=$('saldo-cab'); if(!sel||sel.options.length>1) return;
    sel.innerHTML='<option value="">— Pilih Cabang —</option>';
    CABANG.forEach(c=>{const o=document.createElement('option');o.value=c;o.textContent=cabShort(c);sel.appendChild(o);});
  },

  saldoList: [],

  addSaldo(){
    const loginId=$('saldo-loginid')?.value?.trim();
    const nominal=Number($('saldo-nominal')?.value)||0;
    const cabang=$('saldo-cab')?.value||'';
    if(!loginId){al('saldo-al','⚠️ Isi Login ID!','wn');return;}
    if(!nominal){al('saldo-al','⚠️ Isi Nominal!','wn');return;}
    if(!cabang){al('saldo-al','⚠️ Pilih Cabang!','wn');return;}
    this.saldoList.push({loginId,nominal,cabang,tgl:today(),ts:new Date().toISOString()});
    al('saldo-al',`✅ Saldo ${rup(nominal)} untuk ${loginId} ditambahkan!`,'ok');
    this.clearSaldoForm();
    // Auto-save ke SAL DB_TRANSAKSI
    this.saveSaldo(loginId,nominal,cabang);
  },

  async saveSaldo(loginId,nominal,cabang){
    try{
      await API.appendRows(API.SAL,'DB_TRANSAKSI',[[today(),loginId,'',cabShort(cabang),'',nominal,'Saldo','']],false);
    }catch(e){console.warn('Saldo save:',e.message);}
  },

  clearSaldoForm(){
    ['saldo-loginid','saldo-nominal'].forEach(id=>{const e=$(id);if(e)e.value='';});
    const c=$('saldo-cab');if(c)c.value='';
  },

  async checkConn(){
    const checks=[
      {id:'conn-sal',   sheetId:API.SAL,          sheet:'DB_DRIVER',          label:'File SAL'},
      {id:'conn-staff', sheetId:API.STAFF,         sheet:'MASTER DATA STAFF',  label:'Database Staff'},
      {id:'conn-drvap', sheetId:API.DRV_AIRPORT,  sheet:'ID Rifim Airport Batam',label:'Driver Airport'},
      {id:'conn-drvex', sheetId:API.DRV_EXTERNAL, sheet:'ID Rifim Batam',      label:'Driver External'},
    ];
    for(const c of checks){
      const el=$(c.id); if(!el) continue;
      el.innerHTML='<span class="dot dot-warn dot-pulse"></span> Cek...';
      try{
        const d=await API.sheet(c.sheetId,c.sheet);
        el.innerHTML=d.length>0
          ?`<span class="dot dot-ok"></span> ${d.length} data`
          :'<span class="dot dot-warn"></span> Kosong';
      }catch(e){
        el.innerHTML=`<span class="dot dot-err"></span> Gagal`;
      }
    }
  }
};
