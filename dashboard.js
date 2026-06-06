// ═══════════ RIFIM Admin — Dashboard ═══════════
const Dashboard = {
  async load(){
    this.updateStats();
    await this.checkConn();
  },

  updateStats(){
    st('d-pot-cnt',   Potongan.data.length);
    st('d-pot-total', rup(Potongan.data.reduce((s,e)=>s+e.pot,0)));
    st('d-trx-sal',   Saldo.raw.transaksi.length||'—');
    st('d-drv-sal',   Saldo.raw.driver.length||Potongan.allDrivers.length||'—');
  },

  async checkConn(){
    const checks=[
      {id:'conn-sal',   sheetId:API.SAL,          sheet:'DB_DRIVER',         label:'File SAL'},
      {id:'conn-staff', sheetId:API.STAFF,         sheet:'MASTER DATA STAFF', label:'Database Staff'},
      {id:'conn-drvap', sheetId:API.DRV_AIRPORT,  sheet:'ID Rifim Airport Batam', label:'Driver Airport'},
      {id:'conn-drvex', sheetId:API.DRV_EXTERNAL, sheet:'ID Rifim Batam',     label:'Driver External'},
    ];
    for(const c of checks){
      const el=$(c.id); if(!el) continue;
      el.innerHTML='<span class="dot dot-warn dot-pulse"></span> Cek...';
      try{
        const d=await API.sheet(c.sheetId,c.sheet);
        el.innerHTML=d.length>0
          ?`<span class="dot dot-ok"></span> Terhubung (${d.length})`
          :'<span class="dot dot-warn"></span> Kosong';
      }catch{ el.innerHTML='<span class="dot dot-err"></span> Gagal'; }
    }
  }
};
