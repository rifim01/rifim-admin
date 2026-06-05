// ═══════════ RIFIM Admin — Dashboard ═══════════
const Dashboard = {
  async load(){
    this.updateStats();
    this.checkConn();
  },

  updateStats(){
    st('d-pot-cnt',   Potongan.data.length);
    st('d-pot-total', rup(Potongan.data.reduce((s,e)=>s+e.pot,0)));
    st('d-trx-sal',   Saldo.raw.transaksi.length||'—');
    st('d-drv-sal',   Saldo.raw.driver.length||'—');
  },

  async checkConn(){
    const checks=[
      {id:'conn-sal',  sheet:'DB_DRIVER',         sid:API.SAL,   label:'File SAL'},
      {id:'conn-staff',sheet:'MASTER DATA STAFF',  sid:API.STAFF, label:'Database Staff'},
    ];
    for(const c of checks){
      const el=$(c.id); if(!el) continue;
      el.innerHTML='<span class="dot dot-warn dot-pulse"></span> Cek...';
      try{
        const d=await API.sheet(c.sid,c.sheet);
        el.innerHTML=d.length>0?`<span class="dot dot-ok"></span> Terhubung (${d.length})`:'<span class="dot dot-warn"></span> Kosong';
      }catch{ el.innerHTML='<span class="dot dot-err"></span> Gagal'; }
    }
  }
};
