// ═══════════ RIFIM Admin — Invoice ═══════════
const Invoice = {
  data: null,

  generate(){
    const cab=$('inv-cab')?.value; const bln=$('inv-bln')?.value;
    if(!cab){al('inv-al','⚠️ Pilih cabang!','wn');return;}
    if(!bln){al('inv-al','⚠️ Pilih bulan!','wn');return;}
    const [yr,mn]=bln.split('-');
    const MO=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const bulan=MO[parseInt(mn)-1]+' '+yr;
    // Data dari Potongan & SAL
    const potD=Potongan.data.filter(e=>e.cabang===cab&&e.tgl.startsWith(bln));
    const salD=Saldo.raw.transaksi.filter(r=>JSON.stringify(Object.values(r)).includes(cab));
    const totalPot=potD.reduce((s,e)=>s+e.pot,0);
    const totalPrice=potD.reduce((s,e)=>s+e.price,0);
    const totalNet=potD.reduce((s,e)=>s+e.net,0);
    this.data={cab,bln,bulan,potD,salD,totalPot,totalPrice,totalNet};
    st('invCab',cab); st('invBln',bulan); st('invTrxPot',potD.length); st('invTrxSal',salD.length);
    st('invTotalPot',rup(totalPot)); st('invDate',new Date().toLocaleDateString('id-ID'));
    const MO2=['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    $('invBody').innerHTML=[
      {n:1,ket:'Transaksi Potongan (POT)',jml:potD.length,val:rup(totalPot)},
      {n:2,ket:'Transaksi Saldo SAL',     jml:salD.length,val:'—'},
      {n:3,ket:'Total Price (bruto)',      jml:'—',         val:rup(totalPrice)},
      {n:4,ket:'Total Net (setelah pot.)', jml:'—',         val:rup(totalNet)},
    ].map(r=>`<tr><td style="text-align:center">${r.n}</td><td>${r.ket}</td><td style="text-align:center">${r.jml}</td><td style="text-align:right;font-weight:700">${r.val}</td></tr>`).join('');
    const pv=$('inv-preview'),em=$('inv-empty');
    if(pv) pv.style.display='block'; if(em) em.style.display='none';
    al('inv-al',`✅ Invoice ${cab} — ${bulan} berhasil di-generate!`,'ok');
    App.updateDashStats();
  },

  async saveToSheet(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    if(!this.data){al('inv-al','⚠️ Generate dulu!','wn');return;}
    al('inv-al','⏳ Menyimpan ke DB_LAPORAN_CABANG...','in');
    try{
      const {cab,bulan,potD,salD,totalPot,totalNet}=this.data;
      const rows=[
        [today(),cab,bulan,'POT',potD.length,rup(totalPot)],
        [today(),cab,bulan,'SAL',salD.length,'—'],
        [today(),cab,bulan,'NET','—',rup(totalNet)],
      ];
      const r=await API.appendRows(API.SAL,'DB_LAPORAN_CABANG',rows);
      if(r?.error) throw new Error(r.error);
      al('inv-al','✅ Tersimpan ke DB_LAPORAN_CABANG!','ok');
    }catch(e){al('inv-al','❌ Gagal: '+e.message,'er');}
  },

  exportPDF(){
    if(!this.data){alert('Generate dulu!');return;}
    exportPDF(`Invoice ${this.data.cab} — ${this.data.bulan}`,($('invDoc')||{}).innerHTML||'',false);
  },

  reset(){
    if(!Auth.canEdit()){alert('Hanya Nabilla & Owner!');return;}
    this.data=null;
    const pv=$('inv-preview'),em=$('inv-empty');
    if(pv) pv.style.display='none'; if(em) em.style.display='block';
    al('inv-al','✅ Invoice direset','ok');
  }
};
